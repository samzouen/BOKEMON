/* ==========================================================
   06-progress.js
   XP, levelling, evolution, catching.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ---------- XP / LEVELING / EVOLUTION ---------- */
/* The cap belongs to the ZONE you're standing in, not the region — Rocky
   Caverns lets you push past the rest of Emerald March. Away from any zone,
   the region's best available cap applies. */
/* Region 5 opens the road past 100 — to 110, the first ceiling (2.82; it was
   200 in 2.76–2.81). 200 is for the last two regions. The monster has gates
   of its own as well — see PAST 100 below. At 110 in Region 5 a crowned
   monster carrying a stone charges it, as at any ceiling; the breakthrough
   waits for a region that lets it grow (capAtCeiling). */
const REGION_CAPS = { 1:21, 2:41, 3:61, 4:85, 5:110 };
/* A zone's `cap` is how far a monster may grow there, when that differs from
   the top of its wild band (`max`). */
function zoneCap(id){ const z = ZONE_LEVELS[id]; return z ? (z.cap || z.max) : 0; }
function levelCap(){
  /* The space-time tear's XP knows no region (2.94): while it is paid, only a
     monster's own Crown and ceilings stop it (ui.xpNoCap, 16-tear.js). */
  if(typeof ui !== 'undefined' && ui && ui.xpNoCap) return LEVEL_MAX;
  /* The Band Competition is a Challenge rather than a zone, so it carries its
     own ceiling; beating the band lifts the whole region. */
  const r3 = (state.progress && state.progress.region3) || {};
  /* Region 3 has ONE rule: the Power Stone opens it to 71, everywhere.
     The old 66-in-the-concert override kept snapping it back down. */
  if((state.progress||{}).currentRegion === 3 && r3.powerStone) return 71;
  const z = ui.currentZone && ui.currentZone.id;
  if(z && ZONE_LEVELS[z]) return zoneCap(z);
  const rid = (state.progress && state.progress.currentRegion) || 1;
  const zones = (REGION_ZONES[rid]||[]).map(x=> zoneCap(x.id));
  return Math.max(REGION_CAPS[rid]||21, ...zones, 0) || 21;
}

/* ---------- PAST 100 (2.76, reworked 2.77) ----------
   The cap is 200, reached in stages — and region by region (Region 5: 110).
   · 100 is as far as an UNCROWNED monster goes, and only starters, elites and
     legendaries can wear a Crown — so only they go further. A legendary whose
     core was stolen can't be crowned by hand; it waits at 100 for its story.
     (3.01) Where the region reaches 100 or more, a monster stopped at 100
     stores its fights on the stone it carries once its bar is full — a wild
     one, every fight — for a breakthrough later (storesAtHundred).
   · A crowned monster then stops at a CEILING every ten levels: 110 … 190.
     There, every fight charges the Element Stone it carries instead of its
     level. When the charge reaches the ceiling's need the monster BREAKS
     THROUGH: the need comes off the stone (the rest stays on it) and the next
     ten levels open. The need is 150 at 110 and a quarter more at each ceiling
     after (190, 235 … 895 at 190). A monster at a ceiling with no stone fills
     its bar once and waits.
   · Each level past 100 costs a little more than level 99 did (×1.1), and 20%
     more again every ten levels, on top of the usual +1 fight per 5 levels:
     24 fights at 100, 40 at 120, 85 at 150, 176 at 180, 275 at 199.
     With the breakthroughs that is 14,534 fights from 100 to 200: two years at
     twenty fights a day — three weeks for the 100s, five months for the 190s.
   Tune: PAST_100_START / PAST_100_GROWTH, BREAKTHROUGH_FIRST / _GROWTH. */
const LEVEL_MAX = 200;
const CROWN_GATE = 100;
const CEILING_STEP = 10;
const PAST_100_START = 1.1;
const PAST_100_GROWTH = 1.2;
const BREAKTHROUGH_FIRST = 150;
const BREAKTHROUGH_GROWTH = 1.25;
/* Only these can be crowned, and so only these can pass 100. */
const CROWN_TIERS = ['starter', 'special', 'elite', 'legendary'];
/* 0 for 100-109, 1 for 110-119 … 9 for 190-199; -1 below 100. */
function limitBand(level){ return level < CROWN_GATE ? -1 : Math.floor((level - CROWN_GATE) / CEILING_STEP); }
function pastLimitMult(level){
  return level < CROWN_GATE ? 1 : PAST_100_START * Math.pow(PAST_100_GROWTH, (level - CROWN_GATE) / CEILING_STEP);
}
function canPassLimit(m){ return isCrowned(m) && CROWN_TIERS.includes(baseTier(m.species)); }

/* How far this monster may go on its own account. */
function monCeiling(m){
  if(!canPassLimit(m)) return CROWN_GATE;
  const c = Math.floor(Number(m.ceiling) || (CROWN_GATE + CEILING_STEP));
  return Math.min(LEVEL_MAX, Math.max(CROWN_GATE + CEILING_STEP, c));
}
function monLevelCap(m){ return Math.min(levelCap(), monCeiling(m)); }
/* Why it has stopped: 'max' | 'region' | 'kind' | 'crown' | 'core' | 'ceiling', or null. */
function monGate(m){
  if(m.level >= LEVEL_MAX) return 'max';
  if(m.level >= levelCap()) return 'region';
  if(m.level >= monCeiling(m)){
    if(!canPassLimit(m)){
      if(!CROWN_TIERS.includes(baseTier(m.species))) return 'kind';     // a wild monster's road ends here
      return (SPECIES[m.species] || {}).storyCrownOnly ? 'core' : 'crown';
    }
    return 'ceiling';
  }
  return null;
}

