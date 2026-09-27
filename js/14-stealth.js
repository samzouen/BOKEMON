/* ==========================================================
   14-stealth.js
   The catacombs under Cosa Nostia: the dark, the soldatos'
   lanterns, and what the Whalelord can feel through the walls.
   Loads after 13-walkmap.js (it hangs off the walkable decks)
   and before 15-region5.js (which fills it with places).
   ========================================================== */

/* ============================================================
   THE DARK AND THE LIGHT
   ------------------------------------------------------------
   You never carry a light. A soldato does: a lantern held out in front of
   him, and a small glow all round. He notices you only if you are standing
   in HIS light, and it takes him a beat to be sure:
     his beat, you are in his light   he stops and looks   (?)
     his next beat, still there       caught               (!)
   Step back into the dark between the two and he shrugs and carries on.
   So from the moment the "?" appears you have one whole beat to get out.

   What you can see:
     lit         a lantern's (or a brazier's) light that you have a line of
                 sight to — walls, pillars and crates cast shadows
     sensed      anything within the Whalelord's reach, through walls. He
                 floats about you unseen and tells you what is there.
     remembered  anywhere you have seen before, drawn dim: the layout, and
                 never who is standing in it
     unknown     black
   Guards are drawn where you can see them — and, faintly, wherever the
   Whalelord can feel them (a few tiles, through walls). You know what is
   close; you still have to find your way.

   A floor is a deck (13-walkmap.js) with a `stealth` block:
     kind      'fight'  caught → a battle; beat him and he is gone for good
               'evade'  caught → the run is over; a round of spelling, and
                        you start the floor again
     sense     how far the Whalelord shows the floor (tiles, through walls)
     feel      how far he feels a guard (tiles, through walls)
     guards    [{ id, kind, x, y, face, path, clock, pause, reach, faces, roster }]
               kind: 'soldato' walks `path` back and forth, pausing at each
                     END before he turns (that pause is your window)
                     'lookout' stands and turns: a quarter clockwise every
                     `pause` beats, or through `faces` in order
                     'talker' stands facing his friend: scenery, but his
                     lantern is still lit
                     'capo'   stands still with a wide lantern
               clock: his own beat in ms — every guard keeps his own, so
                      they drift out of step and a corridor never repeats
     wild      (fight floors) the ghosts that find you in the dark
   Guards stand where they stand: you cannot walk through one.
   ============================================================ */

const STEALTH_OPAQUE = '#ocG';         // what light cannot pass (water and braziers do not stop it)
const STEALTH_VIEW = 9;                // how far off you can make out a light
const DIRS = { u:[0,-1], d:[0,1], l:[-1,0], r:[1,0] };
const TURN = { u:'r', r:'d', d:'l', l:'u' };

/* Per floor, for this visit: where each guard is, which way he faces, how
   long he has stood, whether he has half-seen you. Kept in ui, so a fight or
   a conversation resumes the floor exactly as it was; entering the floor
   afresh (down a stair) starts it over. */
function stealthState(id, d){
  ui.stealth = ui.stealth || {};
  if(!ui.stealth[id]) resetStealth(id, d);
  return ui.stealth[id];
}
function resetStealth(id, d){
  ui.stealth = ui.stealth || {};
  const beaten = stealthBeaten(id);
  ui.stealth[id] = {
    guards: (d.stealth.guards || []).filter(g=> !beaten.includes(g.id)).map(g=> guardStart(g)),
    timers: [], caught: false, calm: 6,
  };
  return ui.stealth[id];
}
/* Where a guard starts the floor: on his own tile, or the first of his path. */
function guardStart(def){
  const p0 = (def.path && def.path[0]) || [def.x, def.y];
  return { id:def.id, x:def.x != null ? def.x : p0[0], y:def.y != null ? def.y : p0[1],
           face:def.face || 'd', leg:def.leg || 1, dir:1, wait:0, sus:0, spotted:false };
}
/* Guards beaten on a fight floor stay beaten — that is progress. */
function stealthBeaten(id){
  const r = r5();
  r.beaten = r.beaten || {};
  return r.beaten[id] = r.beaten[id] || [];
}
function guardDef(d, id){ return (d.stealth.guards || []).find(g=> g.id === id); }
/* A guard stands on his tile: nobody walks through him. */
function stealthOccupied(d, x, y){
  const st = ui.stealth && ui.stealth[d.key];
  return !!(st && st.guards.some(g=> g.x === x && g.y === y));
}

