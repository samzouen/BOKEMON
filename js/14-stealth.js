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

   What you can see (2.72: a smaller light):
     near        the tiles right round you (1 out), through walls — the
                 Whalelord floats about you unseen and shows you what is there
     dim         2 tiles out, dimly
     lit         a lantern's (or a brazier's) light that you have a line of
                 sight to — walls, pillars and crates cast shadows
     dark        everything else: 3 tiles out is black, whether you have been
                 there or not. Only the guards and their lanterns show in it.
   Guards are drawn where you can see them — and, faintly, wherever the
   Whalelord can feel them (a few tiles, through walls). You know what is
   close; you still have to find your way.

   A floor is a deck (13-walkmap.js) with a `stealth` block:
     kind      'fight'  caught → a battle; beat him and he is gone for the
                        rest of the day (a capo, for good)
               'evade'  caught → the run is over; a round of spelling, and
                        you start the floor again
               'town'   (2.91) the Old Town's streets: lit (`light:true`, no
                        fog), and the Family's own — out of disguise there,
                        the first man to look your way knows you, and you are
                        surrounded (r5TownCaught, 15-region5.js)
     feel      how far he feels a guard (tiles, through walls)
     guards    [{ id, kind, x, y, face, path, clock, pause, reach, spin, roster }]
               kind: 'soldato' walks `path` back and forth, pausing at each
                     END before he turns (that pause is your window)
                     'lookout' stands and turns a quarter every `pause`
                     beats, through all four ways — always the same way
                     round: `spin` 'cw' (the default) or 'ccw'
                     'talker' stands facing his friend: scenery, but his
                     lantern is still lit
                     'capo'   stands still with a wide lantern
               clock: his own beat in ms — every guard keeps his own, so
                      they drift out of step and a corridor never repeats
     wild      what finds you in the dark: the ghosts on the first tier, the
               physical monsters on the second (fight floors, and since 2.90
               an evade floor that has one)
   Guards stand where they stand: you cannot walk through one.
   In disguise (2.91, r5().disguised) nobody on watch looks twice at you: the
   men walk their rounds, a man who would step into you waits instead, and
   whoever comes alongside you can be talked to (15-region5.js).
   ============================================================ */

const STEALTH_OPAQUE = '#ocGbrk';      // what light cannot pass (water, braziers, rails and tables do not stop it)
const STEALTH_VIEW = 9;                // how far off you can make out a light
const DIRS = { u:[0,-1], d:[0,1], l:[-1,0], r:[1,0] };
const TURN = { u:'r', r:'d', d:'l', l:'u' };           // a quarter clockwise
const TURN_CCW = { u:'l', l:'d', d:'r', r:'u' };       // and the other way round
/* The light you see by (2.72): right round you, and dimly one further. */
const STEALTH_NEAR = 1, STEALTH_DIM = 2;

/* Per floor, for this visit: where each guard is, which way he faces, how
   long he has stood, whether he has half-seen you. Kept in ui, so a fight or
   a conversation resumes the floor exactly as it was; entering the floor
   afresh (by a stair or a door) starts it over. */
function stealthState(id, d){
  ui.stealth = ui.stealth || {};
  if(!ui.stealth[id]) resetStealth(id, d);
  return ui.stealth[id];
}
function resetStealth(id, d){
  ui.stealth = ui.stealth || {};
  const beaten = stealthBeaten(id);
  ui.stealth[id] = {
    guards: stealthOnWatch(d).filter(g=> !beaten.includes(g.id)).map(g=> guardStart(g)),
    timers: [], caught: false, calm: 6,
  };
  return ui.stealth[id];
}
/* The men a floor has on watch: all of them, bar any whose `when` says he is
   not there at this point in the story (2.91: nobody stands watch in the
   Armoury while the ghost phoenix waits in it). */
function stealthOnWatch(d){ return (d.stealth.guards || []).filter(g=> !g.when || g.when()); }
/* Where a guard starts the floor: on his own tile, or the first of his path. */
function guardStart(def){
  const p0 = (def.path && def.path[0]) || [def.x, def.y];
  return { id:def.id, x:def.x != null ? def.x : p0[0], y:def.y != null ? def.y : p0[1],
           face:def.face || 'd', leg:def.leg || 1, dir:1, wait:0, sus:0, spotted:false };
}
/* Guards beaten on a fight floor stay beaten for the rest of the day. Each
   new calendar day the Family regroups: every soldato and lookout is back at
   his post (2.72). A capo stays beaten — capos are the story. */