/* At the region's cap AND its own ceiling — Region 5's cap is 110, the first
   ceiling — a crowned monster's fights charge the stone it carries, as at any
   ceiling (2.82). Its breakthrough waits for a region that lets it grow: the
   charge keeps building on the stone, and is spent where the cap lifts
   (tryBreakthrough asks for the 'ceiling' gate, which the region's comes
   before). */
function capAtCeiling(m){
  return !!m && m.level < LEVEL_MAX && m.level >= levelCap() && canPassLimit(m) && m.level >= monCeiling(m);
}
/* Do this monster's fights charge a stone rather than its level? */
function chargesStone(m){ return monGate(m) === 'ceiling' || capAtCeiling(m); }

/* (3.01) STORED AT 100. In a region that lets a monster reach 100 or more
   (Region 5's 110; the tear, which has no cap), a monster stopped at 100 —
   waiting for its Crown or its core with its bar full, or a wild one, whose
   road ends there — stores every fight it earns on the stone it carries, for
   a breakthrough later. Until 3.01 those fights were lost. The designer: "let's
   make fights at level 100 cap in a region with at least level 100 cap store
   fights in the stone." The charge is the stone's, as at a ceiling: it moves
   with it, and the first breakthrough (150, at 110) takes only its need.
   The bar comes first — a Crown or a core lets it grow on at once — and the
   stone's 1.5× is for experience, not for its own charge. */
function storesAtHundred(m){
  if(!m || m.level < CROWN_GATE || m.level >= LEVEL_MAX || levelCap() < CROWN_GATE) return false;
  const gate = monGate(m);
  if(gate === 'region' || gate === 'kind') return true;
  if(gate === 'crown' || gate === 'core') return (m.xpFights || 0) >= fightsNeeded(m.level);
  return false;
}
/* Stopped at 100 where storing applies — storing already, or (a Crown's or a
   core's) its bar still filling first. For the screens. */
function storeGateAtHundred(m){
  if(!m || m.level < CROWN_GATE || m.level >= LEVEL_MAX || levelCap() < CROWN_GATE || chargesStone(m)) return false;
  return ['region', 'kind', 'crown', 'core'].includes(monGate(m));
}

/* ---------- BREAKTHROUGHS ---------- */
/* Fights of charge to break through a ceiling. Rapid and Grind move it with
   them, in step with the fights a level costs; Dev needs one. */
function breakthroughNeed(ceiling){
  if(xpMode() === 'dev') return 1;
  const steps = Math.max(0, (ceiling - (CROWN_GATE + CEILING_STEP)) / CEILING_STEP);
  const raw = BREAKTHROUGH_FIRST * Math.pow(BREAKTHROUGH_GROWTH, steps) * baseFights(CROWN_GATE) / 21;
  return Math.max(5, Math.round(raw / 5) * 5);
}
/* A breakthrough is the player's to make (2.82). At its ceiling, in a region
   that lets it grow, carrying a stone with enough charge, a monster is READY:
   the Party page pulses it, and Break through (on its card there, or its Stats
   page) makes it — tryBreakthrough. Until then every fight keeps adding to the
   charge, so when two monsters wait at the same ceiling the stone can go to
   whichever the boys choose. Nothing breaks through by itself. */
function breakthroughReady(m){
  if(!m || monGate(m) !== 'ceiling') return false;
  const st = stoneCarriedBy(m);
  return !!st && stoneCharge(st.id) >= breakthroughNeed(monCeiling(m));
}
/* Break through: what it takes comes off the stone; the rest stays. A bar that
   filled while it waited pays out at once. Returns the event, or null. */
function tryBreakthrough(m){
  if(!breakthroughReady(m)) return null;
  const st = stoneCarriedBy(m);
  const c = monCeiling(m);
  const need = breakthroughNeed(c);
  setStoneCharge(st.id, stoneCharge(st.id) - need);
  m.ceiling = Math.min(LEVEL_MAX, c + CEILING_STEP);
  const from = m.level;
  const grown = growMonster(m);
  return { uid:m.uid, species:m.species, name:displayName(m), from, to:m.level,
           evos:grown ? grown.evos : [], newMoves:grown ? grown.newMoves : [],
           breakthrough:m.ceiling, stone:st.name };
}

/* A defeat empties the bar, as it always has — but past 100, where one bar
   can be hundreds of fights, it takes one ordinary level's worth at most
   (what that level would cost without the multiplier). */
function xpAfterDefeat(m){
  if(m.level < CROWN_GATE) return 0;
  return Math.max(0, (m.xpFights || 0) - baseFights(m.level));
}
/* ---------- XP PACING MODES ----------
   Selectable (password-gated) from the Spelling List screen. `tier` counts
   5-level bands: 0 = Lv1-5, 1 = Lv6-10, 2 = Lv11-15, ...  */
const XP_MODES = {
  default: { label:'Default', desc:'2, 3, 4, 5, 6 …  (+1 every 5 levels)',
             fn: tier => 2 + tier },
  rapid:   { label:'Rapid',   desc:'1, 2, 2, 3, 3, 4, 4 …  (+1 every 10 levels)',
             fn: tier => 1 + Math.ceil(tier/2) },
  grind:   { label:'Grind',   desc:'4, 5, 6, 7, 8 …  (slower, more practice)',
             fn: tier => 4 + tier },
  dev:     { label:'Dev',     desc:'Always 1 fight per level (testing only)',
             fn: () => 1 },
};
function xpMode(){
  const m = state && state.settings && state.settings.xpMode;
  return XP_MODES[m] ? m : 'default';
}
/* The mode's own count, before anything past 100 multiplies it. */
function baseFights(level){
  const tier = Math.floor((level-1)/5);
  return Math.max(1, XP_MODES[xpMode()].fn(tier));
}
function fightsNeeded(level){
  const base = baseFights(level);
  if(xpMode() === 'dev') return base;          // testing stays at one fight a level
  return Math.ceil(base * pastLimitMult(level));
}
/* Every move it learns at this level — a passive given on top can come at
   the same level as a move (2.97: the Fox's Focus with Psywave at 21). */