/* ---------- light ---------- */
function stOpaque(d, x, y){
  if(y < 0 || y >= d.rows.length || x < 0 || x >= d.rows[0].length) return true;
  return STEALTH_OPAQUE.includes(d.rows[y][x]);
}
/* Bresenham from a to b: can light (or an eye) get from one to the other?
   The end tiles themselves never block. */
function stLine(d, x0, y0, x1, y1){
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  while(!(x === x1 && y === y1)){
    const e2 = 2 * err;
    if(e2 >= dy){ err += dy; x += sx; }
    if(e2 <= dx){ err += dx; y += sy; }
    if(x === x1 && y === y1) break;
    if(stOpaque(d, x, y)) return false;
  }
  return true;
}
/* One guard's light: a glow on the tiles around him, and his lantern's beam
   ahead — widening by a tile every two (every one for a capo's big lamp). */
function guardLight(d, g, def){
  const out = new Set();
  const add = (x, y)=>{
    if(y < 0 || y >= d.rows.length || x < 0 || x >= d.rows[0].length) return;
    if(stOpaque(d, x, y)) return;
    if(!stLine(d, g.x, g.y, x, y)) return;
    out.add(x + ',' + y);
  };
  for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++) add(g.x + dx, g.y + dy);
  const [fx, fy] = DIRS[g.face] || DIRS.d;
  const reach = def.reach || (def.kind === 'capo' ? 4 : 3);
  const wide = def.kind === 'capo' || def.wide;
  for(let k = 1; k <= reach; k++){
    const spread = wide ? k : Math.floor(k / 2);
    for(let l = -spread; l <= spread; l++){
      add(g.x + fx * k + (fx ? 0 : l), g.y + fy * k + (fy ? 0 : l));
    }
  }
  return out;
}
/* Braziers ('*') light the tiles round them, walls permitting. */
function brazierLight(d){
  if(d._brazier) return d._brazier;
  const out = new Set();
  d.rows.forEach((row, y)=>{ for(let x = 0; x < row.length; x++){
    if(row[x] !== '*') continue;
    for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++){
      const tx = x + dx, ty = y + dy;
      if(Math.abs(dx) + Math.abs(dy) > 3) continue;
      if(stOpaque(d, tx, ty) || !stLine(d, x, y, tx, ty)) continue;
      out.add(tx + ',' + ty);
    }
  }});
  return (d._brazier = out);
}

/* ---------- a guard's beat, without you in it ---------- */
/* Move or turn. Pure: the same beat always does the same thing, which is
   what lets tools/region5-test.js prove an evade floor can be crossed. */
function guardAdvance(d, g, def){
  if(def.kind === 'soldato' && def.path && def.path.length > 1) return patrolStep(d, g, def);
  if(def.kind === 'lookout'){
    g.wait = (g.wait || 0) + 1;
    if(g.wait >= (def.pause || 4)){
      g.wait = 0;
      if(def.faces && def.faces.length){
        const i = def.faces.indexOf(g.face);
        g.face = def.faces[(i + 1) % def.faces.length];
      } else g.face = TURN[g.face] || 'd';
    }
  }
  /* talkers and capos stand where they are */
}
/* Along the path and back. At each END he stands looking the way he came —
   at the wall — for `pause` beats, then turns and steps off in the same beat.
   That standing still, facing the wall, is your window. At a corner in the
   middle of a path he simply turns. */
