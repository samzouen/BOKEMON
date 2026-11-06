/* ==========================================================
   17-region6.js — REGION 6: THE TIME RIFT (3.75)
   Part of 博刻MON. Loaded as a classic script (before 11-app.js): everything
   shares one global scope.

   The designer (3.75): "Let's start pushing out region 6. The shopkeeper is
   a woman with a galaxy starry cloak and her companion is a bat with one
   eye and galaxy starry wings…" — the whole request, and the answers that
   followed it, are in CHANGES.md under 3.75.

   WHAT IS HERE
   · THE WAY IN — the tear's "Enter the space-time tear" (16-tear.js). The
     first time, Selene and Vesper (r6SeleneScene); after that, straight in —
     (3.79) up into the round room, the Rift (18-rift.js, with the region's
     moving sky). Region 6 is "The Time Rift" (REGIONS, 11-app.js), open once
     she has been met (r6().met). Its level cap is 150 (REGION_CAPS).
   · SELENE'S SHOP — the shop, with her at the counter (shopkeeper6.png) and
     Vesper beside her (mon/vesper_front.png; drawn if missing), and her own
     greetings. The element passives' forge is sold here now
     (ELEM_FORGE_FROM 6).
   · LEGACIES, STARLIGHT, CONSTELLATIONS — a legacy captured opens its
     element's sky (talent tree); Starlight lights its constellations
     (nodes) once, for the whole save; any crowned monster of that element
     past level 100 can then switch a lit one on, with the points its level
     gives (1 at 101 and 1 more every 5 levels: 11 at 150, 21 at 200).
   · TALENT TREES — each element's sky: a main branch of seven (minor,
     minor, MAJOR, minor, minor, minor, MAJOR capstone) and two side branches
     of three (minor, minor, MAJOR), off main 2 and main 5 (TALENT_TREES). A
     minor costs 1 point to switch on, a major 2; a whole sky is 17 points
     and 41 Starlight. Switching off is free.
   · CHALLENGE THE FUTURE — once a week (the tear's week, from Monday): one
     wave of the week's three future monsters (future_<element>, FUTURE_KIT),
     level 200, crowned, each with its element's ✦ Very High and ✦ Ultra
     stones, both of its element's passives (3.76) and its whole sky. Over
     every four weeks all twelve elements come round once, three a week
     (futureWeek); a lost fight meets the same three again. SPACETIME
     DISTORTION (3.76: DISTORTION_POOL): three drawn for the week, each
     switched on or off before the fight; a win pays FUTURE_STAR_BASE × the
     multipliers of those on, the week's best win only. A win also
     offers ONE legacy a week: a 10-phrase quiz, two slips and it slips back
     into the future (win again to try again). A loss costs no XP; the fight
     can be left.
   · THE TALENTS PAGE — from the Party page, beside Companions.
   ========================================================== */

/* ---------- the region's own record ---------- */
function r6(){
  const p = state.progress;
  if(!p.region6 || typeof p.region6 !== 'object') p.region6 = { met:false };
  return p.region6;
}
function r6Met(){ return !!(state && state.progress && state.progress.region6 && state.progress.region6.met); }

/* ============================================================
   LEGACIES, STARLIGHT AND CONSTELLATIONS (the designer, 3.75: "talent tree
   currency (starlight, nodes are called constellations?)"; "Light once, all
   use")
   · A LEGACY captured opens its element's sky (its talent tree) for good —
     state.progress.legacies[type]. Captured again, it pays an echo of
     Starlight instead (LEGACY_ECHO).
   · STARLIGHT (state.progress.starlight) is paid by Challenge the future.
     It lights a CONSTELLATION (a node) once and for good, for the whole
     save (state.progress.lit[id]) — each from the one before it on its
     branch, in an open sky.
   · Then any crowned monster of that element past level 100 can switch a
     lit constellation on, with the points its level gives (talentCapacity).
   ============================================================ */
const LEGACY_TYPES = ['Fire', 'Water', 'Grass', 'Electric', 'Flying', 'Ground', 'Physical', 'Psychic', 'Ghost', 'Dragon', 'Steel', 'Fairy'];
const LEGACY_ECHO = 10;                  // Starlight for a legacy whose sky is already open
const STARLIGHT_COST = { minor:2, major:5, capstone:8 };
function legacies(){
  const p = state.progress;
  if(!p.legacies || typeof p.legacies !== 'object') p.legacies = {};
  return p.legacies;
}
function legacyOpen(type){
  const l = state && state.progress && state.progress.legacies;
  return !!(l && l[type]);
}
/* Opens its sky: true if it was not open before. */
function openLegacy(type){
  if(legacyOpen(type)) return false;
  legacies()[type] = 1;
  talentCacheBump();
  return true;
}
function legacyCount(){ return LEGACY_TYPES.filter(legacyOpen).length; }
function starlight(){ return Math.max(0, Math.floor(Number(state && state.progress && state.progress.starlight) || 0)); }
function addStarlight(n){ state.progress.starlight = Math.max(0, starlight() + Math.round(n || 0)); return state.progress.starlight; }
function litMap(){
  const p = state.progress;
  if(!p.lit || typeof p.lit !== 'object') p.lit = {};
  return p.lit;
}
function constellationLit(id){ const l = state && state.progress && state.progress.lit; return !!(l && l[id]); }
function litCount(type){ return talentNodesOf(type).filter(n=> constellationLit(n.id)).length; }
/* Can it be lit now? { ok, why } — its sky open, the one before it lit,
   and the Starlight in hand. */
function constellationLightable(n){
  if(!n) return { ok:false, why:'' };
  if(constellationLit(n.id)) return { ok:false, why:'Already lit.' };
  if(!legacyOpen(n.type)) return { ok:false, why:`Capture the ${n.type} legacy in Challenge the future to open this sky.` };
  if(n.prereq && !constellationLit(n.prereq)) return { ok:false, why:`Light ${talentNode(n.prereq).name} first — the one before it.` };
  if(starlight() < n.light) return { ok:false, why:`Needs ✨ ${n.light} Starlight — you have ${starlight()}.` };
  return { ok:true, why:'' };
}
function lightConstellation(id){
  const n = talentNode(id);
  if(!constellationLightable(n).ok) return false;
  addStarlight(-n.light);
  litMap()[id] = 1;
  talentCacheBump();
  return true;
}
/* The Talents page is there once Selene has been met (or a legacy is held). */
function talentsUnlocked(){ return r6Met() || legacyCount() > 0 || (typeof isDev === 'function' && isDev()); }

/* ============================================================
   TALENT TREES
   Minor nodes are a stat (TALENT_STATS); a major node is one or two effects
   ({ k, v }), each described by talentFxText. Stat effects add up within
   their stat (+4% ATK and +15% ATK make +19%); every damage bonus adds up
   into one multiplier, and every damage cut into another (at most 60% off).
   ============================================================ */
const TALENT_STEP = 5;                 // a point every 5 levels past 100 (and one at 101)
const TALENT_COST = { minor:1, major:2 };
const TALENT_CRIT_MULT = 1.5;          // a critical from a talent, unless a node raises it
const TALENT_CRIT_CAP = 0.5, TALENT_DODGE_CAP = 0.30, TALENT_CUT_MAX = 0.60;
const TALENT_STATS = {
  atk:  { short:'ATK',   name:'Attack',    v:0.04 },
  hp:   { short:'HP',    name:'Vitality',  v:0.05 },
  dmg:  { short:'DMG',   name:'Power',     v:0.04 },
  def:  { short:'DEF',   name:'Guard',     v:0.03 },
  dodge:{ short:'DODGE', name:'Evasion',   v:0.03 },
  crit: { short:'CRIT',  name:'Precision', v:0.04 },
};
const TM = (name, ...fx)=> ({ name, fx:fx.map(([k, v])=> ({ k, v })) });
const TALENT_TREES = {
  /* "atk and dmg% oriented for fire and dragon" */
  Fire:     { legacy:'The Eternal Flame',
    main:['atk', 'dmg', TM('Kindled Fury', ['fury', 0.25]), 'atk', 'crit', 'dmg', TM('Inferno Heart', ['dmg', 0.10], ['critX', 2])],
    a:['crit', 'atk', TM('Burning Blood', ['atk', 0.15], ['hp', -0.15])],          // "trading base HP for ATK"
    b:['dmg', 'atk', TM('Blazing Start', ['pristine', 0.20])] },
  Water:    { legacy:'The Endless Tide',
    main:['hp', 'dmg', TM('Tidal Mend', ['regen', 0.06]), 'hp', 'dmg', 'hp', TM("Ocean's Heart", ['lifesteal', 0.12], ['dmg', 0.08])],
    a:['def', 'hp', TM('Flowing Form', ['resilient', 0.25])],
    b:['dmg', 'hp', TM('Lasting Tide', ['linger', 1])] },
  Grass:    { legacy:'The First Forest',
    main:['hp', 'def', TM('Photosynthesis', ['regen', 0.06]), 'hp', 'def', 'hp', TM('Ancient Canopy', ['warden', 0.12], ['hp', 0.05])],
    a:['def', 'hp', TM('Bramble Hide', ['thorns', 0.25])],
    b:['hp', 'dmg', TM('Sap Drain', ['lifesteal', 0.12])] },
  Electric: { legacy:'The Living Storm',
    main:['dmg', 'crit', TM('Quickcharge', ['swift', 1]), 'dmg', 'crit', 'dmg', TM('Thunderclap', ['opener', 0.40], ['crit', 0.05])],
    a:['crit', 'dmg', TM('Arc Focus', ['critX', 2])],
    b:['dodge', 'dmg', TM('Static Rush', ['pristine', 0.20])] },
  Flying:   { legacy:'The Open Sky',
    main:['dodge', 'dmg', TM('Tailwind', ['swift', 1]), 'dodge', 'dmg', 'crit', TM('Sky Sovereign', ['dodge', 0.08], ['inspire', 0.10])],
    a:['dmg', 'crit', TM('Raptor Dive', ['execute', 0.30])],
    b:['dodge', 'dmg', TM('Dive Bomb', ['opener', 0.40])] },
  /* "defence and HP oriented for rock and steel" — Ground is the rock */
  Ground:   { legacy:'The Deep Stone',
    main:['hp', 'def', TM('Stone Skin', ['stalwart', 0.15]), 'hp', 'def', 'hp', TM('Unbreakable', ['undying', 1], ['hp', 0.05])],
    a:['def', 'hp', TM('Tremor', ['superEff', 0.20])],
    b:['hp', 'def', TM('Earthen Wall', ['bastion', 2])] },
  Physical: { legacy:'The Endless Training',
    main:['atk', 'hp', TM('Adrenaline', ['fury', 0.25]), 'atk', 'hp', 'atk', TM('Iron Fist', ['atk', 0.08], ['opener', 0.30])],
    a:['hp', 'atk', TM('All In', ['atk', 0.15], ['hp', -0.15])],
    b:['atk', 'def', TM('Thick Skin', ['resilient', 0.25])] },
  Psychic:  { legacy:'The Far Mind',
    main:['crit', 'dmg', TM('Clear Mind', ['superEff', 0.20]), 'crit', 'dmg', 'crit', TM('Mind over Matter', ['critX', 2], ['crit', 0.05])],
    a:['dmg', 'hp', TM('Echoing Thought', ['linger', 1])],
    b:['crit', 'dodge', TM('Calm Aura', ['inspire', 0.10])] },
  Ghost:    { legacy:'The Long Night',
    main:['dodge', 'atk', TM('Soul Drain', ['lifesteal', 0.12]), 'dodge', 'atk', 'dmg', TM('Undying Will', ['undying', 1], ['atk', 0.05])],
    a:['atk', 'dodge', TM("Reaper's Mark", ['execute', 0.30])],
    b:['dmg', 'dodge', TM('Devour', ['devour', 0.15])] },
  Dragon:   { legacy:'The Ancient Scale',
    main:['atk', 'dmg', TM("Dragon's Wrath", ['superEff', 0.20]), 'hp', 'atk', 'dmg', TM('Draconic Might', ['atk', 0.08], ['fury', 0.25])],
    a:['dmg', 'atk', TM('Overwhelm', ['execute', 0.30])],
    b:['hp', 'atk', TM('Scaled Hide', ['resilient', 0.25])] },
  Steel:    { legacy:'The Unbending Iron',
    main:['def', 'hp', TM('Iron Plating', ['bastion', 2]), 'def', 'hp', 'def', TM('Living Fortress', ['stalwart', 0.15], ['warden', 0.10])],
    a:['hp', 'def', TM('Bulwark Body', ['atk', -0.10], ['hp', 0.20])],
    b:['def', 'hp', TM('Razor Edges', ['thorns', 0.25])] },
  Fairy:    { legacy:'The Bright Dream',
    main:['hp', 'def', TM('Kind Light', ['warden', 0.10]), 'hp', 'dmg', 'def', TM('Wish Upon a Star', ['regen', 0.06], ['inspire', 0.10])],
    a:['hp', 'dmg', TM('Glimmer Guard', ['bastion', 2])],
    b:['def', 'hp', TM('Second Chance', ['undying', 1])] },
};
/* Where each constellation sits in the drawing ([row, column]; columns 0
   left, 1 the main branch, 2 right), and where each side branch leaves the
   main one. */
const TALENT_LAYOUT = { m:[[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1]], a:[[2,0],[3,0],[4,0]], b:[[5,2],[6,2],[7,2]] };
const TALENT_FROM = { a:'m2', b:'m5' };
const TALENT_BRANCH = { m:'main branch', a:'left branch', b:'right branch' };

const _talentNodes = {};
function talentNodesOf(type){
  if(_talentNodes[type]) return _talentNodes[type];
  const t = TALENT_TREES[type];
  if(!t) return [];
  const out = [];
  [['m', t.main], ['a', t.a], ['b', t.b]].forEach(([br, list])=>{
    list.forEach((it, j)=>{
      const i = j + 1, major = typeof it === 'object';
      const capstone = br === 'm' && i === list.length;
      out.push({
        id:`${type}:${br}${i}`, type, br, i, major, capstone,
        cost:major ? TALENT_COST.major : TALENT_COST.minor,                                  // a monster's points to switch it on
        light:capstone ? STARLIGHT_COST.capstone : (major ? STARLIGHT_COST.major : STARLIGHT_COST.minor),   // Starlight to light it, once
        prereq:i > 1 ? `${type}:${br}${i - 1}` : (br === 'm' ? null : `${type}:${TALENT_FROM[br]}`),
        name:major ? it.name : TALENT_STATS[it].name, stat:major ? null : it,
        fx:major ? it.fx : [{ k:it, v:TALENT_STATS[it].v }],
        row:TALENT_LAYOUT[br][j][0], col:TALENT_LAYOUT[br][j][1],
      });
    });
  });
  return (_talentNodes[type] = out);
}
function talentNode(id){
  const type = String(id || '').split(':')[0];
  return talentNodesOf(type).find(n=> n.id === id) || null;
}
const talentPct = v=> Math.round(Math.abs(v) * 100) + '%';
function talentFxText(f){
  const v = f.v;
  switch(f.k){
    case 'atk':       return `${v < 0 ? '−' : '+'}${talentPct(v)} ATK`;
    case 'hp':        return `${v < 0 ? '−' : '+'}${talentPct(v)} max HP`;
    case 'dmg':       return `+${talentPct(v)} damage`;
    case 'def':       return `${talentPct(v)} less damage taken`;
    case 'dodge':     return `+${talentPct(v)} chance to dodge`;
    case 'crit':      return `+${talentPct(v)} chance of a critical hit (×${TALENT_CRIT_MULT} damage)`;
    case 'fury':      return `+${talentPct(v)} damage while below half its health`;
    case 'pristine':  return `+${talentPct(v)} damage while at full health`;
    case 'opener':    return `+${talentPct(v)} damage on its first attack of each wave`;
    case 'execute':   return `+${talentPct(v)} damage against a foe below a third of its health`;
    case 'superEff':  return `+${talentPct(v)} damage when its hit is super effective`;
    case 'resilient': return `${talentPct(v)} less damage from super-effective hits`;
    case 'stalwart':  return `${talentPct(v)} less damage taken while above half its health`;
    case 'regen':     return `heals ${talentPct(v)} of its max HP at the end of every turn it is on the field`;
    case 'lifesteal': return `heals ${talentPct(v)} of the damage it deals`;
    case 'thorns':    return `strikes back for ${v}× its ATK whenever an attack hits it`;
    case 'bastion':   return `comes onto the field with ${v} shields, each soaking up to its ATK (once a battle)`;
    case 'swift':     return `+${v} initiative`;
    case 'undying':   return `once a battle, a blow that would knock it out leaves it on 1 HP`;
    case 'linger':    return `its Very High stone's effects last ${v} turn${v > 1 ? 's' : ''} longer`;
    case 'inspire':   return `the other monster on its side of the field deals +${talentPct(v)} damage`;
    case 'warden':    return `the other monster on its side of the field takes ${talentPct(v)} less damage`;
    case 'critX':     return `its critical hits deal ×${v} instead of ×${TALENT_CRIT_MULT}`;
    case 'devour':    return `heals ${talentPct(v)} of its max HP whenever it knocks out a foe`;
  }
  return '';
}
function talentNodeText(n){
  const t = n.fx.map(talentFxText).filter(Boolean).join('; ');
  return t.charAt(0).toUpperCase() + t.slice(1) + '.';
}