function newMoveAtLevel(species, level){
  const mvs = MOVES[species].filter(m=>m[5]===level && m[1]!=null);
  return mvs.length ? mvs.map(m=> m[1]).join(' and ') : null;
}
/* Spend the fights a monster has banked on levels, as far as it may go.
   Returns the level-up event, or null. */
function growMonster(m){
  const from = m.level;
  const evos = [], newMoves = [];
  const cap = monLevelCap(m);
  while(m.level < cap && m.xpFights >= fightsNeeded(m.level)){
    m.xpFights -= fightsNeeded(m.level);
    const beforeStage = monStageOf(m);
    // Grow current HP by the change in MAX HP (which is scaled), not by the
    // raw ATK delta — using the unscaled figure left every monster a little
    // short of full after each level, and the gap compounded.
    const beforeMax = computeMaxHp(m.species, m.level, m.supplements, m);
    m.level++;
    const afterMax = computeMaxHp(m.species, m.level, m.supplements, m);
    m.currentHp = Math.min(afterMax, m.currentHp + (afterMax - beforeMax));
    const afterStage = monStageOf(m);
    if(afterStage > beforeStage) evos.push(m.level);
    // once it has caught up, drop the floor entirely
    if(m.evoFloor != null && afterStage >= evolutionStage(m.species, m.level)){
      delete m.evoFloor; delete m.evoFloorLevel;
    }
    const nm = newMoveAtLevel(m.species, m.level);
    if(nm) newMoves.push(nm);
  }
  /* Stopped at a gate of its OWN (a Crown, a ceiling) rather than the
     region's: the bar fills once and waits there, full. A region's cap keeps
     whatever was left over, as before — it lifts with the story. */
  if(m.level >= cap && cap < levelCap()) m.xpFights = Math.min(m.xpFights, fightsNeeded(m.level));
  return m.level !== from ? { uid:m.uid, species:m.species, name:displayName(m), from, to:m.level, evos, newMoves } : null;
}

function awardXpToParty(fightsWorth){
  const credit = Math.max(1, fightsWorth||1);
  const events = [];
  /* A bonded companion learns from every fight its leader's party wins, at the
     party's rate, summoned or not (2.84, handover 07). */
  const learners = state.party.concat(typeof bondedCompanions === 'function' ? bondedCompanions() : []);
  learners.forEach(m=>{
    const sp = SPECIES[m.species];
    if(sp.frozenRegion1 && state.progress.currentRegion===1) return; // phoenix frozen
    // Past this zone's cap: freeze progress rather than discarding it, so a
    // monster raised elsewhere doesn't lose a part-finished level on arrival.
    // At a cap that is also its ceiling, the stone it carries charges (2.82).
    if(m.level >= levelCap()){
      const held = (capAtCeiling(m) || storesAtHundred(m)) && stoneCarriedBy(m);
      if(held) setStoneCharge(held.id, stoneCharge(held.id) + credit);
      return;
    }
    const gate = monGate(m);
    const carried = stoneCarriedBy(m);
    /* (3.01) Stopped at 100 — its bar full, waiting for a Crown or its core,
       or a wild one's road at its end — the fight is stored on its stone. */
    if(carried && storesAtHundred(m)){
      setStoneCharge(carried.id, stoneCharge(carried.id) + credit);
      return;
    }
    if(gate === 'kind') return;              // a wild monster's road ends at 100
    /* At a ceiling, the fight charges the stone it carries instead. When the
       charge is enough it is READY — the breakthrough itself is the player's
       (2.82), and the charge keeps building until then. */
    if(gate === 'ceiling' && carried){
      const was = breakthroughReady(m);
      setStoneCharge(carried.id, stoneCharge(carried.id) + credit);
      if(!was && breakthroughReady(m)) events.push(readyEvent(m));
      return;
    }
    // a dragon carrying the Dragon Stone learns half again as fast
    const stoneBoost = stoneXpBonus(m);      // whichever elemental stone it carries
    m.xpFights = (m.xpFights||0) + credit * stoneBoost;
    const from = m.level;
    const grown = growMonster(m);
    // reaching the cap mid-battle also freezes rather than clears
    // The Dragon Egg hatches on reaching its level, keeping everything it earned.
    if((isEgg(m) || SPECIES[m.species].isBaby) && m.level >= (SPECIES[m.species].hatchesAt||31)){
      const into = SPECIES[m.species].hatchesInto;
      const hatchedName = displayName(m);
      const wasSpecies = m.species;      // read it BEFORE the reassignment below
      m.species = into;
      m.currentHp = computeMaxHp(into, m.level, m.supplements||0, m);
      if(!state.caughtSpecies.includes(into)) state.caughtSpecies.push(into);
      if(!state.encounteredSpecies.includes(into)) state.encounteredSpecies.push(into);
      events.push({ uid:m.uid, species:into, fromSpecies:wasSpecies, name:hatchedName, from, to:m.level, evos:[m.level], newMoves:[], hatched:true });
      return;
    }
    /* It has just reached a ceiling carrying a stone already charged enough
       (by another monster, perhaps): it is ready — the player breaks through. */
    const ready = grown && breakthroughReady(m) ? readyEvent(m) : null;
    if(grown && ready) Object.assign(grown, { ready:ready.ready, stone:ready.stone });
    if(grown) events.push(grown);
  });
  /* a companion's growth reads as one (🤝 on the victory page) */
  events.forEach(ev=>{ if(!state.party.some(p=> p.uid === ev.uid)) ev.companion = true; });
  return events;
}
/* "Ready to break through", for the victory screens: no growth, no evolution. */
function readyEvent(m){
  const st = stoneCarriedBy(m);
  return { uid:m.uid, species:m.species, name:displayName(m), from:m.level, to:m.level, evos:[], newMoves:[],
           ready:Math.min(LEVEL_MAX, monCeiling(m) + CEILING_STEP), stone:st ? st.name : '' };
}