function r5Day(){ const t = new Date(); return t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate(); }
function stealthBeaten(id){
  const r = r5();
  r.beaten = r.beaten || {};
  const today = r5Day();
  if(r.beatenDay !== today){
    r.beatenDay = today;
    Object.keys(r.beaten).forEach(f=>{
      const d = (typeof DECKS !== 'undefined') && DECKS[f];
      const capos = (d && d.stealth ? d.stealth.guards || [] : []).filter(g=> g.kind === 'capo').map(g=> g.id);
      const kept = (r.beaten[f] || []).filter(g=> capos.includes(g));
      if(kept.length < (r.beaten[f] || []).length) r.regrouped = true;   // the Whalelord mentions it
      r.beaten[f] = kept;
    });
  }
  return r.beaten[id] = r.beaten[id] || [];
}
function guardDef(d, id){ return (d.stealth.guards || []).find(g=> g.id === id); }
/* The night the dead rose (2.90): while r5().rush holds, every man on the
   Old Town's tier is fighting ghosts — rooted to the spot, his lantern
   swinging every way but yours. Nobody there can catch you, and nothing wild
   comes out of the dark while the dead are up. It ends when you come up into
   the church (15-region5.js). */
function stealthRush(d){ return !!(d && d.tier === 2 && typeof r5 === 'function' && r5().rush); }
/* In the Family's own colours (2.91): a junior soldato, and nobody on watch
   looks twice at one of those — in the catacombs or in the Old Town. They walk
   their rounds; you walk yours. Wild monsters do not care what you wear. */