function patrolStep(d, g, def){
  const path = def.path;
  const target = path[g.leg];
  if(g.x === target[0] && g.y === target[1]){
    const end = g.leg === 0 || g.leg === path.length - 1;
    if(end && (g.wait || 0) < (def.pause || 3)){ g.wait = (g.wait || 0) + 1; return; }
    g.wait = 0;
    /* next leg: ping-pong along the waypoints */
    if(g.leg + g.dir >= path.length || g.leg + g.dir < 0) g.dir = -g.dir;
    g.leg += g.dir;
  }
  const t = path[g.leg];
  const dx = Math.sign(t[0] - g.x), dy = Math.sign(t[1] - g.y);
  if(dx) g.face = dx > 0 ? 'r' : 'l'; else if(dy) g.face = dy > 0 ? 'd' : 'u';
  const nx = g.x + (dx || 0), ny = g.y + (dx ? 0 : dy);
  /* He does not walk through you: stepping into you is seeing you. */
  const p = (typeof walkState === 'function') ? walkState().at[d.key] : null;
  if(p && p.x === nx && p.y === ny){ g.sus = 1; return; }
  g.x = nx; g.y = ny;
}
function inGuardLight(id, d, g, def){
  const p = walkState().at[id];
  if(!p) return false;
  return guardLight(d, g, def || guardDef(d, g.id)).has(p.x + ',' + p.y);
}

/* ---------- what you can see ---------- */
function stealthVision(id, d){
  const st = stealthState(id, d);
  const p = walkState().at[id];
  const sense = d.stealth.sense || 2;
  const lit = new Map();                                 // tile -> 'guard' | 'fire'
  brazierLight(d).forEach(k=> lit.set(k, 'fire'));
  const lights = st.guards.map(g=> guardLight(d, g, guardDef(d, g.id)));
  lights.forEach(s=> s.forEach(k=> lit.set(k, 'guard')));
  const vis = new Map();                                 // tile -> 'lit' | 'sensed'
  for(let dy = -sense; dy <= sense; dy++) for(let dx = -sense; dx <= sense; dx++){
    const x = p.x + dx, y = p.y + dy;
    if(y < 0 || y >= d.rows.length || x < 0 || x >= d.rows[0].length) continue;
    vis.set(x + ',' + y, lit.has(x + ',' + y) ? 'lit' : 'sensed');
  }
  lit.forEach((kind, k)=>{
    if(vis.get(k) === 'lit') return;
    const [x, y] = k.split(',').map(Number);
    if(Math.max(Math.abs(x - p.x), Math.abs(y - p.y)) > STEALTH_VIEW) return;
    if(stLine(d, p.x, p.y, x, y)) vis.set(k, 'lit');
  });
  /* Whoever has you in his light, you can see — whatever Bresenham thinks of
     the corner between you. */
  st.guards.forEach((g, i)=>{ if(lights[i].has(p.x + ',' + p.y)) vis.set(g.x + ',' + g.y, 'lit'); });
  return { lit, vis };
}

/* ---------- the fog, the guards and their light, painted ---------- */
function stealthSeen(id, d){
  const r = r5();
  r.seen = r.seen || {};
  const n = d.rows.length * d.rows[0].length;
  if(!r.seen[id] || r.seen[id].length !== n) r.seen[id] = '0'.repeat(n);
  return r.seen[id];
}
function paintStealth(id, d){
  const fog = document.getElementById('walkFog');
  if(!fog || !ui.stealth || !ui.stealth[id]) return;
  const st = ui.stealth[id];
  const W = d.rows[0].length;
  const p = walkState().at[id];
  const { lit, vis } = stealthVision(id, d);
  let seen = stealthSeen(id, d).split('');
  let changed = false;
  vis.forEach((v, k)=>{
    const [x, y] = k.split(',').map(Number);
    const i = y * W + x;
    if(seen[i] !== '1'){ seen[i] = '1'; changed = true; }
  });
  if(changed) r5().seen[id] = seen.join('');
  const cells = fog.children;
  for(let i = 0; i < cells.length; i++){
    const x = i % W, y = Math.floor(i / W), k = x + ',' + y;
    const v = vis.get(k);
    const cls = v === 'lit' ? (lit.get(k) === 'guard' ? 'fog-lamp' : 'fog-fire')
              : v === 'sensed' ? 'fog-sense'
              : seen[i] === '1' ? 'fog-seen' : 'fog-dark';
    if(cells[i].className !== cls) cells[i].className = cls;
  }
  const feel = d.stealth.feel != null ? d.stealth.feel : 4;
  st.guards.forEach(g=>{
    const el = document.getElementById('guard-' + g.id);
    if(!el) return;
    el.style.transform = `translate3d(${g.x * WALK_T}px,${g.y * WALK_T}px,0)`;
    el.style.zIndex = 10 + g.y;
    const seenNow = vis.has(g.x + ',' + g.y);
    const felt = !seenNow && p && Math.max(Math.abs(g.x - p.x), Math.abs(g.y - p.y)) <= feel;
    el.style.display = (seenNow || felt) ? '' : 'none';
    el.classList.toggle('sensed', !!felt);
    el.dataset.face = g.face;
    const mk = el.querySelector('.guard-mark');
    if(mk) mk.textContent = g.spotted ? '!' : (g.sus ? '?' : '');
  });
}

