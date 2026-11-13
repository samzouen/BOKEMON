/* ============================================================
   39-painter.js — (4.39) THE PAINTER, A MONSTER: his crosshair, his imitation, his target board — and the jungle's
   strange trees he hides in

   The designer: "painter is mono fairy, wild and has an interesting moveset. he can paint a crosshair (please animate as
   a missile crosshair that locks on) onto an enemy monster with his power[1] that grants +20% crit chance against that
   monster for 5 turns, and paint a target board (please animate as a traditional red and white bullseye board that stays
   in the middle of the pair) that lasts 5 turns with his ultimate that has a 75% chance of taking a hit for the partner
   monster even on moves that pierce evasion. it breaks in 1 hit, even aoe, not stackable. it does not work for himself.
   it swaps out and in with the partner, freezing its turn countdown when swapped off."; "his power2 is 'imitation' -
   copies 3 buffs on the enemies' side to your own side. prioritises diamond dust, dragon dance and steel aegis. it casts
   the buffs so a dragon dance would also bring mach dragon over."; of the crosshair's critical: "20% chance at 1.5x";
   of where he is found: "strange trees. these are trees that block the way, and must be interacted with manually. it
   turns out the tree is a canvas in which a painter is hiding."

   His kit is in 21-castle.js's CA_FOLK (Brush Flick, Crosshair, Imitation, Target Board). Here:
     · the CROSSHAIR — a mark ('crosshair') on one of the other side: every blow on it is a 20% chance more of a critical —
       a critical of its own at 1.5× for whatever has none (crossCrit, in computeDamage), +20% on the chance of each one
       it has (Foresight, Feeding Frenzy, Rage, a talent's: crossBonus). 5 turns; their dust stops it forming.
     · IMITATION — up to three of the other side's buffs, Diamond Dust, Dragon Dance and Steel Aegis first, cast for his
       own side, each as its caster cast it (its tier): a Very High one as that skill (so a Dragon Dance brings its Mach
       Dragon, a Diamond Dust its sweep), any other as it stands, five turns.
     · the TARGET BOARD — on his partner ('targetBoard'), drawn standing between the two of them: a blow that would land
       on the partner lands on the board instead three times in four — dodges, mind-reads and sure strikes alike — and
       breaks it (one attack; an area attack too). One at a time (cast again: renewed). Never for himself: with no
       partner it fails. On your side its turns stop while its partner is off the field, and it comes back with it.
   The hooks into the battle: 04-battle.js (the critical rolls, a board's turns), 05-battle-flow.js (his moves, yours
   and theirs; a board taking a blow, theirs and yours).
   ============================================================ */
const PAINTER = {
  cross:{ crit:0.2, mult:1.5, turns:5 },
  board:{ chance:0.75, turns:5 },
  imitate:{ n:3, first:['diamondDust', 'dragonDance', 'steelAegis'] },
  sym:{ crosshair:'', targetBoard:'', imitate:'' },
};
/* the other side's buffs he can imitate: a Very High one by its element (cast as that skill), the rest as they stand */
const PAINTER_VH = { diamondDust:'Fairy', dragonDance:'Dragon', steelAegis:'Steel', overheat:'Fire', overcharge:'Electric',
  spikeArmour:'Ground', mirage:'Flying', counter:'Physical', confusionField:'Psychic' };
const PAINTER_PLAIN = ['kindle', 'gallop', 'enchant', 'iceBarrier', 'fleece', 'stargaze', 'nourish', 'machDragon'];

/* ---------- the pictures: drawn, no emoji ---------- */
const PAINTER_SVG = {
  crosshair:'<circle cx="32" cy="32" r="19" fill="none" stroke="#e8343a" stroke-width="5"/><circle cx="32" cy="32" r="5" fill="#e8343a"/>' +
    '<path d="M32 4v14M32 46v14M4 32h14M46 32h14" stroke="#e8343a" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M10 18V10h8M46 10h8v8M54 46v8h-8M18 54h-8v-8" fill="none" stroke="#7a1015" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
  targetBoard:'<path d="M20 50 15 62M44 50l5 12" stroke="#7a4a22" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="32" cy="29" r="25" fill="#fff" stroke="#5a2c10" stroke-width="3"/><circle cx="32" cy="29" r="19.5" fill="#e33a35"/>' +
    '<circle cx="32" cy="29" r="14" fill="#fff"/><circle cx="32" cy="29" r="8.5" fill="#e33a35"/><circle cx="32" cy="29" r="3.5" fill="#fff"/>',
  imitate:'<path d="M12 46c-6-12 0-34 20-36 16-1 26 9 24 21-1 7-7 9-12 7-5-2-9 1-8 6 1 6-5 9-11 8-6 0-10-2-13-6z" fill="#f4e6c8" stroke="#6b4a24" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="21" cy="25" r="4.5" fill="#e33a35"/><circle cx="31" cy="18" r="4.5" fill="#3f8de0"/><circle cx="42" cy="21" r="4.5" fill="#f2c230"/><circle cx="18" cy="37" r="4.5" fill="#4fb35a"/>',
};
let _painterSvgN = 0;
function painterSvg(id, px, cls){
  return `<svg class="ptx-ic${cls ? ' ' + cls : ''}" viewBox="0 0 64 64" width="${px}" height="${px}" aria-hidden="true" focusable="false">${PAINTER_SVG[id] || ''}</svg>`;
}
if(typeof DRAWN_SYMBOLS !== 'undefined' && typeof drawnSvg === 'function'){
  Object.keys(PAINTER.sym).forEach(k=>{ DRAWN_SYMBOLS[PAINTER.sym[k]] = drawnSvg('painter-' + k, PAINTER_SVG[k]); });
}
if(typeof STATUS_KIND !== 'undefined'){ STATUS_KIND.crosshair = 'debuff'; STATUS_KIND.targetBoard = 'buff'; }
if(typeof STATUS_LABELS !== 'undefined'){
  STATUS_LABELS.crosshair = PAINTER.sym.crosshair + ' Crosshair';
  STATUS_LABELS.targetBoard = PAINTER.sym.targetBoard + ' Target Board';
}
const ptxWho = (side, x)=> side === 'player' ? escapeHtml(displayName(x)) : escapeHtml((SPECIES[x.species] || {}).name || 'It');
const ptxReal = t=> (t && t.uid && typeof realMon === 'function' && realMon(t)) || t;