function stealthDisguised(d){ return !!(d && d.region === 5 && typeof r5 === 'function' && r5().disguised); }
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
  if(stealthRush(d)) return out;           // the night the dead rose: no beam, just the glow
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
  /* A lookout turns through all four ways, always the same way round, a
     quarter every `pause` beats. (Some used to swing between two.) */
  if(def.kind === 'lookout'){
    g.wait = (g.wait || 0) + 1;
    if(g.wait >= (def.pause || 4)){
      g.wait = 0;
      g.face = (def.spin === 'ccw' ? TURN_CCW : TURN)[g.face] || 'd';
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
  /* He does not walk through you: stepping into you is seeing you — unless
     you are wearing his colours (2.91), when he just waits for you to move. */
  const p = (typeof walkState === 'function') ? walkState().at[d.key] : null;
  if(p && p.x === nx && p.y === ny){ if(!stealthDisguised(d)) g.sus = 1; return; }
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
  const lit = new Map();                                 // tile -> 'guard' | 'fire'
  brazierLight(d).forEach(k=> lit.set(k, 'fire'));
  const lights = st.guards.map(g=> guardLight(d, g, guardDef(d, g.id)));
  lights.forEach(s=> s.forEach(k=> lit.set(k, 'guard')));
  const vis = new Map();                                 // tile -> 'lit' | 'sensed' | 'dim'
  for(let dy = -STEALTH_DIM; dy <= STEALTH_DIM; dy++) for(let dx = -STEALTH_DIM; dx <= STEALTH_DIM; dx++){
    const x = p.x + dx, y = p.y + dy;
    if(y < 0 || y >= d.rows.length || x < 0 || x >= d.rows[0].length) continue;
    const k = x + ',' + y, ring = Math.max(Math.abs(dx), Math.abs(dy));
    vis.set(k, lit.has(k) ? 'lit' : ring <= STEALTH_NEAR ? 'sensed' : 'dim');
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
  if(d.stealth.light) return paintLitGuards(id, d);
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
  /* Where you have been is still noted (r5().seen) but no longer drawn: past
     2 tiles it is black, bar the lanterns (2.72). */
  const cells = fog.children;
  for(let i = 0; i < cells.length; i++){
    const x = i % W, y = Math.floor(i / W), k = x + ',' + y;
    const v = vis.get(k);
    const cls = v === 'lit' ? (lit.get(k) === 'guard' ? 'fog-lamp' : 'fog-fire')
              : v === 'sensed' ? 'fog-sense'
              : v === 'dim' ? 'fog-seen' : 'fog-dark';
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

/* A lit place (2.91: the Old Town's streets, `light:true`): no dark to see
   through, so every man on watch is simply there, where he stands. */
function paintLitGuards(id, d){
  const st = ui.stealth && ui.stealth[id];
  if(!st) return;
  st.guards.forEach(g=>{
    const el = document.getElementById('guard-' + g.id);
    if(!el) return;
    el.style.transform = `translate3d(${g.x * WALK_T}px,${g.y * WALK_T}px,0)`;
    el.style.zIndex = 10 + g.y;
    el.style.display = '';
    el.dataset.face = g.face;
    const mk = el.querySelector('.guard-mark');
    if(mk) mk.textContent = g.spotted ? '!' : '';
  });
}

/* ---------- the floor comes alive ---------- */
function startStealth(world, d){
  const id = d.key;
  const w = walkState();
  stealthCss();
  stealthHold(false);
  /* Up or down a stair, or back from the harbour: the floor starts over. Back from a
     fight or a conversation: exactly where it was. */
  if(ui.stealthFresh){ resetStealth(id, d); ui.stealthFresh = false; }
  const st = stealthState(id, d);
  st.caught = false;
  st.guards.forEach(g=>{ g.sus = 0; g.spotted = false; });
  stopStealth();
  const W = d.rows[0].length, H = d.rows.length;
  /* the dark — except in a lit place (2.91: the Old Town) */
  if(!d.stealth.light){
    const fog = document.createElement('div');
    fog.className = 'walk-fog'; fog.id = 'walkFog';
    fog.style.cssText = `width:${W * WALK_T}px;height:${H * WALK_T}px;` +
      `grid-template-columns:repeat(${W},${WALK_T}px);grid-auto-rows:${WALK_T}px;`;
    for(let i = 0; i < W * H; i++) fog.appendChild(document.createElement('i'));
    world.appendChild(fog);
  }
  st.guards.forEach(g=>{
    const def = guardDef(d, g.id);
    const e = document.createElement('div');
    e.className = 'walk-ent guard guard-' + def.kind;
    e.id = 'guard-' + g.id;
    const px = Math.round(WALK_T * 0.8);
    const icon = def.kind === 'capo' ? '🕴️' : '💂';
    e.innerHTML = `<img src="assets/npc/${guardSprite(def)}.png" alt="" ` +
      `onerror="walkArtMissing(this,'${icon}',${px},0)"><b class="guard-mark"></b>`;
    /* the night the dead rose: a ghost round every one of them */
    if(stealthRush(d)){
      e.classList.add('haunted');
      const orbit = document.createElement('span');
      orbit.className = 'guard-haunt';
      orbit.style.animationDelay = (-(def.clock || 600) % 1400) + 'ms';
      orbit.innerHTML = `<span class="gh-ghost">${monPortrait('ghost', Math.round(WALK_T * 0.55), { view:'front', bare:true })}</span>`;
      e.appendChild(orbit);
    }
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
  if(!st || st.caught || ui.screen !== id || !document.getElementById(d.stealth.light ? 'walkWorld' : 'walkFog')) return;
  if(stealthPaused()) return;
  if(stealthRush(d)){ g.sus = 0; return; }          // fighting ghosts: he has no eyes for you
  /* You are one of them (2.91): he walks his round and never looks at you
     twice. Whoever comes alongside, you can talk to (15-region5.js). */
  if(stealthDisguised(d)){
    g.sus = 0; g.spotted = false;
    guardAdvance(d, g, def);
    paintStealth(id, d);
    if(typeof r5GuardsMoved === 'function') r5GuardsMoved(d);
    return;
  }
  /* The Old Town's streets (2.91) are the Family's own: out of disguise in
     them, the first man who looks your way knows you. */
  if(d.stealth.kind === 'town'){ g.spotted = true; paintStealth(id, d); return stealthCaught(id, d, g, def); }
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
  if(typeof r5NoteStep === 'function') r5NoteStep(d, p);      // where you left off (2.90)
  paintStealth(id, d);
  /* Something in the dark, away from any lantern: on a fight floor, and on
     an evade floor that has a wild table (2.90: the Garrison's). */
  const wild = d.stealth.wild;
  if(st.calm > 0){ st.calm--; return false; }
  if(wild && !stealthRush(d) && !st.guards.some(g=> g.sus)){
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
    if(d.stealth.kind === 'town' && typeof r5TownCaught === 'function') return r5TownCaught(id, d, g, def);
    if(d.stealth.kind === 'evade') return caughtEvade(id, d, g, def);
    return caughtFight(id, d, g, def);
  }, 900);
}
/* A fight floor: he calls it, and it is a fight. Beat him and he is gone for
   the rest of the day; lose, and you are back in town with the floor as you
   left it. `shout`, if given, is what he says instead of his own (2.91: when
   you show him your face). */
function caughtFight(id, d, g, def, shout){
  const roster = (typeof R5_ROSTERS !== 'undefined') && R5_ROSTERS[def.roster];
  if(!roster){ stealthHold(false); return renderWalkDeck(id); }
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
        if(typeof r5BackToEntry === 'function') r5BackToEntry(id);   // next time: the stair you came in by
        if(typeof r5ToHarbour === 'function') r5ToHarbour(); else go('explore');
      });
  }
  if(activePool().length === 0){
    stealthHold(false);
    walkTeardown();
    ui.prevScreen = id; toast('No words selected, please select to proceed.');
    return go('spelling');
  }
  sceneSay([face], roster.label, shout || roster.shout || `<b>"Hey! You — in the light!"</b>`, 'Fight').then(()=>{
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
          roster.beaten || `He will not be back on watch today.`,
          ()=> go(id), { subtitle:d.title });
      } });
  });
}
/* An evade floor: too many of them to fight. Caught, you cannot move: the rest
   of the floor comes running — soldatos and lookouts, one after another, each
   to a square of his own round you — and everything goes black. Then ten
   phrases, like Recover: one written wrong is practised until it is right
   three times in a row, and counts once. Back where you came in, every guard
   at his post. (Before 2.72: "Run", and eight words.) */