/* ---------- the floor comes alive ---------- */
function startStealth(world, d){
  const id = d.key;
  const w = walkState();
  stealthCss();
  stealthHold(false);
  /* Down a stair, or back from the harbour: the floor starts over. Back from a
     fight or a conversation: exactly where it was. */
  if(ui.stealthFresh){ resetStealth(id, d); ui.stealthFresh = false; }
  const st = stealthState(id, d);
  st.caught = false;
  st.guards.forEach(g=>{ g.sus = 0; g.spotted = false; });
  stopStealth();
  const W = d.rows[0].length, H = d.rows.length;
  const fog = document.createElement('div');
  fog.className = 'walk-fog'; fog.id = 'walkFog';
  fog.style.cssText = `width:${W * WALK_T}px;height:${H * WALK_T}px;` +
    `grid-template-columns:repeat(${W},${WALK_T}px);grid-auto-rows:${WALK_T}px;`;
  for(let i = 0; i < W * H; i++) fog.appendChild(document.createElement('i'));
  world.appendChild(fog);
  st.guards.forEach(g=>{
    const def = guardDef(d, g.id);
    const e = document.createElement('div');
    e.className = 'walk-ent guard guard-' + def.kind;
    e.id = 'guard-' + g.id;
    const px = Math.round(WALK_T * 0.8);
    const icon = def.kind === 'capo' ? '🕴️' : '💂';
    e.innerHTML = `<img src="assets/npc/${guardSprite(def)}.png" alt="" ` +
      `onerror="walkArtMissing(this,'${icon}',${px},0)"><b class="guard-mark"></b>`;
    world.appendChild(e);
  });
  paintStealth(id, d);
  /* Each guard keeps his own clock. */
  st.guards.forEach(g=>{
    const def = guardDef(d, g.id);
    const t = setInterval(()=> guardBeat(id, d, g, def), def.clock || 560);
    st.timers.push(t);
  });
  w.face = w.face || 'd';
}
function stopStealth(){
  if(!ui.stealth) return;
  Object.values(ui.stealth).forEach(st=>{ (st.timers || []).forEach(clearInterval); st.timers = []; });
}
function guardSprite(def){ return def.sprite || (def.kind === 'capo' ? 'capo_black' : 'soldato1'); }

/* Anything that stops you moving stops them too: somebody talking, the menu,
   a pop-up, a screen wipe, the app put away in the background. */
function stealthPaused(){
  if(walkState().busy || ui.sceneRunning || ui.drawerOpen || document.hidden) return true;
  return !!document.querySelector('.scene-say, .eye-overlay, .evo-overlay, .refine-scrim, .borrow-scrim, .tile-wipe');
}
/* One beat of one guard: look, then move or turn, then look again. */
function guardBeat(id, d, g, def){
  const st = ui.stealth && ui.stealth[id];
  if(!st || st.caught || ui.screen !== id || !document.getElementById('walkFog')) return;
  if(stealthPaused()) return;
  /* Half-saw you on his last beat and has stood looking since. Still there:
     caught. Gone: he shrugs, and this beat was spent looking. */
  if(g.sus){
    if(inGuardLight(id, d, g, def)){ g.spotted = true; paintStealth(id, d); return stealthCaught(id, d, g, def); }
    g.sus = 0;
    paintStealth(id, d);
    return;
  }
  guardAdvance(d, g, def);
  if(inGuardLight(id, d, g, def)) g.sus = 1;
  paintStealth(id, d);
}