/* ============================================================
   THE CROSSHAIR
   ============================================================ */
function crossOf(t){
  if(!t || !ui.battle) return null;
  if(t.uid) return getMStatus(ptxReal(t), 'crosshair');
  return getEStatus(t, 'crosshair') || null;
}
/* what a crosshair on `def` adds to any critical's chance */
function crossBonus(def){ const c = crossOf(def); return c ? (c.crit || PAINTER.cross.crit) : 0; }
/* a critical of its own: Foresight, Feeding Frenzy, Rage or a talent's */
function ownCrit(att){
  if(!att) return false;
  const m = ptxReal(att);
  try {
    if(m.uid && typeof elemPassiveOn === 'function' && elemPassiveOn(m, 'Psychic', 'ultra')) return true;
    if(!m.uid && typeof foeForesightOn === 'function' && foeForesightOn(m)) return true;
    const p = typeof passiveOf === 'function' ? passiveOf(m) : null;
    if(p && p.crit) return true;
    if(typeof rageDef === 'function' && rageDef(m)) return true;
    const a = typeof talentHolder === 'function' ? talentHolder(att) : null, fx = a && typeof talentFxOf === 'function' ? talentFxOf(a) : null;
    if(fx && fx.crit > 0) return true;
  } catch(e){}
  return false;
}
/* the crosshair's own critical, for a blow by one with none of its own: 20% at 1.5× (computeDamage) */
function crossCrit(att, def){
  const c = crossOf(def);
  if(!c || ownCrit(att)) return 1;
  const cut = typeof critCut === 'function' ? critCut(ptxReal(att)) : 0;
  if(!(Math.random() < (c.crit || PAINTER.cross.crit) - cut)) return 1;
  const struck = ptxReal(def);
  if(struck && typeof floatOver === 'function') floatOver(struck, 'CRITICAL');
  const b = ui.battle;
  if(b && att && att.uid){ if(b._critAt !== b.actionSeq){ b._critAt = b.actionSeq; b._crits = 0; } b._crits++; }
  return c.mult || PAINTER.cross.mult;
}
function castCrosshair(side, caster, t, def, name){
  def = Object.assign({}, PAINTER.cross, def || {});
  const who = ptxWho(side, caster);
  if(!t) return `${PAINTER.sym.crosshair} ${who} paints a crosshair — but there is nothing to aim at.`;
  const st = { type:'crosshair', turnsLeft:def.turns + 1, crit:def.crit, mult:def.mult };
  let ok = false;
  if(side === 'player'){ addEStatus(t, st); ok = !!getEStatus(t, 'crosshair'); }
  else ok = !!setMStatus(ptxReal(t), st);
  const nm = side === 'player' ? escapeHtml((SPECIES[t.species] || {}).name || 'it') : escapeHtml(displayName(ptxReal(t)));
  painterLockOn(side === 'player' ? 'enemy' : 'player', t, ok);
  if(!ok) return `${PAINTER.sym.crosshair} ${who} paints a crosshair on ${nm} — ${side === 'player' ? 'their' : 'your'} diamond dust smears it away.`;
  return `${PAINTER.sym.crosshair} <b>${escapeHtml(name || 'Crosshair')}!</b> ${who} paints a crosshair on ${nm} — locked on. For <b>${def.turns} turns</b> ` +
    `every blow on it has a <b>${Math.round(def.crit * 100)}%</b> greater chance of a critical (at ${def.mult}× for one with none of its own).`;
}

/* ============================================================
   IMITATION
   ============================================================ */
/* the buffs the other side has that `side` can imitate, best first */
function imitateList(side, n){
  if(!ui.battle) return [];
  const holder = side === 'player' ? 'enemy' : 'player', theirs = side === 'player' ? enemySideStatuses() : partyStatuses();
  const mineToo = k=> !!theirs[k] && STATUS_KIND[k] === 'buff' && statusOwner(k, theirs[k], holder) === holder;
  const order = PAINTER.imitate.first.concat(Object.keys(PAINTER_VH).filter(k=> !PAINTER.imitate.first.includes(k)), PAINTER_PLAIN);
  const out = [];
  order.forEach(k=>{
    if(!mineToo(k) || out.some(x=> x.k === k)) return;
    if(k === 'machDragon' && out.some(x=> x.k === 'dragonDance')) return;                  // (its Dragon Dance brings it)
    out.push({ k, st:Object.assign({}, theirs[k]) });
  });
  return n ? out.slice(0, n) : out;
}
function castImitation(side, caster, def, name){
  def = Object.assign({}, PAINTER.imitate, def || {});
  const who = ptxWho(side, caster), list = imitateList(side, def.n);
  if(!list.length){ painterPalette(side, caster, []); return `${PAINTER.sym.imitate} ${who} looks for something to imitate — ${side === 'player' ? 'they have' : 'you have'} no buffs to copy.`; }
  const got = [];
  list.forEach(({ k, st })=>{
    try {
      if(PAINTER_VH[k]){
        const type = PAINTER_VH[k], tier = st.tier || 0;
        if(side === 'player') applyVeryHighEffect(type, caster, monAtk(caster), livingEnemies(), tier);
        else castEnemyVeryHigh(caster, type, tier);
      } else {
        const f = {};
        Object.keys(st).forEach(x=>{ if(!['type', 'turnsLeft', 'owner', 'by', 'mine', 'fresh', 'max'].includes(x)) f[x] = st[x]; });
        if(k === 'machDragon' && side === 'player') f.mine = true;
        castSideBuff(side, caster, k, f, STATUS_TURNS, name);
      }
      const on = side === 'player' ? partyStatuses()[k] : enemySideStatuses()[k];
      if(on) got.push(k);
    } catch(e){ console.error('imitation:', k, e); }
  });
  painterPalette(side, caster, got);
  const nm = k=> (STATUS_LABELS[k] || k).replace(/^\S+\s/, '') + (k === 'dragonDance' && (side === 'player' ? partyStatuses() : enemySideStatuses()).machDragon ? ' (and its Mach Dragon)' : '');
  if(!got.length) return `${PAINTER.sym.imitate} ${who} copies ${side === 'player' ? 'their' : 'your'} buffs — but ${side === 'player' ? 'their' : 'your'} diamond dust smears every one.`;
  return `${PAINTER.sym.imitate} <b>${escapeHtml(name || 'Imitation')}!</b> ${who} copies ${side === 'player' ? 'their' : 'your'} side's ` +
    `${got.length === 1 ? 'buff' : `${got.length} buffs`} for ${side === 'player' ? 'yours' : 'theirs'}: <b>${got.map(nm).join(', ')}</b>.`;
}