function catchPhraseCount(species){
  const t = SPECIES[species].tier;
  if(t==='legendary') return 10;
  if(t==='elite') return 9;                    // between starter and legendary
  if(t==='starter' || t==='special') return 7;
  return 5;
}

/* Move token drop chance, WILD encounters only (never NPC/boss fights).
   Base = the highest-level party monster's level, read directly as a percentage
   (a Lv25 Phoenix in the party = 25%, even if it isn't the active fighter).
   Encounter bonuses stack on top of that base. */
const TOKEN_ENCOUNTER_BONUS = { double:0.05, triple:0.10, starter:0.15, elite:0.18, legendary:0.21 };

/* Every notable monster on the field contributes, not just the best one. The
   richest tier pays in full; each additional notable monster pays two-thirds of
   its own tier's bonus. A triple wave of elite Toads is therefore
   10% (triple) + 18% (elite) + 2 x 12% = 52% on top of the level-based base. */
function tokenDropChance(){
  if(!state.party.length) return 0;
  const topLevel = Math.max(...state.party.map(m=>m.level));
  let chance = topLevel / 100;               // level 25 -> 25%; level 150 -> 150%
  const b = ui.battle;
  if(b && Array.isArray(b.enemies)){
    const n = b.enemies.length;
    if(n >= 3) chance += TOKEN_ENCOUNTER_BONUS.triple;
    else if(n === 2) chance += TOKEN_ENCOUNTER_BONUS.double;

    const valueOf = (e)=>{
      const t = SPECIES[e.species].tier;
      if(t==='legendary') return TOKEN_ENCOUNTER_BONUS.legendary;
      if(t==='elite')     return TOKEN_ENCOUNTER_BONUS.elite;
      if(t==='starter' || t==='special') return TOKEN_ENCOUNTER_BONUS.starter;
      return 0;
    };
    const values = b.enemies.map(valueOf).filter(v=>v>0).sort((a,c)=>c-a);
    values.forEach((v,i)=>{ chance += (i===0) ? v : v*(2/3); });
  }
  return Math.max(0, chance);                // may exceed 100% — see rollTokenDrop
}

/* Every whole 100% is a token for certain, and the rest is the chance of one
   more: 150% is one token and a coin-toss for a second, 260% is two and a 60%
   chance of a third. (Two was the most before 2.77.) */
function rollTokenCount(){
  const c = tokenDropChance();
  let n = Math.floor(c);
  if(Math.random() < (c - n)) n++;
  return n;
}

function rollTokenDrop(){
  const b = ui.battle;
  if(!b || b.isNpc) return 0;               // wild-style fights only (plant and engineer count)
  const n = rollTokenCount();
  if(n > 0) state.inventory.tokens = (state.inventory.tokens||0) + n;
  return n;
}


function onBattleWon(){
  const b = ui.battle;
  if(b.guardianTrial) return onGuardianTrialResolved();
  if(b.scriptedLoss==='padrino'){ restoreRealParty(); return onPadrinoResolved(); }
  if(b.scriptedLoss==='monkey'){ return onMonkeyResolved(); }   // winning her is still the scripted beat
  if(inSacredGroveTrial()){
    state.progress.region2.courage = (state.progress.region2.courage||0) + 1;
    saveProfile();
  }
  // a wild win inside the Caverns moves you one step along that path
  if(ui.cavernAdvanceOnWin && !b.isNpc){
    const pid = ui.cavernAdvanceOnWin;
    ui.cavernAdvanceOnWin = null;
    advancePath(pid);
  }
  const enemyNames = b.enemies.filter(e=>!e.fled).map(e=>SPECIES[e.species].name).join(' & ');
  const levelUps = awardXpToParty();
  const tokens = rollTokenDrop();
  saveProfile();
  const evolvers = levelUps.filter(e=>e.evos.length>0);
  // Non-NPC fights can still carry a callback — the Engineer's commission is a
  // catchable wild fight that pays out.
  /* A callback may show a scene first and then call resumeVictory() to fall
     through to the ordinary victory page — which is where catching happens. */
  ui.pendingVictory = ()=> showVictory(enemyNames, levelUps, tokens);
  const finish = ()=> b.onWin ? b.onWin(levelUps) : showVictory(enemyNames, levelUps, tokens);
  if(evolvers.length){
    /* One animation per EVOLUTION, not per monster. A Magnet that crosses both
       11 and 25 in one payout used to play a single flicker from stage 0 to
       stage 2 — the middle form never appeared at all. Each crossing now gets
       its own scene with the correct consecutive pair. */
    const scenes = [];
    evolvers.forEach(e=>{
      if(e.hatched || e.crowned){ scenes.push(e); return; }   // those are one-offs
      /* `evolutionStage(species, level)` reads the level and nothing else, so
         a monster CAUGHT above its thresholds — a base form at 66, say — was
         reported as already fully evolved, and the animation opened on the
         form it was about to become. The truth is `monStageOf(m)`, which
         respects evoFloor. Walk up from the stage it is actually in. */
      const mon = (state.party || []).concat(state.storage || [])
                    .find(x => x.uid === e.uid);
      let stage = mon ? monStageOf(mon) : evolutionStage(e.species, e.from);
      /* monStageOf reports where it has ALREADY arrived, so step back by the
         number of evolutions this payout is about to play. */
      stage = Math.max(0, stage - e.evos.length);
      e.evos.forEach((lvl, k)=>{
        const last = k === e.evos.length - 1;
        scenes.push(Object.assign({}, e, {
          from: lvl - 1, to: lvl, evos:[lvl],
          stageFrom: stage,
          stageTo:   stage + 1,
          newMoves: last ? e.newMoves : [],     // the learning line belongs to the last
        }));
        stage++;
      });
    });
    playEvolutions(scenes, finish);
  } else {
    finish();
  }
}