/* ---------- your step ---------- */
/* Called by walkMove after every step. Returns true if the step set something
   off (so a held key stops). Walking into a light is not, by itself, being
   seen: he has to look, on his own beat. */
function stealthStep(p, d){
  const id = d.key;
  const st = ui.stealth && ui.stealth[id];
  if(!st || st.caught) return false;
  paintStealth(id, d);
  /* The ghosts in the dark (fight floors, away from any lantern). */
  const wild = d.stealth.wild;
  if(st.calm > 0){ st.calm--; return false; }
  if(wild && d.stealth.kind === 'fight' && !st.guards.some(g=> g.sus)){
    const near = st.guards.some(g=> Math.abs(g.x - p.x) + Math.abs(g.y - p.y) <= 3);
    const { lit } = stealthVision(id, d);
    if(!near && !lit.has(p.x + ',' + p.y) && Math.random() < (wild.rate || 0.04)){
      st.calm = wild.calm || 8;                    // never two in a row
      stopStealth();
      catacombEncounter(d);
      return true;
    }
  }
  return false;
}

/* ---------- caught ---------- */
/* From the "!" until the fight (or the running) begins, nothing else on the
   screen can be pressed — no slipping out through ← Explore with a soldato's
   shout still waiting to be answered. */
function stealthHold(on){
  let s = document.getElementById('stealthHold');
  if(on && !s){
    s = document.createElement('div');
    s.id = 'stealthHold';
    s.style.cssText = 'position:fixed;inset:0;z-index:84;background:rgba(0,0,0,0.22);';
    document.body.appendChild(s);
  } else if(!on && s) s.remove();
}
function stealthCaught(id, d, g, def){
  const st = ui.stealth[id];
  if(st.caught) return;
  st.caught = true;
  stealthHold(true);
  stopStealth();
  releaseKeys();
  walkState().busy = true;
  playSfx('alert');
  setTimeout(()=>{
    walkState().busy = false;
    if(d.stealth.kind === 'evade') return caughtEvade(id, d, g, def);
    return caughtFight(id, d, g, def);
  }, 900);
}
/* A fight floor: he calls it, and it is a fight. Beat him and he is gone for
   good; lose, and you are back in town with the floor as you left it. */
function caughtFight(id, d, g, def){
  const roster = (typeof R5_ROSTERS !== 'undefined') && R5_ROSTERS[def.roster];
  if(!roster) return renderWalkDeck(id);
  const who = guardSprite(def);
  const face = faceNpc(who, def.kind === 'capo' ? '🕴️' : '💂');
  /* Nothing left standing to fight with: he marches you out, and that is all. */
  if(!battleParty().some(m=> m.currentHp > 0)){
    return sceneSay([face], roster.label,
      `<b>"Look at the state of you."</b><br><br>He marches you all the way back through the tunnels and ` +
      `pushes you out of the sea cave onto the beach.`, 'Continue').then(()=>{
        stealthHold(false);
        walkTeardown();
        ui.stealthFresh = true;
        if(typeof r5ToHarbour === 'function') r5ToHarbour(); else go('explore');
      });
  }
  if(activePool().length === 0){
    stealthHold(false);
    walkTeardown();
    ui.prevScreen = id; toast('No words selected, please select to proceed.');
    return go('spelling');
  }
  sceneSay([face], roster.label, roster.shout || `<b>"Hey! You — in the light!"</b>`, 'Fight').then(()=>{
    stealthHold(false);
    walkTeardown();
    beginBattle({ isNpc:true, name:roster.label, npcId:who,
      waves: roster.waves.map((w, wi)=> w.map(s=> Object.assign({ ai: s.ai || (roster.ai || [])[wi] || 'power1', nerfed:false }, s))),
      catacomb:true, bgKey:'battle_catacombs', noFlee:true,
      onWin: ()=>{
        const list = stealthBeaten(id);
        if(!list.includes(g.id)) list.push(g.id);
        const s = ui.stealth && ui.stealth[id];
        if(s) s.guards = s.guards.filter(x=> x.id !== g.id);
        saveProfile();
        if(roster.onBeaten) return roster.onBeaten(id, d);
        storyModal(npcPortrait(who, def.kind === 'capo' ? '🕴️' : '💂', 130, 'transparent'), roster.label,
          roster.beaten || `He will not be patrolling this floor again.`,
          ()=> go(id), { subtitle:d.title });
      } });
  });
}
/* An evade floor: too many of them to fight. The run is over — a round of
   spelling slips you away, and you try the floor again from the stair. */