/* ============================================================
   THE TARGET BOARD
   ============================================================ */
/* the one a board of `side`'s would stand for: the caster's partner (never the caster itself) */
function boardPartner(side, caster){
  const same = m=> m === caster || (m.uid && caster.uid && m.uid === caster.uid);
  const others = (side === 'player' ? livingField() : livingEnemies()).filter(m=> !same(m));
  if(!others.length) return null;
  if(side === 'player') return others[0];                                  // yours: the other one on the field
  return others.sort((a, c)=> a.hp / a.maxHp - c.hp / c.maxHp)[0];         // theirs: the one in the worst shape (partnerOf's way)
}
function boardOf(side, t){
  if(!t || !ui.battle) return null;
  return side === 'player' ? getMStatus(ptxReal(t), 'targetBoard') : (getEStatus(t, 'targetBoard') || null);
}
function castTargetBoard(side, caster, def, name){
  def = Object.assign({}, PAINTER.board, def || {});
  const who = ptxWho(side, caster), p = boardPartner(side, caster);
  if(!p) return `${PAINTER.sym.targetBoard} ${who} paints a target board — but it has no partner beside it to stand it for.`;
  const st = { type:'targetBoard', turnsLeft:def.turns + 1, chance:def.chance, painter:caster.uid || null };
  let ok = false;
  if(side === 'player') ok = !!setMStatus(ptxReal(p), st);
  else { addEStatus(p, st); ok = !!getEStatus(p, 'targetBoard'); }
  const nm = side === 'player' ? escapeHtml(displayName(ptxReal(p))) : escapeHtml((SPECIES[p.species] || {}).name || 'its partner');
  if(!ok) return `${PAINTER.sym.targetBoard} ${who} paints a target board — ${side === 'player' ? 'their' : 'your'} diamond dust smears it away.`;
  painterBoardIn(side, p);
  return `${PAINTER.sym.targetBoard} <b>${escapeHtml(name || 'Target Board')}!</b> ${who} paints a target board beside ${nm}. For <b>${def.turns} turns</b> ` +
    `a blow on ${nm} has a <b>${Math.round(def.chance * 100)}%</b> chance to land on the board instead — even one nothing can dodge — and break it.`;
}
/* a blow on `t` (of `side`): does the board take it? (and if so, it breaks) */
function boardIntercepts(side, t){
  const st = boardOf(side, t);
  if(!st) return false;
  if(st.painter && t.uid && st.painter === t.uid) return false;                          // (never for himself)
  if(!(Math.random() < (st.chance || PAINTER.board.chance))) return false;
  if(side === 'player') removeMStatus(ptxReal(t), 'targetBoard'); else removeEStatus(t, 'targetBoard');
  painterBoardBreak(side, t);
  if(typeof floatOver === 'function') floatOver(ptxReal(t), 'BULLSEYE', 'ptx-pop');
  renderStatusBadges();
  return true;
}
/* (yours on theirs: landStrike) — the board takes the whole of one attack: every strike of it on that one */
function boardTakesYours(t){
  const b = ui.battle;
  if(!b || !t) return false;
  if(t._ptxAte != null && t._ptxAte === b.actionSeq) return true;
  if(!boardIntercepts('enemy', t)) return false;
  t._ptxAte = b.actionSeq;
  const nm = escapeHtml((SPECIES[t.species] || {}).name || 'it');
  setTimeout(()=>{ if(ui.battle) battleMsg(`${PAINTER.sym.targetBoard} The target board takes the blow for ${nm} — and breaks!`); }, 450);
  return true;
}

/* ============================================================
   YOUR PAINTER'S MOVES, AND THEIRS
   ============================================================ */
function yourPainterMove(mon, mv, target){
  let line = '';
  const t = (target && target.hp > 0 && livingEnemies().includes(target)) ? target : livingEnemies()[0];
  if(mv.crosshair) line = castCrosshair('player', mon, t, mv.crosshair, mv.name);
  else if(mv.imitate) line = castImitation('player', mon, mv.imitate, mv.name);
  else line = castTargetBoard('player', mon, mv.targetBoard, mv.name);
  logBattle(`${displayName(mon)} used ${mv.name}`);
  renderStatusBadges();
  battleMsg(line);
  return setTimeout(()=> afterPlayerAttack(mon, []), mv.imitate ? 1700 : 1400);
}
function enemyPainterMove(e, move, next){
  const b = ui.battle, idx = b.enemies.indexOf(e), x = move[6] || {};
  bob(document.getElementById('enemyBob-' + idx), -1);
  let line;
  if(x.crosshair){
    const t = (typeof enemyPickTarget === 'function' && enemyPickTarget(e, null)) || activeMon();
    line = castCrosshair('enemy', e, t, x.crosshair, move[1]);
  } else if(x.imitate) line = castImitation('enemy', e, x.imitate, move[1]);
  else line = castTargetBoard('enemy', e, x.targetBoard, move[1]);
  battleMsg(line);
  renderStatusBadges();
  setTimeout(next, x.imitate ? 1700 : 1400);
}
/* theirs, thinking: the board when it has a partner and none stands; Imitation when you have buffs; the crosshair on one
   of yours not marked; else its blow (bestSpecial, 05-battle-flow.js) */