/* ---------- a monster's talents ---------- */
function talentEligible(m){ return !!m && !isPassenger(m) && isCrowned(m) && (m.level || 0) > CROWN_GATE; }
function talentCapacity(m){ return talentEligible(m) ? 1 + Math.floor((m.level - CROWN_GATE) / TALENT_STEP) : 0; }
/* The level its next point comes at (null at 200). */
function talentNextAt(m){
  if(!m || m.level >= LEVEL_MAX) return null;
  if(m.level <= CROWN_GATE) return CROWN_GATE + 1;
  return Math.min(LEVEL_MAX, CROWN_GATE + TALENT_STEP * (Math.floor((m.level - CROWN_GATE) / TALENT_STEP) + 1));
}
function talentOrder(n){ return LEGACY_TYPES.indexOf(n.type) * 100 + ({ m:0, a:1, b:2 })[n.br] * 10 + n.i; }
/* What it really has switched on: lit constellations of its own elements'
   open skies, each reached from the one before it, within its points.
   Theirs (the future's monsters, which have no uid) is simply all of it. */
function activeTalentNodes(m){
  if(!m || !Array.isArray(m.talents) || !m.talents.length) return [];
  if(!m.uid) return m.talents.map(talentNode).filter(Boolean);
  if(!talentEligible(m)) return [];
  const types = (SPECIES[m.species] || {}).types || [];
  let left = talentCapacity(m);
  const on = new Set(), out = [];
  m.talents.map(talentNode).filter(Boolean).sort((a, b)=> talentOrder(a) - talentOrder(b)).forEach(n=>{
    if(on.has(n.id) || !types.includes(n.type) || !legacyOpen(n.type) || !constellationLit(n.id)) return;
    if(n.prereq && !on.has(n.prereq)) return;
    if(n.cost > left) return;
    left -= n.cost; on.add(n.id); out.push(n);
  });
  return out;
}
function talentSpent(m){ return activeTalentNodes(m).reduce((s, n)=> s + n.cost, 0); }
/* For one monster: 'on' switched on · 'open' can be switched on now · 'pts'
   not enough points · 'path' the one before it first · 'dark' not lit yet ·
   'closed' its sky not open · 'type' not one of its elements */
function talentState(m, n){
  const act = activeTalentNodes(m);
  if(act.some(x=> x.id === n.id)) return 'on';
  if(!((SPECIES[m.species] || {}).types || []).includes(n.type)) return 'type';
  if(!legacyOpen(n.type)) return 'closed';
  if(!constellationLit(n.id)) return 'dark';
  if(n.prereq && !act.some(x=> x.id === n.prereq)) return 'path';
  if(act.reduce((s, x)=> s + x.cost, 0) + n.cost > talentCapacity(m)) return 'pts';
  return 'open';
}
function learnTalent(m, id){
  const n = talentNode(id);
  if(!m || !n || talentState(m, n) !== 'open') return false;
  const before = monMaxHp(m);
  m.talents = activeTalentNodes(m).map(x=> x.id).concat(id);
  talentHpFollow(m, before);
  return true;
}
/* The learned nodes that are reached through this one. */
function talentDependents(m, id){
  const on = activeTalentNodes(m).map(x=> x.id);
  const out = new Set([id]);
  let grew = true;
  while(grew){
    grew = false;
    on.forEach(x=>{ const n = talentNode(x); if(n && n.prereq && out.has(n.prereq) && !out.has(x)){ out.add(x); grew = true; } });
  }
  out.delete(id);
  return [...out];
}
function unlearnTalent(m, id){
  const gone = new Set([id, ...talentDependents(m, id)]);
  const before = monMaxHp(m);
  m.talents = activeTalentNodes(m).map(x=> x.id).filter(x=> !gone.has(x));
  talentHpFollow(m, before);
  return gone.size;
}
function resetTalents(m){
  if(!m) return;
  const before = monMaxHp(m);
  m.talents = [];
  talentHpFollow(m, before);
}
/* Max HP moves with an HP node: its health moves by as much (as a level does). */
function talentHpFollow(m, before){
  talentCacheBump();
  const after = monMaxHp(m);
  if(m.currentHp > 0) m.currentHp = Math.max(1, Math.min(after, m.currentHp + (after - before)));
}

/* ---------- what it all adds up to ----------
   Kept per monster (a WeakMap — nothing extra in the save), refreshed when
   its talents, level or crown change, or a sky opens or a constellation is lit. */
let _talentGen = 1;
function talentCacheBump(){ _talentGen++; }
const _tfxCache = new WeakMap();
function talentFxOf(x){
  if(x && x.talentFx) return x.talentFx;          // (3.86) a set of its own: an alien's boosts (20-jungle.js)
  if(!x || !Array.isArray(x.talents) || !x.talents.length) return null;
  const key = _talentGen + '|' + x.talents.join(',') + '|' + (x.level || 0) + '|' + (x.crowned ? 1 : 0) + '|' + (x.species || '');
  const hit = _tfxCache.get(x);
  if(hit && hit.key === key) return hit.fx;
  const fx = talentFxSum(activeTalentNodes(x));
  _tfxCache.set(x, { key, fx });
  return fx;
}
function talentFxSum(nodes){
  if(!nodes.length) return null;
  const fx = { atk:0, hp:0, dmg:0, def:0, dodge:0, crit:0, critX:TALENT_CRIT_MULT, fury:0, pristine:0, opener:0, execute:0,
               superEff:0, resilient:0, stalwart:0, regen:0, lifesteal:0, thorns:0, bastion:0, swift:0, undying:0,
               linger:0, inspire:0, warden:0, devour:0, nm:{}, n:nodes.length };
  nodes.forEach(n=> n.fx.forEach(f=>{
    if(f.k === 'critX') fx.critX = Math.max(fx.critX, f.v);
    else fx[f.k] = (fx[f.k] || 0) + f.v;
    if(n.major && !fx.nm[f.k]) fx.nm[f.k] = n.name;
  }));
  return fx;
}
/* A short list of what it has, for a page: "ATK +12% · Damage +8% · …" */
function talentSummary(fx){
  if(!fx) return '';
  const out = [];
  const pct = v=> `${v < 0 ? '−' : '+'}${talentPct(v)}`;
  if(fx.atk) out.push(`ATK ${pct(fx.atk)}`);
  if(fx.hp) out.push(`Max HP ${pct(fx.hp)}`);
  if(fx.dmg) out.push(`Damage ${pct(fx.dmg)}`);
  if(fx.def) out.push(`Damage taken −${talentPct(fx.def)}`);
  if(fx.dodge) out.push(`Dodge +${talentPct(Math.min(TALENT_DODGE_CAP, fx.dodge))}`);
  if(fx.crit) out.push(`Critical +${talentPct(Math.min(TALENT_CRIT_CAP, fx.crit))} (×${fx.critX})`);
  Object.values(fx.nm).filter((v, i, a)=> a.indexOf(v) === i).forEach(nm=> out.push(nm));
  return out.join(' · ');
}

/* ============================================================
   TALENTS IN BATTLE — the hooks the rest of the game calls
   Either side's: yours by uid (a reference or the monster), theirs the
   enemy itself (the future's monsters carry e.talents).
   ============================================================ */
function talentHolder(x){
  if(!x) return null;
  if(x.uid){
    if(Array.isArray(x.talents)) return x;
    return (typeof ui !== 'undefined' && ui.battle && typeof battleMonByUid === 'function') ? (battleMonByUid(x.uid) || null) : null;
  }
  return x;
}
function tfx(x){ const h = talentHolder(x); return h ? talentFxOf(h) : null; }
function talentHpFrac(x){ return x.uid ? (x.currentHp || 0) / Math.max(1, monMaxHp(x)) : (x.hp || 0) / Math.max(1, x.maxHp || 1); }
/* Its stats (computeAtk, computeMaxHp): its talents' share, on yours. */
function talentStatMult(mon, stat){
  if(!mon || !Array.isArray(mon.talents) || !mon.talents.length) return 1;
  const fx = talentFxOf(mon);
  return fx ? Math.max(0.1, 1 + (fx[stat] || 0)) : 1;
}
/* What the other one on its side brings (an aura): the best of them. */
function talentAura(x, kind){
  if(!ui.battle || !x) return 0;
  const side = x.uid ? livingField() : livingEnemies();
  let best = 0;
  side.forEach(o=>{
    if(o === x || (x.uid && o.uid === x.uid)) return;
    const fx = talentFxOf(o);
    if(fx && fx[kind] > best) best = fx[kind];
  });
  return best;
}
/* computeDamage, the attacker's side: its damage bonuses, all added up. */
function talentDealMult(att, def, isPlayer, peek, opts){
  if(!ui.battle || (opts && opts.rider)) return 1;
  const a = talentHolder(att);
  const fx = a ? talentFxOf(a) : null;
  let add = 0;
  if(fx){
    add += fx.dmg;
    const f = talentHpFrac(a);
    if(fx.fury && f < 0.5) add += fx.fury;
    if(fx.pristine && f >= 0.999) add += fx.pristine;
    if(fx.opener && !talentOpened(a)) add += fx.opener;
    const d = def ? (talentHolder(def) || def) : null;
    if(fx.execute && d && d.species && talentHpFrac(d) < 1 / 3) add += fx.execute;
    if(fx.superEff && def && def.types && att && att.types && typeMultFor(att, def) > 1) add += fx.superEff;
  }
  add += talentAura(a || att, 'inspire');
  add -= hexCut(a || att, 'hxDmg');               // (3.86) a Vicious Hex Dulled: off its damage bonuses
  return add ? Math.max(0.1, 1 + add) : 1;
}
/* …and the defender's: its damage cuts, all added up (60% at most). */
function talentTakeMult(def, att){
  if(!ui.battle) return 1;
  const d = talentHolder(def);
  const fx = d ? talentFxOf(d) : null;
  let cut = 0;
  if(fx){
    cut += fx.def;
    if(fx.stalwart && talentHpFrac(d) > 0.5) cut += fx.stalwart;
    if(fx.resilient && att && att.types && def && def.types && typeMultFor(att, def) > 1) cut += fx.resilient;
  }
  cut += talentAura(d || def, 'warden');
  return cut ? Math.max(1 - TALENT_CUT_MAX, 1 - cut) : 1;
}
/* A talent's critical: rolled for a blow that no other critical has made
   one already. Returns the multiplier, or 1. */
function talentCrit(att, def){
  const a = talentHolder(att), fx = a ? talentFxOf(a) : null;
  if(!fx || !(fx.crit > 0) || !(Math.random() < Math.min(TALENT_CRIT_CAP, fx.crit) - critCut(a))) return 1;   // (3.86) less, Unlucky
  const d = def ? (talentHolder(def) || def) : null;
  if(d && d.species) floatOver(d, 'CRITICAL');
  const b = ui.battle;
  if(b && a.uid){ if(b._critAt !== b.actionSeq){ b._critAt = b.actionSeq; b._crits = 0; } b._crits++; }
  return fx.critX || TALENT_CRIT_MULT;
}
function talentDodge(x){ const fx = tfx(x); return fx ? Math.min(fx.dodgeCap || TALENT_DODGE_CAP, fx.dodge || 0) : 0; }   // (3.86) an alien's own limit
function talentInit(x){ const fx = tfx(x); return (fx ? (fx.swift || 0) : 0) + ((x && !x.uid && x.distInit) || 0); }   // and the distortion's Haste
function talentLinger(x){ const fx = tfx(x); return fx ? (fx.linger || 0) : 0; }
function talentThorns(x){ const fx = tfx(x); return fx ? (fx.thorns || 0) : 0; }
function talentLifesteal(x){ const fx = tfx(x); return fx ? (fx.lifesteal || 0) : 0; }
function talentDevour(x){ const fx = tfx(x); return fx ? (fx.devour || 0) : 0; }
function talentName(x, k){ const fx = tfx(x); return (fx && fx.nm[k]) || ''; }
/* Its first attack of the wave: not made yet? (bState: this battle's alone) */
function talentOpened(x){ const b = ui.battle; return !b || !x || bState(x).tOpen === b.waveIndex; }
function talentMarkOpened(x){
  const b = ui.battle, h = talentHolder(x) || x;
  if(b && h && tfx(h)) bState(h).tOpen = b.waveIndex;
}
/* Undying: once a battle. */
function talentUndyingReady(x){ const h = talentHolder(x), fx = h ? talentFxOf(h) : null; return !!(fx && fx.undying && !bState(h).tUndying); }
function talentUndyingUse(x){ const h = talentHolder(x); if(h) bState(h).tUndying = true; return talentName(h, 'undying') || 'Undying'; }
/* Shields as it comes onto the field (applyEntryPassives): once a battle —
   a Bastion constellation's, and the distortion's Haste. */
function talentEntry(holder, atk){
  const b = ui.battle;
  if(!b || !holder) return;
  const h = talentHolder(holder) || holder, fx = talentFxOf(h);
  const n = (fx ? (fx.bastion || 0) : 0) + ((!h.uid && h.distShields) || 0);
  if(!(n > 0)) return;
  const s = bState(h);
  if(s.tBastion) return;
  s.tBastion = true;
  grantBlock(h, n, atk || (typeof atkOfMon === 'function' ? atkOfMon(h) : 0));
  const who = h.uid ? displayName(h) : SPECIES[h.species].name;
  const why = (fx && fx.nm.bastion) ? fx.nm.bastion : 'Haste';
  setTimeout(()=>{ if(ui.battle === b) battleMsg(`🧱 ${escapeHtml(who)} — ${escapeHtml(why)}: ${n} shields.`); }, 650);
}
/* The end of every turn: what heals itself (endRound). Returns its line. */
function talentRoundEnd(){
  const b = ui.battle;
  if(!b) return '';
  const said = [];
  livingField().forEach(m=>{
    const fx = talentFxOf(m);
    if(!fx || !(fx.regen > 0)) return;
    const max = monMaxHp(m), was = m.currentHp;
    if(was <= 0 || was >= max) return;
    m.currentHp = Math.min(max, was + Math.ceil(max * fx.regen));
    drainHp(pid('playerHp', m), was, m.currentHp, max);
    said.push(`${escapeHtml(displayName(m))} +${m.currentHp - was}`);
  });
  livingEnemies().forEach(e=>{
    const fx = talentFxOf(e), reg = (fx ? (fx.regen || 0) : 0) + (e.distRegen || 0);   // and the distortion's Echo
    if(!(reg > 0) || e.hp >= e.maxHp) return;
    const was = e.hp;
    e.hp = Math.min(e.maxHp, was + Math.ceil(e.maxHp * reg));
    drainHp('enemyHp-' + b.enemies.indexOf(e), was, e.hp, e.maxHp);
    said.push(`their ${escapeHtml(SPECIES[e.species].name)} +${e.hp - was}`);
  });
  return said.length ? `🌿 Talents heal: ${said.join(', ')}.` : '';
}

/* ============================================================
   THE FUTURE'S MONSTERS — future_<element> (the designer: "future rift
   monsters are ready, all labelled future_<element>. we still need to plan
   their moves, passives talents, AI"). A DRAFT, made of what the game
   already knows how to do: each a legendary of one element (level 200 in
   the rift, crowned), a five-move kit and one signature passive, its
   element's ✦ Very High stone (cast on its first action) and its element's
   whole sky of constellations. AI: its Max every turn, as every fierce foe
   from Region 5 on (the Psychic weighs its moves instead: 'smart'). Art:
   assets/mon/future_<element>.png (the picture's fallback finds it).
   ============================================================ */