async function caughtEvade(id, d, g, def){
  const w0 = walkState();
  w0.busy = true;
  const face = faceNpc(guardSprite(def), '💂');
  await captureStream(id, d);
  await sceneSay([face], 'Soldato', `<b>"Got you. There is nowhere to run."</b>`, 'Continue');
  await sceneCurtain(true, 700);
  sceneClear();
  stealthHold(false);
  walkTeardown();
  const n = d.stealth.retryPhrases || 10;
  /* back to whichever way you came in by */
  const entry = ((ui.floorEntry || {})[id]) || d.entry || 'top';
  const back = ()=>{
    ui.stealthFresh = true;
    ui.r5Recaught = id;                          // no second warning on the way back in
    const w = walkState(), a = (d.arrive && d.arrive[entry]) || d.spawn;
    w.at[id] = { x:a[0], y:a[1] }; w.face = 'd'; w.busy = false;
    if(w.ghostAt) w.ghostAt[id] = { x:a[0], y:a[1] };
    if(typeof r5NoteSpot === 'function') r5NoteSpot(id, a[0], a[1], entry);
  };
  /* (a floor may say its own ways in: the Garrison's are a gate and a stair) */
  const whereBack = (d.arriveSay || {})[entry] ? escapeHtml(d.arriveSay[entry])
                  : entry === 'bottom' ? `the bottom of ${escapeHtml(d.title)}`
                  : entry === 'top' ? `the top of ${escapeHtml(d.title)}`
                  : `the door you came in by, in ${escapeHtml(d.title)}`;
  /* (2.91) caught because you showed one of them your face, in disguise */
  const revealed = ui.r5Revealed === id;
  ui.r5Revealed = null;
  if(!activePool().length){ back(); sceneCurtain(false, 400); return go(id); }
  captureTest(n, ()=>{
    const r = r5();
    r.evadeTries = r.evadeTries || {};
    r.evadeTries[id] = (r.evadeTries[id] || 0) + 1;
    back();
    saveProfile();
    storyModal(monPortrait('whalelord', 150, { view:'front', bare:true }), whaleName(),
      (revealed ? `<b>"Too many of them on this floor. Show your face to one, and they all come."</b><br><br>` : '') +
      `<b>"We slipped away from them in the dark. They have gone back to their posts."</b><br><br>` +
      `<i>You are back at ${whereBack}. Try again.</i>`,
      ()=> go(id), { subtitle:d.title });
  });
  sceneCurtain(false, 600);                      // the black lifts off the writing
}
/* The rest of the floor comes for you. Actors, not the floor's guards (they
   stand where they are): each walks in out of the dark, along the floor, to a
   square of his own within three steps of you, one after another. `sprites`
   (2.91), if given, says who — in turn (the Old Town sends its capos too). */