function painterPick(e){
  const rows = (MOVES.painter || []).filter(r=> r[6] && (e.level || 1) >= r[5]);
  const row = k=> rows.find(r=> r[6][k]) || null;
  const partner = (livingEnemies() || []).find(x=> x !== e);
  if(row('targetBoard') && partner && !getEStatus(partner, 'targetBoard') && Math.random() < 0.6) return row('targetBoard');
  if(row('imitate') && imitateList('enemy', 1).length && Math.random() < 0.65) return row('imitate');
  if(row('crosshair') && livingField().some(m=> !getMStatus(m, 'crosshair')) && Math.random() < 0.45) return row('crosshair');
  return null;
}
if(typeof bestSpecial === 'function'){
  const _ptxBest = bestSpecial;
  bestSpecial = function(e){
    if(e && e.species === 'painter') return painterPick(e);
    return _ptxBest.apply(this, arguments);
  };
}
/* the moves' words (the move card, the dex) */
if(typeof moveEffectText === 'function'){
  const _ptxText = moveEffectText;
  moveEffectText = function(mv){
    const out = _ptxText.apply(this, arguments) || [];
    const pc = x=> Math.round(x * 100);
    if(mv && mv.crosshair){ const d = Object.assign({}, PAINTER.cross, mv.crosshair);
      out.push(`<b>${escapeHtml(mv.name)}.</b> A crosshair on one foe for <b>${d.turns} turns</b>: every blow on it has a <b>${pc(d.crit)}%</b> greater chance of a critical — ` +
        `<b>${d.mult}×</b> for one with no critical of its own.`); }
    if(mv && mv.imitate){ const d = Object.assign({}, PAINTER.imitate, mv.imitate);
      out.push(`<b>${escapeHtml(mv.name)}.</b> Copies up to <b>${d.n}</b> of the other side's buffs to yours — Diamond Dust, Dragon Dance and Steel Aegis first — casting each as it was cast (a Dragon Dance brings its Mach Dragon).`); }
    if(mv && mv.targetBoard){ const d = Object.assign({}, PAINTER.board, mv.targetBoard);
      out.push(`<b>${escapeHtml(mv.name)}.</b> A target board beside its partner for <b>${d.turns} turns</b>: a blow on the partner has a <b>${pc(d.chance)}%</b> chance to hit the board instead — ` +
        `even one that can't be dodged — breaking it. One at a time; never for itself. Off the field with its partner, its turns wait.`); }
    return out;
  };
}

/* ============================================================
   THE PICTURES — a missile's crosshair locking on; the bullseye board between the pair; the palette
   ============================================================ */
const PTX_RET = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="3.2"/>` +
  `<circle cx="50" cy="50" r="3.4" fill="currentColor"/><path d="M50 8v18M50 74v18M8 50h18M74 50h18" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>` +
  `<g class="ptx-br"><path d="M14 30V14h16M70 14h16v16M86 70v16H70M30 86H14V70" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
const PTX_BOARD = `<svg viewBox="0 0 80 96" aria-hidden="true"><path d="M26 66 16 94M54 66l10 28M40 70v20" stroke="#6b4320" stroke-width="5.5" stroke-linecap="round"/>` +
  `<circle cx="40" cy="38" r="34" fill="#fffdf6" stroke="#5a2c10" stroke-width="3"/><circle cx="40" cy="38" r="27" fill="#d9302e"/><circle cx="40" cy="38" r="20" fill="#fffdf6"/>` +
  `<circle cx="40" cy="38" r="13" fill="#d9302e"/><circle cx="40" cy="38" r="6" fill="#fffdf6"/><circle cx="40" cy="38" r="2.2" fill="#d9302e"/>` +
  `<path d="M14 22c4-7 10-11 17-13" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/></svg>`;