const FUTURE_KIT = {
  Fire:     { glyph:'炎', passive:['Star Core', { crit:{ chance:0.20, mult:2 } }],
    moves:[['Cinder Jab',0.3], ['Plasma Lance',0.6], ['Solar Storm',0.5,'AOE'], ['Supernova',1.25], ['Supernova Max',2.1]] },
  Water:    { glyph:'潮', passive:['Tidal Ward', { ward:0.15 }],
    moves:[['Droplet Shot',0.3], ['Hydro Lance',0.6], ['Time Tide',0.5,'AOE'], ['Riptide Rift',1.25], ['Riptide Rift Max',1.8,'Single',{ sleepHit:0.30 }]] },
  Grass:    { glyph:'森', passive:['Spore Reflex', { sleepBack:0.25 }],
    moves:[['Thorn Flick',0.3], ['Vine Lash',0.6], ['Seed Storm',0.5,'AOE'], ['World Bloom',1.25], ['World Bloom Max',1.8]] },
  Electric: { glyph:'雷', passive:['Overclock', { speed:2, empower:0.10 }],
    moves:[['Static Jab',0.3], ['Volt Lance',0.6], ['Storm Grid',0.5,'AOE'], ['Chrono Bolt',1.25], ['Chrono Bolt Max',1.8,'Single',{ hits:3, split:true, stunHit:0.15 }]] },
  Flying:   { glyph:'翔', passive:['Afterimage Wings', { evadeAlways:0.25 }],
    moves:[['Gust Cut',0.3], ['Wing Lance',0.6], ['Cyclone',0.5,'AOE'], ['Sky Rend',1.25], ['Sky Rend Max',2.1,'Single',{ hits:3, split:true }]] },
  Ground:   { glyph:'岩', passive:['Bedrock Shell', { block:2, hitCap:1/4 }],
    moves:[['Pebble Shot',0.3], ['Stone Lance',0.6], ['Quake',0.5,'AOE'], ['Tectonic Slam',1.25], ['Tectonic Max',1.8,'Single',{ stunHit:0.30 }]] },
  Physical: { glyph:'拳', passive:['Battle Instinct', { counterStack:2 }],
    moves:[['Jab',0.3], ['Cross Strike',0.6], ['Shockwave',0.5,'AOE'], ['Final Form',1.25], ['Final Form Max',2.1]] },
  Psychic:  { glyph:'念', ai:'smart', passive:['Precognition', { precog:0.5 }],
    moves:[['Mind Tap',0.3], ['Psi Lance',0.6], ['Thought Wave',0.5,'AOE'], ['Mind Rift',1.25], ['Mind Rift Max',1.8,'Single',{ confuseHit:{ chance:0.30, ffPower:1.0 } }]] },
  Ghost:    { glyph:'影', passive:['Void Step', { lurk:true, ambush:1.75 }],
    moves:[['Chill Touch',0.3], ['Shade Lance',0.6], ['Night Wave',0.5,'AOE'], ['Void Rend',1.25], ['Void Rend Max',1.8,'Single',{ pierce:true }]] },
  Dragon:   { glyph:'龍', passive:['Dread Aura', { terrorize:0.20, unsweepable:true }],
    moves:[['Eon Claw',0.3], ['Dragon Lance',0.6], ['Eon Roar',0.5,'AOE'], ['Eon Breath',1.25], ['Eon Breath Max',2.1]] },
  Steel:    { glyph:'鋼', passive:['Organosteel Hide', { block:3, organosteel:1 }],
    moves:[['Iron Tap',0.3], ['Steel Lance',0.6], ['Shrapnel',0.5,'AOE'], ['Iron Epoch',1.25], ['Iron Epoch Max',1.8,'Single',{ taunt:{ turns:1 } }]] },
  Fairy:    { glyph:'星', passive:['Stardust Veil', { cleanseEnd:1 }],
    moves:[['Twinkle',0.3], ['Star Lance',0.6], ['Glitter Storm',0.5,'AOE'], ['Starlight Waltz',1.25], ['Starlight Waltz Max',1.8,'Single',{ softenHit:{ chance:0.5, amount:0.5 } }]] },
};
/* (3.76) Their Max moves — the designer: "their max moves should hit like
   legendaries, 2.1x damage or 1.8 with a special effect": 2.1× for Fire,
   Flying (three strikes), Physical and Dragon; 1.8× and something more for
   the rest — a sleep (Water), a drink of half its ATK (Grass), three strikes
   that may stun (Electric), a stun (Ground), a muddle (Psychic), straight
   through shields (Ghost), a taunt (Steel), a weakened next blow (Fairy). */
if(typeof LIFESTEAL === 'object' && LIFESTEAL) LIFESTEAL['World Bloom Max'] = 0.5;
const futureId = type=> 'future_' + String(type).toLowerCase();
(function addFutureSpecies(){
  const SLOTS = ['Basic', 'Power1', 'Power2', 'Ultimate', 'Max'], WORDS = [2, 4, 8, 8, 8];
  Object.keys(FUTURE_KIT).forEach(type=>{
    const k = FUTURE_KIT[type], id = futureId(type);
    SPECIES[id] = { name:'Future ' + type, tier:'legendary', types:[type], rate:13, nerfedRate:13, base:200, evo:[], evoMult:1.5,
                    color:TYPE_COLORS[type] || '#5a4a8a', glyph:k.glyph, bossOnly:true, noLevelCap:true, future:true };
    const rows = k.moves.map(([name, mult, target, extra], i)=>{
      const row = [SLOTS[i], name, mult, target || 'Single', WORDS[i], 1];
      if(extra) row.push(extra);
      return row;
    });
    rows.splice(3, 0, ['Passive', k.passive[0], null, 'Passive', 0, 1, { passive:k.passive[1] }]);
    MOVES[id] = rows;
  });
})();

/* ============================================================
   CHALLENGE THE FUTURE
   ============================================================ */
const FUTURE = {
  level:200,          // "1 wave of 3 level 200 monsters"
  stonePlus:2,        // their element's Very High stone, at ✦
  power:1,            // × their ATK and HP on top of everything — the knob if the future is too hard (or too easy)
  xp:12,              // fights' worth of XP for a win (a tear round's) — (3.82) × the distortions'
  tickets:6,          // (3.82) "a base +6 tickets to the standard ticket drop rate", × the distortions' too
  words:10,           // phrases to capture a legacy…
  slips:2,            // …and the slips that lose it
};
/* (3.76) SPACETIME DISTORTION, remade — the designer: "3 distortion states
   are randomly selected from a pool, each with a point multiplier. these
   stick for the week too, just like the 3 monsters". Each week three of
   DISTORTION_POOL are drawn by the week's number; each is the player's to
   switch on or off before a fight. A win pays FUTURE_STAR_BASE × the
   multipliers of those switched on (rounded) — the week's best only, so a
   better one later pays the difference. The base and the multipliers are
   placeholders ("we can set the base starlight value and the multipliers
   later"). The six levels of 3.75 are gone. */