/* ---------- EVOLUTION SEQUENCE (9 seconds) ----------
   The silhouette flickers between the current form and a colour-inverted
   version of the evolved form, accelerating as it goes, while glowing
   particles swirl upward. It resolves onto the evolved sprite in full colour
   with the declaration. */
const EVO_TOTAL_MS   = 14000;
const EVO_REVEAL_MS  = 2800;                       // final hold on the evolved form
const EVO_FLASH_MS   = EVO_TOTAL_MS - EVO_REVEAL_MS;

/* Flip intervals shrink geometrically: slow, hesitant flickers at first,
   frantic by the end. */
function evoFlashSchedule(totalMs){
  const out = [];
  let t = 0, gap = 620;
  while(t < totalMs){
    out.push(gap);
    t += gap;
    gap = Math.max(70, gap * 0.87);
  }
  return out;
}

function playEvolutions(list, done){
  let i = 0;
  const next = ()=>{
    if(i >= list.length){ done(); return; }
    /* if a previous scene was cut short, its fanfare must not follow us */
    if(playEvolutions._f) clearTimeout(playEvolutions._f);
    const ev = list[i++];
    playSfx('evolution');
    /* The reveal lands on the same fanfare a Very High or Ultra stone gets —
     the climb has been building for fourteen seconds and used to arrive in
     silence. */
    playEvolutions._f = setTimeout(()=> playSfx('stone_veryhigh'), EVO_FLASH_MS - 200);
    const sp = SPECIES[ev.species];
    /* Explicit stages when the caller worked them out; otherwise derive them.
       The pair must always be CONSECUTIVE — the form you were, and the form you
       are about to become. */
    const fromStage = (ev.stageFrom != null) ? ev.stageFrom : evolutionStage(ev.species, ev.from);
    const toStage   = (ev.stageTo   != null) ? ev.stageTo   : evolutionStage(ev.species, ev.to);

    const ov = document.createElement('div');
    ov.className = 'evo-overlay';
    ov.innerHTML = `
      <div class="evo-particles" id="evoParticles"></div>
      <div class="evo-stage">
        <div id="evoSprite" class="evo-sprite-wrap cutout">${monPortrait(ev.fromSpecies||ev.species,190,{view:'front',stage:ev.fromSpecies?0:fromStage,bare:true})}</div>
      </div>
      <div id="evoText" class="evo-text">What's happening…?</div>
      <div id="evoActions"></div>
    `;
    document.body.appendChild(ov);

    // swirling upward glow
    const pc = ov.querySelector('#evoParticles');
    for(let k=0;k<26;k++){
      const d = document.createElement('span');
      d.className = 'evo-particle';
      d.style.left = (5 + Math.random()*90) + '%';
      d.style.animationDelay = (Math.random()*2.2) + 's';
      d.style.animationDuration = (2.4 + Math.random()*2.2) + 's';
      d.style.width = d.style.height = (4 + Math.random()*7) + 'px';
      pc.appendChild(d);
    }

    const spriteBox = ov.querySelector('#evoSprite');
    const schedule = evoFlashSchedule(EVO_FLASH_MS);
    let step = 0, showEvolved = false;
    let timer = null;

    /* Both forms are rendered ONCE into fixed-size layers and simply toggled.
       Re-writing innerHTML each flip made the box resize (so the caption jumped),
       reloaded the images (so old and new overlapped), and left the final frame
       showing whichever species happened to be painted last. */
    const passengerScale = ev.fromSpecies==='sacred_seed' ? 0.20
                         : ev.fromSpecies==='dragon_egg'  ? 0.40
                         : ev.fromSpecies==='newt_baby'   ? 0.35 : 1;
    spriteBox.innerHTML =
      `<span class="evo-layer" id="evoFrom">${
        monPortrait(ev.fromSpecies || ev.species, Math.round(190*passengerScale),
                    { view:'front', stage: ev.fromSpecies ? 0 : fromStage, bare:true })
      }</span>` +
      `<span class="evo-layer" id="evoTo">${
        monPortrait(ev.species, 190, { view:'front', stage:toStage, bare:true, crowned:!!ev.crowned })
      }</span>`;
    const layerFrom = spriteBox.querySelector('#evoFrom');
    const layerTo   = spriteBox.querySelector('#evoTo');

    const paint = (showTarget)=>{
      layerFrom.style.opacity = showTarget ? '0' : '1';
      layerTo.style.opacity   = showTarget ? '1' : '0';
      // The invert lives on the TARGET LAYER ONLY, never the shared box — a
      // filter toggled on a parent while children fade via opacity composites
      // unreliably on some mobile browsers and could bleed onto the old form.
      layerFrom.classList.remove('evo-inverted');
      layerTo.classList.toggle('evo-inverted', !!showTarget);
    };
    paint(false);

    const tick = ()=>{
      if(step >= schedule.length){ return finish(); }
      showEvolved = !showEvolved;
      paint(showEvolved);
      timer = setTimeout(tick, schedule[step++]);
    };

    const finish = ()=>{
      clearTimeout(timer);
      /* The transformation loop has to stop before the fanfare, or the two
         overlap and neither reads. Same fanfare as winning an Ultra stone. */
      fadeOutSfx('evolution', 320);
      setTimeout(()=> playSfx('stone_ultra'), 260);
      // settle on the NEW form, full colour, with the old one gone for good
      layerFrom.style.display = 'none';
      layerTo.style.opacity = '1';
      layerTo.classList.remove('evo-inverted');
      spriteBox.classList.add('evo-pop');
      ov.querySelector('#evoText').innerHTML =
        `<b>${escapeHtml(ev.name)}</b> ${ev.crowned?'is crowned!':(ev.hatched?'hatched!':'evolved!')}` +
        (ev.newMoves.length ? `<div class="evo-learn">Learned ${escapeHtml(ev.newMoves.join(', '))}!</div>` : '');
      ov.querySelector('#evoActions').innerHTML =
        `<button class="btn btn-primary" id="evoNext" style="width:auto;padding:12px 30px;">Continue</button>`;
      ov.querySelector('#evoNext').addEventListener('click', ()=>{
        if(ov.parentNode) document.body.removeChild(ov);
        next();
      });
    };

    timer = setTimeout(tick, 500);
  };
  next();
}