function captureStream(id, d, sprites){
  const p = walkState().at[id];
  const world = document.getElementById('walkWorld');
  if(!p || !world) return Promise.resolve();
  const H = d.rows.length, W = d.rows[0].length, key = (x, y)=> x + ',' + y;
  const open = (x, y)=> x >= 0 && y >= 0 && x < W && y < H && !wSolid(d, x, y);
  const bfs = (sx, sy, limit)=>{
    const dist = new Map([[key(sx, sy), 0]]), prev = new Map(), q = [[sx, sy]];
    while(q.length){
      const [x, y] = q.shift(), k0 = dist.get(key(x, y));
      if(k0 >= limit) continue;
      for(const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if(dist.has(k) || !open(nx, ny)) continue;
        dist.set(k, k0 + 1); prev.set(k, key(x, y)); q.push([nx, ny]);
      }
    }
    return { dist, prev };
  };
  const round = bfs(p.x, p.y, 12);
  const st = ui.stealth && ui.stealth[id];
  const taken = new Set((st ? st.guards : []).map(g=> key(g.x, g.y)));
  /* …and nobody stands where somebody already is (a capo at his table) */
  deckThings(d).filter(t=> !t.walk).forEach(t=>{
    for(let dx = 0; dx < (t.w || 1); dx++) for(let dy = 0; dy < (t.h || 1); dy++) taken.add(key(t.x + dx, t.y + dy));
  });
  /* nor where the Whalelord floats: they cannot see him, but he is there */
  const gh = (walkState().ghostAt || {})[id];
  if(gh && typeof cuainAboard === 'function' && cuainAboard()) taken.add(key(gh.x, gh.y));
  /* the squares round you, nearest first, and spread round you */
  const spots = [...round.dist.entries()].filter(([k, n])=> n >= 1 && n <= 3 && !taken.has(k))
    .map(([k, n])=>{ const [x, y] = k.split(',').map(Number); return { x, y, n, a:Math.atan2(y - p.y, x - p.x) }; })
    .sort((a, b)=> a.n - b.n || a.a - b.a).slice(0, 10);
  const T = WALK_T;
  const walks = spots.map((s, i)=>{
    /* where he comes from: several steps further out than his square */
    const from = bfs(s.x, s.y, 7);
    let best = null;
    from.dist.forEach((n, k)=>{
      const far = round.dist.get(k) || 0;
      if(n >= 4 && far > s.n && (!best || n + far > best.n + best.far)) best = { k, n, far };
    });
    const path = [];
    if(best){ let k = best.k; while(k){ path.push(k.split(',').map(Number)); k = from.prev.get(k); } }
    else path.push([s.x, s.y]);
    return { id:'cap' + i, path, sprite:sprites ? sprites[i % sprites.length] : (i % 2 ? 'soldato2' : 'soldato1'), delay:i * 170 };
  });
  const stepMs = 110 * SCENE_SPEED;
  return Promise.all(walks.map(wk=> new Promise(done=>{
    setTimeout(()=>{
      const [x0, y0] = wk.path[0];
      const el = sceneActor(wk.id, { x:x0, y:y0, src:`assets/npc/${wk.sprite}.png`, icon:/^capo/.test(wk.sprite) ? '🕴️' : '💂' });
      if(!el) return done();
      el.classList.add('capture-guard');
      let i = 0;
      const next = ()=>{
        i++;
        if(i >= wk.path.length) return done();
        const [x, y] = wk.path[i];
        el.style.transition = `left ${stepMs}ms linear, top ${stepMs}ms linear`;
        el._o.x = x; el._o.y = y;
        el.style.left = (x * T) + 'px'; el.style.top = (y * T) + 'px';
        el.style.zIndex = 10 + y;
        setTimeout(next, stepMs);
      };
      setTimeout(next, stepMs);
    }, wk.delay * SCENE_SPEED);
  }))).then(()=> sceneWait(600));
}
/* Ten phrases to slip away, one at a time: recently-missed ones first, then
   the rest of the list. One written wrong is practised the way Recover does
   it — right three times in a row, a miss starting the three again — and
   then counts as one phrase. */