function caughtEvade(id, d, g, def){
  const face = faceNpc(guardSprite(def), '💂');
  const n = d.stealth.retryWords || 8;
  sceneSay([face], 'Soldato', `<b>"There! Get them!"</b><br><br>Too many of them to fight. Run — and write while you run.`,
    'Run').then(()=>{
    stealthHold(false);
    walkTeardown();
    const words = pickWords(n);
    /* back to whichever stair you came in by */
    const entry = ((ui.floorEntry || {})[id]) || 'top';
    const back = ()=>{
      ui.stealthFresh = true;
      const w = walkState(), a = (d.arrive && d.arrive[entry]) || d.spawn;
      w.at[id] = { x:a[0], y:a[1] }; w.face = 'd';
      if(w.ghostAt) w.ghostAt[id] = { x:a[0], y:a[1] };
    };
    if(!words.length){ back(); return go(id); }
    startQuiz({
      title:'Slip away', subtitle:`Write ${n} words to lose them in the dark.`,
      words, wordTarget:n, lockExit:true,
      onComplete:()=>{
        const r = r5();
        r.evadeTries = r.evadeTries || {};
        r.evadeTries[id] = (r.evadeTries[id] || 0) + 1;
        saveProfile();
        back();
        storyModal(monPortrait('whalelord', 150, { view:'front', bare:true }), whaleName(),
          `<b>"We lost them. They have gone back to their posts."</b><br><br>` +
          `<i>You are back at the ${entry === 'bottom' ? 'bottom' : 'top'} of ${escapeHtml(d.title)}. Try again.</i>`,
          ()=> go(id), { subtitle:d.title });
      },
      onExit:()=>{ back(); go(id); },
    });
  });
}

/* ---------- something in the dark ---------- */
/* A floor's wild table: [{ sp, w, plus }], and a level band `lv:[lo, hi]`.
   The pack is pitched at your strongest monster, clamped to the band. */
function catacombEncounter(d){
  const wild = d.stealth.wild;
  const table = wild.table;
  const total = table.reduce((n, t)=> n + (t.w || 1), 0);
  const pick = ()=>{ let r = Math.random() * total; for(const t of table){ r -= (t.w || 1); if(r <= 0) return t; } return table[0]; };
  const [lo, hi] = wild.lv || [76, 84];
  const best = Math.max(...battleParty().map(m=> m.level), lo);
  const base = Math.max(lo, Math.min(hi, best));
  const size = 1 + Math.floor(Math.random() * (wild.size || 3));
  const wave = [];
  for(let i = 0; i < size; i++){
    const t = pick();
    const lv = Math.max(lo, Math.min(hi + (t.plus || 0), base - 2 + Math.floor(Math.random() * 4) + (t.plus || 0)));
    wave.push({ species:t.sp, level:lv, wildRoll:true });
  }
  ui.currentZone = (REGION_ZONES[5] || []).find(z=> z.id === 'catacombs') || ui.currentZone;
  ui.returnDeck = d.key;                  // flee, catch or explore on: back to this spot
  walkState().busy = true;
  stealthHold(true);
  setTimeout(()=>{
    stealthHold(false);
    walkState().busy = false;
    walkTeardown();
    beginBattle({ waves:[wave], isNpc:false, allowCatch:true, name:'Something in the dark',
      catacomb:true, bgKey:'battle_catacombs', onWin: ()=> resumeVictory() });
  }, 350);
}