/* Straight back into the next encounter — no detour through the zone page.
   Inside the Caverns that means the next step of whichever path you were on. */
function exploreFurther(){
  if(!battleParty().some(m=>m.currentHp>0)){
    toast('Your team needs healing first.');
    return go((ui.currentZone||{}).id==='rocky_caverns' && !cavernsComplete() ? 'caverns' : 'zone');
  }
  if(ui.cavernPath && !cavernsComplete()) return exploreCavernPath(ui.cavernPath);
  if((ui.currentZone||{}).id==='diving')           return startDive();   // straight back in
  if((ui.currentZone||{}).id==='weather_deck')     return go('weather_deck');
  if((ui.currentZone||{}).id==='plant_generator')  return go('generator');
  if((ui.currentZone||{}).id==='geothermal_plant') return go('plant');
  /* the catacombs: back into the dark, exactly where you were standing */
  if((ui.currentZone||{}).id==='catacombs')        return r5AfterWild();
  return startWildEncounter({ silentIntro:true });
}

/* Continue to the standard victory screen after a story beat. */
/* `then` runs INSTEAD of the victory screen — for the scenes that must
   interrupt it, like the whales stopping the ship. Calls that pass arguments
   used to have them silently ignored, which is why the wall never appeared. */
function resumeVictory(interrupt, then){
  const f = ui.pendingVictory;
  ui.pendingVictory = null;
  if(interrupt && typeof then === 'function') return then();
  if(f) f(); else go('region');
}

function showVictory(enemyNames, levelUps, tokens){
  playSfx('victory'); fadeOutMusic(2000);
  /* This used to be a comma expression buried in a template literal. It fired
     while the string was being built, which is fragile and easy to lose to any
     edit of the surrounding markup — and it did get lost. */
  if(levelUps && levelUps.length) setTimeout(()=> playSfx('level_up'), 700);
  const breakNow = tallyBattleForEyeBreak();
  const b = ui.battle;
  $('#brandSub').textContent = 'Victory';
  // determine catchable target(s): wild only, species not already caught
  /* `e.fled` also sits at 0 HP, but it left with the loot rather than being
     beaten — only what you actually took down can be caught. */
  const catchable = b.enemies.filter(e=>e.hp<=0 && !e.fled && SPECIES[e.species].tier!=='npc' && !state.caughtSpecies.includes(e.species));
  screenEl.innerHTML = `
    <div style="text-align:center;padding:14px 0;">
      <div style="font-size:42px;">🎉</div>
      <div class="screen-title" style="text-align:center;">Victory!</div>
      <div class="screen-sub" style="text-align:center;">You defeated the wild ${enemyNames}.</div>
    </div>
    <div class="hp-card" style="margin-bottom:14px;">
      <div style="font-weight:800;font-size:13px;color:var(--ink-soft);margin-bottom:6px;">Your team earned a fight!</div>
      ${levelUps.some(e=> e.to > e.from) ? levelUps.filter(e=> e.to > e.from).map(e=>`<div style="font-weight:700;font-size:14px;">⬆️ ${e.companion ? '🤝 ' : ''}${escapeHtml(e.name)} grew to Lv ${e.to}!</div>`).join('') : `<div style="font-size:13px;color:var(--ink-soft);font-weight:600;">Everyone gained progress toward their next level.</div>`}
      ${levelUps.filter(e=> e.breakthrough).map(e=>`<div style="font-weight:800;font-size:14px;color:var(--gold);margin-top:6px;">⚡ ${escapeHtml(e.name)} broke through! It can grow to Lv ${e.breakthrough} now.</div>`).join('')}
      ${levelUps.filter(e=> e.ready).map(e=>`<div style="font-weight:800;font-size:14px;color:#6a4ab0;margin-top:6px;">⚡ ${escapeHtml(e.name)} is ready to break through to Lv ${e.ready} — see your Party.</div>`).join('')}
      ${tokens ? `<div style="font-weight:800;font-size:14px;color:var(--gold);margin-top:6px;">🎫 Found ${tokens > 1 ? tokens + ' Skill Tokens' : 'a Skill Token'}! (${state.inventory.tokens} total)</div>` : ''}
      ${(ui.victoryNotes || []).map(n=> `<div style="font-weight:800;font-size:14px;color:var(--gold);margin-top:6px;">${n}</div>`).join('')}
    </div>
    <div id="catchArea"></div>
    <button class="btn btn-ghost" id="regionBtn" style="margin-top:10px;">Back to region</button>
    <button class="btn btn-ghost" id="againBtn" style="margin-top:8px;">${
      (ui.currentZone||{}).id==='catacombs' ? '🕯️ Back into the dark' : '🌿 Explore further'}</button>
  `;
  const area = $('#catchArea');
  if(catchable.length){
    if(catchable.length===1){
      area.innerHTML = `<button class="btn btn-primary" id="catchBtn">🎯 Try to catch the ${SPECIES[catchable[0].species].name}!</button>`;
      $('#catchBtn').addEventListener('click', ()=> startCatch(catchable[0]));
    } else {
      area.innerHTML = `<div style="font-weight:800;font-size:13px;margin-bottom:8px;">Catch which one?</div>` +
        catchable.map((e,i)=>`<button class="btn btn-primary catch-opt" data-i="${i}" style="margin-bottom:8px;">🎯 ${SPECIES[e.species].name} (Lv ${e.level})</button>`).join('');
      area.querySelectorAll('.catch-opt').forEach(btn=> btn.addEventListener('click', ()=> startCatch(catchable[+btn.dataset.i])));
    }
  }
  ui.victoryNotes = null;                       // said once
  $('#regionBtn').addEventListener('click', ()=>go('region'));
  if(breakNow) showEyeBreak();
  $('#againBtn').addEventListener('click', ()=> exploreFurther());
}