function painterCss(){
  if(document.getElementById('painterCss')) return;
  const st = document.createElement('style');
  st.id = 'painterCss';
  st.textContent = `
  #myRow{ position:relative; }
  .ptx-ret{ position:absolute; left:50%; top:46%; width:72%; aspect-ratio:1; translate:-50% -50%; color:#ff3b3b; pointer-events:none; z-index:6;
    filter:drop-shadow(0 0 3px rgba(255,40,40,.75)); animation:ptxRet 4s linear infinite, ptxRetPulse 1.4s ease-in-out infinite; }
  .ptx-ret svg{ width:100%; height:100%; display:block; }
  .ptx-ret.yours{ color:#ff8a2a; filter:drop-shadow(0 0 3px rgba(255,140,40,.8)); }
  @keyframes ptxRet{ to{ rotate:360deg; } }
  @keyframes ptxRetPulse{ 0%,100%{ opacity:.9; } 50%{ opacity:.55; } }
  .ptx-lock{ position:fixed; z-index:9050; pointer-events:none; color:#ff2d2d; filter:drop-shadow(0 0 6px rgba(255,30,30,.9)); }
  .ptx-lock svg{ width:100%; height:100%; display:block; }
  .ptx-lock.go{ animation:ptxLock 1.1s cubic-bezier(.2,.7,.2,1) both; }
  .ptx-lock.go .ptx-br{ transform-origin:50px 50px; animation:ptxBr 1.1s steps(1, end) both; }
  .ptx-lock.locked{ animation:ptxLocked .5s ease-out both; }
  .ptx-lock.fail{ animation:ptxFail .6s ease-in both; }
  @keyframes ptxLock{ 0%{ transform:scale(2.6) rotate(-90deg); opacity:0; } 18%{ opacity:1; } 55%{ transform:scale(1.25) rotate(-12deg); }
    72%{ transform:scale(1.12) rotate(6deg); } 86%{ transform:scale(1.04) rotate(-2deg); } 100%{ transform:scale(1) rotate(0); opacity:1; } }
  @keyframes ptxBr{ 0%{ transform:scale(1.5); } 35%{ transform:scale(1.32); } 55%{ transform:scale(1.18); } 72%{ transform:scale(1.08); } 86%{ transform:scale(1); } }
  @keyframes ptxLocked{ 0%,30%,60%{ opacity:1; color:#ff2d2d; } 15%,45%{ opacity:.2; } 100%{ opacity:0; transform:scale(.72); } }
  @keyframes ptxFail{ to{ opacity:0; transform:scale(1.5) rotate(40deg); filter:grayscale(1); } }
  .ptx-board{ position:absolute; z-index:5; pointer-events:none; transform-origin:50% 100%; }
  .ptx-board svg{ width:100%; height:100%; display:block; filter:drop-shadow(0 3px 3px rgba(0,0,0,.35)); }
  .ptx-board.in{ animation:ptxBoardIn .7s cubic-bezier(.3,1.4,.5,1) both; }
  .ptx-board.in svg{ animation:ptxPaint .55s ease-out both; }
  @keyframes ptxBoardIn{ 0%{ transform:scale(.3) translateY(30%); opacity:0; } 60%{ opacity:1; } 100%{ transform:none; } }
  @keyframes ptxPaint{ from{ clip-path:inset(0 100% 0 0); } to{ clip-path:inset(0 0 0 0); } }
  .ptx-shard{ position:fixed; z-index:9050; pointer-events:none; overflow:hidden; }
  .ptx-shard svg{ position:absolute; top:0; height:100%; }
  .ptx-shard.l{ animation:ptxShardL 1s cubic-bezier(.5,0,.8,.6) both; }
  .ptx-shard.r{ animation:ptxShardR 1s cubic-bezier(.5,0,.8,.6) both; }
  @keyframes ptxShardL{ 0%{ transform:none; opacity:1; } 15%{ transform:translate(-6px,-6px) rotate(-8deg); } 100%{ transform:translate(-34px,90px) rotate(-70deg); opacity:0; } }
  @keyframes ptxShardR{ 0%{ transform:none; opacity:1; } 15%{ transform:translate(6px,-6px) rotate(8deg); } 100%{ transform:translate(34px,90px) rotate(70deg); opacity:0; } }
  .ptx-splinter{ position:fixed; z-index:9050; width:7px; height:3px; border-radius:2px; background:#d9302e; pointer-events:none; animation:ptxSplint .8s ease-out both; }
  @keyframes ptxSplint{ to{ transform:translate(var(--dx), var(--dy)) rotate(var(--r)); opacity:0; } }
  .ptx-dab{ position:fixed; z-index:9050; pointer-events:none; width:30px; height:30px; animation:ptxDab 1.1s cubic-bezier(.4,.1,.3,1) both; }
  .ptx-dab .emo-svg, .ptx-dab svg{ width:100%; height:100%; }
  @keyframes ptxDab{ 0%{ transform:translate(0,0) scale(.4); opacity:0; } 15%{ opacity:1; transform:translate(0,0) scale(1.1); }
    100%{ transform:translate(var(--dx), var(--dy)) scale(.9); opacity:0; } }
  .ptx-pop{ color:#d9302e !important; }
  @media (prefers-reduced-motion: reduce){ .ptx-ret{ animation:none; } .ptx-lock.go, .ptx-lock.go .ptx-br, .ptx-board.in, .ptx-board.in svg{ animation-duration:.01s; } }`;
  document.head.appendChild(st);
}
const ptxEl = id=> document.getElementById(id);
/* where one of either side is on the page: its sprite's box */
function ptxBob(side, t){
  if(!ui.battle || !t) return null;
  if(side === 'enemy') return ptxEl('enemyBob-' + ui.battle.enemies.indexOf(t));
  const m = ptxReal(t), on = playerField().find(x=> x.uid === m.uid);
  return on ? ptxEl(pid('playerBob', on)) : null;
}
/* a missile's crosshair locking on: big and turning, closing in by steps, flashing red as it locks — then the mark
   stays on it (painterDecor) */