/* ---------- the painting, drawn from the grid ---------- */
/* The catacombs have no painting of their own yet, so each floor is drawn
   from its grid when it is first shown: flagstones, rough walls, black water,
   pillars, braziers, bones, the Family's crates, a sealed gate. Seeded by
   position, so it never shimmers. */
const CATA_PX = 32;
const _cataArt = {};
function paintCatacomb(d){
  if(_cataArt[d.key]) return _cataArt[d.key];
  const W = d.rows[0].length, H = d.rows.length, P = CATA_PX;
  const c = document.createElement('canvas');
  c.width = W * P; c.height = H * P;
  const g = c.getContext('2d');
  if(!g) return '';
  const rnd = (x, y, k)=>{ const s = Math.sin(x * 127.1 + y * 311.7 + (k || 0) * 74.7) * 43758.5453; return s - Math.floor(s); };
  const at = (x, y)=> (y < 0 || y >= H || x < 0 || x >= W) ? '#' : d.rows[y][x];
  const solidWall = (x, y)=> at(x, y) === '#';
  g.fillStyle = '#0b0a0d'; g.fillRect(0, 0, W * P, H * P);
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const ch = at(x, y), X = x * P, Y = y * P;
    if(ch === '#'){
      /* rough rock: darker the further from any floor */
      const edge = !solidWall(x, y + 1) || !solidWall(x, y - 1) || !solidWall(x + 1, y) || !solidWall(x - 1, y);
      g.fillStyle = edge ? '#2a2630' : '#141217';
      g.fillRect(X, Y, P, P);
      if(edge){
        g.fillStyle = 'rgba(160,150,170,0.10)';
        for(let k = 0; k < 4; k++) g.fillRect(X + rnd(x, y, k) * (P - 6), Y + rnd(x, y, k + 9) * (P - 6), 6, 4);
        if(!solidWall(x, y + 1)){ g.fillStyle = '#3a3542'; g.fillRect(X, Y + P - 5, P, 5); }
        /* now and then a burial niche in the wall face, with something pale in it */
        if(!solidWall(x, y + 1) && rnd(x, y, 11) < 0.22){
          g.fillStyle = '#0e0c11'; g.fillRect(X + 6, Y + 8, P - 12, P - 16);
          g.fillStyle = 'rgba(225,215,190,0.55)'; g.fillRect(X + 9, Y + P - 13, P - 18, 3);
        }
      }
      continue;
    }
    if(ch === '~'){
      g.fillStyle = '#0d1f26'; g.fillRect(X, Y, P, P);
      g.strokeStyle = 'rgba(120,180,200,0.18)'; g.lineWidth = 1.5;
      for(let k = 0; k < 2; k++){
        const yy = Y + 8 + k * 12 + rnd(x, y, k) * 4;
        g.beginPath(); g.moveTo(X + 4, yy); g.quadraticCurveTo(X + P / 2, yy - 3, X + P - 4, yy); g.stroke();
      }
      continue;
    }
    /* flagstones */
    const tone = 70 + Math.floor(rnd(x, y) * 14);
    g.fillStyle = `rgb(${tone},${tone - 3},${tone + 4})`;
    g.fillRect(X, Y, P, P);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1;
    g.strokeRect(X + 0.5, Y + 0.5, P - 1, P - 1);
    if(rnd(x, y, 3) < 0.35){ g.beginPath(); g.moveTo(X + rnd(x, y, 4) * P, Y); g.lineTo(X + rnd(x, y, 5) * P, Y + P); g.stroke(); }
    if(ch === '='){                                  // a plank bridge over the water
      g.fillStyle = '#0d1f26'; g.fillRect(X, Y, P, P);
      g.fillStyle = '#5a4128'; g.fillRect(X + 2, Y, P - 4, P);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      const across = at(x - 1, y) === '~' || at(x + 1, y) === '~';
      for(let k = 1; k < 4; k++){
        if(across) g.fillRect(X + 2, Y + k * P / 4, P - 4, 1.5);
        else g.fillRect(X + k * P / 4, Y, 1.5, P);
      }
    }
    if(ch === ','){                                  // old bones in the corner
      g.fillStyle = 'rgba(225,215,190,0.8)';
      g.fillRect(X + 6 + rnd(x, y, 6) * 8, Y + 10 + rnd(x, y, 7) * 10, 12, 3);
      g.beginPath(); g.arc(X + 20, Y + 20, 4, 0, Math.PI * 2); g.fill();
    }
    if(ch === 'o'){                                  // a pillar
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(X + P / 2 + 2, Y + P / 2 + 3, P * 0.42, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4d4655'; g.beginPath(); g.arc(X + P / 2, Y + P / 2, P * 0.40, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#6b6275'; g.beginPath(); g.arc(X + P / 2 - 3, Y + P / 2 - 3, P * 0.2, 0, Math.PI * 2); g.fill();
    }
    if(ch === 'c'){                                  // the Family's crates
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X + 4, Y + 6, P - 4, P - 4);
      g.fillStyle = '#6e5334'; g.fillRect(X + 2, Y + 2, P - 5, P - 5);
      g.strokeStyle = '#3e2d1a'; g.lineWidth = 2;
      g.strokeRect(X + 3, Y + 3, P - 7, P - 7);
      g.beginPath(); g.moveTo(X + 3, Y + 3); g.lineTo(X + P - 4, Y + P - 4); g.stroke();
    }
    if(ch === 'G'){                                  // a gate of iron bars, shut
      g.fillStyle = '#16141a'; g.fillRect(X, Y, P, P);
      g.fillStyle = '#5b5866';
      for(let k = 0; k < 5; k++) g.fillRect(X + 3 + k * 6.5, Y, 3, P);
      g.fillRect(X, Y + 5, P, 3); g.fillRect(X, Y + P - 8, P, 3);
    }
    if(ch === '*'){                                  // a brazier
      g.fillStyle = '#2b2320'; g.beginPath(); g.arc(X + P / 2, Y + P / 2 + 3, P * 0.34, 0, Math.PI * 2); g.fill();
      const gr = g.createRadialGradient(X + P / 2, Y + P / 2, 1, X + P / 2, Y + P / 2, P * 0.5);
      gr.addColorStop(0, 'rgba(255,220,120,0.95)'); gr.addColorStop(0.5, 'rgba(240,120,40,0.7)'); gr.addColorStop(1, 'rgba(240,120,40,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(X + P / 2, Y + P / 2, P * 0.5, 0, Math.PI * 2); g.fill();
    }
  }
  try { _cataArt[d.key] = c.toDataURL('image/png'); } catch(e){ _cataArt[d.key] = ''; }
  return _cataArt[d.key];
}