/* ---------- CATCHING ---------- */
function startCatch(enemy){
  const need = catchPhraseCount(enemy.species);
  // build challenge words: fight mistakes first, then fill from pool
  const mistakes = (ui.battle.fightMistakes||[]).slice();
  const poolWords = shuffle(activePool().map(w=>w.text).filter(t=>!mistakes.includes(t)));
  const words = [];
  for(const t of mistakes){ if(words.length<need) words.push(t); }
  while(words.length<need){ if(poolWords.length===0){ // refill if pool smaller than need
      const all = activePool().map(w=>w.text); if(all.length===0) break; poolWords.push(...shuffle(all)); }
    words.push(poolWords.pop());
  }
  ui.catchTarget = enemy;
  startQuiz({
    title:`Catching ${SPECIES[enemy.species].name}`,
    subtitle:`Spell ${words.length} to seal it. One slip is risky — two lets it escape!`,
    words,
    endAfterMistakes:2, lockExit:true,
    onComplete:(results)=> resolveCatch(enemy, results),
    onExit:()=>{ showVictory(ui.battle.enemies.map(e=>SPECIES[e.species].name).join(' & '), []); },
  });
}
function resolveCatch(enemy, results){
  const mistakes = results.filter(r=>!r.passed).length;
  let caught;
  if(mistakes===0) caught = true;
  else if(mistakes===1) caught = Math.random() >= 0.80; // first mistake fails 80% of the time
  else caught = false;                                   // second mistake always fails
  if(caught) gotcha(enemy);
  else {
    playSfx('catch_miss');
    go('battle'); // reuse container
    $('#brandSub').textContent='Catch';
    screenEl.innerHTML = `
      <div style="text-align:center;padding:30px 0;">
        <div style="font-size:42px;">💨</div>
        <div class="screen-title" style="text-align:center;">So close!</div>
        <div class="screen-sub" style="text-align:center;">The ${SPECIES[enemy.species].name} broke free and fled.</div>
      </div>
      <button class="btn btn-primary" id="okBtn">Continue</button>
    `;
    $('#okBtn').addEventListener('click', ()=> afterCatch());
  }
}
/* Where a catch (or a miss) leaves you: the region, or — in the catacombs —
   the very spot the fight found you. */
function afterCatch(){
  if((ui.currentZone||{}).id === 'catacombs' && ui.returnDeck && typeof r5AfterWild === 'function') return r5AfterWild();
  go('region');
}
/* Legendaries are a one-time meeting: once caught, they stop appearing. */
function legendaryCaught(sp){ return (state.caughtSpecies||[]).includes(sp); }

const CATCH_MESSAGES = {
  phoenix: `The young phoenix looks deep into your eyes, into your soul.<br><br>` +
    `Sensing that you have the potential and the heart to help monsters around the world, ` +
    `it entrusts its power to you.<br><br>` +
    `<i>Grow it well, and it will help you as you adventure onward.</i>`,
};

function gotcha(enemy){
  /* Remember the form it was actually caught in, so a Lv55 base-form catch
     becomes stage 1 at Lv56 and stage 2 at Lv57 rather than jumping instantly. */
  playSfx('catch_success');
  const sp = SPECIES[enemy.species];
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at center,#fff7e0,#e8dcc0);gap:16px;';
  ov.innerHTML = `
    <div class="evo-mon cutout">${monPortrait(enemy.species, 140, { view:'front', bare:true, stage:enemy.stage||0 })}</div>
    <div style="font-family:'Baloo 2',cursive;font-weight:800;font-size:24px;">Gotcha!</div>
    <div style="font-weight:700;color:var(--ink-soft);">${sp.name} was caught!</div>
    <div style="font-size:13px;color:var(--ink-soft);font-weight:600;">Give it a nickname? (optional)</div>
    <input type="text" id="nickInput" placeholder="${sp.name}" maxlength="16" style="max-width:220px;text-align:center;">
    <button class="btn btn-primary" id="nickSave" style="width:auto;padding:12px 28px;">Add to team</button>
  `;
  document.body.appendChild(ov);
  ov.querySelector('#nickSave').addEventListener('click', async ()=>{
    const nick = ov.querySelector('#nickInput').value.trim();
    const mon = newMonster(enemy.species, enemy.level);
  const caughtStage = enemy.stage || 0;
  if(caughtStage < evolutionStage(enemy.species, enemy.level)){
    mon.evoFloor = caughtStage;
    mon.evoFloorLevel = enemy.level;
  }
    if(nick){ mon.nickname = nick; mon.namedRegion = state.progress.currentRegion; }
    if(slottedCount() < 6) state.party.push(mon);
    else state.storage.push(mon);
    if(!state.caughtSpecies.includes(enemy.species)) state.caughtSpecies.push(enemy.species);
    if(!state.encounteredSpecies.includes(enemy.species)) state.encounteredSpecies.push(enemy.species);
    await saveProfile();
    document.body.removeChild(ov);
    const where = state.party.some(m=>m.uid===mon.uid) ? 'your party' : 'storage';
    toast(`${displayName(mon)} joined ${where}!`);
    // Some catches carry a scene of their own.
    if(enemy.species === 'ankylosaurus') return ankyloConversation(mon);
    const msg = CATCH_MESSAGES[enemy.species];
    if(msg) return storyModal(monPortrait(enemy.species, 150, { view:'front', bare:true, stage:enemy.stage||0 }),
      SPECIES[enemy.species].name, msg, ()=>go('region'), { subtitle:'A bond formed' });
    afterCatch();
  });
}