function painterLockOn(side, t, ok){
  painterCss();
  const host = ptxBob(side, t);
  painterSound(ok ? 'lock' : 'fail');
  if(!host) return;
  const r = host.getBoundingClientRect(), d = Math.max(60, Math.min(r.width, r.height) * 0.86);
  const el = document.createElement('div');
  el.className = 'ptx-lock go';
  el.style.cssText = `left:${(r.left + r.width / 2 - d / 2).toFixed(0)}px;top:${(r.top + r.height * 0.46 - d / 2).toFixed(0)}px;width:${d.toFixed(0)}px;height:${d.toFixed(0)}px;`;
  el.innerHTML = PTX_RET;
  document.body.appendChild(el);
  setTimeout(()=>{ el.classList.remove('go'); el.classList.add(ok ? 'locked' : 'fail'); setTimeout(()=>{ el.remove(); painterDecor(); }, 620); }, 1150);
}
/* the board painted in beside its partner */
function painterBoardIn(side, p){
  painterCss();
  painterSound('brush');
  setTimeout(()=>{ painterDecor(); const b = document.querySelector(`.ptx-board[data-for="${side}:${p.uid || ui.battle.enemies.indexOf(p)}"]`); if(b){ b.classList.remove('in'); void b.offsetWidth; b.classList.add('in'); } }, 60);
}
/* …and broken: split down the middle, the halves falling away, splinters of paint */
function painterBoardBreak(side, t){
  painterCss();
  painterSound('crack');
  const key = `${side}:${t.uid || (ui.battle ? ui.battle.enemies.indexOf(t) : '')}`;
  const b = document.querySelector(`.ptx-board[data-for="${key}"]`);
  if(!b) return;
  const r = b.getBoundingClientRect();
  ['l', 'r'].forEach(s=>{
    const half = document.createElement('div');
    half.className = 'ptx-shard ' + s;
    half.style.cssText = `left:${(s === 'l' ? r.left : r.left + r.width / 2).toFixed(0)}px;top:${r.top.toFixed(0)}px;width:${(r.width / 2).toFixed(0)}px;height:${r.height.toFixed(0)}px;`;
    half.innerHTML = PTX_BOARD.replace('<svg ', `<svg style="width:${r.width.toFixed(0)}px;left:${s === 'l' ? 0 : -(r.width / 2).toFixed(0)}px" `);
    document.body.appendChild(half);
    setTimeout(()=> half.remove(), 1050);
  });
  for(let i = 0; i < 9; i++){
    const sp = document.createElement('i');
    sp.className = 'ptx-splinter';
    const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40;
    sp.style.cssText = `left:${(r.left + r.width / 2).toFixed(0)}px;top:${(r.top + r.height * 0.4).toFixed(0)}px;--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d + 20).toFixed(0)}px;--r:${(Math.random() * 360).toFixed(0)}deg;` +
      (i % 2 ? 'background:#fffdf6;' : '');
    document.body.appendChild(sp);
    setTimeout(()=> sp.remove(), 850);
  }
  b.remove();
}
/* Imitation: each buff copied flies across from their side to his, as a dab of paint */
function painterPalette(side, caster, got){
  painterCss();
  painterSound('imitate');
  const from = side === 'player' ? document.querySelector('.enemy-card') : ptxEl('playerCard');
  const to = ptxBob(side, caster);
  if(!from || !to) return;
  const a = from.getBoundingClientRect(), z = to.getBoundingClientRect();
  (got.length ? got : ['imitate']).forEach((k, i)=>{
    const el = document.createElement('div');
    el.className = 'ptx-dab';
    const sym = (STATUS_LABELS[k] || '').split(' ')[0];
    el.innerHTML = k === 'imitate' ? painterSvg('imitate', 30) : (typeof symHtml === 'function' ? symHtml(sym) : sym);
    el.style.cssText = `left:${(a.left + a.width / 2 - 15 + (i - 1) * 26).toFixed(0)}px;top:${(a.top + a.height * 0.4).toFixed(0)}px;` +
      `--dx:${(z.left + z.width / 2 - (a.left + a.width / 2 + (i - 1) * 26)).toFixed(0)}px;--dy:${(z.top + z.height * 0.3 - (a.top + a.height * 0.4)).toFixed(0)}px;animation-delay:${i * 0.18}s;`;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 1500 + i * 180);
  });
}
/* after every drawing of the fight: the marks on whoever wears a crosshair, a board between each pair that has one */
function painterDecor(){
  if(!ui.battle || typeof document === 'undefined') return;
  painterCss();
  document.querySelectorAll('.ptx-ret').forEach(x=>{ if(!x.closest('.ptx-lock')) x.remove(); });
  /* theirs marked */
  (ui.battle.enemies || []).forEach((e, i)=>{
    if(e.hp <= 0 || !getEStatus(e, 'crosshair')) return;
    const bob = ptxEl('enemyBob-' + i);
    if(!bob) return;
    if(getComputedStyle(bob).position === 'static') bob.style.position = 'relative';
    bob.insertAdjacentHTML('beforeend', `<div class="ptx-ret">${PTX_RET}</div>`);
  });
  /* yours marked (their painter's) */
  playerField().forEach(m=>{
    if(m.currentHp <= 0 || !getMStatus(m, 'crosshair')) return;
    const bob = ptxEl(pid('playerBob', m));
    if(!bob) return;
    if(getComputedStyle(bob).position === 'static') bob.style.position = 'relative';
    bob.insertAdjacentHTML('beforeend', `<div class="ptx-ret yours">${PTX_RET}</div>`);
  });
  /* the boards */
  const keep = new Set();
  const place = (key, card, other, row)=>{
    if(!card || !row) return;
    keep.add(key);
    let el = document.querySelector(`.ptx-board[data-for="${key}"]`);
    if(!el || el.parentElement !== row){ if(el) el.remove(); el = document.createElement('div'); el.className = 'ptx-board'; el.dataset.for = key; el.innerHTML = PTX_BOARD; row.appendChild(el); }
    if(getComputedStyle(row).position === 'static') row.style.position = 'relative';
    const rr = row.getBoundingClientRect(), a = card.getBoundingClientRect(), o = other ? other.getBoundingClientRect() : null;
    const w = Math.max(34, Math.min(70, a.width * 0.42)), h = w * 1.2;
    const cx = o ? (a.left + a.width / 2 + o.left + o.width / 2) / 2 : (a.left + a.width + 4 + w / 2);
    el.style.width = w.toFixed(0) + 'px'; el.style.height = h.toFixed(0) + 'px';
    el.style.left = (cx - rr.left - w / 2).toFixed(0) + 'px';
    el.style.top = (a.top - rr.top + a.height * 0.5 - h * 0.55).toFixed(0) + 'px';
  };
  const row = ptxEl('myRow'), shown = playerField();
  shown.forEach(m=>{
    if(m.currentHp <= 0 || !getMStatus(m, 'targetBoard')) return;
    const card = ptxEl(pid('player', m) + 'Card'), oth = shown.find(x=> x !== m);
    place('player:' + m.uid, card, oth ? ptxEl(pid('player', oth) + 'Card') : null, row);
  });
  (ui.battle.enemies || []).forEach((e, i)=>{
    if(e.hp <= 0 || !getEStatus(e, 'targetBoard')) return;
    const card = ptxEl('enemy-' + i);
    if(!card) return;
    const j = ui.battle.enemies.findIndex((x, k)=> k !== i && x.hp > 0 && ptxEl('enemy-' + k));
    place('enemy:' + i, card, j >= 0 ? ptxEl('enemy-' + j) : null, card.parentElement);
  });
  document.querySelectorAll('.ptx-board').forEach(el=>{ if(!keep.has(el.dataset.for)) el.remove(); });
}
if(typeof renderBattle === 'function'){
  const _ptxRender = renderBattle;
  renderBattle = function(){ const r = _ptxRender.apply(this, arguments); try { painterDecor(); } catch(e){} return r; };
}
if(typeof renderStatusBadges === 'function'){
  const _ptxBadges = renderStatusBadges;
  renderStatusBadges = function(){ const r = _ptxBadges.apply(this, arguments); try { painterDecor(); } catch(e){} return r; };
}

/* ============================================================
   THE SOUNDS — made as they play (33-catch.js's hall): a missile's lock-on (its beeps quicker and quicker, then the
   lock); a brush's two swishes; a board cracking; a palette's little run, up and back
   ============================================================ */
/* (4.40) The designer: "i love the sfx for painter but i don't think we can be consistent b/c other monsters don't have it
   yet. perhaps we can temporarily remove the painter's sfx, please?" Off (`on`), kept for when the others have theirs. */