/* ---------- look ---------- */
function stealthCss(){
  if(document.getElementById('stealthCss')) return;
  const s = document.createElement('style');
  s.id = 'stealthCss';
  s.textContent = `
    .walk-fog{position:absolute;left:0;top:0;display:grid;z-index:9;pointer-events:none;}
    .walk-fog i{display:block;transition:background-color .35s;}
    .walk-fog i.fog-dark{background:#050407;}
    .walk-fog i.fog-seen{background:rgba(5,4,7,0.72);}
    .walk-fog i.fog-sense{background:rgba(40,20,70,0.34);}
    .walk-fog i.fog-lamp{background:rgba(255,196,90,0.22);box-shadow:inset 0 0 6px rgba(255,190,80,0.35);}
    .walk-fog i.fog-fire{background:rgba(255,150,60,0.10);}
    .walk-ent.guard img{filter:drop-shadow(0 0 5px rgba(255,200,90,0.8));}
    .walk-ent.guard.sensed > :not(.guard-mark){opacity:.45;filter:grayscale(1) drop-shadow(0 0 6px rgba(150,90,220,0.9));}
    .walk-ent.guard .guard-mark{position:absolute;left:50%;top:-58%;transform:translateX(-50%);
      font:900 calc(var(--wt) * 0.6)/1 'Baloo 2',sans-serif;color:#ffd84a;text-shadow:0 2px 0 #2a1c00,0 0 6px #000;}
  `;
  document.head.appendChild(s);
}