function go(screen){
  if(screen !== 'quiz') document.body.classList.remove('writing');
  document.body.classList.remove('in-scene');
  /* A daily reward held back during a fight gets its moment once the player is
     somewhere it can safely take over the screen. */
  if(!['battle','quiz'].includes(screen) && typeof flushPendingDaily === 'function'){
    setTimeout(flushPendingDaily, 350);
  }
  if(!['zone','caverns','battle','quiz'].includes(screen)) document.body.classList.remove('zone-dark','zone-tinted');
  // Protected screens re-lock as soon as you leave them, so the password is
  // required on every visit. The arena stays unlocked while you're actually
  // fighting in it (arena -> battle -> arena), otherwise testing would prompt
  // for the password after every single bout.
  if(ui.spellingUnlocked && screen !== 'spelling') ui.spellingUnlocked = false;
  if(ui.arenaUnlocked && screen !== 'arena' && screen !== 'battle') ui.arenaUnlocked = false;
  if(ui.xpUnlocked && screen !== 'sound') ui.xpUnlocked = false;
  /* Out of a fight a companion is whole again: what it lost was the fight's. */
  if(!['battle','quiz'].includes(screen) && typeof restCompanions === 'function' && state && state.party) restCompanions();
  /* Training with the Monkey King ends when you walk away from it (2.87). */
  if(ui.coreSession && !['coreSpar','battle','quiz','spelling'].includes(screen) && typeof endCoreSession === 'function') endCoreSession();
  ui.screen = screen;
  render();
}

function render(){
  try{ renderInner(); }
  catch(err){
    console.error('render error:', err);
    toast('Error: '+err.message);
    try{
      screenEl.innerHTML = `<div class="placeholder-note">
        <span class="pn-emoji">⚠️</span>Something went wrong on this screen.<br>
        <span style="font-size:11px;">${escapeHtml(err.message)}</span>
      </div><button class="btn btn-primary" id="errHome" style="margin-top:14px;">Back to Home</button>`;
      $('#errHome').addEventListener('click', ()=>go('home'));
    }catch(e2){}
  }
}
function renderInner(){
  enforceEyeBreak();
  if(!['home','region','battle','recover','challenge','explore','shop','storage','party','companions','coreSpar','stats','monsterIndex','indexDetail','spellingIndex','profileSelect'].includes(ui.screen)) setScreenBg(null);
  const hb = $('#hamburgerBtn');
  // hamburger available everywhere except profile setup + (future) fights
  const noMenu = ['boot','profileSelect','starterSelect','battle','quiz'].includes(ui.screen);
  hb.disabled = noMenu;

  switch(ui.screen){
    case 'profileSelect': return renderProfileSelect();
    case 'newTrainer':    return promptNewTrainerName();
    case 'starterSelect': return renderStarterSelect();
    case 'home':          return renderHome();
    case 'region':        return renderRegion();
    case 'explore':       return renderExplore();
    case 'battle':        return renderBattle();
    case 'challenge':     return (state.progress.currentRegion === 5) ? renderChallengeR5()
                               : (state.progress.currentRegion === 4) ? renderChallengeR4() : renderChallenge();
    case 'tear':          return renderTear();             // the space-time tear (2.94, 16-tear.js)
    case 'party':         return renderPartyStub();
    case 'companions':    return renderCompanions();
    case 'coreSpar':      return renderCoreSpar();
    case 'stats':         return renderStats();
    case 'storage':       return renderStorage();
    case 'shop':          return renderShop();
    case 'regionSelect':  return renderRegionSelect();
    case 'zone':          return renderZone();
    case 'caverns':       return renderCaverns();
    case 'plant':         return renderPlant();
    case 'concert':       return renderConcert();
    case 'generator':     return renderGenerator();
    case 'diving':        return go('weather_deck');
    case 'elementStones': return renderElementStones();
    case 'weather_deck':      return renderWeatherDeck();
    case 'cabin_deck': return renderCabinDeck();
    case 'laboratory_deck': return renderLaboratoryDeck();
    case 'accuse':        return renderAccuse();
    case 'accuse':        return renderAccuse();
    case 'dojo':          return renderDojo();
    case 'avatarPick':    return renderAvatarPick();
    case 'region2':       return renderStub('Region 2','🏞️','Region 2 is unlocked — its wilds and trainers arrive in a future phase. Earth Snake and Ground Starter will be catchable here.','region');
    case 'recover':       return renderRecover();
    case 'monsterIndex':  return renderMonsterIndex();
    case 'indexDetail':   return renderIndexDetail();
    case 'spellingIndex': return renderSpellingIndex();
    case 'spelling':      return renderSpelling();
    case 'quiz':          return renderQuiz();
    case 'arena':         return renderArenaGate();
    case 'sound':         return renderSound();
    /* Every walkable place is a screen of its own: the ship's decks above,
       and everything in Cosa Nostia (15-region5.js). */
    default:              return (typeof DECKS !== 'undefined' && DECKS[ui.screen])
                                   ? renderWalkDeck(ui.screen) : renderProfileSelect();
  }
}