const FUTURE_STAR_BASE = 10;
const DISTORTION_POOL = {
  silence: { name:'Silenced',      mult:1.6, text:'Your Very High stones are sealed for the whole fight.' },
  dust:    { name:'Endless Dust',  mult:1.6, text:'A fresh Diamond Dust of theirs settles at the start of every turn.' },
  ahead:   { name:'Ahead of Time', mult:1.3, text:'They always move first — sooner than any Mach Dragon ✦.' },
  rewind:  { name:'Rewind',        mult:1.5, text:'Time rewinds once for each of them: the first time it falls, it stands again at half health.' },
  immune:  { name:'Untouchable',   mult:1.5, text:'No debuff of yours takes hold on them — no freeze, curse, seed, muddle or mark.' },
  ripple:  { name:'Ripple',        mult:1.2, hp:0.25,     text:'Their health +25%.' },
  surge:   { name:'Surge',         mult:1.3, atk:0.25,    text:'Their attack +25%.' },
  echo:    { name:'Echo',          mult:1.3, regen:0.05,  text:'They heal 5% of their health at the end of every turn.' },
  bulwark: { name:'Bulwark',       mult:1.2, shields:2,   text:'Each arrives with 2 shields.' },
};
const DISTORTION_IDS = Object.keys(DISTORTION_POOL);
/* The week's three, the same all week. */
function futureDistortions(d){
  const rnd = seededRandom(7919 * (futureWeekNo(d) + 2048));
  for(let k = 0; k < 5; k++) rnd();
  const ids = DISTORTION_IDS.slice();
  for(let i = ids.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids.slice(0, 3);
}
/* Which of the week's three are switched on (futureState().dist). */
function distortionChosen(){
  const f = futureState(), on = f.dist || {};
  return futureDistortions().filter(id=> !!on[id]);
}
function distortionMult(ids){ return (ids || []).reduce((p, id)=> p * ((DISTORTION_POOL[id] || {}).mult || 1), 1); }
function distortionPay(ids){ return Math.round(FUTURE_STAR_BASE * distortionMult(ids)); }
/* (3.82) the designer: "multipliers to difficulty (spacetime distortion) should multiply the ticket
   drop and the XP as well". A win's XP, in fights' worth; its tickets (Skill Tokens): the base and
   the usual drop together (each whole one certain, what is left a chance of one more), × the same. */
function futureXp(ids){ return Math.round(FUTURE.xp * distortionMult(ids)); }
function futureTicketChance(ids, enemies){ return (FUTURE.tickets + tokenDropChanceFor(enemies)) * distortionMult(ids); }
function futureTicketRoll(ids, enemies){
  const c = futureTicketChance(ids, enemies);
  let n = Math.floor(c);
  if(Math.random() < c - n) n++;
  return n;
}
/* What a set of them does to the numbers: health and attack added up; a
   heal and shields, the greater. */
function distortionRules(ids){
  const r = { hp:0, atk:0, regen:0, shields:0, ids:(ids || []).slice() };
  r.ids.forEach(id=>{
    const d = DISTORTION_POOL[id];
    if(!d) return;
    if(d.hp) r.hp += d.hp;
    if(d.atk) r.atk += d.atk;
    if(d.regen) r.regen = Math.max(r.regen, d.regen);
    if(d.shields) r.shields = Math.max(r.shields, d.shields);
  });
  return r;
}
/* In a fight against the future (the rift's, or the Test Arena's card):
   whether `id` is one of its distortions (b.distortion: their ids). */
function futureFight(){ const b = ui.battle; return !!(b && (b.future || b.arenaChallenge === 'r6_future')); }
function battleDistortion(id){
  const b = ui.battle;
  return futureFight() && Array.isArray(b.distortion) && b.distortion.includes(id);
}
function futureSilenced(){ return battleDistortion('silence'); }      // your Very High buttons (04-battle.js)
function futureAhead(){ return battleDistortion('ahead'); }           // their Mach tier: 3 (machTier)
/* Endless Dust, in their pre-action upkeep: their old dust swept up, a fresh
   one down — no dust of yours stops it. */
function futureEndlessDust(){
  const b = ui.battle;
  if(!battleDistortion('dust') || !livingEnemies().length) return '';
  const es = enemySideStatuses();
  const n = diamondDustCleanse('enemy');            // (3.77) its own Unstable Magic count (magicBurst)
  es.diamondDust = { type:'diamondDust', turnsLeft:2, owner:livingEnemies()[0], by:'enemy', tier:0, fresh:true };
  renderStatusBadges();
  return `✨ Endless Dust — a fresh Diamond Dust settles on their side${n ? `: ${n} of yours swept away` : ''}.`;
}

/* THE WEEK'S THREE (the designer: "all 12 types appear once per 4 weeks, 3
   per wave, never repeating every 4 weeks"). Weeks are counted from a Monday;
   every four make a cycle, whose twelve elements are shuffled by the
   cycle's number, three to a week. The same three all week — a lost fight
   meets them again. */
const FUTURE_EPOCH = new Date(2026, 0, 5);                 // a Monday
function futureWeekNo(d){ return Math.round((tearWeekStart(d).getTime() - tearWeekStart(FUTURE_EPOCH).getTime()) / (7 * 864e5)); }
function seededRandom(seed){
  let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  return ()=> (s = (s * 16807) % 2147483647) / 2147483647;
}
function futureCycleRaw(cycle){
  const rnd = seededRandom(9973 * (cycle + 4096));
  for(let k = 0; k < 7; k++) rnd();
  const order = LEGACY_TYPES.slice();
  for(let i = order.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}
/* …and no element two weeks running across a cycle's end: any of the last
   cycle's final three in this one's first week swaps places with one from
   its second or third week (never its fourth, which the next cycle reads). */
function futureCycleOrder(cycle){
  const order = futureCycleRaw(cycle), prevLast = futureCycleRaw(cycle - 1).slice(9, 12);
  for(let i = 0; i < 3; i++){
    if(!prevLast.includes(order[i])) continue;
    for(let j = 3; j < 9; j++){
      if(!prevLast.includes(order[j])){ [order[i], order[j]] = [order[j], order[i]]; break; }
    }
  }
  return order;
}
function futureWeek(d){
  const no = futureWeekNo(d), cycle = Math.floor(no / 4), pos = ((no % 4) + 4) % 4;
  const types = futureCycleOrder(cycle).slice(pos * 3, pos * 3 + 3);
  return { no, key:tearWeekKey(d), types, picks:types.map(type=> ({ type, species:futureId(type) })) };
}
/* This week's record. A new week starts it afresh. */
function futureState(){
  const r = r6(), wk = tearWeekKey();
  if(!r.future || typeof r.future !== 'object' || r.future.week !== wk)
    r.future = { week:wk, wins:0, tries:0, paid:0, pending:false, captured:null, dist:{} };
  if(typeof r.future.paid !== 'number' || r.future.paid < 0) r.future.paid = 0;      // (3.76) Starlight paid this week (it was a level)
  if(!r.future.dist || typeof r.future.dist !== 'object') r.future.dist = {};
  return r.future;
}
function futureFoeSpec(p){
  const k = FUTURE_KIT[p.type] || {};
  return { species:p.species, level:FUTURE.level, ai:k.ai || 'best', crowned:true, nerfed:false, anyLevel:true,
           veryHigh:{ type:p.type, plus:FUTURE.stonePlus, cast:true },
           vhPassive:p.type, ultraPassive:p.type,            // (3.76) "all the buyable passives": both of its element's
           talents:talentNodesOf(p.type).map(n=> n.id), legacy:p.type };
}
function futureBegin(){
  if(!ensurePool()) return;
  const f = futureState(), ids = distortionChosen();
  f.tries = (f.tries || 0) + 1;
  ui.futureDist = ids.slice();                   // for futureWaveStart, which runs inside beginBattle
  beginBattle({ waves:[futureWeek().picks.map(futureFoeSpec)], isNpc:true, future:true, bgKey:'battle_future', foeRegion:6,
                name:`The future${ids.length ? ' · ' + ids.map(id=> DISTORTION_POOL[id].name).join(' · ') : ''}`, onWaveStart:(i)=> futureWaveStart(i) });
  ui.battle.distortion = ids.slice();
  saveProfile();
}
/* As they walk on (loadWave, before their entry passives): their sky's
   share of ATK and HP, the distortions', FUTURE.power — (3.76) and both of
   their element's passives, their ✦ Ultra stone, and what a distortion
   marks on them. */
function futureWaveStart(i){
  const b = ui.battle;
  if(!b) return;
  if(!Array.isArray(b.distortion)) b.distortion = Array.isArray(ui.futureDist) ? ui.futureDist.slice() : [];
  const spec = b.waves[i] || [], dr = distortionRules(b.distortion);
  b.enemies.forEach((e, k)=>{
    const s = spec[k] || {};
    e.legacy = s.legacy || null;
    e.talents = (s.talents || []).slice();
    if(s.vhPassive) e.vhPassive = s.vhPassive;
    if(s.ultraPassive) e.ultraPassive = s.ultraPassive;
    if(s.legacy) e.futureUltra = { type:s.legacy, plus:FUTURE.stonePlus, used:false };   // (3.76) once a battle, its second action
    const fx = talentFxOf(e);
    e.atk = Math.max(1, Math.ceil(e.atk * (1 + (fx ? fx.atk : 0)) * (1 + dr.atk) * FUTURE.power));
    e.maxHp = e.hp = Math.max(1, Math.ceil(e.maxHp * (1 + (fx ? fx.hp : 0)) * (1 + dr.hp) * FUTURE.power));
    if(dr.regen) e.distRegen = dr.regen;
    if(dr.shields) e.distShields = dr.shields;
    if(b.distortion.includes('immune')) e.debuffImmune = true;
  });
}
/* (3.76) Their ✦ Ultra stone: once a battle, on its second action (enemyActs).
   Returns the move, or null. */
function futureUltraFor(e){
  const u = e && e.futureUltra, b = ui.battle;
  if(!u || u.used || !b || e._windup) return null;
  const r = roundNo();
  if(e._fuRound !== r){ e._fuRound = r; e._fuActs = (e._fuActs || 0) + 1; }
  if(e._fuActs < 2) return null;
  u.used = true;
  return enemyUltraMove(u.type, u.plus);
}
/* Rewind — (3.76) once for each of them: the first time it falls, it stands
   again at half health (landStrike). */
function futureRewindReady(t){ return !!(t && !t.uid && !t._rewound && battleDistortion('rewind')); }
function futureRewind(t){
  t._rewound = true;
  return Math.max(1, Math.ceil(t.maxHp * 0.5));
}
/* Won: XP for the whole team, this week's Starlight (the difference, if a
   smaller win was paid already), then — once a week — a legacy. */
function futureWon(){
  const b = ui.battle;
  if(!b || !b.future || b.futureDone) return;
  b.futureDone = true;
  b.phase = 'resolving';
  const f = futureState(), ids = Array.isArray(b.distortion) ? b.distortion.slice() : [];
  const worth = distortionPay(ids);
  f.wins = (f.wins || 0) + 1;
  let star = 0;
  if(worth > (f.paid || 0)){
    star = worth - (f.paid || 0);
    f.paid = worth;
    addStarlight(star);
  }
  if(!f.captured) f.pending = true;
  tallyBattleForEyeBreak();
  const xp = futureXp(ids);
  const tickets = futureTicketRoll(ids, b.enemies);
  if(tickets > 0) state.inventory.tokens = (state.inventory.tokens || 0) + tickets;
  const levelUps = awardXpToParty(xp) || [];
  saveProfile();
  stopMusic();
  playSfx('victory');
  const run = { ids, worth, star, levelUps, xp, tickets, mult:distortionMult(ids) };
  const finish = ()=> f.pending ? futureChoose(run) : futureResults(run);
  const evolvers = levelUps.filter(e=> e.evos && e.evos.length);
  if(evolvers.length) playEvolutions(evolvers, finish); else finish();
}
/* Lost or left: nothing is taken (a fall leaves them on a little health). */
function futureEnded(kind){
  const b = ui.battle;
  if(!b || !b.future || b.futureDone) return;
  b.futureDone = true;
  b.phase = 'resolving';
  if(kind === 'lost') battleParty().concat(bondedCompanions()).forEach(m=>{ m.currentHp = Math.max(1, Math.floor(monMaxHp(m) * 0.10)); });
  tallyBattleForEyeBreak();
  stopMusic();
  if(kind === 'lost') playSfx('defeat');
  saveProfile();
  challengeResult(kind === 'lost' ? '⏳' : '🚪', kind === 'lost' ? 'The future was too strong' : 'You stepped back from the future',
    (kind === 'lost' ? '<div>Your team fainted and recovered a little. Nothing else is lost — not even XP.</div>' : '<div>Nothing is lost.</div>') +
    `<div style="margin-top:6px;">The same three wait for you all week. Try again whenever you are ready${distortionChosen().length ? ' — or switch a distortion off' : ''}.</div>`,
    'future');
}
/* Choose whose legacy to capture. */
function futureChoose(run){
  r6Css();
  const f = futureState(), wk = futureWeek();
  $('#brandSub').textContent = 'Capture a legacy';
  screenEl.innerHTML = `
    <div class="fu-screen">
      <div class="screen-title" style="text-align:center;">The future is beaten!</div>
      <div class="fu-say">${run && run.star ? `✨ <b>+${run.star} Starlight</b>. ` : ''}${run && run.tickets ? `${tokenIcon(18)} <b>+${run.tickets} Skill Token${run.tickets === 1 ? '' : 's'}</b>. ` : ''}Now choose one of them. Its legacy — everything that kind of monster will ever learn — comes back with you. The monster itself stays in its own time.</div>
      <div class="fu-picks">${wk.picks.map((p, i)=>{
        const open = legacyOpen(p.type);
        return `<button class="fu-pick" data-pick="${i}">
          <span class="fu-pic">${monPortrait(p.species, 72, { view:'front', bare:true, crowned:true })}</span>
          <span class="fu-pn">${escapeHtml(SPECIES[p.species].name)}</span>
          <span class="type-badge" style="background:${TYPE_COLORS[p.type]};">${escapeHtml(p.type)}</span>
          <span class="fu-pl">${open ? `Its sky is open: an echo, ✨ +${LEGACY_ECHO} Starlight` : `Opens the <b>${escapeHtml(p.type)}</b> sky`}</span>
        </button>`; }).join('')}</div>
      <div class="fu-note">Spell <b>${FUTURE.words}</b> phrases to capture it. ${FUTURE.slips} slips, and it slips back into the future — win again this week to try again.</div>
    </div>`;
  screenEl.querySelectorAll('[data-pick]').forEach(bt=> bt.addEventListener('click', ()=> futureCapture(wk.picks[+bt.dataset.pick], run)));
}
function futureCapture(p, run){
  /* the fight's slips first, then the learned words (as every quiz in the rift) */
  const mistakes = ((ui.battle && ui.battle.fightMistakes) || []).slice();
  const all = revisionPool();
  const rest = all.filter(t=> !mistakes.includes(t));
  const words = [];
  mistakes.forEach(t=>{ if(words.length < FUTURE.words) words.push(t); });
  if(words.length < FUTURE.words && all.length) words.push(...drawPhrases(rest.length ? rest : all, FUTURE.words - words.length));   // (3.95) the least tested first
  if(!words.length){ toast('No words selected, please select to proceed.'); return futureResults(run); }
  preloadSfx(['catch_success', 'catch_miss'], true);
  startQuiz({
    title:`Capturing the ${p.type} legacy`,
    subtitle:`Spell ${words.length} to hold it. ${FUTURE.slips} slips, and it slips back into the future!`,
    words, endAfterMistakes:FUTURE.slips, lockExit:true,
    onComplete:(results)=> futureCaptured(p, results, run),
    onExit:()=> futureResults(run),
  });
}
function futureCaptured(p, results, run){
  const f = futureState();
  const slips = (results || []).filter(x=> !x.passed).length;
  f.pending = false;
  if(slips >= FUTURE.slips){
    saveProfile();
    playSfxSoon('catch_miss', 2500);
    return futureResults(Object.assign({}, run, { slipped:p }));
  }
  f.captured = p.type;
  const opened = openLegacy(p.type);
  if(!opened) addStarlight(LEGACY_ECHO);
  saveProfile();
  playSfxSoon('catch_success', 2500);
  futureResults(Object.assign({}, run, { legacy:p, opened }));
}
function futureResults(run){
  run = run || {};
  const grown = {};
  (run.levelUps || []).forEach(e=>{
    if(!e || !e.uid) return;
    const g = grown[e.uid] || (grown[e.uid] = { name:e.name, to:-Infinity, ready:null });
    if(Number.isFinite(e.to)) g.to = Math.max(g.to, e.to);
    if(e.ready) g.ready = e.ready;
  });
  const p = run.legacy, s = run.slipped;
  const said = ids=> ids && ids.length ? ids.map(id=> escapeHtml(DISTORTION_POOL[id].name)).join(', ') : 'no distortion';
  const lines = [
    run.star ? `<div>✨ <b>+${run.star} Starlight</b> (a win worth ${run.worth}: ${said(run.ids)}). You have <b>${starlight()}</b>.</div>`
             : run.worth != null ? `<div>A win worth ✨ ${run.worth} (${said(run.ids)}) — you were paid as much or more this week already. Switch more distortions on for more.</div>` : '',
    run.tickets ? `<div>${tokenIcon(18)} <b>+${run.tickets} Skill Token${run.tickets === 1 ? '' : 's'}</b>${run.mult > 1 ? ` (×${+run.mult.toFixed(2)} for the distortions)` : ''}. You have <b>${state.inventory.tokens || 0}</b>.</div>` : '',   // (3.87) "should not read tickets but tokens"
    run.xp ? `<div>XP: <b>${run.xp} fights' worth</b> for the whole team${run.mult > 1 ? ` (${FUTURE.xp} × ${+run.mult.toFixed(2)})` : ''}.</div>` : '',
    p ? (run.opened ? `<div style="color:#6a4ab0;font-weight:800;">🌌 The <b>${escapeHtml(p.type)}</b> legacy is yours: its sky is open. Light its constellations with Starlight on the Talents page.</div>`
                    : `<div style="color:#6a4ab0;font-weight:800;">🌌 An echo of the ${escapeHtml(p.type)} legacy you hold: ✨ +${LEGACY_ECHO} Starlight.</div>`) : '',
    s ? `<div>💨 The ${escapeHtml(s.type)} legacy slipped back into the future. Win again this week to try again.</div>` : '',
    ...Object.values(grown).filter(g=> Number.isFinite(g.to)).map(g=> `<div>⬆️ ${escapeHtml(g.name)} grew to Lv ${g.to}!</div>`),
    ...Object.values(grown).filter(g=> g.ready).map(g=> `<div style="color:#6a4ab0;">⚡ ${escapeHtml(g.name)} is ready to break through to Lv ${g.ready} — see your Party.</div>`),
  ];
  challengeResult(p ? '🌌' : s ? '💨' : '⏳', p ? 'A legacy from the future' : 'The future is beaten', lines.filter(Boolean).join(''), 'future');
}

/* The Test Arena's card (08-screens2.js): this week's three — with none of
   the week's distortions, each alone, or all three — nothing paid, nothing
   captured, for the grown-ups to try. */
function futureArenaVariants(V){
  const wk = futureDistortions();
  const sets = [[]].concat(wk.map(id=> [id]), [wk.slice()]);
  return sets.map(ids=> V(()=> ({
    waves:[futureWeek().picks.map(futureFoeSpec)], isNpc:true, bgKey:'battle_future', name:`The future${ids.length ? ' · ' + ids.map(id=> DISTORTION_POOL[id].name).join(' · ') : ''}`,
    onWaveStart:(i)=>{ if(ui.battle && !Array.isArray(ui.battle.distortion)) ui.battle.distortion = ids.slice(); futureWaveStart(i); },
  }), ids.length ? ids.map(id=> DISTORTION_POOL[id].name).join(' + ') + ` (×${+distortionMult(ids).toFixed(2)})` : 'No distortion'));
}
function futureArenaNote(){
  return `This week's three from the future, level ${FUTURE.level}, crowned, each with its element's ✦ Very High stone (cast on its first action), its ✦ Ultra stone (once, on its second), both of its element's passives and its whole sky of constellations. ` +
    `This week's distortions: ${futureDistortions().map(id=> `${DISTORTION_POOL[id].name} — ${DISTORTION_POOL[id].text.replace(/\.$/, '')}`).join('; ')}. ` +
    `In the rift a win pays Starlight and a legacy; here it pays nothing.`;
}
/* What each one does, in words, for its card (the passive's own words, and
   what its Max adds). */
const FUTURE_PASSIVE_TEXT = {
  Fire:'Every strike has a 20% chance to land a 2× critical.',
  Water:'Its whole side takes 15% less damage.',
  Grass:'Strike it, and you may fall asleep (25%).',
  Electric:'Moves 2 steps sooner, and its side deals 10% more damage.',
  Flying:'Dodges a quarter of every attack.',
  Ground:'Arrives with 2 shields, and no strike takes more than a quarter of its health.',
  Physical:'Arrives with 2 Counter stacks.',
  Psychic:'The first attack to reach it each turn lands at half.',
  Ghost:'Arrives lurking; the blow that ends its Lurk deals 1.75×.',
  Dragon:'Your side deals 20% less damage while it stands — no dust sweeps it.',
  Steel:'3 shields as it arrives, and 1 more every turn.',
  Fairy:'At the end of every turn it lifts one of your marks off its side.',
};
function futureMaxText(type){
  const row = (MOVES[futureId(type)] || []).find(r=> r[0] === 'Max');
  if(!row) return '';
  const x = row[6] || {}, bits = [];
  bits.push(x.hits ? `${x.hits} strikes, ${+(row[2] * (x.split ? 1 : x.hits)).toFixed(2)}× in all` : `${row[2]}×`);
  if(row[3] === 'AOE') bits.push('every one of yours');
  if(x.pierce) bits.push('straight through shields');
  if(x.stunHit) bits.push(`may stun (${Math.round(x.stunHit * 100)}%${x.hits ? ' a strike' : ''})`);
  if(x.sleepHit) bits.push(`may send to sleep (${Math.round(x.sleepHit * 100)}%)`);
  if(x.confuseHit) bits.push(`may confuse (${Math.round(x.confuseHit.chance * 100)}%)`);
  if(x.softenHit) bits.push(`may weaken your next attack (${Math.round(x.softenHit.chance * 100)}%)`);
  if(x.taunt) bits.push('taunts — your next move must strike it');                   // (3.76)
  const ls = (typeof LIFESTEAL === 'object' && LIFESTEAL && LIFESTEAL[row[1]]) || 0;
  if(ls) bits.push(`drinks ${ls}× its ATK in health`);
  return `${row[1]}: ${bits.join(', ')}`;
}

/* ============================================================
   (3.76) THEIR ELEMENT PASSIVES — the designer: "please give these monsters
   all the buyable passives". A future monster holds both of its element's
   (e.vhPassive / e.ultraPassive, futureWaveStart), and each works in its
   hands as yours do in yours, mirrored onto the other side. The whole wave
   stands on the field — there is no bench of theirs — so "on the field or
   off it" is simply standing. Your ✦ Curse quiets them (passivesMuted).
   Hooked from 04-battle.js and 05-battle-flow.js behind typeof checks.
   ============================================================ */
function foeHolders(el, slot){ return ui.battle ? livingEnemies().filter(e=> (e.vhPassive || e.ultraPassive) && elemPassiveOn(e, el, slot)) : []; }
function foeHolds(e, el, slot){ return !!(e && !e.uid && e.hp > 0 && (e.vhPassive || e.ultraPassive) && elemPassiveOn(e, el, slot)); }
function foeNm(e){ return escapeHtml(SPECIES[e.species].name); }
function foeIdx(e){ return ui.battle ? ui.battle.enemies.indexOf(e) : -1; }
function foeBuffCount(){ const es = enemySideStatuses(); return Object.keys(es).filter(k=> STATUS_KIND[k] === 'buff').length; }
function foeCurseOnThem(){ return !!(ui.battle && ui.battle.fieldStatus && ui.battle.fieldStatus.curse); }

/* ---- their blows (computeDamage, theirs attacking) ---- */
/* Consume, Burgeon, Momentum, Deadly Combo, Metamorph, Tempering — and
   Coruscate, (3.77) the whole wave's while a holder of it stands. */
function foeSelfAmp(e){
  if(!e || e.uid || !ui.battle) return 1;
  let a = 1;
  if(getESide('diamondDust') && foeHolders('Fairy', 'vh').length) a *= 1 + Math.min(CORUSCATE.cap, CORUSCATE.per * foeBuffCount());
  if(!(e.vhPassive || e.ultraPassive)) return a;
  if(foeHolds(e, 'Fire', 'ultra')) a *= 1 + Math.max(0, Math.min(CONSUME_CAP, 1 - Math.max(0, e.hp) / Math.max(1, e.maxHp)));
  if(foeHolds(e, 'Grass', 'ultra') && e.hp >= e.maxHp) a *= BURGEON_AMP;
  if(foeHolds(e, 'Flying', 'ultra')) a *= 1 + Math.min(MOMENTUM.cap, MOMENTUM.per * Math.max(0, initiativeOf('enemy', e, true)));
  if(foeHolds(e, 'Physical', 'ultra')) a *= 1 + DEADLY_COMBO.per * Math.min(DEADLY_COMBO.max, e._dcombo || 0);   // (3.77) no Counter needed
  if(foeHolds(e, 'Ground', 'ultra')) a *= 1 + METAMORPH.per * Math.min(METAMORPH.max, e._metamorph || 0);        // (3.77) damage, not ATK
  return a;   // (3.86) Tempering's 10% more dealt is gone
}
/* …and what the one of yours struck adds: Shatter, (3.86) a Vicious Hex
   Exposed on it (its marks until 3.86), Violent Dance on anything slower. */
function foeAttackAmp(e, def){
  let a = foeSelfAmp(e);
  const m = def && def.uid ? realMon(def) : null;
  if(m){
    a *= foeShatterAmp(m) * foeHexAmp(m);
    if(getESide('dragonDance') && foeHolds(e, 'Dragon', 'vh') && initKey('enemy', e) > initKey('player', m)) a *= 1 + VIOLENT_DANCE.faster;
  }
  return a;
}
function foeShatterAmp(m){
  if(!m || !foeHolders('Water', 'ultra').length) return 1;
  const ch = getPStatus(0, 'chill'), chill = !!(ch && isEnemyOwned('chill', ch)), ice = !!getMStatus(m, 'iceTomb');
  return 1 + (chill ? SHATTER.chill : 0) + (ice ? SHATTER.freeze : 0);
}
/* Foresight: 20% dodge, and a 20% critical at 2× — (3.77) no Discombobulate needed. */
function foeForesightOn(e){ return foeHolds(e, 'Psychic', 'ultra'); }
function foeForesightDodge(t){ return foeForesightOn(t) ? FORESIGHT.dodge : 0; }
function foeForesightCrit(e, def){
  if(!foeForesightOn(e) || !(Math.random() < FORESIGHT.crit - critCut(e))) return 1;   // (3.86) less, Unlucky
  const m = def && def.uid ? realMon(def) : null;
  if(m) floatOver(m, 'CRITICAL');
  return FORESIGHT.mult;
}

/* ---- your blows on them (computeDamage, yours attacking; landStrike) ---- */
function foeElusiveOwn(e, mir){
  const cl0 = getESide('clones'), cl = cl0 && (!cl0.owner || cl0.owner === e) ? cl0 : null, tac = tachyOf(e);   // (3.96) the caster's alone
  const best = Math.max(stanceEvasion(e),
    (mir.window && mir.step < mir.window.length) ? mir.window[mir.step] : (mir.chance || 0.20),
    (cl && cl.evade) || 0, tac ? tachyDodgeChance(tac) : 0);
  return Math.min(ELUSIVE_CAP, best);
}
function foeElusiveReduce(t){
  const mir = ui.battle ? getESide('mirage') : null;
  if(!mir || !t || t.uid) return 0;
  if(foeHolds(t, 'Flying', 'vh')) return foeElusiveOwn(t, mir);
  const hs = foeHolders('Flying', 'vh');
  return hs.length ? Math.max(...hs.map(h=> foeElusiveOwn(h, mir))) * ELUSIVE_SHARE : 0;
}
/* Elusive's cut, on one of theirs. ((3.86) Tempering's 10% less taken is gone.) */
function foeDefendMult(t){
  if(!t || t.uid) return 1;
  return 1 - foeElusiveReduce(t);
}
/* A blow of yours landed on an Elusive one: its Mirage's afterimages all the same. */
function foeElusiveImages(t){
  const mir = getESide('mirage');
  if(!mir || !mir.images || !foeHolds(t, 'Flying', 'vh')) return false;
  mir.pending = (mir.pending || 0) + mir.images;
  return true;
}
/* (3.86) Tempering, theirs: while their Steel Aegis is up, once — again
   every 7 turns (foeRecharge) — a blow of yours that would take it from half
   its health or more to below half leaves it at half, with 3 shields
   (landStrike). Its share a turn (3.76) is gone. */
function foeTemperLimit(t, dmg){
  if(!(dmg > 0) || !t || t.uid || t._temperUsed || !getESide('steelAegis') || !foeHolds(t, 'Steel', 'vh')) return dmg;
  const half = Math.ceil(TEMPER.floor * t.maxHp);
  if(t.hp < half || t.hp - dmg >= half) return dmg;
  t._temperUsed = true;
  grantBlock(t, TEMPER.shields, enemyAtk(t));
  floatOver(t, 'TEMPERED');
  const nm = foeNm(t), b = ui.battle;
  setTimeout(()=>{ if(ui.battle === b) battleMsg(`🔨 Their ${nm}'s <b>Tempering</b> — it holds at half its health, with <b>${TEMPER.shields}</b> shields.`); }, 900);
  return t.hp - half;
}
/* Metamorph's last stand: once — (3.86) again every 7 turns (foeRecharge);
   (3.77) Spike Armour or not — a blow that would fell it leaves it on 1 HP
   with a shield, and it holds on that turn and the next. Your Curse on them
   ends it and stops it. */
function foeLastStandReady(t){ return !!(t && !t.uid && foeHolds(t, 'Ground', 'ultra') && !t._lastStand && !foeCurseOnThem()); }
function foeLastStandUse(t){ t._lastStand = true; grantBlock(t, 1, enemyAtk(t)); t._endure = roundNo() + 1; return 'Metamorph'; }
function foeEndures(t){ return !!(t && !t.uid && t._endure >= roundNo() && !foeCurseOnThem() && !passivesMuted(t)); }

/* ---- their hits that got through to yours (enemyStrikeOn) ---- */
function foeHitLanded(e, m, dmg){
  const b = ui.battle;
  if(!b || !e || !m || !(dmg > 0) || !(e.vhPassive || e.ultraPassive)) return;
  /* (3.77) "make all ultra passives work without their stone's buffs up" */
  if(foeHolds(e, 'Physical', 'ultra')) e._dcombo = Math.min(DEADLY_COMBO.max, (e._dcombo || 0) + 1);   // Deadly Combo, for the battle
  if(foeHolds(e, 'Electric', 'ultra')){                                                                 // Capacitor
    const v = Math.round(dmg * CAPACITOR_PCT);
    if(v > 0) (b.foeCapacitor || (b.foeCapacitor = [])).push({ e, dmg:v });
  }
  if(foeHolds(e, 'Ghost', 'ultra')) giveHexDebuff(m, 'enemy');                                         // (3.86) Vicious Hex: a debuff a hit
}
/* (3.86) Vicious Hex on yours: a debuff a hit, each one's own (giveHexDebuff,
   04-battle.js) — the marks (+6% a mark, until 3.86) are gone. Exposed: 15%
   more taken. (foeHexSweep stays for the old call sites: nothing passes on.) */
function foeHexOf(m){ return 0; }
function foeHexAmp(m){ return (m && m.uid && getMStatus(m, 'hxWeak')) ? 1 + HEX_DEBUFF.pct : 1; }
function foeHexSweep(){}

/* ---- their Leech Seed drinking (theirSeedsDrink): Nourish ---- */
function foeNourishProc(){
  if(!foeHolders('Grass', 'vh').length) return false;
  const was = getESide('nourish'), ls = getPStatus(0, 'leechSeed');
  const tier = (ls && isEnemyOwned('leechSeed', ls)) ? vhTier(ls) : ((was && was.tier) || 0);   // (3.77) 3 / 4 / 5% by their Leech Seed's tier
  return !!setESide({ type:'nourish', turnsLeft:2, stacks:Math.min(NOURISH.max, ((was && was.stacks) || 0) + 1), per:nourishPer(tier), tier });
}
/* What their ATK gains, added to it as Enrage is (enemyAtk): Nourish's
   stacks. (Metamorph's is damage since 3.77: foeSelfAmp.) */
function foeAtkBonus(e){
  if(!ui.battle || !e || e.uid) return 0;
  const nu = getESide('nourish');
  const f = (nu && nu.stacks > 0) ? (nu.per || NOURISH.per[0]) * Math.min(NOURISH.max, nu.stacks) : 0;
  return f > 0 ? Math.round(e.atk * f) : 0;
}

/* ---- their casts (castEnemyVeryHigh) ---- */
function foeFuryHolder(){ return foeHolders('Physical', 'vh')[0] || null; }              // Focused Fury's Deflect (deflectSweep)
function foeMindControl(){ return !!(getESide('confusionField') && foeHolders('Psychic', 'vh').length); }   // your muddled swing hits all of your side
/* (3.86) Their Tempering standing: no more than 2 of their buffs swept or
   stolen a turn, their Diamond Dust last (temperSweepLeft, 04-battle.js). */
function foeTemperingGuards(){ return foeHolders('Steel', 'vh').length > 0; }

/* ---- (3.86) their Binding Curse (Deadly Curse until 3.86): their Curse on
   your side, a holder of it standing above 34% of its health. Cast through
   your dust; each time it is cast, or would be swept, washed off or run out,
   it holds one more turn instead, and their holder and every one of yours on
   the field lose 11% of the holder's max HP — HP lost, past shields and
   cuts. Their Vicious Hex counts each as its damage. ---- */
function foeBindingWorks(e){ return !!(e && !e.uid && e.hp > 0 && foeHolds(e, 'Ghost', 'vh') && e.hp > BINDING.floor * e.maxHp); }
/* (3.94) the strongest of theirs who can (the most max HP), chosen afresh each time, as yours */
function foeBinder(){
  if(!ui.battle) return null;
  const able = livingEnemies().filter(foeBindingWorks);
  return able.length ? able.slice().sort((x, y)=> (y.maxHp || 0) - (x.maxHp || 0))[0] : null;
}
function foeBindingPulse(h, why){
  const b = ui.battle;
  if(!b || !h) return '';
  const loss = Math.ceil(BINDING.pct * h.maxHp), idx = foeIdx(h), was = h.hp;
  h.hp = Math.max(1, h.hp - loss);
  drainHp('enemyHp-' + idx, was, h.hp, h.maxHp);
  showDamageNumber('enemy-' + idx, was - h.hp);
  const mine = livingField();
  let hurt = false;
  mine.forEach(m=>{
    const before = m.currentHp;
    m.currentHp = Math.max(hpFloorOf(m), m.currentHp - loss);
    if(m.currentHp < before) hurt = true;
    drainHp(pid('playerHp', m), before, m.currentHp, monMaxHp(m));
    showDamageNumber(pid('playerBob', m), before - m.currentHp);
    if(foeHolds(h, 'Ghost', 'ultra')) giveHexDebuff(m, 'enemy');   // their Vicious Hex: its damage
  });
  if(hurt && typeof noteWrath === 'function') noteWrath();          // (3.94) a hit, for your Gathering Wrath
  logBattle(`Their Binding Curse (${SPECIES[h.species].name}, ${why}): ${loss} HP from it and from ${mine.length} of yours`);
  return `🔗 Their ${foeNm(h)}'s <b>Binding Curse</b> — ${why}: it holds one more turn, and it and every one of yours on the field lose <b>${loss}</b> HP.` +
    (foeBindingWorks(h) ? '' : ` Their ${foeNm(h)} is too weak to hold it any longer.`);
}
/* Their Curse on you would go: bound, it holds a turn more and pulses. Returns its line, or ''. */
function foeBindingHolds(why){
  const c = ui.battle ? getPStatus(0, 'curse') : null;
  if(!c || !isEnemyOwned('curse', c)) return '';
  const h = foeBinder();
  if(!h) return '';
  c.turnsLeft = Math.max(0, c.turnsLeft || 0) + 1;
  return foeBindingPulse(h, why);
}

/* ---- Unstable Magic (Detonate until 3.77), theirs: every buff or debuff
   of either side's swept, stopped by a dust or running out (magicBurst) —
   (3.86) one burst a count, their strongest holder's; (3.93) no cap (it was
   3 a turn) ---- */
function queueFoeDetonate(n){
  const b = ui.battle;
  if(!b || !(n > 0) || !foeHolders('Fairy', 'ultra').length) return;
  b.foeDetonateN = (b.foeDetonateN || 0) + n;
}
function foeDetonatePending(){ return !!(ui.battle && ui.battle.foeDetonateN > 0); }
function foeDetonateNow(){
  const b = ui.battle;
  if(!foeDetonatePending()) return '';
  const n = b.foeDetonateN;
  b.foeDetonateN = 0;
  const hs = foeHolders('Fairy', 'ultra');
  if(!(n > 0) || !hs.length || !livingField().length) return '';
  const e = hs.slice().sort((x, y)=> enemyAtk(y) * foeSelfAmp(y) - enemyAtk(x) * foeSelfAmp(x))[0];   // the strongest
  foeStrikeYours(e, DETONATE_PCT * n, true, { noHex:true });
  return `💥 Their ${foeNm(e)}'s Unstable Magic${n > 1 ? ` ×${n}` : ''} — its magic bursts over your side!`;
}
function runFoeDetonate(done){
  const said = foeDetonateNow();
  if(!said) return done();
  battleMsg(said);
  setTimeout(()=>{ if(ui.battle) done(); }, 900);
}

/* ---- the pre-action phase (runUpkeepPassives → runFoeUpkeep) ---- */
/* One upkeep strike of theirs (`all`: on every one of yours, else one at
   random): pct × its ATK, their damage buffs and its own, their Curse on
   you, your block as it meets their burn. (3.77) `opts.breakKey`: their
   Dragon Dance's break first (Violent Dance), once per strike. */
function foeStrikeYours(e, pct, all, opts){
  const mine = livingField();
  if(!mine.length || !e) return [];
  const targets = all ? mine : [mine[Math.floor(Math.random() * mine.length)]];
  const curP = getPStatus(0, 'curse'), cur = (curP && isEnemyOwned('curse', curP)) ? 1 + (curP.extra != null ? curP.extra : 0.25) : 1;
  return targets.map(me=>{
    let broke = 0;
    if(opts && opts.breakKey){
      const sh0 = shieldsOn(me);
      breakShields('enemy', e, me, opts.breakKey, pid('playerBlk', me), pid('playerBob', me));
      broke = sh0 - shieldsOn(me);
    }
    const dmg = Math.ceil(pct * enemyAtk(e) * enemyBuffMultiplier(e) * foeSelfAmp(e) * foeShatterAmp(me) * foeHexAmp(me) * cur);   // (3.93) its Feeble in the pool
    const before = me.currentHp;
    const through = capHit(me, applyBlock(me, dmg, pid('playerBlk', me)));
    dropHp(me, through);
    if(through > 0) noteHurt(me);
    flashHit(document.getElementById(pid('playerBob', me)));
    drainHp(pid('playerHp', me), before, me.currentHp, monMaxHp(me));
    showDamageNumber(pid('playerBob', me), before - me.currentHp);
    if(dmg > through) floatBlocked(pid('playerBob', me), dmg - through);
    /* (3.86) their Vicious Hex: its upkeep strikes are its damage too (not its Unstable Magic's: noHex) */
    if(dmg > 0 && !(opts && opts.noHex) && foeHolds(e, 'Ghost', 'ultra')) giveHexDebuff(me, 'enemy');
    return { me, dmg:before - me.currentHp, broke };
  });
}
/* Theirs whose Wildfire would hit hardest: its ATK and its own multipliers. */
function foeWildfireHolder(){
  const hs = foeHolders('Fire', 'vh').filter(e=> e.hp > 0);
  return hs.length ? hs.slice().sort((x, y)=> enemyAtk(y) * enemyBuffMultiplier(y) * foeSelfAmp(y) - enemyAtk(x) * enemyBuffMultiplier(x) * foeSelfAmp(x))[0] : null;
}
function foeWildfire(e, oh){
  if(!e || e.hp <= 0 || !livingField().length) return '';
  const p = wildfirePct(oh);
  foeStrikeYours(e, p, true);
  let self = Math.ceil(p * enemyAtk(e) * enemyBuffMultiplier(e) * foeSelfAmp(e));
  const cur = getEStatus(e, 'curse');
  if(cur) self = Math.ceil(self * (1 + (cur.extra != null ? cur.extra : 0.25)));
  const took = Math.max(0, Math.min(self, e.hp - Math.ceil(e.maxHp * WILDFIRE.floor)));
  if(took > 0){ const was = e.hp; e.hp -= took; drainHp('enemyHp-' + foeIdx(e), was, e.hp, e.maxHp); showDamageNumber('enemy-' + foeIdx(e), took); }
  return `🔥 Their ${foeNm(e)}'s Wildfire scorches your side${took > 0 ? ' — and itself' : ''}!`;
}
function foeOneStrike(e, pct, label, opts){
  if(!e || e.hp <= 0) return '';
  const r = foeStrikeYours(e, pct, false, opts)[0];
  return r ? `${label} — ${escapeHtml(displayName(r.me))}${r.broke ? ` (${r.broke} shield${r.broke > 1 ? 's' : ''} shattered first)` : ''}!` : '';
}
function foeCapacitorStrike(s){
  const mine = livingField();
  if(!mine.length || !s || !(s.dmg > 0)) return '';
  const me = mine[Math.floor(Math.random() * mine.length)];
  const dmg = Math.ceil(s.dmg * foeHexAmp(me)), before = me.currentHp;
  const through = capHit(me, applyBlock(me, dmg, pid('playerBlk', me)));
  dropHp(me, through);
  if(through > 0) noteHurt(me);
  flashHit(document.getElementById(pid('playerBob', me)));
  drainHp(pid('playerHp', me), before, me.currentHp, monMaxHp(me));
  showDamageNumber(pid('playerBob', me), before - me.currentHp);
  if(dmg > 0 && s.e && foeHolds(s.e, 'Ghost', 'ultra')) giveHexDebuff(me, 'enemy');   // (3.86) its holder's damage: Vicious Hex
  return `🔋 Their ${s.e && SPECIES[s.e.species] ? foeNm(s.e) + '\'s' : ''} Capacitor — a stored charge strikes ${escapeHtml(displayName(me))}!`;
}
function foeUpkeepPassives(done){
  const b = ui.battle;
  if(!b) return done();
  const jobs = [];
  if(battleDistortion('dust')) jobs.push(()=> futureEndlessDust());
  const oh = getESide('overheat');
  /* (3.94) the strongest of their holders only, as yours (wildfireHolder) */
  if(oh && foeHolders('Fire', 'vh').length) jobs.push(()=>{
    const o = getESide('overheat'), e = foeWildfireHolder();
    return (o && e) ? foeWildfire(e, o) : '';
  });
  const dd = getESide('dragonDance');
  if(dd){
    const n = Math.max(0, vhTier(dd)) + 1;
    foeHolders('Dragon', 'vh').forEach(e=>{ for(let k = 1; k <= n; k++) jobs.push(()=> getESide('dragonDance') ? foeOneStrike(e, VIOLENT_DANCE.pct, `🐲 Their ${foeNm(e)}'s Violent Dance${n > 1 ? ` (${k}/${n})` : ''} strikes`,
      { breakKey:'fvd:' + (b._vdSeq = (b._vdSeq || 0) + 1) }) : ''); });   // (3.77) shields broken before each strike, a break of its own each
  }
  if(getESide('spikeArmour')) foeHolders('Ground', 'vh').forEach(e=> jobs.push(()=>{
    const sa = getESide('spikeArmour');                                         // (3.77) 0.2 / 0.3 / 0.4× by its tier
    return sa ? foeOneStrike(e, spikePct(sa), `🪨 Their ${foeNm(e)}'s Spike Formation — a spike strikes`) : '';
  }));
  (b.foeCapacitor || []).splice(0).forEach(st=> jobs.push(()=> foeCapacitorStrike(st)));
  jobs.push(()=> foeDetonatePending() ? foeDetonateNow() : '');
  let k = 0;
  const step = ()=>{
    if(!ui.battle) return;
    if(k >= jobs.length || !livingField().length || !livingEnemies().length){ foeHexSweep(); renderStatusBadges(); return done(); }
    const said = jobs[k++]();
    if(said){ battleMsg(said); renderStatusBadges(); return setTimeout(step, 800); }
    step();
  };
  step();
}

/* ---- the round's end (endRound) ---- */
/* Metamorph grows (3.77: its damage, 5% a turn to +20%, Spike Armour or
   not); marks pass on. (Deadly Combo stays for the battle since 3.77.)
   Returns its line. */
function foeMetamorphTurn(){
  const b = ui.battle;
  if(!b) return '';
  foeHexSweep();
  const grew = foeHolders('Ground', 'ultra').filter(e=> (e._metamorph || 0) < METAMORPH.max);
  grew.forEach(e=>{ e._metamorph = (e._metamorph || 0) + 1; });
  return grew.length ? `🦋 Their ${grew.map(foeNm).join(' and ')}'s Metamorph grows: <b>+${Math.round(METAMORPH.per * 100)}%</b> damage.` : '';
}
/* (3.77) while their Ice Tomb's chill is on your side, by its tier */
function foeCleansingSprings(){
  const tier = springsTier('enemy');
  if(tier < 0) return '';
  const holders = foeHolders('Water', 'vh');
  if(!holders.length) return '';
  const said = [];
  holders.forEach(h=>{
    const healed = springsHeal(h, livingEnemies(), e=> e.hp, (e, v)=>{ const was = e.hp; e.hp = v; drainHp('enemyHp-' + foeIdx(e), was, v, e.maxHp); },
                               e=> e.maxHp, e=> e.types || [], tier);
    const x = springsWash('enemy');
    if(!healed.length && !x) return;
    said.push(`⛲ Their ${foeNm(h)}'s Cleansing Springs` + (healed.length ? ` — ${healed.map(([e, n])=> `${foeNm(e)} +${n}`).join(', ')}` : '') +
      (x ? `${healed.length ? ';' : ' —'} your ${escapeHtml(x.label)} is washed away` : '') + '.');
  });
  if(said.length) renderStatusBadges();
  return said.join(' ');
}

/* ============================================================
   SELENE AND VESPER — the way in
   ============================================================ */
function seleneFace(px){ return npcPortrait('shopkeeper6', '🧙‍♀️', px || 130, 'transparent'); }
/* Vesper: his picture (assets/mon/vesper_front.png); drawn if it is missing. */
function vesperFace(px){
  px = px || 80;
  return `<img src="assets/mon/vesper_front.png" alt="Vesper" class="npc-portrait r6-vesper" data-px="${px}"
    style="width:${px}px;height:${px}px;object-fit:contain;background:transparent;image-rendering:pixelated;" onerror="r6VesperFallback(this)">`;
}
function r6VesperFallback(img){ try { img.outerHTML = vesperSvg(+img.dataset.px || 80); } catch(e){} }
let _vesperN = 0;
/* A small round bat, one big eye, wings full of stars. */
function vesperSvg(px){
  r6Css();
  const u = 'vs' + (++_vesperN), w = px || 80;
  const L = 'M52,36 C40,20 22,12 6,18 C12,26 13,33 9,40 C17,38 21,43 21,50 C27,46 33,48 36,55 C41,49 47,50 52,54 Z';
  const R = 'M68,36 C80,20 98,12 114,18 C108,26 107,33 111,40 C103,38 99,43 99,50 C93,46 87,48 84,55 C79,49 73,50 68,54 Z';
  const rnd = seededRandom(31337);
  let stars = '';
  for(let i = 0; i < 26; i++){
    const left = i % 2 === 0;
    const x = left ? 10 + rnd() * 40 : 70 + rnd() * 40, y = 18 + rnd() * 34, r = 0.5 + rnd() * 1.1;
    stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#fff" opacity="${(0.5 + rnd() * 0.5).toFixed(2)}"${i % 5 === 0 ? ' class="vs-tw"' : ''}/>`;
  }
  return `<svg class="vesper-svg" viewBox="0 0 120 80" width="${w}" height="${Math.round(w * 0.667)}" aria-label="Vesper">
    <defs>
      <radialGradient id="${u}g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#6a45c0"/><stop offset=".6" stop-color="#2c1858"/><stop offset="1" stop-color="#120a26"/></radialGradient>
      <radialGradient id="${u}n" cx="30%" cy="55%" r="35%"><stop offset="0" stop-color="#ff7ad9" stop-opacity=".6"/><stop offset="1" stop-color="#ff7ad9" stop-opacity="0"/></radialGradient>
      <radialGradient id="${u}m" cx="72%" cy="40%" r="30%"><stop offset="0" stop-color="#5ab4ff" stop-opacity=".55"/><stop offset="1" stop-color="#5ab4ff" stop-opacity="0"/></radialGradient>
      <clipPath id="${u}c"><path d="${L}"/><path d="${R}"/></clipPath>
    </defs>
    <g class="vs-wing vs-l"><path d="${L}" fill="url(#${u}g)" stroke="#b9a2ff" stroke-width="1.1"/></g>
    <g class="vs-wing vs-r"><path d="${R}" fill="url(#${u}g)" stroke="#b9a2ff" stroke-width="1.1"/></g>
    <g clip-path="url(#${u}c)"><rect x="0" y="0" width="120" height="80" fill="url(#${u}n)"/><rect x="0" y="0" width="120" height="80" fill="url(#${u}m)"/>${stars}</g>
    <path d="M50,37 L47,23 L56,32 Z M70,37 L73,23 L64,32 Z" fill="#1d1236" stroke="#8d72e6" stroke-width="1"/>
    <ellipse cx="60" cy="46" rx="13" ry="14.5" fill="#1d1236" stroke="#8d72e6" stroke-width="1.2"/>
    <circle cx="60" cy="43.5" r="8.2" fill="#fff8e6"/>
    <circle cx="60" cy="43.5" r="5.2" fill="#ffc94a"/>
    <circle cx="60" cy="43.5" r="2.5" fill="#120a26"/>
    <circle cx="62.2" cy="41.4" r="1.4" fill="#fff"/>
    <path d="M56,55 l2,4 l2,-4 Z M60,55 l2,4 l2,-4 Z" fill="#fff"/>
    <path d="M55,60 l-1,4 M65,60 l1,4" stroke="#8d72e6" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}
/* (3.80) Vesper a fifth bigger than Selene beside him — the designer: "size
   vesper and lucesco to be larger than Selene by about 20% each" */
const R6_BIG = 1.2;
function r6Pair(selPx, vesPx){ selPx = selPx || 130; return `<span class="emblem-pair">${seleneFace(selPx)}${vesperFace(vesPx || Math.round(selPx * R6_BIG))}</span>`; }
/* Nemesis's three forms, as he left: the falcon, the jackal and the cobra. */
function nemesisTrioHtml(px){
  const im = (src, alt)=> `<span class="r6-nem"><img src="${src}" alt="${alt}" style="width:${px}px;height:${px}px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.visibility='hidden'"></span>`;
  return `<span class="emblem-pair">${im('assets/mon/nemesis_front.png', 'the falcon')}${im('assets/mon/nemesis_anubis_front.png', 'the jackal')}${im('assets/mon/nemesis_wadjet_front.png', 'the cobra')}</span>`;
}
/* The tear's "Enter the space-time tear": Selene the first time, then the
   region itself. */
function r6Enter(){
  if(!r6Met()) return r6SeleneScene();
  r6GoIn();
}
function r6GoIn(){
  state.progress.currentRegion = 6;
  ui.currentZone = null;                          // the vault's catacombs are another region's
  ui.walkBack = null;
  saveProfile();
  /* (3.79) "The tear should lead up into a round room": up out of the tear,
     into the Rift (18-rift.js) */
  if(typeof riftGo === 'function' && typeof DECKS !== 'undefined' && DECKS.r6_rift) return riftGo();
  go('region');
}
function r6SeleneScene(){
  tearCss();
  r6Css();
  const opts = { subtitle:'The Time Rift', bg:'rift' };
  const page = (emblem, title, html, next)=> ()=> storyModal(emblem, title, html, next, opts);
  const p5 = page(r6Pair(), 'Stay in the rift',
    `"Legacies are slow to gather. Stay here in the rift, and grow: here your monsters can reach level <b>150</b>. ` +
    `When you are ready, we will face Nemesis together."<br><br>` +
    `"And since you will be staying —" a little counter of starlight shimmers into being beside her "— I keep a shop."<br><br>` +
    `Vesper puffs up proudly.` +
    `<div class="scene-reward">🌌 <div><b>Region 6 — The Time Rift</b><br><span>Level cap 150 · Challenge the future, once a week · Selene's shop · ` +
    `Talents, from your Party page</span></div></div>`,
    ()=>{ r6().met = true; r6().metAt = Date.now(); r6GoIn(); });
  const p4 = page(r6Pair(), 'Legacies',
    `"But there is a way to grow. Every monster that will ever live pushes its element further than the last. ` +
    `A <b>legacy</b> is all of that, gathered up: the fire of every Fire monster to the end of time; the stone of every Ground monster."<br><br>` +
    `"Once a week the rift opens onto the future: three of its strongest monsters, level 200. Beat them, and capture the legacy of one. ` +
    `Not the monster itself — taking it out of its own time would tear time open again — only what it knows."<br><br>` +
    `"A legacy opens its element's sky. <b>Starlight</b> lights its <b>constellations</b>, one by one. A crowned monster past level 100 ` +
    `can learn from the lit ones of its own element — more of them as it grows."`, p5);
  const p3 = page(nemesisTrioHtml(84), 'Three pieces',
    `"He has split himself into three — the falcon, the jackal and the cobra — and sent each piece hunting through time ` +
    `for more cores, to mend his broken body."<br><br>` +
    `"Do not rush after him. With his power over time he can be anywhere, and anywhen. And you —" she looks your team over ` +
    `"— are not strong enough. Not yet."`, p4);
  const p2 = page(r6Pair(), 'Selene',
    `A woman steps out of the stars. Her cloak <i>is</i> the stars: galaxies drift across it as she moves.<br><br>` +
    `"I am <b>Selene</b>. Vesper and I are guardians of spacetime. We keep the past, the present and the future, each in its own place."<br><br>` +
    `She looks past you at the tear. "Nemesis came through here. He was already hurt — your fight had cracked Cyborg's body — ` +
    `and still we could not stop him. He threw Vesper and me aside like leaves in the wind."<br><br>Vesper's starry wings droop.`, p3);
  page(`<span class="r6-tear">${tearGalaxy()}</span>`, 'Through the tear',
    `You step through the tear, and the vault is gone.<br><br>` +
    `Stars turn slowly all around you — above, below, everywhere — and time feels thin, like ice on a pond.<br><br>` +
    `Something flaps out of the dark: a bat with one huge eye, and wings full of stars. It circles you twice, and squeaks.<br><br>` +
    `"<b>Vesper.</b> Bring them here."`, p2)();
}

/* ============================================================
   THE REGION'S LOOKS — a sky of its own until there is art
   (region6.png, battle_future.png …): bgCandidates asks here first.
   ============================================================ */
let _r6Sky = null;
function r6SkyUri(){
  if(_r6Sky) return _r6Sky;
  const rnd = seededRandom(2026);
  let stars = '';
  for(let i = 0; i < 170; i++){
    const x = (rnd() * 800).toFixed(1), y = (rnd() * 1400).toFixed(1), r = (0.4 + rnd() * 1.7).toFixed(2), o = (0.35 + rnd() * 0.65).toFixed(2);
    stars += `<circle cx='${x}' cy='${y}' r='${r}' fill='#fff' opacity='${o}'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1400' viewBox='0 0 800 1400'><defs>` +
    `<radialGradient id='a' cx='50%' cy='30%' r='80%'><stop offset='0' stop-color='#3a1d63'/><stop offset='0.55' stop-color='#160b2a'/><stop offset='1' stop-color='#06030c'/></radialGradient>` +
    `<radialGradient id='n' cx='28%' cy='62%' r='40%'><stop offset='0' stop-color='#b44bd8' stop-opacity='0.4'/><stop offset='1' stop-color='#b44bd8' stop-opacity='0'/></radialGradient>` +
    `<radialGradient id='m' cx='76%' cy='24%' r='34%'><stop offset='0' stop-color='#3f7bd8' stop-opacity='0.35'/><stop offset='1' stop-color='#3f7bd8' stop-opacity='0'/></radialGradient>` +
    `</defs><rect width='800' height='1400' fill='url(#a)'/><rect width='800' height='1400' fill='url(#n)'/><rect width='800' height='1400' fill='url(#m)'/>${stars}</svg>`;
  return (_r6Sky = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/'/g, '%27'));
}
function r6BgCandidates(key){
  if(!key) return null;
  const D = (typeof BG_DIR !== 'undefined' ? BG_DIR : 'assets/bg/');
  if(key === 'rift') return [D + 'rift.png', D + 'region6.png', r6SkyUri()];          // Selene's scene, wherever you come from
  if(key === 'past') return [D + 'past.png', typeof pastSkyUri === 'function' ? pastSkyUri() : r6SkyUri()];   // (3.81) the land of long ago, at dusk
  const SHARED = ['explore', 'region', 'challenge', 'recover', 'shop', 'battle', 'home', 'region6', 'tear'];
  if(SHARED.includes(key)) return [D + key + '6.png', D + 'region6.png', r6SkyUri()].filter((v, i, a)=> a.indexOf(v) === i);
  if(key === 'jungle' || key === 'battle_jungle') return [D + key + '.png', typeof jungleSkyUri === 'function' ? jungleSkyUri() : r6SkyUri()];   // (3.84) the time-lost jungle
  if(key === 'palace' || key === 'battle_palace') return [D + key + '.png', typeof caPalaceBgUri === 'function' ? caPalaceBgUri() : r6SkyUri()];   // (3.90) the King's hall, drawn until there is art
  if(/^battle_/.test(key)) return [D + key + '.png', D + 'battle6.png', D + 'region6.png', r6SkyUri()];
  return null;
}

/* ============================================================
   SELENE'S SHOP — her words (renderShop draws her, and Vesper)
   ============================================================ */
const SELENE_GREETINGS = [
  "Time is the one thing I cannot sell. Everything else — have a look.",
  "Vesper counted your medals as you came in. He is never wrong.",
  "The forge is lit. Bring me High stones of one element, and I'll make its passive.",
  "Every word you master echoes forward. The future can hear you.",
  "Nemesis is out there, in three pieces. Best be ready.",
  "Spend wisely. Or don't — I already know how it turns out.",
  "Vesper says hello. He says it with his eye.",
  "Starlight is for the sky. Medals are for my shop.",
];
function r6ShopGreeting(){ return SELENE_GREETINGS[Math.floor(Math.random() * SELENE_GREETINGS.length)]; }

/* ============================================================
   THE CHALLENGE PAGE (Region 6)
   ============================================================ */
function renderChallengeR6(){
  r6Css();
  setScreenBg('challenge');
  $('#brandSub').textContent = 'Challenge';
  const f = futureState(), wk = futureWeek();
  const day = escapeHtml(tearDayName(tearNextWeek()));
  const status = f.pending ? '<b>Won!</b> A legacy is waiting to be captured.'
    : f.captured ? `This week's legacy: <b>${escapeHtml(f.captured)}</b>. New monsters on <b>${day}</b>.`
    : 'Beat all three to capture one legacy this week.';
  const paid = f.paid >= 0 ? ` · ✨ paid for Distortion ${f.paid}` : '';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Region</button>
    <div class="screen-title">Challenge</div>
    <div class="screen-sub">The future, once a week — and the past.</div>
    <div class="challenge-card fu-card" id="cFuture">
      <span class="fu-mini">${wk.picks.map(p=> `<span>${monPortrait(p.species, 34, { view:'front', bare:true })}</span>`).join('')}</span>
      <div style="flex:1;">
        <div class="cc-title">Challenge the future ${f.captured ? '<span class="clear-tag">Done</span>' : ''}</div>
        <div class="cc-desc">This week: ${wk.picks.map(p=> `<b style="color:${TYPE_COLORS[p.type]};">${escapeHtml(p.type)}</b>`).join(', ')} — level ${FUTURE.level}. ${status}${paid}</div>
      </div>
    </div>
    ${tearChallengeCard()}
    <div class="challenge-card" style="cursor:default;">
      ${nemesisTrioHtml(30).replace('emblem-pair', 'fu-mini')}
      <div style="flex:1;">
        <div class="cc-title">Nemesis</div>
        <div class="cc-desc">In three pieces — the falcon, the jackal and the cobra — hunting through time for cores. Selene says: not yet.</div>
      </div>
    </div>
    <button class="btn btn-ghost" id="returnBtn" style="margin-top:4px;">Return</button>`;
  $('#backBtn').addEventListener('click', ()=> go('region'));
  $('#returnBtn').addEventListener('click', ()=> go('region'));
  $('#cFuture').addEventListener('click', ()=>{ ui.futureBack = null; go('future'); });
  const tc = $('#cTear');
  if(tc) tc.addEventListener('click', ()=>{ ui.tearBack = null; go('tear'); });
}

/* ============================================================
   THE FUTURE'S PAGE — the week's three, the distortion, the fight
   ============================================================ */
function renderFuture(){
  r6Css();
  setScreenBg('challenge');
  $('#brandSub').textContent = 'Challenge the future';
  const f = futureState(), wk = futureWeek(), week3 = futureDistortions(), on = distortionChosen();
  const day = escapeHtml(tearDayName(tearNextWeek()));
  const worth = distortionPay(on), more = Math.max(0, worth - (f.paid || 0));
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← ${ui.futureBack ? 'The Rift' : 'Challenge'}</button>
    <div class="fu-screen">
      <div class="screen-title" style="text-align:center;">Challenge the future</div>
      <div class="fu-say">${vesperFace(46)} "Three of the future's strongest, this week. Beat them all, and capture one legacy." — Selene</div>
      <div class="fu-trio">${wk.picks.map(p=>{
        const vh = veryHighDef(p.type, FUTURE.stonePlus) || {};
        const k = FUTURE_KIT[p.type], pv = elemPassiveDef(p.type, 'vh'), pu = elemPassiveDef(p.type, 'ultra');
        return `<div class="fu-foe" style="--tc:${TYPE_COLORS[p.type]};">
          <div class="fu-foe-pic">${monPortrait(p.species, 64, { view:'front', bare:true, crowned:true })}</div>
          <div class="fu-foe-txt">
            <div class="fu-foe-name">${escapeHtml(SPECIES[p.species].name)} <span class="type-badge" style="background:${TYPE_COLORS[p.type]};">${escapeHtml(p.type)}</span></div>
            <div>Lv ${FUTURE.level} · crowned · <b>${escapeHtml(vh.name || '')} ✦</b> · <b>${escapeHtml(stoneName(p.type, 'ultra'))} ✦</b> once · its whole sky</div>
            <div><b>${escapeHtml(k.passive[0])}:</b> ${escapeHtml(FUTURE_PASSIVE_TEXT[p.type])}</div>
            <div>Passives: <b>${escapeHtml(pv ? pv.name : '')}</b> and <b>${escapeHtml(pu ? pu.name : '')}</b>.</div>
            <div>${escapeHtml(futureMaxText(p.type))}</div>
            <div class="fu-leg">${legacyOpen(p.type) ? `Its sky is open — capturing it again pays ✨ ${LEGACY_ECHO}.` : `Its legacy would open the <b>${escapeHtml(p.type)}</b> sky.`}</div>
          </div>
        </div>`; }).join('')}</div>
      <div class="fu-dist">
        <div class="fu-dist-head">🌀 This week's spacetime distortions</div>
        <div class="fu-dist-sub">Switch each on or off. Each one switched on multiplies what a win pays.</div>
        <div class="fu-dt-row">${week3.map(id=>{ const d = DISTORTION_POOL[id], y = on.includes(id);
          return `<button class="fu-dt${y ? ' on' : ''}" data-dt="${id}" aria-pressed="${y}">
            <span class="fu-dt-top"><b>${escapeHtml(d.name)}</b><i>×${d.mult}</i></span>
            <span class="fu-dt-txt">${escapeHtml(d.text)}</span>
            <span class="fu-dt-sw">${y ? 'On' : 'Off'}</span></button>`; }).join('')}</div>
        <div class="fu-dist-note">A win now is worth ✨ <b>${worth}</b> (${FUTURE_STAR_BASE}${on.length ? ' × ' + on.map(id=> DISTORTION_POOL[id].mult).join(' × ') : ''}).
          ${f.paid > 0 ? `This week ✨ <b>${f.paid}</b> is paid already, so it pays ${more ? `✨ <b>${more}</b> more` : 'nothing more — switch more on for more'}.` : ''}
          Every win also pays about ${tokenIcon(16)} <b>${Math.round(futureTicketChance(on, wk.picks.map(p=> ({ species:p.species }))))}</b> Skill Tokens and <b>${futureXp(on)}</b> fights' worth of XP${on.length ? ', multiplied the same way' : ''}.</div>
      </div>
      ${f.pending ? `<button class="btn btn-primary fu-btn" id="fuCapture">Capture a legacy</button>` : ''}
      <button class="btn ${f.pending ? 'btn-ghost' : 'btn-primary'} fu-btn" id="fuFight">Fight${on.length ? ` — ${on.length} distortion${on.length > 1 ? 's' : ''}` : ''}</button>
      <div class="fu-note">${f.captured ? `This week's legacy is captured (<b>${escapeHtml(f.captured)}</b>). You can still fight for Starlight. ` : 'One legacy a week, on a win. '}
        New monsters and distortions on <b>${day}</b>. Lose, and nothing is taken — not even XP — and the same three wait for you. Every move here asks for your <b>silver and gold words</b>.
        You hold ✨ <b>${starlight()}</b> Starlight.</div>
    </div>`;
  /* (3.79) come from the Rift's distortion, Back goes there */
  $('#backBtn').addEventListener('click', ()=>{ const b = ui.futureBack; ui.futureBack = null; go(b || 'challenge'); });
  screenEl.querySelectorAll('[data-dt]').forEach(bt=> bt.addEventListener('click', ()=>{
    const id = bt.dataset.dt, d = futureState().dist;
    if(d[id]) delete d[id]; else d[id] = 1;
    saveProfile(); renderFuture();
  }));
  $('#fuFight').addEventListener('click', ()=> futureBegin());
  const cap = $('#fuCapture');
  if(cap) cap.addEventListener('click', ()=> futureChoose(null));
}

/* ============================================================
   THE TALENTS PAGE (the designer: "a talents page accessible from a button
   next to the companions button on the party page")
   The twelve skies along the top (open or not, how many lit — a tap shows
   one, to light its constellations); the monsters that can learn (crowned,
   past 100 — (3.79) the rarest first, then the highest level); the one chosen, its points,
   and its own elements' skies, where a tap on a constellation lights it or
   switches it on.
   ============================================================ */
/* (3.79) rarest first, then the highest level (byRarityThenLevel, 02-core.js) */
function talentCandidates(){ return byRarityThenLevel((state.party || []).concat(state.storage || []).filter(m=> m && talentEligible(m))); }
function renderTalents(){
  r6Css();
  setScreenBg('home');
  $('#brandSub').textContent = 'Talents';
  const ok = talentCandidates();
  const m = ok.find(x=> x.uid === ui.talentUid) || ok[0] || null;
  if(m) ui.talentUid = m.uid;
  const types = m ? ((SPECIES[m.species] || {}).types || []) : [];
  const sky = types.includes(ui.talentSky) ? ui.talentSky : (types[0] || null);
  const cap = m ? talentCapacity(m) : 0, used = m ? talentSpent(m) : 0, next = m ? talentNextAt(m) : null;
  const fx = m ? talentFxOf(m) : null;
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← Party</button>
    <div class="tl-head">
      <div><div class="screen-title" style="margin:0;">Talents</div>
        <div class="screen-sub" style="margin:0;">Crowned monsters past level 100 learn from the lit constellations of their own elements' skies.</div></div>
      <div class="tl-star" title="Starlight">✨ <b>${starlight()}</b><small>Starlight</small></div>
    </div>
    <div class="tl-skies">${LEGACY_TYPES.map(t=>{
      const o = legacyOpen(t);
      return `<button class="tl-sky${o ? ' open' : ''}" data-sky="${t}" style="--tc:${TYPE_COLORS[t]};"><span>${escapeHtml(t)}</span><i>${o ? `${litCount(t)}/${talentNodesOf(t).length}` : '🔒'}</i></button>`;
    }).join('')}</div>
    <div class="tl-hint">Capture legacies in <b>Challenge the future</b> to open skies; its Starlight lights their constellations.</div>
    ${ok.length ? `<div class="tl-pick">${ok.map(x=> `<button class="tl-mon${x === m ? ' on' : ''}" data-tuid="${x.uid}">
        ${monPortrait(x.species, 44, { stage:monStage(x), crowned:true })}
        <span>${escapeHtml(displayName(x))}</span><small>Lv ${x.level} · ${talentSpent(x)}/${talentCapacity(x)}</small></button>`).join('')}</div>`
      : `<div class="tl-none">No monster can learn talents yet: it needs its <b>Crown</b>, and to grow past <b>level 100</b> — 1 point at 101, and 1 more every ${TALENT_STEP} levels.</div>`}
    ${m ? `
    <div class="tl-who">
      <div class="tl-who-name">${escapeHtml(displayName(m))}${crownMark(m)} <span>Lv ${m.level}</span> ${typeBadges(m.species)}</div>
      <div class="tl-pts">${Array.from({ length:cap }, (_, i)=> `<i class="${i < used ? 'on' : ''}"></i>`).join('')}</div>
      <div class="tl-who-sub">Points: <b>${used} of ${cap}</b> used${next ? ` · the next at Lv ${next}` : ''}${used ? ' · <button class="tl-link" id="tlReset">Switch all off</button>' : ''}</div>
      <div class="tl-who-sub">ATK ${monAtk(m)} · HP ${monMaxHp(m)}${fx ? ` — ${escapeHtml(talentSummary(fx))}` : ''}</div>
    </div>
    ${types.length > 1 ? `<div class="tl-tabs">${types.map(t=> `<button class="tl-tab${t === sky ? ' on' : ''}" data-tab="${t}" style="--tc:${TYPE_COLORS[t]};">${escapeHtml(t)} sky</button>`).join('')}</div>` : ''}
    ${talentSkyHtml(sky, m)}` : ''}
    <div class="tl-legend">A minor constellation costs 1 point to switch on; a major one ★, 2. Light one with Starlight once, and every monster of its element can use it. Switching off is free.</div>
    ${(typeof isDev === 'function' && isDev()) ? `<div class="tl-dev">🛠️ <button class="btn btn-ghost" id="tlDevSkies">Open every sky</button><button class="btn btn-ghost" id="tlDevStar">+100 Starlight</button></div>` : ''}`;
  $('#backBtn').addEventListener('click', ()=> go('party'));
  screenEl.querySelectorAll('[data-sky]').forEach(b=> b.addEventListener('click', ()=> openSky(b.dataset.sky)));
  screenEl.querySelectorAll('[data-tuid]').forEach(b=> b.addEventListener('click', ()=>{ ui.talentUid = b.dataset.tuid; renderTalents(); }));
  screenEl.querySelectorAll('[data-tab]').forEach(b=> b.addEventListener('click', ()=>{ ui.talentSky = b.dataset.tab; renderTalents(); }));
  screenEl.querySelectorAll('.tl-map [data-node]').forEach(b=> b.addEventListener('click', ()=> openConstellation(b.dataset.node, m, renderTalents)));
  const rs = $('#tlReset');
  if(rs) rs.addEventListener('click', ()=> confirmDialogHtml(`Switch off every constellation ${escapeHtml(displayName(m))} has on? It costs nothing, and the lit ones stay lit.`,
    ()=>{ resetTalents(m); saveProfile(); renderTalents(); }, 'Switch off'));
  const ds = $('#tlDevSkies');
  if(ds) ds.addEventListener('click', ()=>{ LEGACY_TYPES.forEach(openLegacy); saveProfile(); renderTalents(); });
  const dst = $('#tlDevStar');
  if(dst) dst.addEventListener('click', ()=>{ addStarlight(100); saveProfile(); renderTalents(); });
}
/* One sky, drawn as a star map: the main branch down the middle, the side
   branches off to the left and right. With a monster, what it has on. */
function talentSkyHtml(type, m){
  if(!type || !TALENT_TREES[type]) return '';
  const nodes = talentNodesOf(type), tc = TYPE_COLORS[type] || '#9a8cff';
  const act = m ? new Set(activeTalentNodes(m).map(n=> n.id)) : new Set();
  const X = [17, 50, 83], RY = 70, TOP = 40, H = TOP + RY * 7 + 62;
  const y = n=> TOP + n.row * RY;
  const open = legacyOpen(type);
  const lines = nodes.filter(n=> n.prereq).map(n=>{
    const p = talentNode(n.prereq);
    const cls = (act.has(n.id) && act.has(p.id)) ? 'on' : (constellationLit(n.id) && constellationLit(p.id)) ? 'lit' : '';
    return `<line x1="${X[p.col]}" y1="${y(p)}" x2="${X[n.col]}" y2="${y(n)}" class="${cls}" vector-effect="non-scaling-stroke"/>`;
  }).join('');
  const cells = nodes.map(n=>{
    const lit = constellationLit(n.id), st = m ? talentState(m, n) : null;
    const can = !lit && constellationLightable(n).ok;
    const cls = ['tl-node', n.major ? 'major' : 'minor', lit ? 'lit' : 'dark', !open ? 'closed' : '', can ? 'can-light' : '',
                 st === 'on' ? 'on' : '', st === 'open' ? 'open' : ''].filter(Boolean).join(' ');
    const inner = n.major ? `<b>★</b>` : `<b>${TALENT_STATS[n.stat].short}</b><small>+${talentPct(n.fx[0].v)}</small>`;
    const tag = (!lit && open) ? `<i class="tl-cost">✨${n.light}</i>` : '';
    const lbl = n.major ? `<span class="tl-lbl">${escapeHtml(n.name)}</span>` : '';
    return `<button class="${cls}" data-node="${n.id}" style="left:${X[n.col]}%;top:${y(n)}px;" aria-label="${escapeHtml(n.name)}">${inner}${tag}${lbl}</button>`;
  }).join('');
  return `<div class="tl-map" style="--tc:${tc};height:${H}px;">
    <div class="tl-map-name">${escapeHtml(type)} · ${escapeHtml(TALENT_TREES[type].legacy)}${open ? '' : ' · 🔒'}</div>
    <svg class="tl-lines" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${cells}</div>`;
}
/* A sky on its own, from the strip along the top: its constellations to
   light (and, with no monster, nothing to switch). */
function openSky(type){
  r6Css();
  const ov = document.createElement('div');
  ov.className = 'tl-sheet-scrim tl-sky-ov';
  const draw = ()=>{
    const open = legacyOpen(type);
    ov.innerHTML = `<div class="tl-sheet tl-sheet-tall">
      <div class="tl-sheet-title">${escapeHtml(type)} sky <small>${open ? `${litCount(type)} of ${talentNodesOf(type).length} lit` : 'not open yet'}</small></div>
      <div class="tl-sheet-sub">${open ? `You hold ✨ <b>${starlight()}</b> Starlight. Tap a constellation to see it, or to light it.`
        : `Capture the <b>${escapeHtml(type)}</b> legacy in Challenge the future to open this sky.`}</div>
      ${talentSkyHtml(type, null)}
      <button class="btn btn-ghost" id="tlSkyClose" style="margin-top:10px;">Close</button></div>`;
    ov.querySelector('#tlSkyClose').addEventListener('click', close);
    ov.querySelectorAll('.tl-map [data-node]').forEach(b=> b.addEventListener('click', ()=> openConstellation(b.dataset.node, null, draw)));
  };
  const close = ()=>{ if(ov.parentNode) ov.parentNode.removeChild(ov); if(ui.screen === 'talents') renderTalents(); };
  ov.addEventListener('click', e=>{ if(e.target === ov) close(); });
  document.body.appendChild(ov);
  draw();
}
/* One constellation: what it does, and — as it stands — light it, switch it
   on for the chosen monster, or off. `after` redraws whoever asked. */
function openConstellation(id, m, after){
  const n = talentNode(id);
  if(!n) return;
  const ov = document.createElement('div');
  ov.className = 'tl-sheet-scrim';
  const lit = constellationLit(n.id), lt = constellationLightable(n), st = m ? talentState(m, n) : null;
  const place = n.br === 'm' ? `main branch, ${['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'][n.i - 1]}${n.capstone ? ' — its capstone' : ''}`
                             : `${TALENT_BRANCH[n.br]} (off the main branch's ${n.br === 'a' ? 'second' : 'fifth'}), ${['first', 'second', 'third'][n.i - 1]}`;
  const prev = n.prereq ? talentNode(n.prereq) : null;
  const deps = (m && st === 'on') ? talentDependents(m, n.id) : [];
  let line = '', btns = '';
  if(!lit){
    line = lt.ok ? `Not lit yet. Light it for ✨ <b>${n.light}</b> Starlight (you have ${starlight()}) — for good, for every monster of its element.` : escapeHtml(lt.why);
    if(lt.ok) btns += `<button class="btn btn-primary" id="tlLight">Light it — ✨ ${n.light}</button>`;
  } else if(m){
    const who = escapeHtml(displayName(m));
    if(st === 'on'){ line = `✨ Lit · switched on for ${who}.`; btns += `<button class="btn btn-ghost" id="tlOff">Switch off${deps.length ? ` (and the ${deps.length} after it)` : ''}</button>`; }
    else if(st === 'open'){ line = `✨ Lit. Switch it on for ${who}: ${n.cost} point${n.cost > 1 ? 's' : ''} of ${talentCapacity(m) - talentSpent(m)} free.`; btns += `<button class="btn btn-primary" id="tlOn">Switch on — ${n.cost} point${n.cost > 1 ? 's' : ''}</button>`; }
    else if(st === 'path') line = `✨ Lit. Switch on ${escapeHtml(prev ? prev.name : 'the one before it')} for ${who} first.`;
    else if(st === 'pts') line = `✨ Lit. ${who} needs ${n.cost} free point${n.cost > 1 ? 's' : ''} — it has ${talentCapacity(m) - talentSpent(m)}.${talentNextAt(m) ? ` The next comes at Lv ${talentNextAt(m)}.` : ''}`;
    else line = '✨ Lit.';
  } else line = '✨ Lit — every crowned monster of its element past level 100 can switch it on, from the Talents page.';
  ov.innerHTML = `<div class="tl-sheet" style="--tc:${TYPE_COLORS[n.type]};">
    <div class="tl-sheet-title">${n.major ? '★ ' : ''}${escapeHtml(n.name)} <small>${n.major ? 'major' : 'minor'} · ${n.cost} point${n.cost > 1 ? 's' : ''}</small></div>
    <div class="tl-sheet-sub"><span class="type-badge" style="background:${TYPE_COLORS[n.type]};">${escapeHtml(n.type)}</span> ${escapeHtml(place)}${prev ? ` · after ${escapeHtml(prev.name)}` : ''}</div>
    <div class="tl-sheet-fx">${escapeHtml(talentNodeText(n))}</div>
    <div class="tl-sheet-line">${line}</div>
    <div class="tl-sheet-btns">${btns}<button class="btn btn-ghost" id="tlClose">Close</button></div></div>`;
  const close = ()=>{ if(ov.parentNode) ov.parentNode.removeChild(ov); };
  ov.addEventListener('click', e=>{ if(e.target === ov) close(); });
  document.body.appendChild(ov);
  ov.querySelector('#tlClose').addEventListener('click', close);
  const go2 = fn=> ()=>{ close(); fn(); saveProfile(); if(after) after(); };
  const L = ov.querySelector('#tlLight'), ON = ov.querySelector('#tlOn'), OFF = ov.querySelector('#tlOff');
  if(L) L.addEventListener('click', go2(()=>{ if(lightConstellation(n.id)){ playSfx('stone_high'); toast(`✨ ${n.name} is lit!`); } }));
  if(ON) ON.addEventListener('click', go2(()=>{ if(learnTalent(m, n.id)) toast(`${displayName(m)}: ${n.name} switched on.`); }));
  if(OFF) OFF.addEventListener('click', go2(()=>{ unlearnTalent(m, n.id); }));
}

/* ---------- looks ---------- */
let _r6CssDone = false;
function r6Css(){
  if(_r6CssDone || typeof document === 'undefined') return;
  _r6CssDone = true;
  const st = document.createElement('style');
  st.id = 'r6Css';
  st.textContent = `
  .r6-tear{ display:inline-block; width:150px; height:150px; position:relative; }
  .r6-tear .tear-svg{ width:100%; height:100%; }
  .r6-nem{ display:inline-block; filter:drop-shadow(0 0 10px rgba(220,40,60,.75)); }
  .vesper-svg{ display:inline-block; overflow:visible; vertical-align:bottom; }
  .vesper-svg .vs-wing{ transform-box:view-box; }
  .vesper-svg .vs-l{ transform-origin:52px 45px; animation:vsFlapL 1.8s ease-in-out infinite; }
  .vesper-svg .vs-r{ transform-origin:68px 45px; animation:vsFlapR 1.8s ease-in-out infinite; }
  .vesper-svg .vs-tw{ animation:vsTw 2.2s ease-in-out infinite; }
  @keyframes vsFlapL{ 0%,100%{ transform:rotate(0); } 50%{ transform:rotate(-9deg); } }
  @keyframes vsFlapR{ 0%,100%{ transform:rotate(0); } 50%{ transform:rotate(9deg); } }
  @keyframes vsTw{ 0%,100%{ opacity:.25; } 50%{ opacity:1; } }
  .shop-keeper .r6-vesper, .shop-keeper .vesper-svg{ align-self:flex-end; margin-left:-18px; }

  /* the future */
  .fu-card .fu-mini, .fu-mini{ display:inline-flex; gap:2px; flex:0 0 auto; }
  .fu-mini span, .fu-mini .r6-nem{ display:inline-flex; }
  .fu-screen{ background:radial-gradient(ellipse at 50% 20%, #2c1548 0%, #140a22 60%, #07040c 100%); border-radius:18px;
    padding:14px 12px 16px; color:#efe6ff; box-shadow:0 6px 30px rgba(20,8,40,.45); }
  .fu-screen .screen-title{ color:#f4ecff; }
  .fu-say{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:#d9c8f6; margin:4px 2px 12px; line-height:1.45; }
  .fu-trio{ display:flex; flex-direction:column; gap:8px; }
  .fu-foe{ display:flex; gap:10px; align-items:flex-start; background:rgba(255,255,255,.06); border:1px solid rgba(200,170,255,.22);
    border-left:4px solid var(--tc); border-radius:14px; padding:8px 10px; }
  .fu-foe-pic{ flex:0 0 auto; }
  .fu-foe-txt{ font-size:12px; font-weight:600; line-height:1.4; color:#e3d6fa; }
  .fu-foe-txt b{ color:#fff; }
  .fu-foe-name{ font-family:'Baloo 2',cursive; font-weight:800; font-size:16px; color:#fff; }
  .fu-leg{ color:#c9b2ff; margin-top:2px; }
  .fu-dist{ margin-top:12px; background:rgba(255,255,255,.05); border:1px solid rgba(200,170,255,.25); border-radius:14px; padding:10px; }
  .fu-dist-head{ font-weight:800; font-size:14px; color:#f0e6ff; margin-bottom:8px; }
  .fu-dist-sub{ font-size:11.5px; font-weight:600; color:#cdb8f0; margin:-4px 0 8px; }
  /* (3.76) the week's three, each switched on or off */
  .fu-dt-row{ display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; }
  .fu-dt{ border:1.5px solid rgba(200,170,255,.35); background:rgba(255,255,255,.06); color:#efe6ff; border-radius:12px; padding:7px 7px 6px; cursor:pointer;
    font-family:'Nunito',sans-serif; display:flex; flex-direction:column; align-items:stretch; gap:4px; text-align:left; min-width:0; }
  .fu-dt-top{ display:flex; justify-content:space-between; align-items:baseline; gap:4px; }
  .fu-dt-top b{ font-family:'Baloo 2',cursive; font-size:13px; line-height:1.1; }
  .fu-dt-top i{ font-style:normal; font-size:12px; font-weight:800; color:#ffe39a; flex:0 0 auto; }
  .fu-dt-txt{ font-size:10.5px; font-weight:600; line-height:1.3; color:#dccdf7; flex:1; }
  .fu-dt-sw{ align-self:flex-start; font-size:10px; font-weight:900; letter-spacing:.04em; text-transform:uppercase; padding:1px 8px; border-radius:99px;
    background:rgba(255,255,255,.12); color:#cbb8ee; }
  .fu-dt.on{ background:linear-gradient(180deg, #7a45c8, #4f2690); border-color:#d6b8ff; box-shadow:0 0 12px rgba(180,120,255,.55); }
  .fu-dt.on .fu-dt-sw{ background:#ffe39a; color:#4f2690; }
  .fu-dt:active{ transform:translateY(2px); }
  .fu-dist-note{ font-size:12px; font-weight:600; color:#cdb8f0; margin-top:6px; line-height:1.45; }
  .fu-btn{ margin-top:12px; background:linear-gradient(180deg, #7a45c8, #4f2690); color:#fff; box-shadow:0 4px 0 #2d1456; }
  .fu-btn.btn-ghost{ background:transparent; border:1.5px solid rgba(200,170,255,.45); color:#e6d8ff; box-shadow:none; }
  .fu-note{ font-size:12px; font-weight:600; color:#cdb8f0; margin-top:10px; line-height:1.5; text-align:center; }
  .fu-picks{ display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-top:6px; }
  .fu-pick{ display:flex; flex-direction:column; align-items:center; gap:4px; background:rgba(255,255,255,.07); border:1.5px solid rgba(200,170,255,.35);
    border-radius:14px; padding:8px 4px; color:#efe6ff; cursor:pointer; font-family:'Nunito',sans-serif; }
  .fu-pick:active{ transform:translateY(2px); }
  .fu-pn{ font-family:'Baloo 2',cursive; font-weight:800; font-size:13px; text-align:center; line-height:1.15; }
  .fu-pl{ font-size:10.5px; font-weight:700; color:#d6c4f6; text-align:center; line-height:1.3; }

  /* talents */
  .tl-head{ display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
  .tl-star{ flex:0 0 auto; background:linear-gradient(180deg, #2c1548, #140a22); color:#ffe39a; border-radius:14px; padding:6px 12px; text-align:center;
    font-weight:800; box-shadow:0 0 14px rgba(150,100,255,.35); }
  .tl-star b{ font-size:18px; color:#fff; } .tl-star small{ display:block; font-size:9.5px; color:#cdb8f0; }
  .tl-skies{ display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-top:12px; }
  .tl-sky{ border:1.5px solid var(--line); background:var(--paper-2); border-radius:10px; padding:6px 2px; cursor:pointer; font-family:'Nunito',sans-serif;
    display:flex; flex-direction:column; align-items:center; font-weight:800; font-size:11px; color:var(--ink-soft); opacity:.75; }
  .tl-sky i{ font-style:normal; font-size:10px; }
  .tl-sky.open{ background:var(--tc); color:#fff; border-color:rgba(0,0,0,.15); opacity:1; text-shadow:0 1px 2px rgba(0,0,0,.35); }
  .tl-hint{ font-size:11.5px; font-weight:600; color:var(--ink-soft); margin:6px 2px 10px; }
  .tl-pick{ display:flex; gap:8px; overflow-x:auto; padding:4px 2px 8px; -webkit-overflow-scrolling:touch; }
  .tl-mon{ flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:2px; width:82px; border:1.5px solid var(--line); background:var(--paper-2);
    border-radius:12px; padding:6px 4px; cursor:pointer; font-family:'Nunito',sans-serif; }
  .tl-mon span{ font-weight:800; font-size:11px; max-width:76px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tl-mon small{ font-size:10px; font-weight:700; color:var(--ink-soft); }
  .tl-mon.on{ border-color:#7a45c8; box-shadow:0 0 0 2px rgba(122,69,200,.35); background:#efe6ff; }
  .tl-none{ background:var(--paper-2); border:1px solid var(--line); border-radius:14px; padding:12px; font-size:13px; font-weight:600; line-height:1.5; }
  .tl-who{ background:var(--paper-2); border:1px solid var(--line); border-radius:14px; padding:10px 12px; margin-top:4px; }
  .tl-who-name{ font-family:'Baloo 2',cursive; font-weight:800; font-size:17px; }
  .tl-who-name > span{ font-size:12px; color:var(--ink-soft); }
  .tl-who-sub{ font-size:12px; font-weight:600; color:var(--ink-soft); margin-top:3px; line-height:1.45; }
  .tl-pts{ display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
  .tl-pts i{ width:12px; height:12px; border-radius:50%; border:2px solid #7a45c8; background:transparent; }
  .tl-pts i.on{ background:#7a45c8; box-shadow:0 0 6px rgba(122,69,200,.6); }
  .tl-link{ background:none; border:none; padding:0; color:#7a45c8; font-weight:800; text-decoration:underline; cursor:pointer; font-size:12px; font-family:inherit; }
  .tl-tabs{ display:flex; gap:6px; margin-top:10px; }
  .tl-tab{ flex:1; border:1.5px solid var(--line); background:var(--paper-2); border-radius:10px; padding:7px; font-weight:800; font-family:'Baloo 2',cursive; cursor:pointer; }
  .tl-tab.on{ background:var(--tc); color:#fff; }
  .tl-map{ position:relative; margin-top:10px; border-radius:16px; overflow:hidden; background:#140a22 url("${r6SkyUri()}") center/cover;
    box-shadow:inset 0 0 30px rgba(0,0,0,.6), 0 4px 18px rgba(20,8,40,.35); }
  .tl-map-name{ position:absolute; left:10px; top:8px; font-size:11px; font-weight:800; color:#d8c8f6; letter-spacing:.3px; }
  .tl-lines{ position:absolute; inset:0; width:100%; height:100%; }
  .tl-lines line{ stroke:rgba(220,210,255,.18); stroke-width:2; stroke-dasharray:4 5; }
  .tl-lines line.lit{ stroke:rgba(255,248,220,.7); stroke-dasharray:none; }
  .tl-lines line.on{ stroke:var(--tc); stroke-width:3.5; stroke-dasharray:none; filter:drop-shadow(0 0 3px var(--tc)); }
  .tl-node{ position:absolute; transform:translate(-50%, -50%); border-radius:50%; border:2px dashed rgba(220,210,255,.35); background:rgba(20,10,40,.55);
    color:rgba(230,220,255,.55); display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; padding:0;
    font-family:'Nunito',sans-serif; line-height:1; }
  .tl-node.minor{ width:46px; height:46px; }
  .tl-node.major{ width:58px; height:58px; font-size:20px; }
  .tl-node b{ font-size:11px; font-weight:900; } .tl-node.major b{ font-size:22px; }
  .tl-node small{ font-size:9.5px; font-weight:800; margin-top:1px; }
  .tl-node.closed{ opacity:.45; }
  .tl-node.can-light{ border-color:#ffd56a; color:#ffe9a8; animation:tlBreath 2.4s ease-in-out infinite; }
  .tl-node.lit{ border:2px solid rgba(255,248,225,.95); background:radial-gradient(circle at 50% 40%, #fffef6, #e9dcff 70%); color:#2a1752;
    box-shadow:0 0 12px rgba(255,250,230,.75); }
  .tl-node.open{ box-shadow:0 0 0 3px var(--tc), 0 0 16px rgba(255,250,230,.85); animation:tlBreath 1.8s ease-in-out infinite; }
  .tl-node.on{ background:radial-gradient(circle at 50% 38%, #fff, var(--tc) 72%); color:#fff; border-color:#fff; text-shadow:0 1px 2px rgba(0,0,0,.45);
    box-shadow:0 0 0 2px var(--tc), 0 0 20px var(--tc); }
  .tl-node .tl-cost{ position:absolute; bottom:-8px; right:-10px; font-style:normal; font-size:9.5px; font-weight:900; color:#ffe39a; background:#2c1548;
    border:1px solid rgba(255,227,154,.6); border-radius:8px; padding:1px 4px; }
  .tl-node .tl-lbl{ position:absolute; top:100%; left:50%; transform:translateX(-50%); margin-top:4px; white-space:nowrap; font-size:10.5px; font-weight:800;
    color:#f1e8ff; text-shadow:0 1px 3px #000; pointer-events:none; }
  @keyframes tlBreath{ 0%,100%{ filter:brightness(1); } 50%{ filter:brightness(1.35); } }
  .tl-legend{ font-size:11.5px; font-weight:600; color:var(--ink-soft); margin:10px 2px 0; line-height:1.45; }
  .tl-dev{ display:flex; gap:8px; align-items:center; margin-top:12px; font-size:18px; }
  .tl-dev .btn{ padding:8px 10px; font-size:13px; }
  .tl-sheet-scrim{ position:fixed; inset:0; background:rgba(20,12,35,.6); z-index:85; display:flex; align-items:flex-end; justify-content:center; cursor:pointer; }
  .tl-sheet{ cursor:auto; }   /* (3.79) the pointer makes a tap outside a sheet count on an iPad */
  .tl-sheet{ background:var(--paper); border-radius:18px 18px 0 0; padding:18px 18px 22px; max-width:520px; width:100%; max-height:88vh; overflow-y:auto;
    border-top:4px solid var(--tc, #7a45c8); }
  .tl-sheet-tall{ max-width:560px; }
  .tl-sheet-title{ font-family:'Baloo 2',cursive; font-weight:800; font-size:19px; }
  .tl-sheet-title small{ font-family:'Nunito',sans-serif; font-size:12px; color:var(--ink-soft); font-weight:700; }
  .tl-sheet-sub{ font-size:12px; font-weight:700; color:var(--ink-soft); margin-top:3px; line-height:1.45; }
  .tl-sheet-fx{ font-size:14px; font-weight:700; margin-top:10px; line-height:1.5; }
  .tl-sheet-line{ font-size:12.5px; font-weight:600; color:var(--ink-soft); margin-top:8px; line-height:1.5; }
  .tl-sheet-btns{ display:flex; flex-direction:column; gap:8px; margin-top:14px; }
  `;
  document.head.appendChild(st);
}