function captureTest(n, done){
  const pool = activePool().map(w=> w.text);
  const inPool = new Set(pool);
  const recent = (state.recentWrong || []).filter(w=> inPool.has(w));
  const queue = [];
  [...recent, ...shuffle(pool)].forEach(w=>{ if(queue.length < n && !queue.includes(w)) queue.push(w); });
  while(queue.length < n && pool.length) queue.push(pool[Math.floor(Math.random() * pool.length)]);   // a short list repeats
  let k = 0, streak = -1;                        // streak ≥ 0: practising queue[k]
  const step = ()=>{
    if(k >= queue.length){ ui.captureTest = null; return done(); }
    const left = 3 - streak;
    ui.captureTest = { k, of:queue.length, word:queue[k], practising:streak >= 0, streak:Math.max(0, streak) };
    startQuiz({
      title:'Caught',
      subtitle: streak >= 0
        ? `Practice: get this right ${left} more time${left === 1 ? '' : 's'} in a row. It counts as one phrase. (${k} of ${queue.length} done)`
        : `Write ${queue.length} phrases to slip away in the dark. (${k} of ${queue.length} done)`,
      words:[queue[k]], lockExit:true,
      onComplete:(res)=>{
        const passed = !!(res && res[0] && res[0].passed);
        if(streak >= 0){
          if(!passed) streak = 0;
          else if(++streak >= 3){ k++; streak = -1; }
        }
        else if(passed) k++;
        else streak = 0;
        step();
      },
      onExit:()=>{},
    });
  };
  step();
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
/* A floor's own painting (2.88): a deck may name `art` — assets/zones/<art>.png,
   painted over the floor's reference at 32 px a tile (any size of the same
   shape will do). It is looked for once; until it has loaded, or if it is
   not there, the floor is drawn from its grid as before. */
const _cataPainting = {};
function cataPainting(d){
  if(!d || !d.art || typeof Image === 'undefined') return null;
  const st = _cataPainting[d.art];
  if(st === 'ok') return `assets/zones/${d.art}.png`;
  if(st === undefined){
    _cataPainting[d.art] = 'looking';
    const im = new Image();
    im.onload = ()=>{ _cataPainting[d.art] = 'ok'; };
    im.onerror = ()=>{ _cataPainting[d.art] = 'none'; };
    im.src = `assets/zones/${d.art}.png`;
  }
  return null;
}
function paintCatacomb(d){
  const own = cataPainting(d);
  if(own) return own;
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
    if(ch === 's'){                                  // the pit's sand (2.88)
      g.fillStyle = `rgb(${176 + Math.floor(rnd(x, y) * 14)},${150 + Math.floor(rnd(x, y, 1) * 12)},${104 + Math.floor(rnd(x, y, 2) * 10)})`;
      g.fillRect(X, Y, P, P);
      g.fillStyle = 'rgba(90,70,40,0.25)';
      for(let k = 0; k < 5; k++) g.fillRect(X + rnd(x, y, k + 3) * (P - 3), Y + rnd(x, y, k + 13) * (P - 3), 2, 2);
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
    /* ---- the Old Town's tier (2.88) ---- */
    if(ch === 'b'){                                  // a barrel, seen from above
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(X + P / 2 + 2, Y + P / 2 + 3, P * 0.44, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#6a4326'; g.beginPath(); g.arc(X + P / 2, Y + P / 2, P * 0.44, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#2e1d10'; g.lineWidth = 2;
      g.beginPath(); g.arc(X + P / 2, Y + P / 2, P * 0.44, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(X + P / 2, Y + P / 2, P * 0.30, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#8a5a34'; g.beginPath(); g.arc(X + P / 2, Y + P / 2, P * 0.18, 0, Math.PI * 2); g.fill();
    }
    if(ch === 'r'){                                  // a block of cut stone
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X + 4, Y + 6, P - 5, P - 5);
      g.fillStyle = '#a79f92'; g.fillRect(X + 2, Y + 2, P - 5, P - 5);
      g.fillStyle = '#c4bcae'; g.fillRect(X + 2, Y + 2, P - 5, 5);
      g.strokeStyle = 'rgba(60,55,48,0.6)'; g.lineWidth = 1.5; g.strokeRect(X + 2.5, Y + 2.5, P - 6, P - 6);
      if(rnd(x, y, 8) < 0.5){ g.beginPath(); g.moveTo(X + 6 + rnd(x, y, 9) * 10, Y + 8); g.lineTo(X + 12 + rnd(x, y, 10) * 10, Y + P - 6); g.stroke(); }
    }
    if(ch === 'k'){                                  // a bunk: its pillow at the wall end
      const headLeft = at(x - 1, y) === '#', headRight = at(x + 1, y) === '#';
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X + 1, Y + 6, P - 1, P - 6);
      g.fillStyle = '#5a4430'; g.fillRect(X, Y + 3, P, P - 6);
      g.fillStyle = '#7d6a55'; g.fillRect(X + (headLeft ? 3 : 0), Y + 6, P - (headLeft || headRight ? 3 : 0), P - 12);
      if(headLeft || headRight){
        g.fillStyle = '#d8cfbd'; g.fillRect(headLeft ? X + 4 : X + P - 13, Y + 8, 9, P - 16);
      }
    }
    if(ch === 't'){                                  // a table, or a bench
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X, Y + 8, P, P - 10);
      g.fillStyle = '#7b5634'; g.fillRect(X, Y + 5, P, P - 12);
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for(let k = 1; k < 3; k++) g.fillRect(X, Y + 5 + k * (P - 12) / 3, P, 1);
      if(at(x - 1, y) !== 't'){ g.fillStyle = '#4a321d'; g.fillRect(X, Y + 5, 2, P - 12); }
      if(at(x + 1, y) !== 't'){ g.fillStyle = '#4a321d'; g.fillRect(X + P - 2, Y + 5, 2, P - 12); }
    }
    if(ch === 'x'){                                  // the ring's rail: posts, and a bar to the next
      const n = (dx, dy)=> at(x + dx, y + dy) === 'x';
      g.fillStyle = '#5b3b20';
      if(n(-1, 0)) g.fillRect(X, Y + P / 2 - 2, P / 2, 4);
      if(n(1, 0))  g.fillRect(X + P / 2, Y + P / 2 - 2, P / 2, 4);
      if(n(0, -1)) g.fillRect(X + P / 2 - 2, Y, 4, P / 2);
      if(n(0, 1))  g.fillRect(X + P / 2 - 2, Y + P / 2, 4, P / 2);
      g.fillStyle = '#3a2513'; g.fillRect(X + P / 2 - 4, Y + P / 2 - 4, 8, 8);
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
    .walk-ent.guard img, .scene-actor.capture-guard img{filter:drop-shadow(0 0 5px rgba(255,200,90,0.8));}
    .walk-ent.guard.sensed > :not(.guard-mark){opacity:.45;filter:grayscale(1) drop-shadow(0 0 6px rgba(150,90,220,0.9));}
    .walk-ent.guard .guard-mark{position:absolute;left:50%;top:-58%;transform:translateX(-50%);
      font:900 calc(var(--wt) * 0.6)/1 'Baloo 2',sans-serif;color:#ffd84a;text-shadow:0 2px 0 #2a1c00,0 0 6px #000;}
    /* the night the dead rose (2.90): every man fighting a ghost */
    @keyframes guardShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6%)}75%{transform:translateX(6%)}}
    @keyframes guardHaunt{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .walk-ent.guard.haunted > img{animation:guardShake .45s ease-in-out infinite;}
    .walk-ent.guard.haunted .guard-haunt{position:absolute;left:50%;top:45%;width:0;height:0;
      animation:guardHaunt 1.4s linear infinite;pointer-events:none;}
    .walk-ent.guard.haunted .gh-ghost{position:absolute;left:calc(var(--wt) * 0.30);top:calc(var(--wt) * -0.62);
      opacity:.85;filter:drop-shadow(0 0 6px rgba(170,120,255,.95));}
    .walk-ent.guard.haunted .gh-ghost img{display:block;filter:none;}
  `;
  document.head.appendChild(s);
}