const PTX_SND = { on:false, beep:0.05, lock:0.05, swish:0.07, crack:0.2, pluck:0.05 };
function painterSound(kind){
  if(!PTX_SND.on) return;
  try {
    if(typeof czSound === 'undefined' || !czSound.live) return;
    const L = czSound.live();
    if(!L) return;
    PTX_SOUNDS[kind] && PTX_SOUNDS[kind](L.ctx, L.out, L.t);
  } catch(e){}
}
const PTX_SOUNDS = {
  lock(ctx, out, t){
    const B = czsBusOf(ctx, out);
    const blip = (at, f, d, v)=>{ const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(f, at); lp.type = 'lowpass'; lp.frequency.value = 2400;
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + 0.006); g.gain.setValueAtTime(v, at + d - 0.02); g.gain.linearRampToValueAtTime(0, at + d);
      o.connect(lp); lp.connect(g); g.connect(B.in); o.start(at); o.stop(at + d + 0.02); };
    [0, 0.26, 0.47, 0.63, 0.75, 0.85, 0.93].forEach((dt, i)=> blip(t + dt, 880 + i * 25, 0.06, PTX_SND.beep));
    blip(t + 1.02, 1175, 0.42, PTX_SND.lock);
    czsAir(ctx, B.in, t, 1.0, 300, 1400, 0.02, { peak:0.9, q:0.8 });
    return 3;
  },
  fail(ctx, out, t){ const B = czsBusOf(ctx, out); czsAir(ctx, B.in, t, 0.5, 1200, 300, 0.04, { peak:0.1 }); return 2; },
  brush(ctx, out, t){ const B = czsBusOf(ctx, out); [0, 0.22].forEach((dt, i)=> czsAir(ctx, B.in, t + dt, 0.26, 700 + i * 300, 2600 + i * 500, PTX_SND.swish, { peak:0.4, q:1.1, pan:i ? 0.3 : -0.3 })); return 2; },
  crack(ctx, out, t){
    const B = czsBusOf(ctx, out);
    czsBoom(ctx, B, t, { vol:PTX_SND.crack * 0.6, f0:180, f1:70, dur:0.35, n0:2400, n1:400 });
    czsAir(ctx, B.in, t, 0.12, 3200, 1500, PTX_SND.crack, { peak:0.05, q:0.7, type:'highpass' });
    czsAir(ctx, B.in, t + 0.05, 0.5, 1600, 300, PTX_SND.crack * 0.4, { peak:0.1, q:0.8 });
    return 3;
  },
  imitate(ctx, out, t){
    const B = czsBusOf(ctx, out), up = [64, 67, 71, 76], down = [76, 71, 67, 64];
    up.forEach((m, i)=> czsPluck(ctx, B, t + i * 0.08, czsMidi(m), { vol:PTX_SND.pluck, dur:0.9, pan:-0.4 }));
    down.forEach((m, i)=> czsPluck(ctx, B, t + 0.4 + i * 0.08, czsMidi(m + 12), { vol:PTX_SND.pluck * 0.8, dur:0.9, pan:0.4 }));
    return 3;
  },
};

/* ============================================================
   THE STRANGE TREES (the jungle, 20-jungle.js) — the designer: "strange trees. these are trees that block the way, and
   must be interacted with manually. it turns out the tree is a canvas in which a painter is hiding."
   Six places in the jungle's corridors (one square wide, a way on either side), far from the villages, the castle,
   the way in and the rift; three of them with a tree standing in the way each day (chosen by the day, as the bands'
   places are). A tree blocks the square. Looked at: a tree that is not quite a tree — touched, it topples, a canvas,
   and a Painter tumbles out to fight you (Lv 98, a wild one: one not caught yet can be caught after). Won, the tree
   is gone for the day; fled, it stands there still.
   ============================================================ */
const STRANGE = { spots:6, daily:3, lv:98, gap:24, keepOff:7 };
let _strangeSpots = null;
function strangeSpots(){
  if(_strangeSpots) return _strangeSpots;
  if(typeof jgGround !== 'function') return (_strangeSpots = []);
  const G = jgGround(), { W, H, places } = G, open = (x, y)=> !jgSolidAt(x, y);
  const C = places.castle, N = places.north, k = STRANGE.keepOff;
  const safe = [places.entry, ...Object.values(places.villages), { x:C.x - 8, y:C.y - 2, w:C.w + 16, h:C.h + 16 }].concat(N ? [{ x:N.x - N.rx, y:0, w:N.rx * 2, h:N.ry + 1 }] : []);
  const near = (x, y)=> safe.some(s=> x > s.x - k && x < s.x + s.w + k && y > s.y - k && y < s.y + s.h + k);
  const cand = [];
  for(let y = 2; y < H - 2; y++) for(let x = 2; x < W - 2; x++){
    if(G.g[y * W + x] !== JG_T.PATH || near(x, y)) continue;
    const n = open(x, y - 1), s = open(x, y + 1), w = open(x - 1, y), e = open(x + 1, y);
    if((n && s && !w && !e) || (w && e && !n && !s)) cand.push({ x, y });
  }
  const R = jgRng((JG.seed ^ 0x9a17e5) >>> 0);
  for(let i = cand.length - 1; i > 0; i--){ const j = Math.floor(R() * (i + 1)); const t = cand[i]; cand[i] = cand[j]; cand[j] = t; }
  /* spread over the whole jungle: one in each of six parts of it (three across, two down) */
  const out = [];
  for(let r = 0; r < 2; r++) for(let c = 0; c < 3; c++){
    const x0 = W * c / 3, x1 = W * (c + 1) / 3, y0 = H * r / 2, y1 = H * (r + 1) / 2;
    const pick = cand.find(p=> p.x >= x0 + 6 && p.x < x1 - 6 && p.y >= y0 + 6 && p.y < y1 - 6 && !out.some(o=> Math.abs(o.x - p.x) + Math.abs(o.y - p.y) < STRANGE.gap));
    if(pick) out.push({ id:'st' + out.length, x:pick.x, y:pick.y });
  }
  return (_strangeSpots = out);
}
function strangeSpotAt(x, y){ return strangeSpots().find(s=> s.x === x && s.y === y) || null; }
/* today's trees: three of the six, by the day */
function strangeToday(){
  const day = today(), spots = strangeSpots();
  const R = jgRng((JG.seed ^ 0x5eed7 ^ jgDaySeed(day)) >>> 0), ids = spots.map(s=> s.id);
  for(let i = ids.length - 1; i > 0; i--){ const j = Math.floor(R() * (i + 1)); const t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
  return new Set(ids.slice(0, STRANGE.daily));
}
function strangeState(){ const j = jgState(); if(!j.strange || typeof j.strange !== 'object') j.strange = {}; return j.strange; }   // { id: the day its painter was beaten }
function strangeStanding(s){ return !!s && strangeToday().has(s.id) && strangeState()[s.id] !== today(); }
/* a tree standing in the way here (the deck's `occupied`) */
function strangeTreeAt(x, y){ const s = strangeSpotAt(x, y); return s && strangeStanding(s) ? s : null; }
const STRANGE_TREE_SVG = `<svg class="st-tree" viewBox="0 0 64 80" aria-hidden="true">` +
  `<path d="M14 78 22 52M50 78 42 52M32 70V52" stroke="#6b4320" stroke-width="3.2" stroke-linecap="round"/>` +
  `<g transform="rotate(-3 32 30)"><rect x="5" y="3" width="54" height="54" rx="1.5" fill="#f4ecd6" stroke="#8a6a3a" stroke-width="2"/>` +
  `<rect x="8" y="6" width="48" height="48" fill="#3f7d3a"/>` +
  `<path d="M28 54V38c0-3-3-5-6-6M36 54V40c0-3 3-5 6-6" stroke="#5b3a1e" stroke-width="5" stroke-linecap="round" fill="none"/>` +
  `<path d="M12 30c-3-9 4-17 12-16 2-7 13-9 17-3 7-2 13 4 11 11 5 4 3 12-3 13-2 6-10 8-15 5-5 4-14 3-16-3-5 0-8-4-6-7z" fill="#5fae4a"/>` +
  `<path d="M17 24c4-4 9-6 14-5M35 17c5 0 9 3 11 7" fill="none" stroke="#8fd46a" stroke-width="3" stroke-linecap="round"/>` +
  `<path d="M24 34c3 2 7 2 10 0M40 30c2 2 5 2 7 0" fill="none" stroke="#3f7d3a" stroke-width="2.4" stroke-linecap="round"/>` +
  `<path d="M51 44c0 3 1 5 0 8" stroke="#5fae4a" stroke-width="2.2" stroke-linecap="round"/></g></svg>`;
function painterJungleThings(list){
  strangeSpots().forEach(s=>{
    list.push({ x:s.x, y:s.y, late:true, cls:'jg-npc st-thing st-' + s.id, html:()=> STRANGE_TREE_SVG, verb:'Look', sub:'A strange tree', solid:true,   // (laid after the finds: they stay where they were)
      when:()=> strangeStanding(s), act:()=> strangeLook(s) });
  });
}
async function strangeLook(s){
  if(ui.jgTalk || !strangeStanding(s)) return;
  painterCss(); strangeCss();
  const lion = typeof riftLucescoFace === 'function' ? [riftLucescoFace()] : [];
  ui.jgTalk = true;
  releaseKeys();
  let yes = false;
  try {
    await jgSay([], '', `A tree stands right in the middle of the path. …Its leaves don't move in the wind. And is that a <i>frame</i> round it?`);
    if(ui.screen !== JG_KEY) return;
    if(lion.length) await jgSay(lion, 'Lucesco', `He sniffs at it, and sneezes.<br><br><b>"That is no tree. It smells of paint."</b>`);
    if(ui.screen !== JG_KEY) return;
    yes = await r5Ask([], '', `Give it a push?`, 'Push it', 'Leave it');
  } finally { ui.jgTalk = false; }
  if(!yes || ui.screen !== JG_KEY){ refreshWalk(); return; }
  const thing = document.querySelector('.st-' + s.id);
  if(thing) thing.classList.add('st-topple');
  ui.jgTalk = true;
  try {
    await jgSay([caFace('painter')], 'A wild Painter', `The tree topples over with a thump — it was a canvas! A Painter tumbles out from behind it, brush in hand.<br><br><b>"How DARE you! I was hiding — I mean, painting!"</b>`);
  } finally { ui.jgTalk = false; }
  if(ui.screen !== JG_KEY) return;
  strangeFight(s);
}
function strangeFight(s){
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first.'); refreshWalk(); return false; }
  releaseKeys();
  if(typeof jgSave === 'function') jgSave(true);
  const begin = ()=>{
    ui.jgFight = { tree:s.id };
    beginBattle({ waves:[[{ species:'painter', level:STRANGE.lv, ai:'best', nerfed:false, anyLevel:true }]], isNpc:false, allowCatch:true,
      name:'A wild Painter', bgKey:'battle_jungle', foeRegion:6, encounter:true, encounterMusic:typeof JG_FIGHT_MUSIC !== 'undefined' ? JG_FIGHT_MUSIC : undefined,
      onWin:()=>{ strangeState()[s.id] = today(); saveProfile(); resumeVictory(); },
      onLose:()=>{ ui.jgFight = null; go('region'); } });
    if(ui.battle) ui.battle.jungle = 'tree:' + s.id;
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin, typeof JG_FIGHT_MUSIC !== 'undefined' ? JG_FIGHT_MUSIC : undefined); else begin();
  return true;
}
function strangeCss(){
  if(document.getElementById('strangeCss')) return;
  const st = document.createElement('style');
  st.id = 'strangeCss';
  st.textContent = `
  .st-thing .st-tree{ position:absolute; left:50%; bottom:2%; width:185%; height:auto; translate:-50% 0; filter:drop-shadow(0 3px 2px rgba(0,0,0,.3)); transform-origin:50% 100%; }
  .st-thing.st-topple .st-tree{ animation:stTopple .7s cubic-bezier(.5,0,.8,.5) both; }
  @keyframes stTopple{ to{ transform:rotate(-82deg) translateY(10%); opacity:.4; } }`;
  document.head.appendChild(st);
}
