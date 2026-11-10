/* ============================================================
   30-fx-moves.js — THE MOVES WITH ART OF THEIR OWN (4.15)
   The designer: "especially legendary monster signature moves and purchased high to ultra stone moves need special
   art to show they are a tier apart … legendaries get special art to make them feel more special, and perhaps a
   longer screen time to make the animation feel more impactful. consider using a little screen shake for legendary
   power2 and ultimate/max moves too … Elite and starter ultimate moves also get some special attention".
   Each entry of FX_MOVES (by the move's name): `cast(ctx)` at once, `impact(ctx, at, k, side)` on each blow that lands,
   `hold` (ms) to keep the blow back while it plays, `side:'self'` for a cast on its own side. Drawn with the tools and
   the type kits of 29-fx.js.
   ============================================================ */


/* OVERHEAT (Fire's Very High: your whole team runs hot). A ring of heat runs out across the ground, flames burst up
   round each of yours on the field (those behind it, behind it), embers rise, and it flashes hot three times. */
FX_MOVES['Overheat'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_FIRE);
    const ids = fxMine(ctx);
    ids.forEach((id, n)=>{
      const a = fxAnchor(id);
      if(!a) return;
      const rnd = fxRand(ctx.seed + n * 101), base = { x:a.x, y:a.foot };
      fxAdd({ layer:'back', dur:760, step(L, t){
        const u = fxEaseOut(t / 760), cv = u < 0.66 ? 1 : 1 - (u - 0.66) * 3, rr = 8 + u * a.w * 0.62;
        fxRing(L, base.x, base.y, rr + 1, 1, FX_FIRE[5], cv, 0.3);
        fxRing(L, base.x, base.y, rr, 2, FX_FIRE[u < 0.35 ? 1 : u < 0.7 ? 2 : 3], cv, 0.3);
      } });
      const N = 12;
      for(let i = 0; i < N; i++){
        const ang = (i / N) * Math.PI * 2 + rnd() * 0.4, x0 = base.x + Math.cos(ang) * a.w * 0.38, y0 = base.y + Math.sin(ang) * a.w * 0.1;
        const hgt = a.h * (0.26 + rnd() * 0.3) * (Math.sin(ang) < 0 ? 1.25 : 1), wd = 4 + rnd() * 3, delay = 70 + rnd() * 220, life = 640 + rnd() * 260;
        fxAdd({ layer:Math.sin(ang) < 0 ? 'back' : 'front', dur:delay + life, step(L, t){
          if(t < delay) return;
          const u = (t - delay) / life, rise = u < 0.3 ? fxEaseOut(u / 0.3) : 1 - fxEaseIn((u - 0.3) / 0.7) * 0.85;
          fxTongue(L, x0, y0, hgt * rise, wd * (0.6 + 0.4 * rise), t, i, FX_FIRE, u > 0.78 ? 1 - (u - 0.78) * 4.5 : 1);
        } });
      }
      const rising = [];
      for(let i = 0; i < 30; i++) rising.push({ x:base.x + (rnd() - 0.5) * a.w * 0.85, y:base.y - rnd() * a.h * 0.35, vx:(rnd() - 0.5) * 12, vy:-(30 + rnd() * 50),
        life:420 + rnd() * 380, size:1 + (rnd() < 0.25 ? 1 : 0), ramp:[FX_FIRE[1], FX_FIRE[2], FX_FIRE[3], FX_FIRE[4]], drag:0.5, delay:100 + rnd() * 700 });
      fxSpray('front', rising, 1300);
      fxAdd({ layer:'front', dur:820, step(L, t){
        if(t < 280) return;
        const flash = Math.floor((t - 280) / 80) % 2 === 0 && t < 760;
        fxGlow(L, id, FX_FIRE[2], flash ? 1 : 0, flash ? FX_FIRE[4] : FX_FIRE[3]);
      } });
    });
  },
};

/* FUSION FLARE (Fire's Ultra: 5 to 9 strikes on them at random). A white-hot star gathers over your monster, drawing
   fire in; it hangs there while the strikes fall, each a lance of flame from it to the one struck and a blast there;
   then it collapses in a shower of sparks. */
FX_MOVES['Fusion Flare'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_FIRE);
    const a = ctx.from, star = ctx.star = { x:a.x + 4, y:Math.max(18, a.y - a.h * 0.78), r:0, last:performance.now() };
    const rnd = fxRand(ctx.seed), motes = [];
    for(let i = 0; i < 36; i++){ const ang = rnd() * Math.PI * 2; motes.push({ ang, d:28 + rnd() * 34, delay:rnd() * 220, c:FX_FIRE[1 + Math.floor(rnd() * 3)] }); }
    fxAdd({ layer:'back', dur:6400, step(L, t){
      motes.forEach(m=>{
        if(t < m.delay || t > m.delay + 260) return;
        const d = m.d * (1 - fxEaseIn((t - m.delay) / 260));
        fxLine(L, star.x + Math.cos(m.ang) * d, star.y + Math.sin(m.ang) * d, star.x + Math.cos(m.ang) * (d + 4), star.y + Math.sin(m.ang) * (d + 4), m.c, 1);
      });
      if(!star.endAt && t > 900 && performance.now() - star.last > 450) star.endAt = t;   // no strike for a while: spent
      if(star.endAt && t - star.endAt > 200){
        if(!star.burst){ star.burst = true; fxSpray('back', fxBurstParts(star.x, star.y, 26, { seed:ctx.seed + 9, vmin:50, vmax:150, ramp:[FX_FIRE[0], FX_FIRE[1], FX_FIRE[2], FX_FIRE[3]], grav:40, drag:2, lmin:220, lmax:520 }), 700); }
        return;
      }
      const shrink = star.endAt ? Math.max(0, 1 - (t - star.endAt) / 200) : 1;
      const r = star.r = (3 + 7 * Math.min(1, t / 300)) * shrink * (1 + 0.07 * Math.sin(t * 0.05));
      for(let s = 0; s < 12; s++){                                // its corona, turning
        const ang = s * Math.PI / 6 + t * 0.004, len = r + 5 + (s % 2 ? 0 : 4) + 2 * Math.sin(t * 0.02 + s);
        fxLine(L, star.x + Math.cos(ang) * r * 0.7, star.y + Math.sin(ang) * r * 0.7, star.x + Math.cos(ang) * len, star.y + Math.sin(ang) * len, s % 2 ? FX_FIRE[2] : FX_FIRE[1], 1);
      }
      fxFlameBall(L, star.x, star.y, r + 2, FX_FIRE, t, ctx.seed, { wob:0.16, cols:[FX_FIRE[3], FX_FIRE[2], FX_FIRE[1], FX_FIRE[0], FX_FIRE[0]], outline:FX_FIRE[5], core:Math.max(1, r * 0.5) });
    } });
  },
  impact(ctx, at, k, side){
    const star = ctx.star || { x:ctx.from.x, y:ctx.from.y - 30 };
    star.last = performance.now();
    const layer = fxLayerFor(side);
    fxAdd({ layer:'back', dur:160, step(L, t){                    // the lance: dark edge, red, yellow, a white heart
      const w = t < 70 ? 1 : 0;
      fxLine(L, star.x, star.y, at.x, at.y, FX_FIRE[5], 7 - w * 0 - (t > 110 ? 2 : 0));
      fxLine(L, star.x, star.y, at.x, at.y, FX_FIRE[3], 5 - (t > 110 ? 2 : 0));
      fxLine(L, star.x, star.y, at.x, at.y, FX_FIRE[1], 3 - (t > 110 ? 2 : 0));
      if(t < 110) fxLine(L, star.x, star.y, at.x, at.y, FX_FIRE[0], 1);
    } });
    fxAdd({ layer, dur:460, step(L, t){                          // the blast: a flash, a cross of light, a ring of heat
      if(t < 70){
        fxDisc(L, at.x, at.y, 9 + t / 7, FX_FIRE[0]);
        const len = 14 + t / 2;
        fxLine(L, at.x - len, at.y, at.x + len, at.y, FX_FIRE[0], 1);
        fxLine(L, at.x, at.y - len, at.x, at.y + len, FX_FIRE[0], 1);
      }
      const u = t / 460, rr = 8 + fxEaseOut(u) * 26;
      fxRing(L, at.x, at.y, rr + 1, 1, FX_FIRE[5], 1 - u, 0.8);
      fxRing(L, at.x, at.y, rr, 2, FX_FIRE[u < 0.5 ? 1 : 2], 1 - u, 0.8);
    } });
    fxFireBurst(at, layer, { seed:ctx.seed + k * 13, big:1.45 });
    fxSpray(layer, fxBurstParts(at.x, at.y, 9, { seed:ctx.seed + k * 7, vmin:100, vmax:190, ramp:[FX_FIRE[0], FX_FIRE[1], FX_FIRE[2]], shape:'streak', drag:3, lmin:160, lmax:300 }), 500);
    fxShake(k % 2 ? 2 : 3, 120);
  },
};




/* ============================================================
   HELPERS FOR THE MOVES OF THEIR OWN
   ============================================================ */
/* Who stands on each side: yours (their bobs) and theirs (their cards) — and for a move, its maker's side and the other. */
function fxYoursIds(){ return (typeof playerField === 'function' ? playerField() : []).filter(m=> m && m.currentHp > 0).map(m=> pid('playerBob', m)); }
function fxFoesIds(){ return ((ui.battle && ui.battle.enemies) || []).map((e, i)=> e && e.hp > 0 ? 'enemy-' + i : null).filter(Boolean); }
function fxMine(ctx){ return ctx.foe ? fxFoesIds() : fxYoursIds(); }
function fxTheirs(ctx){ return ctx.foe ? fxYoursIds() : fxFoesIds(); }
/* What lands on one of yours is drawn in front of it; on one of theirs, the back canvas is already in front. */
const fxLayerOfId = id=> /^enemy-/.test(id || '') ? 'back' : 'front';
/* A purchased stone's tell: a gem's twinkle where its move leaves, so it reads a tier apart. */
function fxStoneTell(ctx, pal){
  const a = ctx.self || !ctx.to.length ? { x:ctx.from.x, y:ctx.from.y - ctx.from.h * 0.2 } : fxMuzzle(ctx.from, ctx.to[0]);
  const layer = ctx.foe ? 'back' : 'front';
  fxAdd({ layer, dur:300, step(L, t){
    const u = t / 300;
    fxRing(L, a.x, a.y, 3 + u * 14, 1, pal[2], 1 - u);
    fxStar4(L, a.x, a.y, 8 * Math.sin(u * Math.PI) + 1, pal[0], pal[0]);
  } });
}
/* An Ultra's host: something hanging over its maker while the strikes fall, gone soon after they stop.
   draw(L, host, t, grow, fade). Each strike sets host.last (fxHostHit). */
function fxHost(ctx, o, draw){
  const a = ctx.from, host = ctx.host = { x:a.x + (o.dx || 4), y:Math.max(18, a.y - a.h * (o.up == null ? 0.8 : o.up)), last:performance.now(), endAt:0 };
  if(o.at) Object.assign(host, o.at(ctx));
  fxAdd({ layer:o.layer || 'back', dur:o.dur || 7000, step(L, t){
    if(!host.endAt && t > (o.min || 900) && performance.now() - host.last > (o.idle || 450)) host.endAt = t;
    const grow = Math.min(1, t / (o.grow || 300)), fade = host.endAt ? Math.max(0, 1 - (t - host.endAt) / 240) : 1;
    if(fade <= 0){ if(!host.gone){ host.gone = true; if(o.end) o.end(host); } return; }
    draw(L, host, t, grow * fade, fade);
  } });
  return host;
}
function fxHostHit(ctx){ if(ctx.host) ctx.host.last = performance.now(); return ctx.host || { x:ctx.from.x, y:ctx.from.y - 30 }; }
/* A streak from the sky onto `at`, for what falls on it (drawn as it lands: the fall is too quick to see whole). */
function fxSkyStreak(layer, at, o){
  const sx = at.x + (o.dx || -18), sy = Math.max(0, at.y - (o.len || 70));
  fxAdd({ layer, dur:o.dur || 180, step(L, t){
    const u = t / (o.dur || 180), cv = 1 - u;
    fxLine(L, sx, sy, at.x, at.y, o.cols[2], (o.w || 3) + 2, cv);
    fxLine(L, sx, sy, at.x, at.y, o.cols[1], o.w || 3, cv);
    fxLine(L, sx + (at.x - sx) * 0.4, sy + (at.y - sy) * 0.4, at.x, at.y, o.cols[0], 1, cv);
  } });
}
/* Two shots braided together on their way: draw(L, p, u, t, side) for each, side ±1. */
function fxBraid(ctx, a, b, o, draw){
  const base = fxArc(a, b, o.lift), dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, amp = o.amp || 9;
  [1, -1].forEach(side=>{
    const path = u=>{ const p = base(u), w = side * amp * Math.sin(u * Math.PI) * Math.cos(u * Math.PI * 2.2); return { x:p.x + nx * w, y:p.y + ny * w }; };
    fxTravel(o.layer, a, b, { delay:o.delay || 40, time:o.time || 280, path, tail:o.tail || 300, each:o.each }, (L, p, u, t)=>{
      for(let k = 4; k >= 1; k--){ const q = path(Math.max(0, u - k * 0.03)); if(o.trail) o.trail(L, q, k, t, side); }
      draw(L, p, u, t, side);
    });
  });
}
/* An extra ring for a stone's blow, its colour lined. */
function fxRingBurst(at, layer, pal, big, ms){
  fxAdd({ layer, dur:ms || 420, step(L, t){ const u = fxEaseOut(t / (ms || 420)), rr = 8 + u * 26 * (big || 1); fxRing(L, at.x, at.y, rr + 1, 1, pal[5], 1 - u, 0.85); fxRing(L, at.x, at.y, rr, 2, pal[u < 0.5 ? 1 : 2], 1 - u, 0.85); } });
}

/* ============================================================
   HIGH STONES — two shots braided together, a heavier burst and a ring where they land
   ============================================================ */
function fxHigh(type, pal, drawShot, trail){
  return {
    dur:800,
    cast(ctx){
      fxStoneTell(ctx, pal);
      const layer = ctx.side === 'player' ? 'front' : 'back';
      ctx.to.forEach((b, k)=> fxBraid(ctx, fxMuzzle(ctx.from, b), b, { layer, delay:60 + k * 60, time:280, trail }, (L, p, u, t, side)=> drawShot(L, p, u, t, side, ctx)));
    },
    aura(ctx){ fxStoneTell(ctx, pal); FX_KIT[type].aura(ctx, ctx.fromId, { big:1.2 }); },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side);
      FX_KIT[type].burst(at, layer, { seed:ctx.seed + k * 13, big:1.25, k });
      fxRingBurst(at, layer, pal, 1);
    },
  };
}
FX_MOVES['Twin Blaze'] = fxHigh('Fire', FX_FIRE, (L, p, u, t, s, ctx)=> fxFlameBall(L, p.x, p.y, 5.5, FX_FIRE, t, ctx.seed + s, { wob:0.26, cols:[FX_FIRE[3], FX_FIRE[2], FX_FIRE[1], FX_FIRE[1], FX_FIRE[0]], outline:FX_FIRE[5] }),
  (L, q, k)=> fxDisc(L, q.x, q.y, 4 - k * 0.7, FX_FIRE[2 + Math.min(2, k >> 1)], 1 - k * 0.15));
FX_MOVES['Twin Torrent'] = fxHigh('Water', FX_WATER, (L, p, u, t, s, ctx)=> fxWaterBall(L, p.x, p.y, 5.5, t, ctx.seed + s),
  (L, q, k)=> fxDisc(L, q.x, q.y, 4.5 - k * 0.6, FX_WATER[k < 2 ? 2 : 1]));
FX_MOVES['Twin Razor'] = fxHigh('Grass', FX_GRASS, (L, p, u, t, s)=> fxLeaf(L, p.x, p.y, 11, t * 0.035 * s, FX_LEAFC),
  (L, q, k, t)=> { if(k === 2) fxSet(L, Math.round(q.x), Math.round(q.y), FX_GRASS[1]); });
FX_MOVES['Twin Bolt'] = {
  dur:800,
  cast(ctx){
    fxStoneTell(ctx, FX_ELEC);
    const layer = ctx.side === 'player' ? 'front' : 'back';
    ctx.to.forEach((b, k)=>{
      const a = fxMuzzle(ctx.from, b), dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
      [1, -1].forEach(s=>{
        const mid = { x:(a.x + b.x) / 2 + nx * 22 * s, y:(a.y + b.y) / 2 + ny * 22 * s }, t0 = 60 + k * 60 + (s > 0 ? 0 : 50);
        fxAdd({ layer, dur:t0 + 320, step(L, t){
          if(t < t0) return;
          const u = Math.min(1, (t - t0) / 110), st = ((t - t0) / 45) | 0;
          const e1 = u < 0.5 ? { x:a.x + (mid.x - a.x) * u * 2, y:a.y + (mid.y - a.y) * u * 2 } : mid;
          fxZap(L, a.x, a.y, e1.x, e1.y, ctx.seed + st + s * 50, 2, 5);
          if(u > 0.5){ const v = (u - 0.5) * 2; fxZap(L, mid.x, mid.y, mid.x + (b.x - mid.x) * v, mid.y + (b.y - mid.y) * v, ctx.seed + st * 3 + s * 70, 2, 5); }
        } });
      });
    });
  },
  aura(ctx){ fxStoneTell(ctx, FX_ELEC); FX_KIT.Electric.aura(ctx, ctx.fromId, { big:1.2 }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSparks(at, layer, { seed:ctx.seed + k * 13, big:1.3 }); fxRingBurst(at, layer, FX_ELEC, 1); },
};
FX_MOVES['Twin Boulder'] = fxHigh('Ground', FX_GROUND, (L, p, u, t, s, ctx)=> fxRock(L, p.x, p.y, 6, t * 0.012 * s, ctx.seed + s, FX_ROCKC),
  (L, q, k, t)=> { if(k === 3 && ((t / 40) | 0) % 2) fxSet(L, Math.round(q.x), Math.round(q.y + 3), FX_GROUND[1]); });
FX_MOVES['Twin Gale'] = fxHigh('Flying', FX_FLY, (L, p, u, t, s, ctx)=>{ const b = ctx.to[0] || p; fxCrescent(L, p.x, p.y, 10, Math.atan2(b.y - p.y, b.x - p.x) + s * 0.3, FX_WINDC); },
  (L, q, k)=> { if(k === 1) fxSet(L, Math.round(q.x), Math.round(q.y), FX_FLY[2]); });
FX_MOVES['Twin Strike'] = {
  dur:800,
  cast(ctx){
    fxStoneTell(ctx, FX_PHYS);
    const layer = ctx.side === 'player' ? 'front' : 'back';
    ctx.to.forEach((b, k)=> [0, 1].forEach(i=> FX_KIT.Physical.shot(ctx, fxMuzzle(ctx.from, b), { x:b.x + (i ? 6 : -6), y:b.y + (i ? 4 : -4) }, { k, big:1.2, layer, delay:40 + i * 70 + k * 50 })));
  },
  aura(ctx){ fxStoneTell(ctx, FX_PHYS); FX_KIT.Physical.aura(ctx, ctx.fromId, { big:1.2 }); },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    FX_KIT.Physical.burst({ x:at.x - 6, y:at.y - 4 }, layer, { seed:ctx.seed + k * 13, big:1.05 });
    fxLater(90, ()=> FX_KIT.Physical.burst({ x:at.x + 6, y:at.y + 4, w:at.w, h:at.h, foot:at.foot }, layer, { seed:ctx.seed + k * 13 + 5, big:1.2 }));
    fxRingBurst(at, layer, FX_PHYS, 1.1);
  },
};
FX_MOVES['Twin Hex'] = fxHigh('Ghost', FX_GHOST, (L, p, u, t, s, ctx)=>{ fxFlameBall(L, p.x, p.y, 5, FX_GHOST, t, ctx.seed + s, { wob:0.3, up:0.3, cols:[FX_GHOST[3], FX_GHOST[2], FX_GHOST[1], FX_GHOST[0]], outline:FX_GHOST[5] }); fxSet(L, Math.round(p.x - 1), Math.round(p.y - 1), FX_GHOST[5]); fxSet(L, Math.round(p.x + 2), Math.round(p.y - 1), FX_GHOST[5]); },
  (L, q, k)=> fxDisc(L, q.x, q.y, 3 - k * 0.5, FX_GHOST[3 + (k > 2 ? 1 : 0)], 0.75 - k * 0.12));
FX_MOVES['Twin Shock'] = fxHigh('Psychic', FX_PSY, (L, p, u, t, s)=>{ fxRing(L, p.x, p.y, 7, 1, FX_PSY[4]); fxRing(L, p.x, p.y, 6, 2, s > 0 ? FX_PSY[1] : FX_PSY[2]); fxDisc(L, p.x, p.y, 2, FX_PSY[0]); },
  (L, q, k)=> fxRing(L, q.x, q.y, 5 - k, 1, FX_PSY[2], 1 - k * 0.2));
FX_MOVES['Twin Breath'] = fxHigh('Dragon', FX_DRAGON, (L, p, u, t, s, ctx)=> fxFlameBall(L, p.x, p.y, 5.5, FX_DRAGON, t, ctx.seed + s, { wob:0.28, cols:[FX_DRAGON[3], FX_DRAGON[2], FX_DRAGON[1], FX_DRAGON[1], FX_DRAGON[0]], outline:FX_DRAGON[5] }),
  (L, q, k)=> fxDisc(L, q.x, q.y, 4 - k * 0.7, FX_DRAGON[2 + Math.min(2, k >> 1)], 1 - k * 0.15));
FX_MOVES['Twin Cannon'] = fxHigh('Steel', FX_STEEL, (L, p)=>{ fxDisc(L, p.x, p.y, 5, FX_STEEL[5]); fxDisc(L, p.x, p.y, 4, FX_STEEL[3]); fxDisc(L, p.x - 1, p.y - 1, 2, FX_STEEL[1]); fxSet(L, Math.round(p.x - 2), Math.round(p.y - 2), FX_STEEL[0]); },
  (L, q, k)=> fxDisc(L, q.x, q.y + 1, 3 - k * 0.5, FX_SMOKE[1 + (k >> 1)], 0.6 - k * 0.12));
FX_MOVES['Twin Gleam'] = fxHigh('Fairy', FX_FAIRY, (L, p, u, t, s, ctx)=>{ fxFlameBall(L, p.x, p.y, 4.5, FX_FAIRY, t, ctx.seed + s, { wob:0.08, cols:[FX_FAIRY[3], FX_FAIRY[2], FX_FAIRY[1], FX_FAIRY[0]], outline:FX_FAIRY[5] }); fxStar4(L, p.x, p.y - 7, 3, FX_GOLD[1], FX_GOLD[0]); },
  (L, q, k)=> { if(k % 2) fxStar4(L, q.x, q.y, 2, FX_FAIRY[2], FX_FAIRY[0]); });

/* ============================================================
   VERY HIGH STONES — a cast each of its own (Overheat is above)
   ============================================================ */
/* ICE TOMB (Water): every one of them frozen, and a chill over their side. Shards of ice grow up round each, frost
   smokes off them, the tomb closes in pale blue, and snow drifts down over their side. */
const FX_ICE = [fxRGB('#ffffff'), fxRGB('#dff6ff'), fxRGB('#a9e3fb'), fxRGB('#6cb8e6'), fxRGB('#3f7fb8'), fxRGB('#1f3f66')];
function fxIceShard(L, x, y, h, w, lean, cover){
  const pts = [[x - w, y], [x - w * 0.6 + lean * 0.5, y - h * 0.7], [x + lean, y - h], [x + w * 0.7 + lean * 0.4, y - h * 0.6], [x + w, y]];
  fxPolyLined(L, pts, FX_ICE[2], FX_ICE[5], cover);
  fxPoly(L, [[x - w * 0.4, y], [x + lean * 0.8, y - h * 0.9], [x + lean * 0.2, y]], FX_ICE[1], cover);
  fxLine(L, x + lean * 0.9, y - h * 0.95, x + lean * 0.5, y - h * 0.5, FX_ICE[0], 1, cover);
}
FX_MOVES['Ice Tomb'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_ICE);
    const ids = fxTheirs(ctx), rnd = fxRand(ctx.seed);
    ids.forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const layer = fxLayerOfId(id), shards = [];
      for(let i = 0; i < 7; i++) shards.push({ x:a.x + (i - 3) * a.w * 0.11 + (rnd() - 0.5) * 3, h:a.h * (0.3 + rnd() * 0.32) * (1 - Math.abs(i - 3) * 0.08), w:3 + rnd() * 2.5, lean:(i - 3) * 1.6 + (rnd() - 0.5) * 3, d:120 + rnd() * 260 + n * 80 });
      fxAdd({ layer, dur:1250, step(L, t){
        const cv = t < 1000 ? 1 : 1 - (t - 1000) / 250;
        if(t > 500) fxGlow(L, id, FX_ICE[2], Math.min(0.5, (t - 500) / 400), FX_ICE[4]);
        shards.forEach(s=>{ if(t < s.d) return; const g = fxEaseOut(Math.min(1, (t - s.d) / 200)); fxIceShard(L, s.x, a.foot, s.h * g, s.w, s.lean * g, cv); });
      } });
      fxPuffs(layer, { x:a.x, y:a.foot - 4 }, 6, { seed:ctx.seed + n, pal:[FX_ICE[0], FX_ICE[1], FX_ICE[2]], r:4, spread:a.w * 0.8, rise:10, life:700, delay:400, thick:0.55 });
    });
    const flakes = [];
    for(let i = 0; i < 26; i++) flakes.push({ x:FX.W * (0.38 + rnd() * 0.62), y:-4 - rnd() * 30, vx:-6 + rnd() * 4, vy:24 + rnd() * 26, life:1300, ramp:[0], delay:rnd() * 300,
      draw(L, x, y, u){ const sx = x + Math.sin(u * 12 + y) * 2; if(u > 0.85 && !fxCover(Math.round(sx), Math.round(y), (1 - u) * 6.6)) return; fxStar4(L, sx, y, 1.5, FX_ICE[0]); fxSet(L, Math.round(sx), Math.round(y), FX_ICE[3]); } });
    fxSpray('back', flakes, 1700);
  },
};

/* LEECH SEED (Grass): a field of seeds. Seeds are thrown onto each of them, burst open and vines curl round them;
   a stream of green light runs back to your side. */
FX_MOVES['Leech Seed'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_GRASS);
    const ids = fxTheirs(ctx), home = ctx.from, rnd = fxRand(ctx.seed);
    ids.forEach((id, n)=>{
      const b = fxAnchor(id); if(!b) return;
      const a = fxMuzzle(home, b), layer = fxLayerOfId(id), t1 = 60 + n * 70;
      fxTravel(layer === 'front' ? 'front' : 'back', a, b, { delay:t1, time:280, lift:Math.hypot(b.x - a.x, b.y - a.y) * 0.3 }, (L, p, u, t)=>{
        fxPolyLined(L, fxRot([[-3, 0], [0, -2], [3, 0], [0, 2]], p.x, p.y, t * 0.02), FX_GROUND[2], FX_GROUND[5]); fxSet(L, Math.round(p.x), Math.round(p.y - 1), FX_GRASS[1]);
      });
      const vines = [];
      for(let i = 0; i < 4; i++) vines.push({ ph:i * 1.57 + rnd(), r:b.w * (0.28 + rnd() * 0.08), y0:b.foot, y1:b.y - b.h * 0.25 });
      fxAdd({ layer, dur:t1 + 1150, step(L, t){
        if(t < t1 + 280) return;
        const g = fxEaseOut(Math.min(1, (t - t1 - 280) / 380)), cv = t < t1 + 950 ? 1 : 1 - (t - t1 - 950) / 200;
        vines.forEach((v, i)=>{
          for(let j = 0; j < 40 * g; j++){
            const f = j / 40, ang = v.ph + f * Math.PI * 3, x = b.x + Math.cos(ang) * v.r * (1 - f * 0.25), y = v.y0 + (v.y1 - v.y0) * f + Math.sin(ang) * 3;
            if(!fxCover(Math.round(x), Math.round(y), cv)) continue;
            fxDisc(L, x, y, 1.5, FX_GRASS[5]); fxSet(L, Math.round(x), Math.round(y), j % 9 === 0 ? FX_GRASS[1] : FX_GRASS[3]);
            if(j % 10 === 5) fxLeaf(L, x + 3, y - 1, 5, ang, FX_LEAFC, cv);
          }
        });
      } });
      const motes = [];
      for(let i = 0; i < 8; i++) motes.push({ d:t1 + 650 + i * 50, off:(rnd() - 0.5) * 16 });
      fxAdd({ layer:'back', dur:t1 + 1400, step(L, t){
        motes.forEach(m=>{ const u = (t - m.d) / 380; if(u < 0 || u > 1) return; const p = fxArc(b, home, 24 + m.off)(fxEaseIn(u)); fxDisc(L, p.x, p.y, 2, FX_GRASS[3]); fxSet(L, Math.round(p.x), Math.round(p.y), FX_GRASS[0]); });
      } });
    });
  },
};

/* OVERCHARGE (Electric): your side charged. Lightning comes down onto each of yours from above, crackles round them,
   and they flicker bright. */
FX_MOVES['Overcharge'] = {
  side:'self', dur:1200,
  cast(ctx){
    fxStoneTell(ctx, FX_ELEC);
    fxMine(ctx).forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const layer = fxLayerOfId(id), top = { x:a.x + 8, y:0 }, t0 = 80 + n * 120;
      fxAdd({ layer, dur:t0 + 260, step(L, t){
        if(t < t0) return;
        const st = ((t - t0) / 40) | 0, u = Math.min(1, (t - t0) / 70);
        fxZap(L, top.x, top.y, top.x + (a.x - top.x) * u, top.y + (a.y - top.y) * u, ctx.seed + st + n * 31, 3, 9);
        if(u >= 1 && t - t0 < 120) fxDisc(L, a.x, a.y, 10, FX_ELEC[0], 0.6);
      } });
      fxAdd({ layer, dur:t0 + 1000, step(L, t){
        if(t < t0 + 120) return;
        const st = (t / 55) | 0, rnd = fxRand(ctx.seed + st * 7 + n);
        for(let i = 0; i < 3; i++){ const a1 = rnd() * 6.28, a2 = a1 + 0.7 + rnd(), r = a.w * 0.42; fxZap(L, a.x + Math.cos(a1) * r, a.y + Math.sin(a1) * r * 0.9, a.x + Math.cos(a2) * r, a.y + Math.sin(a2) * r * 0.9, ctx.seed + st * 3 + i, 1, 4); }
        if(t < t0 + 700 && st % 2) fxGlow(L, id, FX_ELEC[1], 0.35, FX_ELEC[2]);
      } });
      fxSpray(layer, fxBurstParts(a.x, a.y, 14, { seed:ctx.seed + n, vmin:80, vmax:180, drag:3, ramp:[FX_ELEC[0], FX_ELEC[1], FX_ELEC[2]], lmin:150, lmax:300, shape:'streak', delay:t0 + 80 }), t0 + 600);
    });
  },
};

/* SPIKE ARMOUR (Ground): spikes of rock burst up in a ring round each of yours, then settle as armour. */
function fxSpike(L, x, y, h, w, lean, pal, cover){
  fxPolyLined(L, [[x - w, y], [x + lean, y - h], [x + w, y]], pal[1], pal[3], cover);
  fxPoly(L, [[x - w * 0.2, y], [x + lean * 0.9, y - h * 0.85], [x + w * 0.6, y]], pal[2], cover);
  fxLine(L, x - w * 0.6, y - 1, x + lean * 0.8, y - h * 0.8, pal[0], 1, cover);
}
FX_MOVES['Spike Armour'] = {
  side:'self', dur:1200,
  cast(ctx){
    fxStoneTell(ctx, FX_GROUND);
    fxMine(ctx).forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const rnd = fxRand(ctx.seed + n), spikes = [];
      for(let i = 0; i < 10; i++){ const ang = i / 10 * Math.PI * 2 + rnd() * 0.3; spikes.push({ ang, x:a.x + Math.cos(ang) * a.w * 0.42, y:a.foot + Math.sin(ang) * a.w * 0.11, h:a.h * (0.22 + rnd() * 0.18), w:3 + rnd() * 1.5, d:60 + i * 30 }); }
      for(const layer of ['back', 'front']) fxAdd({ layer:fxLayerOfId(id) === 'back' ? 'back' : layer, dur:1150, step(L, t){
        spikes.forEach(s=>{
          if((Math.sin(s.ang) < 0) !== (layer === 'back') || t < s.d) return;
          const u = t - s.d, g = u < 140 ? fxEaseOut(u / 140) : u < 600 ? 1 : Math.max(0, 1 - (u - 600) / 300);
          fxSpike(L, s.x, s.y, s.h * g, s.w, Math.cos(s.ang) * 3, FX_ROCKC);
        });
        if(t > 650 && t < 950 && layer === 'front') fxGlow(L, id, 0, 0, ((t / 70) | 0) % 2 ? FX_GROUND[2] : FX_GROUND[3]);
      } });
      fxPuffs('back', { x:a.x, y:a.foot }, 6, { seed:ctx.seed + 7, pal:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[2]], r:4, spread:a.w * 0.9, rise:8, life:600, delay:80 });
      fxShake(1, 120);
    });
  },
};

/* MIRAGE (Flying): your side blurs. Copies of each of yours shimmer out to its sides and the air wavers round them. */
function fxGhostCopy(L, id, dx, c, a){
  const img = fxSpriteOf(id);
  if(!img || img.tagName !== 'IMG') return;
  const mk = fxMask(img); if(!mk) return;
  const r = img.getBoundingClientRect();
  const x0 = (r.left - FX.ox) / FX.P + dx, y0 = (r.top - FX.oy) / FX.P, sx = mk.w / (r.width / FX.P), sy = mk.h / (r.height / FX.P);
  const W = Math.ceil(r.width / FX.P), H = Math.ceil(r.height / FX.P);
  for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){
    const u = Math.floor(x * sx), v = Math.floor(y * sy);
    if(u < mk.w && v < mk.h && mk.m[v * mk.w + u]){ const X = Math.round(x0 + x + Math.sin(y * 0.5 + performance.now() * 0.02) * 1.2), Y = Math.round(y0 + y); if(fxCover(X, Y, a)) fxSet(L, X, Y, c); }
  }
}
FX_MOVES['Mirage'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_FLY);
    fxMine(ctx).forEach(id=>{
      const a = fxAnchor(id); if(!a) return;
      fxAdd({ layer:'back', dur:1250, step(L, t){
        const out = fxEaseOut(Math.min(1, t / 300)), cv = t < 900 ? 0.5 : 0.5 * (1 - (t - 900) / 350);
        fxGhostCopy(L, id, -a.w * 0.32 * out, FX_FLY[2], cv);
        fxGhostCopy(L, id, a.w * 0.32 * out, FX_FLY[1], cv);
        for(let i = 0; i < 4; i++){ const y = a.foot - (i + 0.5) * a.h * 0.22; for(let x = -a.w * 0.5; x < a.w * 0.5; x += 2) if(((x + i * 3 + (t / 30)) | 0) % 7 < 3) fxSet(L, Math.round(a.x + x), Math.round(y + Math.sin(x * 0.4 + t * 0.02) * 1.5), FX_FLY[0]); }
      } });
    });
  },
};

/* COUNTER (Physical): a guard. A shield of light flashes up before each of yours, gold edged, and their stance glows. */
FX_MOVES['Counter'] = {
  side:'self', dur:1100,
  cast(ctx){
    fxStoneTell(ctx, FX_PHYS);
    fxMine(ctx).forEach(id=>{
      const a = fxAnchor(id); if(!a) return;
      const dir = /^enemy-/.test(id) ? -1 : 1, cx = a.x + dir * a.w * 0.34, cy = a.y - a.h * 0.05, layer = fxLayerOfId(id);
      fxAdd({ layer, dur:1000, step(L, t){
        const g = fxEaseOut(Math.min(1, t / 160)), cv = t < 700 ? 1 : 1 - (t - 700) / 300, hh = a.h * 0.42 * g, ww = a.w * 0.2 * g;
        const pts = [[cx - ww, cy - hh * 0.8], [cx, cy - hh], [cx + ww, cy - hh * 0.8], [cx + ww * 0.9, cy + hh * 0.2], [cx, cy + hh], [cx - ww * 0.9, cy + hh * 0.2]];
        fxPolyLined(L, pts, FX_PHYS[1], FX_PHYS[4], cv * 0.6);
        fxPoly(L, pts.map(([x, y])=> [cx + (x - cx) * 0.6, cy + (y - cy) * 0.6]), FX_PHYS[0], cv * 0.5);
        if(t > 120 && t < 260) fxLine(L, cx - ww, cy - hh * 0.5, cx + ww, cy + hh * 0.3, FX_PHYS[0], 2);
        if(t > 300 && t < 800 && ((t / 80) | 0) % 2) fxGlow(L, id, 0, 0, FX_PHYS[2]);
      } });
      fxGroundRing('back', a, { cols:[FX_PHYS[1], FX_PHYS[2], FX_PHYS[3]], line:FX_PHYS[5], r1:a.w * 0.6, dur:650 });
    });
  },
};

/* CURSE (Ghost): their side cursed. A ring of runes turns beneath each of them, purple smoke rises, and they darken. */
FX_MOVES['Curse'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_GHOST);
    fxTheirs(ctx).forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const layer = fxLayerOfId(id);
      fxAdd({ layer, dur:1250, step(L, t){
        const g = fxEaseOut(Math.min(1, t / 300)), cv = t < 950 ? 1 : 1 - (t - 950) / 300, rx = a.w * 0.48 * g;
        fxRing(L, a.x, a.foot, rx + 1, 1, FX_GHOST[5], cv, 0.3);
        fxRing(L, a.x, a.foot, rx, 2, FX_GHOST[2], cv, 0.3);
        fxRing(L, a.x, a.foot, rx * 0.7, 1, FX_GHOST[3], cv, 0.3);
        for(let i = 0; i < 8; i++){ const ang = i / 8 * Math.PI * 2 + t * 0.003, x = a.x + Math.cos(ang) * rx * 0.85, y = a.foot + Math.sin(ang) * rx * 0.85 * 0.3;
          fxRect(L, x - 1, y - 1, 3, 3, FX_GHOST[1], cv); fxSet(L, Math.round(x), Math.round(y), FX_GHOST[5]); }
        if(t > 300 && t < 1000) fxGlow(L, id, FX_GHOST[4], 0.35 + 0.15 * Math.sin(t * 0.02), FX_GHOST[2]);
      } });
      fxPuffs(layer, { x:a.x, y:a.foot - 2 }, 8, { seed:ctx.seed + n, pal:[FX_GHOST[2], FX_GHOST[3], FX_GHOST[4]], r:4, spread:a.w * 0.8, rise:16, life:700, delay:200, stagger:300, thick:0.65 });
    });
  },
};
function fxRect(L, x, y, w, h, c, cover){ for(let j = 0; j < h; j++) for(let i = 0; i < w; i++){ const X = Math.round(x) + i, Y = Math.round(y) + j; if(cover == null || fxCover(X, Y, cover)) fxSet(L, X, Y, c); } }

/* DISCOMBOBULATE (Psychic): their side bewildered. Pink rings wash over them, and stars and spirals circle their heads. */
FX_MOVES['Discombobulate'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_PSY);
    const ids = fxTheirs(ctx), mid = ids.length ? ids.map(fxAnchor).filter(Boolean) : [];
    if(mid.length){ const c = { x:mid.reduce((s, p)=> s + p.x, 0) / mid.length, y:mid[0].y };
      for(let i = 0; i < 3; i++) fxAdd({ layer:fxLayerOfId(ids[0]), dur:700 + i * 120, step(L, t){ if(t < i * 120) return; const u = fxEaseOut((t - i * 120) / 700), rr = 8 + u * FX.W * 0.4; fxRing(L, c.x, c.y, rr + 1, 1, FX_PSY[4], (1 - u) * 0.8, 0.45); fxRing(L, c.x, c.y, rr, 2, FX_PSY[2], (1 - u) * 0.8, 0.45); } }); }
    ids.forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const hy = a.y - a.h * 0.45, layer = fxLayerOfId(id);
      fxAdd({ layer, dur:1250, step(L, t){
        if(t < 250) return;
        const cv = t < 1000 ? 1 : 1 - (t - 1000) / 250;
        for(let i = 0; i < 3; i++){ const ang = t * 0.008 + i * 2.09; fxStar4(L, a.x + Math.cos(ang) * a.w * 0.3, hy + Math.sin(ang) * 4, 2.5, i ? FX_GOLD[1] : FX_PSY[1], FX_PSY[0]); }
        for(let j = 0; j < 26; j++){ const f = j / 26, ang = f * Math.PI * 4 + t * 0.01, r = 1 + f * 7, X = Math.round(a.x + Math.cos(ang) * r), Y = Math.round(hy - 8 + Math.sin(ang) * r * 0.6); if(fxCover(X, Y, cv)) fxSet(L, X, Y, FX_PSY[3]); }
      } });
    });
  },
};

/* DRAGON DANCE (Dragon): Mach Dragon. Two dragon ribbons coil up round each of yours, fast, and streaks of speed fly off. */
FX_MOVES['Dragon Dance'] = {
  side:'self', dur:1200,
  cast(ctx){
    fxStoneTell(ctx, FX_DRAGON);
    fxMine(ctx).forEach(id=>{
      const a = fxAnchor(id); if(!a) return;
      const own = fxLayerOfId(id);
      for(const layer of ['back', 'front']) fxAdd({ layer:own === 'back' ? 'back' : layer, dur:1150, step(L, t){
        for(let r = 0; r < 2; r++){
          const head = Math.min(1, t / 500), tail = Math.max(0, (t - 350) / 600), ph = r * Math.PI;
          for(let pass = 0; pass < 2; pass++) for(let u = tail; u <= head; u += 0.005){
            const ang = u * Math.PI * 5 + ph, s = Math.sin(ang);
            if(own !== 'back' && (s < 0) !== (layer === 'back')) continue;
            const x = a.x + Math.cos(ang) * a.w * 0.44, y = a.foot - u * a.h * 1.15 + s * 4, w = 2.6 - u * 0.8;
            if(pass === 0) fxDisc(L, x, y, w + 1, FX_DRAGON[5]); else fxDisc(L, x, y, w, u > head - 0.05 ? FX_DRAGON[0] : (r ? FX_DRAGON[1] : FX_DRAGON[2]));
          }
        }
      } });
      fxSpray('back', fxBurstParts(a.x, a.y, 12, { seed:ctx.seed, ang:Math.PI, spread:0.8, vmin:120, vmax:220, drag:1, ramp:[FX_DRAGON[0], FX_DRAGON[1], FX_DRAGON[2]], lmin:200, lmax:350, shape:'streak', delay:400 }), 900);
    });
  },
};

/* STEEL AEGIS (Steel): shields for your team. Plates of steel lock together in a wall before each of yours, and a gleam
   runs across it. */
FX_MOVES['Steel Aegis'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_STEEL);
    fxMine(ctx).forEach(id=>{
      const a = fxAnchor(id); if(!a) return;
      const dir = /^enemy-/.test(id) ? -1 : 1, cx = a.x + dir * a.w * 0.36, cy = a.y - a.h * 0.02, layer = fxLayerOfId(id), hexes = [];
      for(let j = -2; j <= 1; j++) for(let i = -1; i <= 1; i++) hexes.push({ x:cx + i * 11 * dir + (j & 1 ? 5.5 : 0), y:cy + j * 10 + 5, d:60 + hexes.length * 40 });
      fxAdd({ layer, dur:1250, step(L, t){
        const cv = t < 950 ? 1 : 1 - (t - 950) / 300;
        hexes.forEach(h=>{
          if(t < h.d) return;
          const g = fxEaseOut(Math.min(1, (t - h.d) / 120)), r = 6.5 * g, pts = [];
          for(let k = 0; k < 6; k++){ const an = k * Math.PI / 3 + Math.PI / 6; pts.push([h.x + Math.cos(an) * r, h.y + Math.sin(an) * r]); }
          fxPolyLined(L, pts, FX_STEEL[2], FX_STEEL[5], cv);
          fxSet(L, Math.round(h.x - 1), Math.round(h.y - 2), FX_STEEL[0]);
        });
        if(t > 550 && t < 900){ const band = (t - 550) / 350 * 60 - 30; for(let y = -22; y <= 22; y++) for(let x = -20; x <= 20; x++) if(Math.abs(x + y * 0.5 - band) < 2){ const X = Math.round(cx + x), Y = Math.round(cy + y); if(L.buf[Y * FX.W + X]) fxSet(L, X, Y, FX_STEEL[0]); } }
      } });
    });
  },
};

/* DIAMOND DUST (Fairy): a fall of diamond dust over the whole field, every twinkle catching the light, and a shimmer
   sweeping across. */
FX_MOVES['Diamond Dust'] = {
  side:'self', dur:1400,
  cast(ctx){
    fxStoneTell(ctx, FX_FAIRY);
    const rnd = fxRand(ctx.seed), dust = [];
    for(let i = 0; i < 80; i++){ const sz = 1.5 + rnd() * 3, col = [FX_ICE[0], FX_FAIRY[1], FX_ICE[2], FX_GOLD[1]][i % 4];
      dust.push({ x:rnd() * FX.W, y:-6 - rnd() * FX.H * 0.4, vx:(rnd() - 0.5) * 10, vy:40 + rnd() * 40, life:1400, ramp:[0], delay:rnd() * 300,
        draw(L, x, y, u, c, age){ const tw = Math.abs(Math.sin(age * 0.012 + sz * 3)); if(u > 0.8 && !fxCover(Math.round(x), Math.round(y), (1 - u) * 5)) return; if(tw > 0.6) fxStar4(L, x, y, sz * tw + 0.5, col, FX_ICE[0]); else fxSet(L, Math.round(x), Math.round(y), col); } }); }
    fxSpray('back', dust, 1800);
    fxSpray('front', dust.splice(0, 22), 1800);
    fxAdd({ layer:'back', dur:900, step(L, t){ const x0 = -20 + t / 900 * (FX.W + 60); for(let y = 0; y < FX.H; y += 1) for(let k = 0; k < 6; k++){ const X = Math.round(x0 - y * 0.3 + k); if(((X + y) & 1) === 0) fxSet(L, X, y, k < 2 || k > 3 ? FX_ICE[2] : FX_ICE[0]); } } });
  },
};

/* ============================================================
   ULTRA STONES — a host over its maker while 5 to 9 strikes fall, each strike its own blast (Fusion Flare is above)
   ============================================================ */
/* VORTEX BLAST (Water): a whirlpool turns over your monster; each strike is a spear of water from it, and a splash. */
FX_MOVES['Vortex Blast'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_WATER);
    fxHost(ctx, { up:0.85 }, (L, h, t, g)=>{
      for(let arm = 0; arm < 3; arm++) for(let j = 0; j < 34; j++){
        const f = j / 34, ang = arm * 2.09 + f * 4.2 - t * 0.012, r = (2 + f * 13) * g;
        const X = h.x + Math.cos(ang) * r, Y = h.y + Math.sin(ang) * r * 0.45;
        fxDisc(L, X, Y, 1.6 - f * 0.6, FX_WATER[5]); fxSet(L, Math.round(X), Math.round(Y), f < 0.3 ? FX_WATER[0] : f < 0.65 ? FX_WATER[1] : FX_WATER[2]);
      }
      fxWaterBall(L, h.x, h.y, 3 * g + 1, t, ctx.seed);
    });
  },
  impact(ctx, at, k, side){
    const h = fxHostHit(ctx), layer = fxLayerFor(side);
    fxAdd({ layer:'back', dur:170, step(L, t){ const cv = 1 - t / 170; fxLine(L, h.x, h.y, at.x, at.y, FX_WATER[5], 6, cv); fxLine(L, h.x, h.y, at.x, at.y, FX_WATER[2], 4, cv); fxLine(L, h.x, h.y, at.x, at.y, FX_WATER[0], 1, cv); } });
    fxSplash(at, layer, { seed:ctx.seed + k * 13, big:1.35 });
    fxShake(k % 2 ? 2 : 1, 110);
  },
};

/* VERDANT NOVA (Grass): a great flower of blades opens over your monster, turning; each strike throws a fan of razor
   leaves from it and a green nova bursts where they land. */
FX_MOVES['Verdant Nova'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_GRASS);
    fxHost(ctx, { up:0.85 }, (L, h, t, g)=>{
      for(let i = 0; i < 8; i++){ const ang = i * Math.PI / 4 + t * 0.003; fxLeaf(L, h.x + Math.cos(ang) * 8 * g, h.y + Math.sin(ang) * 8 * g, 11 * g + 1, ang, FX_LEAFC); }
      fxDisc(L, h.x, h.y, 3.5 * g + 0.5, FX_GOLD[5]); fxDisc(L, h.x, h.y, 2.5 * g + 0.5, FX_GOLD[2]); fxSet(L, Math.round(h.x - 1), Math.round(h.y - 1), FX_GOLD[0]);
    });
  },
  impact(ctx, at, k, side){
    const h = fxHostHit(ctx), layer = fxLayerFor(side);
    [-1, 0, 1].forEach(i=> fxTravel('back', h, at, { delay:0, time:110, lift:i * 14, linear:true }, (L, p, u, t)=> fxLeaf(L, p.x, p.y, 9, t * 0.05 + i, FX_LEAFC)));
    fxLater(90, ()=>{
      FX_KIT.Grass.burst(at, layer, { seed:ctx.seed + k * 13, big:1.3 });
      fxRingBurst(at, layer, FX_GRASS, 1.2);
    });
  },
};

/* ARC EXPLOSION (Electric): a ball of plasma crackles over your monster; each strike is a bolt from it and an
   explosion of sparks. */
FX_MOVES['Arc Explosion'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_ELEC);
    fxHost(ctx, { up:0.85 }, (L, h, t, g)=>{
      const st = (t / 45) | 0, rnd = fxRand(ctx.seed + st);
      fxDisc(L, h.x, h.y, 7 * g + 1, FX_ELEC[4]); fxDisc(L, h.x, h.y, 6 * g, FX_ELEC[2]); fxDisc(L, h.x, h.y, 4 * g, FX_ELEC[1]); fxDisc(L, h.x, h.y, 2 * g, FX_ELEC[0]);
      for(let i = 0; i < 4; i++){ const a1 = rnd() * 6.28; fxZap(L, h.x, h.y, h.x + Math.cos(a1) * 14 * g, h.y + Math.sin(a1) * 14 * g, ctx.seed + st * 4 + i, 1, 3); }
    });
  },
  impact(ctx, at, k, side){
    const h = fxHostHit(ctx), layer = fxLayerFor(side);
    fxAdd({ layer:'back', dur:150, step(L, t){ fxZap(L, h.x, h.y, at.x, at.y, ctx.seed + k * 9 + ((t / 50) | 0), 3, 8); } });
    fxSparks(at, layer, { seed:ctx.seed + k * 13, big:1.5 });
    fxRingBurst(at, layer, FX_ELEC, 1.2, 380);
    fxShake(2, 110);
  },
};

/* TECTONIC CRUSH (Ground): the ground shakes under their side; each strike is a boulder brought down on one of them,
   rock bursting and dust rolling. */
FX_MOVES['Tectonic Crush'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_GROUND);
    fxTheirs(ctx).forEach((id, n)=>{ const a = fxAnchor(id); if(a) fxPuffs(fxLayerOfId(id), { x:a.x, y:a.foot }, 5, { seed:ctx.seed + n, pal:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[2]], r:4, spread:a.w * 0.9, rise:6, life:500, stagger:200 }); });
    fxShake(2, 300);
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    fxSkyStreak(layer, at, { cols:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[4]], w:6, len:90, dx:-10 });
    fxAdd({ layer, dur:140, step(L, t){ fxRock(L, at.x, at.y - 4 + t * 0.03, 11, 0.4, ctx.seed + k, FX_ROCKC, 1 - t / 140); } });
    FX_KIT.Ground.burst(at, layer, { seed:ctx.seed + k * 13, big:1.5 });
    fxShake(3, 140);
  },
};

/* SONIC SKYDIVE (Flying): each strike is a dive out of the sky onto one of them, a cone of sound bursting round it. */
FX_MOVES['Sonic Skydive'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_FLY);
    const a = ctx.from;
    fxAdd({ layer:'back', dur:420, step(L, t){ const u = t / 420; fxLine(L, a.x, a.y - u * FX.H, a.x, a.y - u * FX.H + 20, FX_FLY[3], 3, 1 - u); fxLine(L, a.x, a.y - u * FX.H, a.x, a.y - u * FX.H + 20, FX_FLY[0], 1, 1 - u); } });
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    fxSkyStreak(layer, at, { cols:[FX_FLY[0], FX_FLY[1], FX_FLY[4]], w:4, len:110, dx:k % 2 ? -26 : 26 });
    fxAdd({ layer, dur:360, step(L, t){
      const u = fxEaseOut(t / 360);
      for(let i = 0; i < 3; i++){ const rr = 6 + u * (14 + i * 7); fxRing(L, at.x, at.y - i * 4, rr + 1, 1, FX_FLY[4], (1 - u) * (1 - i * 0.25), 0.4); fxRing(L, at.x, at.y - i * 4, rr, 2, FX_FLY[1], (1 - u) * (1 - i * 0.25), 0.4); }
    } });
    FX_KIT.Flying.burst(at, layer, { seed:ctx.seed + k * 13, big:1.3 });
    fxShake(2, 100);
  },
};

/* DEVASTATE (Physical): your monster gathers itself, then blow after blow lands, each a great burst with rings. */
FX_MOVES['Devastate'] = {
  dur:900, window:6500,
  cast(ctx){ fxStoneTell(ctx, FX_PHYS); FX_KIT.Physical.aura(ctx, ctx.fromId, { big:1.2 }); },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    FX_KIT.Physical.burst(at, layer, { seed:ctx.seed + k * 13, big:1.55 });
    fxRingBurst(at, layer, FX_PHYS, 1.3, 380);
    fxAdd({ layer, dur:120, step(L, t){ for(let i = 0; i < 10; i++){ const ang = i * 0.628 + k, r0 = 30 - t / 6; fxLine(L, at.x + Math.cos(ang) * r0, at.y + Math.sin(ang) * r0, at.x + Math.cos(ang) * (r0 + 10), at.y + Math.sin(ang) * (r0 + 10), FX_PHYS[3], 1); } } });
    fxShake(3, 120);
  },
};

/* SHADOW SHRED (Ghost): darkness gathers round your monster, eyes in it; each strike rakes great shadow claws across
   one of them, shards of shadow flying. */
FX_MOVES['Shadow Shred'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_GHOST);
    const a = ctx.from;
    fxPuffs('back', { x:a.x, y:a.y }, 10, { seed:ctx.seed, pal:[FX_GHOST[3], FX_GHOST[4], FX_GHOST[5]], r:6, spread:a.w * 0.9, spreadY:a.h * 0.5, rise:4, life:700, stagger:200, thick:0.7 });
    fxAdd({ layer:'front', dur:700, step(L, t){ if(t > 150 && t < 600){ const e = 2; fxRect(L, a.x - 6, a.y - a.h * 0.3, e, e, FX_PSY[1]); fxRect(L, a.x + 4, a.y - a.h * 0.3, e, e, FX_PSY[1]); } } });
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side), rot = (k * 1.3) % 3;
    fxAdd({ layer, dur:330, step(L, t){
      const u = Math.min(1, t / 90), cv = t < 200 ? 1 : 1 - (t - 200) / 130;
      for(let i = 0; i < 3; i++){
        const ang = -1 + rot * 0.5, ox = (i - 1) * 8, len = 22, c = Math.cos(ang), s = Math.sin(ang);
        const x0 = at.x - c * len - s * ox, y0 = at.y - s * len + c * ox, x1 = at.x + c * len * (2 * u - 1) - s * ox, y1 = at.y + s * len * (2 * u - 1) + c * ox;
        fxLine(L, x0, y0, x1, y1, FX_GHOST[5], 5, cv); fxLine(L, x0, y0, x1, y1, FX_GHOST[2], 3, cv); fxLine(L, x0, y0, x1, y1, FX_GHOST[0], 1, cv);
      }
    } });
    FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k * 13, big:1.3 });
    fxShake(2, 100);
  },
};

/* MINDSTORM (Psychic): a storm of pink rings gathers over their side; each strike is psychic lightning from it. */
FX_MOVES['Mindstorm'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_PSY);
    const foes = fxTheirs(ctx).map(fxAnchor).filter(Boolean);
    fxHost(ctx, { at:()=> foes.length ? { x:foes.reduce((s, p)=> s + p.x, 0) / foes.length, y:Math.max(12, Math.min(...foes.map(p=> p.y - p.h * 0.75))) } : {} }, (L, h, t, g)=>{
      for(let i = 0; i < 5; i++){ const rx = (10 + i * 7) * g, ang0 = t * 0.004 * (i % 2 ? 1 : -1);
        for(let j = 0; j < 40; j++){ const ang = ang0 + j / 40 * Math.PI * 2; if(j % 8 > 5) continue; const X = h.x + Math.cos(ang) * rx, Y = h.y + Math.sin(ang) * rx * 0.3; fxDisc(L, X, Y, 1.5, FX_PSY[4]); fxSet(L, Math.round(X), Math.round(Y), i % 2 ? FX_PSY[1] : FX_PSY[2]); } }
    });
  },
  impact(ctx, at, k, side){
    const h = fxHostHit(ctx), layer = fxLayerFor(side);
    fxAdd({ layer:'back', dur:160, step(L, t){ const st = (t / 50) | 0; fxBolt(L, h.x + (k % 3 - 1) * 10, h.y, at.x, at.y, ctx.seed + k * 7 + st, FX_PSY[4], 4, 7); fxBolt(L, h.x + (k % 3 - 1) * 10, h.y, at.x, at.y, ctx.seed + k * 7 + st, FX_PSY[1], 2, 7); } });
    FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k * 13, big:1.4 });
    fxShake(1, 100);
  },
};

/* DRACO METEOR (Dragon): an orb shoots up from your monster into the sky; each strike is a meteor coming down on one
   of them, a blast of dragon fire. */
FX_MOVES['Draco Meteor'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_DRAGON);
    const a = ctx.from;
    fxAdd({ layer:'back', dur:420, step(L, t){ const u = fxEaseIn(t / 420), y = a.y - u * (a.y + 10); fxFlameBall(L, a.x, y, 5, FX_DRAGON, t, ctx.seed, { wob:0.3, cols:[FX_DRAGON[3], FX_DRAGON[2], FX_DRAGON[1], FX_DRAGON[0]], outline:FX_DRAGON[5] }); fxLine(L, a.x, y + 6, a.x, y + 22, FX_DRAGON[2], 2, 0.7); } });
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side), dx = k % 2 ? -34 : 34;
    fxSkyStreak(layer, at, { cols:[FX_FIRE[1], FX_DRAGON[2], FX_DRAGON[4]], w:6, len:100, dx });
    fxAdd({ layer, dur:120, step(L, t){ fxRock(L, at.x, at.y, 7, k, ctx.seed + k, [FX_DRAGON[1], FX_DRAGON[3], FX_DRAGON[4], FX_DRAGON[5]], 1 - t / 120); } });
    fxDragonBurst(at, layer, { seed:ctx.seed + k * 13, big:1.5 });
    fxFireBurst(at, layer, { seed:ctx.seed + k * 17, big:0.8 });
    fxShake(3, 130);
  },
};

/* GIGATON SMASH (Steel): plates of steel lock into a great hammer over your monster; each strike brings it down on one
   of them, sparks and a ring of metal. */
FX_MOVES['Gigaton Smash'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_STEEL);
    fxHost(ctx, { up:0.95 }, (L, h, t, g)=>{
      const w = 17 * g, hh = 11 * g;
      fxPolyLined(L, [[h.x - w, h.y - hh], [h.x + w, h.y - hh], [h.x + w, h.y + hh], [h.x - w, h.y + hh]], FX_STEEL[2], FX_STEEL[5]);
      fxPoly(L, [[h.x - w + 2, h.y - hh + 1], [h.x + w - 2, h.y - hh + 1], [h.x + w - 2, h.y - hh + 3], [h.x - w + 2, h.y - hh + 3]], FX_STEEL[0]);
      fxPoly(L, [[h.x - w + 1, h.y + hh - 3], [h.x + w - 1, h.y + hh - 3], [h.x + w - 1, h.y + hh - 1], [h.x - w + 1, h.y + hh - 1]], FX_STEEL[3]);
      fxRect(L, h.x - 2, h.y + hh, 4, 10 * g, FX_STEEL[4]);
    });
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    fxHostHit(ctx);
    fxSkyStreak(layer, at, { cols:[FX_STEEL[0], FX_STEEL[2], FX_STEEL[5]], w:10, len:80, dx:0, dur:140 });
    fxAdd({ layer, dur:130, step(L, t){ const w = 18, hh = 12, y = at.y - 6; fxPolyLined(L, [[at.x - w, y - hh], [at.x + w, y - hh], [at.x + w, y + hh], [at.x - w, y + hh]], FX_STEEL[2], FX_STEEL[5], 1 - t / 130); } });
    FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k * 13, big:1.5 });
    fxRingBurst(at, layer, FX_STEEL, 1.3, 400);
    fxShake(4, 150);
  },
};

/* ASTRAL BLOOM (Fairy): a flower of starlight opens over your monster, turning; each strike is a falling star onto one
   of them, bursting in twinkles and hearts. */
FX_MOVES['Astral Bloom'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_FAIRY);
    fxHost(ctx, { up:0.9 }, (L, h, t, g)=>{
      for(let i = 0; i < 6; i++){ const ang = i * Math.PI / 3 + t * 0.002, x = h.x + Math.cos(ang) * 9 * g, y = h.y + Math.sin(ang) * 9 * g;
        fxFlameBall(L, x, y, 4 * g + 0.5, FX_FAIRY, t, ctx.seed + i, { wob:0.05, cols:[FX_FAIRY[3], FX_FAIRY[2], FX_FAIRY[1]], outline:FX_FAIRY[5] }); }
      fxStar4(L, h.x, h.y, 6 * g + 1, FX_GOLD[1], FX_GOLD[0]);
      for(let i = 0; i < 4; i++){ const ang = -t * 0.004 + i * 1.57; fxStar4(L, h.x + Math.cos(ang) * 18 * g, h.y + Math.sin(ang) * 10 * g, 2, FX_ICE[0], FX_ICE[0]); }
    });
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    fxHostHit(ctx);
    fxSkyStreak(layer, at, { cols:[FX_ICE[0], FX_FAIRY[1], FX_FAIRY[4]], w:3, len:100, dx:k % 2 ? 30 : -30 });
    fxAdd({ layer, dur:200, step(L, t){ fxStar4(L, at.x, at.y, 12 * (1 - t / 200) + 1, FX_GOLD[1], FX_ICE[0]); } });
    FX_KIT.Fairy.burst(at, layer, { seed:ctx.seed + k * 13, big:1.45 });
    fxShake(1, 100);
  },
};

/* ============================================================
   THE LEGENDARIES — every move of theirs its own art. Their Power 2, Ultimate and Max keep the blow back a while
   (`hold`) so the art has its time, and shake the field.
   ============================================================ */
const FX_RED = [fxRGB('#ffe0d0'), fxRGB('#ff8a6a'), fxRGB('#e0402a'), fxRGB('#b0221a'), fxRGB('#781410'), fxRGB('#3c0a08')];
const FX_CLOUD = [fxRGB('#ffffff'), fxRGB('#fbf6e8'), fxRGB('#efe2c0'), fxRGB('#d8c48e'), fxRGB('#b09456'), fxRGB('#6a5428')];
const FX_WHITEFIRE = [FX_GOLD[0], FX_GOLD[0], FX_GOLD[1], FX_GOLD[2], FX_FIRE[2], FX_FIRE[4]];
const FX_TEAL = [fxRGB('#effffb'), fxRGB('#a8f0e0'), fxRGB('#4fd0b8'), fxRGB('#26988a'), fxRGB('#155c58'), fxRGB('#0a302e')];
const FX_NIGHT = [fxRGB('#e8e4ff'), fxRGB('#9d93d8'), fxRGB('#5b4fa0'), fxRGB('#352a6a'), fxRGB('#1c1440'), fxRGB('#0a0618')];
/* The ones it is aimed at; for a cast with none named (a move of theirs on all of yours), the other side. */
function fxTargets(ctx){ return ctx.to.length ? ctx.to : fxTheirs(ctx).map(fxAnchor).filter(Boolean); }
/* A thick beam from a to b, with its core and edge; `rings` along it. */
function fxBeam(L, a, b, w, pal, cover, rings, t){
  fxLine(L, a.x, a.y, b.x, b.y, pal[5], w + 2, cover);
  fxLine(L, a.x, a.y, b.x, b.y, pal[2], w, cover);
  fxLine(L, a.x, a.y, b.x, b.y, pal[0], Math.max(1, w - 4), cover);
  if(rings){ const n = Math.max(2, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 22)); for(let i = 1; i < n; i++){ const u = (i + ((t || 0) / 120) % 1) / n; if(u >= 1) continue; fxRing(L, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, w * 0.9 + 2, 1, pal[1], cover); } }
}
/* A puff of cloud: a cluster of round lobes, lit on top. */
function fxCloudPuff(L, x, y, r, cover){
  const lobes = [[-r * 0.6, 0, r * 0.62], [0, -r * 0.35, r * 0.75], [r * 0.62, 0, r * 0.6], [0, r * 0.15, r * 0.7]];
  lobes.forEach(([dx, dy, rr])=> fxDisc(L, x + dx, y + dy, rr + 1, FX_CLOUD[4], cover));
  lobes.forEach(([dx, dy, rr])=> fxDisc(L, x + dx, y + dy, rr, FX_CLOUD[1], cover));
  fxDisc(L, x - r * 0.15, y - r * 0.45, r * 0.4, FX_CLOUD[0], cover);
}
/* The Monkey King's staff: a golden rod banded red at its ends. */
function fxStaff(L, a, b, w, cover){
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, band = Math.min(d * 0.15, 6 + w);
  fxLine(L, a.x, a.y, b.x, b.y, FX_GOLD[5], w + 2, cover);
  fxLine(L, a.x, a.y, b.x, b.y, FX_GOLD[2], w, cover);
  fxLine(L, a.x - uy * (w * 0.3), a.y + ux * (w * 0.3), b.x - uy * (w * 0.3), b.y + ux * (w * 0.3), FX_GOLD[0], 1, cover);
  fxLine(L, b.x - ux * band, b.y - uy * band, b.x, b.y, FX_RED[2], w, cover);
  fxLine(L, a.x, a.y, a.x + ux * band, a.y + uy * band, FX_RED[2], w, cover);
}
/* A music note, for the Whalelord's song. */
const FX_NOTE = ['...oo', '...ofo', '...o.o', '...o..', '.ooo..', 'offfo.', 'offfo.', '.ooo..'];
function fxNote(L, x, y, c, line){ x = Math.round(x) - 3; y = Math.round(y) - 4; FX_NOTE.forEach((r, j)=>{ for(let i = 0; i < r.length; i++){ const k = r[i]; if(k === 'f') fxSet(L, x + i, y + j, c); else if(k === 'o') fxSet(L, x + i, y + j, line); } }); }
/* A small five-petalled flower (the Mindcat's forget-me-nots). */
function fxFlower(L, x, y, r, petal, heart, line, rot, cover){
  for(let i = 0; i < 5; i++){ const a = rot + i * 1.2566; fxDisc(L, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.5 + 1, line, cover); }
  for(let i = 0; i < 5; i++){ const a = rot + i * 1.2566; fxDisc(L, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.5, petal, cover); }
  fxDisc(L, x, y, Math.max(1, r * 0.3), heart, cover);
}
/* A cog: a toothed wheel with a hole. */
function fxGear(L, x, y, r, rot, pal, cover){
  const pts = [];
  for(let i = 0; i < 24; i++){ const a = rot + i * Math.PI / 12, rr = (i % 3 === 0 || i % 3 === 1) && (i % 6 < 3) ? r : r * 0.78; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  fxPolyLined(L, pts, pal[2], pal[5], cover);
  fxDisc(L, x, y, r * 0.5, pal[1], cover); fxDisc(L, x, y, r * 0.22, pal[5], cover);
}
/* A clock's face, its hand at `ang`. */
function fxClock(L, x, y, r, ang, cover){
  fxDisc(L, x, y, r + 1, FX_STEEL[5], cover); fxDisc(L, x, y, r, FX_ICE[1], cover);
  for(let i = 0; i < 12; i++){ const a = i * Math.PI / 6; fxSet(L, Math.round(x + Math.cos(a) * (r - 2)), Math.round(y + Math.sin(a) * (r - 2)), FX_STEEL[4]); }
  fxLine(L, x, y, x + Math.cos(ang) * (r - 2), y + Math.sin(ang) * (r - 2), FX_RED[3], 1, cover);
  fxLine(L, x, y, x + Math.cos(ang * 0.08 - 1.2) * (r * 0.55), y + Math.sin(ang * 0.08 - 1.2) * (r * 0.55), FX_STEEL[5], 2, cover);
}
/* A tear in space: a jagged dark rift, stars inside it, its edge glowing. */
function fxRift(L, x, y, len, wid, ang, seed, t, cover){
  const rnd = fxRand(seed), n = 9, top = [], bot = [], c = Math.cos(ang), s = Math.sin(ang);
  for(let i = 0; i <= n; i++){ const f = i / n, w = wid * Math.sin(f * Math.PI) * (0.7 + rnd() * 0.5), along = (f - 0.5) * len; top.push([x + c * along - s * w, y + s * along + c * w]); }
  for(let i = n; i >= 0; i--){ const f = i / n, w = wid * Math.sin(f * Math.PI) * (0.7 + rnd() * 0.5), along = (f - 0.5) * len; bot.push([x + c * along + s * w, y + s * along - c * w]); }
  const pts = top.concat(bot);
  fxPolyLined(L, pts, FX_NIGHT[5], FX_PSY[1], cover);
  for(let i = 0; i < 6; i++){ const f = rnd(), along = (f - 0.5) * len * 0.8, off = (rnd() - 0.5) * wid * 0.8 * Math.sin(f * Math.PI); if(((t / 90 + i) | 0) % 3) fxSet(L, Math.round(x + c * along - s * off), Math.round(y + s * along + c * off), FX_ICE[0]); }
}

/* ---------- THE MONKEY KING ---------- */
FX_MOVES['Jingu Thrust'] = {
  dur:700,
  cast(ctx){
    fxTargets(ctx).slice(0, 1).forEach(b=>{
      const a = fxMuzzle(ctx.from, b);
      fxAdd({ layer:ctx.side === 'player' ? 'front' : 'back', dur:460, step(L, t){
        const u = t < 120 ? fxEaseOut(t / 120) : t < 300 ? 1 : 1 - (t - 300) / 160;
        fxStaff(L, a, { x:a.x + (b.x - a.x) * u, y:a.y + (b.y - a.y) * u }, 3);
      } });
    });
  },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Physical.burst(at, layer, { seed:ctx.seed + k, big:1.15 }); fxRingBurst(at, layer, FX_GOLD, 0.9); },
};
FX_MOVES['Cloud Step'] = {
  dur:700,
  cast(ctx){
    fxTargets(ctx).slice(0, 1).forEach(b=>{
      const a = ctx.from, path = fxArc(a, b, 30);
      fxAdd({ layer:'back', dur:520, step(L, t){
        const head = Math.min(1, t / 260), tail = Math.max(0, (t - 140) / 300);
        for(let u = tail; u <= head; u += 0.07){ const p = path(u); fxCloudPuff(L, p.x, p.y, 4 + 3 * Math.sin(u * Math.PI), 1 - (head - u) * 1.2); }
      } });
    });
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    FX_KIT.Physical.burst(at, layer, { seed:ctx.seed + k, big:1.2 });
    fxAdd({ layer, dur:900, step(L, t){ if(t < 200) return; for(let i = 0; i < 3; i++){ const ang = t * 0.01 + i * 2.09; fxStar4(L, at.x + Math.cos(ang) * at.w * 0.25, at.y - at.h * 0.45 + Math.sin(ang) * 3, 2.5, FX_GOLD[1], FX_GOLD[0]); } } });
  },
};
FX_MOVES['72 Transformations'] = {
  side:'self', dur:1100,
  cast(ctx){
    const id = ctx.fromId, a = ctx.from, rnd = fxRand(ctx.seed);
    [-1, 1, 0].forEach((s, i)=> fxLater(80 + i * 120, ()=>{
      const x = a.x + s * a.w * 0.38, y = a.y - (s ? 0 : a.h * 0.3);
      fxAdd({ layer:'front', dur:520, step(L, t){ const u = t / 520; for(let j = 0; j < 5; j++){ const ang = j * 1.256 + i; fxCloudPuff(L, x + Math.cos(ang) * (4 + u * 10), y + Math.sin(ang) * (3 + u * 6), 4 * (1 - u * 0.5), 1 - u); } } });
      fxSpray('front', fxBurstParts(x, y, 8, { seed:ctx.seed + i, vmin:40, vmax:90, ramp:[FX_GOLD[0], FX_GOLD[1], FX_GOLD[2]], drag:3, lmin:200, lmax:380, shape:'streak' }), 500);
    }));
    fxAdd({ layer:'back', dur:1100, step(L, t){
      if(t < 350) return;
      const out = fxEaseOut(Math.min(1, (t - 350) / 250)), cv = t < 850 ? 0.75 : 0.75 * (1 - (t - 850) / 250);
      fxGhostCopy(L, id, -a.w * 0.36 * out, FX_GOLD[2], cv);
      fxGhostCopy(L, id, a.w * 0.36 * out, FX_GOLD[1], cv);
    } });
    fxShake(2, 150);
  },
};
function fxHeavensplitter(max){
  return {
    dur:1100, hold:max ? 600 : 450, shake:0,
    cast(ctx){
      const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), a = ctx.from;
      ctx.pillar = b;
      fxAdd({ layer:'back', dur:700, step(L, t){             // the staff thrown up, spinning, from his hand
        const u = Math.min(1, t / 420), x = a.x + (b.x - a.x) * u, y = a.y - Math.sin(u * Math.PI) * 50 - u * 20, ang = t * 0.04, len = 16;
        if(t < 420) fxStaff(L, { x:x - Math.cos(ang) * len, y:y - Math.sin(ang) * len }, { x:x + Math.cos(ang) * len, y:y + Math.sin(ang) * len }, 3);
      } });
      if(max) fxAdd({ layer:'back', dur:900, step(L, t){       // the sky cracking open above
        if(t < 300) return;
        const cv = t < 750 ? 1 : 1 - (t - 750) / 150;
        for(let i = 0; i < 3; i++) fxBolt(L, b.x - 40 + i * 40, 0, b.x - 10 + i * 10, 22 + i * 4, ctx.seed + i, FX_GOLD[0], 1, 6, 5);
        if(cv < 1) return;
      } });
    },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side), w = max ? 10 : 7;
      fxAdd({ layer, dur:520, step(L, t){                    // the staff, grown huge, brought down on it
        const u = t < 90 ? fxEaseIn(t / 90) : 1, cv = t < 360 ? 1 : 1 - (t - 360) / 160, top = { x:at.x - 6, y:-10 }, bot = { x:at.x, y:top.y + (at.foot + 2 - top.y) * u };
        fxStaff(L, top, bot, w, cv);
      } });
      fxLater(80, ()=>{
        FX_KIT.Physical.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.9 : 1.6 });
        fxRingBurst({ x:at.x, y:at.foot }, layer, FX_GOLD, max ? 1.8 : 1.4, 520);
        if(max) fxRingBurst({ x:at.x, y:at.foot }, layer, FX_RED, 2.4, 650);
        fxPuffs(layer, { x:at.x, y:at.foot }, max ? 10 : 7, { seed:ctx.seed + 3, pal:[FX_CLOUD[1], FX_CLOUD[2], FX_CLOUD[3]], r:5, spread:at.w, rise:8, life:600, stagger:80 });
        fxSpray(layer, fxBurstParts(at.x, at.foot, max ? 24 : 16, { seed:ctx.seed + 4, ang:-Math.PI / 2, spread:2.4, vmin:80, vmax:200, grav:300, ramp:[FX_GOLD[0], FX_GOLD[1], FX_GOLD[2], FX_GOLD[3]], lmin:300, lmax:600 }), 900);
        fxShake(max ? 5 : 4, 200);
      });
    },
  };
}
FX_MOVES['Heavensplitter'] = fxHeavensplitter(false);
FX_MOVES['Heavensplitter Max'] = fxHeavensplitter(true);

/* ---------- THE WATER DRAGON ---------- */
FX_MOVES['Aqua Fang'] = {
  dur:700,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> FX_KIT.Water.shot(ctx, fxMuzzle(ctx.from, b), b, { k:0, big:1.1, layer:ctx.side === 'player' ? 'front' : 'back', delay:30 })); },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    fxAdd({ layer, dur:300, step(L, t){                       // jaws of water snapping shut
      const u = Math.min(1, t / 110), cv = t < 200 ? 1 : 1 - (t - 200) / 100, gap = 14 * (1 - u) + 2;
      fxCrescent(L, at.x, at.y - gap, 11, Math.PI / 2, [FX_WATER[0], FX_WATER[2], FX_WATER[3], FX_WATER[5]], cv);
      fxCrescent(L, at.x, at.y + gap, 11, -Math.PI / 2, [FX_WATER[0], FX_WATER[2], FX_WATER[3], FX_WATER[5]], cv);
    } });
    fxLater(100, ()=> fxSplash(at, layer, { seed:ctx.seed + k, big:1.1 }));
  },
};
FX_MOVES['Torrent Claw'] = {
  dur:700,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> FX_KIT.Water.shot(ctx, fxMuzzle(ctx.from, b), b, { k:0, big:1.15, layer:ctx.side === 'player' ? 'front' : 'back', delay:30 })); },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    fxAdd({ layer, dur:330, step(L, t){
      const u = Math.min(1, t / 100), cv = t < 200 ? 1 : 1 - (t - 200) / 130;
      for(let i = 0; i < 3; i++){ const ox = (i - 1) * 7, len = 16, x0 = at.x + ox - len * 0.6, y0 = at.y - len, x1 = at.x + ox + len * 0.6, y1 = at.y + len * 0.8, ex = x0 + (x1 - x0) * u, ey = y0 + (y1 - y0) * u;
        fxLine(L, x0, y0, ex, ey, FX_WATER[5], 4, cv); fxLine(L, x0, y0, ex, ey, FX_WATER[2], 2, cv); fxLine(L, x0, y0, ex, ey, FX_WATER[0], 1, cv); }
    } });
    fxSplash(at, layer, { seed:ctx.seed + k, big:1.15 });
  },
};
/* Tsunami: a great wave rolls across their side. */
FX_MOVES['Tsunami'] = {
  dur:1100, hold:350,
  cast(ctx){
    const foes = fxTargets(ctx), y0 = foes.length ? Math.max(...foes.map(p=> p.foot)) + 4 : FX.H * 0.4, top = foes.length ? Math.min(...foes.map(p=> p.y - p.h * 0.55)) : FX.H * 0.1;
    const x0 = foes.length ? Math.min(...foes.map(p=> p.x - p.w * 0.6)) - 30 : FX.W * 0.3, x1 = foes.length ? Math.max(...foes.map(p=> p.x + p.w * 0.6)) + 10 : FX.W;
    fxAdd({ layer:ctx.foe ? 'front' : 'back', dur:1050, step(L, t){
      const u = fxEaseOut(Math.min(1, t / 750)), crest = x0 + (x1 - x0) * u, cv = t < 850 ? 1 : 1 - (t - 850) / 200, hgt = (y0 - top) * Math.sin(Math.min(1, t / 300) * Math.PI / 2);
      for(let x = Math.round(x0 - 20); x <= crest; x++){
        const f = (crest - x) / 60, h = hgt * Math.max(0.25, 1 - f * 0.7) * (0.9 + 0.1 * Math.sin(x * 0.3 + t * 0.02));
        for(let y = 0; y < h; y++){ const Y = Math.round(y0 - y); if(!fxCover(x, Y, cv)) continue; const e = y / h; fxSet(L, x, Y, e > 0.92 ? FX_WATER[5] : e > 0.8 ? FX_WATER[0] : e > 0.55 ? FX_WATER[2] : FX_WATER[3]); }
      }
      for(let y = 0; y < hgt; y++){ const Y = Math.round(y0 - y), c = y > hgt * 0.75 ? FX_WATER[0] : FX_WATER[1]; for(let k = 0; k < 3; k++) if(fxCover(Math.round(crest + k), Y, cv)) fxSet(L, Math.round(crest + k), Y, k === 2 ? FX_WATER[5] : c); }
    } });
    fxShake(2, 400);
  },
  impact(ctx, at, k, side){ fxSplash(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.3 }); },
};
/* Cataclysm's charge, its Unleash and its Hyperbeam; Dragon Legacy. */
function fxDragonCharge(ctx){
  const a = ctx.from;
  FX_KIT.Water.aura(ctx, ctx.fromId, { big:1.3 });
  FX_KIT.Dragon.aura(ctx, ctx.fromId, { big:1.1 });
  const rnd = fxRand(ctx.seed), rain = [];
  for(let i = 0; i < 30; i++) rain.push({ x:rnd() * FX.W, y:-rnd() * 40, vx:-20, vy:160 + rnd() * 60, life:900, ramp:[0], delay:rnd() * 400, draw(L, x, y, u){ fxLine(L, x, y, x - 2, y - 6, FX_WATER[2], 1, u > 0.8 ? (1 - u) * 5 : 1); } });
  fxSpray('back', rain, 1400);
}
FX_MOVES['Cataclysm'] = { side:'self', dur:1100, cast:fxDragonCharge };
FX_MOVES['Cataclysm Max'] = { side:'self', dur:1100, cast:fxDragonCharge };
FX_MOVES['Charge'] = {
  dur:900,
  cast(ctx){
    if(ctx.type === 'Water' || ctx.self) return fxDragonCharge(ctx);
    fxTargets(ctx).slice(0, 1).forEach(b=> FX_KIT.Physical.shot(ctx, fxMuzzle(ctx.from, b), b, { k:0, big:1.3, layer:'back', delay:30 }));   // the Tricerarmor's Charge
  },
  aura(ctx){ fxDragonCharge(ctx); },
  impact(ctx, at, k, side){ FX_KIT[ctx.type === 'Water' ? 'Water' : 'Steel'].burst(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.35 }); fxShake(2, 120); },
};
FX_MOVES['Unleash'] = {
  dur:1000,
  cast(ctx){
    const foes = fxTheirs(ctx).map(fxAnchor).filter(Boolean), rnd = fxRand(ctx.seed);
    foes.forEach((b, n)=>{ for(let i = 0; i < 4; i++){ const d = 40 + n * 60 + i * 70, x = b.x + (rnd() - 0.5) * b.w * 0.6;
      fxAdd({ layer:'back', dur:d + 200, step(L, t){ if(t < d) return; const u = Math.min(1, (t - d) / 120), y = -6 + (b.y + 4) * u; fxLine(L, x - 3, y - 18, x, y, FX_WATER[5], 4); fxLine(L, x - 3, y - 18, x, y, FX_WATER[2], 2); fxSet(L, Math.round(x), Math.round(y), FX_WATER[0]); } }); } });
  },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSplash(at, layer, { seed:ctx.seed + k, big:1.5 }); fxDragonBurst(at, layer, { seed:ctx.seed + k, big:0.9 }); fxShake(3, 140); },
};
FX_MOVES['Hyperbeam'] = {
  dur:1100,
  cast(ctx){
    const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), a = fxMuzzle(ctx.from, b);
    fxAdd({ layer:'back', dur:900, step(L, t){
      if(t < 200){ fxDisc(L, a.x, a.y, 2 + t / 25, FX_TEAL[1]); fxRing(L, a.x, a.y, 12 - t / 20, 1, FX_TEAL[0]); return; }
      const cv = t < 700 ? 1 : 1 - (t - 700) / 200, w = t < 260 ? 4 : 9 + Math.sin(t * 0.06) * 2;
      fxBeam(L, a, b, w, [FX_ICE[0], FX_TEAL[1], FX_WATER[2], FX_WATER[3], FX_WATER[4], FX_WATER[5]], cv, true, t);
    } });
    fxShake(3, 500);
  },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSplash(at, layer, { seed:ctx.seed + k, big:1.7 }); fxRingBurst(at, layer, FX_TEAL, 1.6, 500); fxShake(4, 180); },
};
FX_MOVES['Dragon Legacy'] = { side:'self', dur:900, cast(ctx){ FX_KIT.Dragon.aura(ctx, ctx.fromId, { big:1.2 }); FX_KIT.Water.aura(ctx, ctx.fromId, { big:1 }); } };

/* ---------- THE PHOENIX ---------- */
/* Scorch: a dart of flame shaped like a feather. */
FX_MOVES['Scorch'] = {
  dur:700,
  cast(ctx){
    fxTargets(ctx).slice(0, 1).forEach(b=>{
      const a = fxMuzzle(ctx.from, b), ang = Math.atan2(b.y - a.y, b.x - a.x);
      fxTravel(ctx.side === 'player' ? 'front' : 'back', a, b, { delay:30, time:230, lift:10 }, (L, p, u, t, path)=>{
        for(let k = 6; k >= 1; k--){ const q = path(Math.max(0, u - k * 0.025)); fxDisc(L, q.x, q.y, 3 - k * 0.35, FX_FIRE[2 + (k >> 1)], 1 - k * 0.1); }
        fxLeaf(L, p.x, p.y, 13, ang, [FX_FIRE[1], FX_FIRE[2], FX_FIRE[3], FX_FIRE[5]]);
      });
    });
  },
  impact(ctx, at, k, side){ fxFireBurst(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.05 }); },
};
/* Firestorm: fire falls out of the sky on each of them. */
FX_MOVES['Firestorm'] = {
  dur:900,
  cast(ctx){
    const foes = fxTargets(ctx), rnd = fxRand(ctx.seed);
    foes.forEach((b, n)=>{ for(let i = 0; i < 3; i++){ const d = 30 + n * 40 + i * 80, x = b.x + (rnd() - 0.5) * b.w * 0.5, s = { x:x - 30, y:-8 };
      fxTravel('back', s, { x, y:b.y - 4 }, { delay:d, time:220, lift:0, linear:true }, (L, p, u, t)=>{ fxLine(L, p.x - 6, p.y - 10, p.x, p.y, FX_FIRE[3], 3, 0.7); fxFlameBall(L, p.x, p.y, 3.5, FX_FIRE, t, ctx.seed + i, { wob:0.3, cols:[FX_FIRE[3], FX_FIRE[2], FX_FIRE[1], FX_FIRE[0]], outline:FX_FIRE[5] }); }); } });
  },
  impact(ctx, at, k, side){ fxFireBurst(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.15 }); },
};
/* Nova: the phoenix blazes, and a ring of solar fire sweeps out across the field. */
FX_MOVES['Nova'] = {
  dur:1100, hold:300,
  cast(ctx){
    const a = ctx.from;
    fxAdd({ layer:'front', dur:300, step(L, t){ fxGlow(L, ctx.fromId, FX_GOLD[1], t < 200 ? 1 : 0, FX_FIRE[3]); } });
    fxAdd({ layer:'back', dur:900, step(L, t){
      if(t < 150) return;
      const u = fxEaseOut((t - 150) / 750), rr = 10 + u * FX.W * 0.95, cv = 1 - u * 0.7;
      fxRing(L, a.x, a.y, rr + 2, 2, FX_FIRE[5], cv, 0.6); fxRing(L, a.x, a.y, rr, 3, FX_FIRE[2], cv, 0.6); fxRing(L, a.x, a.y, rr - 3, 2, FX_GOLD[1], cv, 0.6);
    } });
    fxSpray('back', fxBurstParts(a.x, a.y, 30, { seed:ctx.seed, vmin:120, vmax:260, ramp:[FX_GOLD[0], FX_GOLD[1], FX_FIRE[2], FX_FIRE[3]], drag:1.2, lmin:400, lmax:700, delay:150 }), 1000);
    fxShake(2, 300);
  },
  aura(ctx){ this.cast(ctx); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxFireBurst(at, layer, { seed:ctx.seed + k, big:1.3 }); fxSpray(layer, fxBurstParts(at.x, at.y, 6, { seed:ctx.seed + k + 1, vmin:20, vmax:50, ramp:[FX_ICE[0], FX_GOLD[1]], grav:-30, lmin:400, lmax:600, delay:200 }), 900); },
};
/* Incinerate: a flamethrower, by how far past its base it was written — at its base narrow and orange, halfway wider
   and golden, at full white-gold and widest, with rings of flame running along it (Max: sacred fire throughout). */
function fxFlamethrower(max){
  return {
    dur:1100, hold:max ? 600 : 450,
    cast(ctx){
      const ch = ctx.charge == null ? 0.5 : ctx.charge, b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), a = fxMuzzle(ctx.from, b);
      const pal = ch >= 0.67 ? FX_WHITEFIRE : (ch >= 0.33 || max) ? FX_SACRED : FX_FIRE;
      const dur = 420 + 380 * ch, size = 2.2 + 3 * ch + (max ? 0.6 : 0), spread = 0.08 + 0.12 * ch, rate = 3 + Math.round(5 * ch), rnd = fxRand(ctx.seed);
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx), parts = [];
      ctx.flame = { pal, ch };
      fxAdd({ layer:ctx.side === 'player' ? 'front' : 'back', dur:dur + 450, step(L, t, dt){
        if(t < dur) for(let i = 0; i < rate; i++){ const an = ang + (rnd() - 0.5) * 2 * spread, v = d / 0.26 * (0.85 + rnd() * 0.3); parts.push({ x:a.x, y:a.y, vx:Math.cos(an) * v, vy:Math.sin(an) * v, born:t - rnd() * 16, life:260 + rnd() * 120 }); }
        const live = parts.filter(p=> t - p.born < p.life);
        live.forEach(p=>{ const age = (t - p.born) / 1000; p.cx = p.x + p.vx * age; p.cy = p.y + p.vy * age - age * age * 60; p.u = (t - p.born) / p.life; p.r = size * (0.5 + p.u * 1.6); });
        live.forEach(p=> fxDisc(L, p.cx, p.cy, p.r + 1, pal[5], p.u > 0.8 ? (1 - p.u) * 5 : 1));
        live.forEach(p=> fxDisc(L, p.cx, p.cy, p.r, pal[Math.min(4, Math.floor(p.u * 5))], p.u > 0.8 ? (1 - p.u) * 5 : 1));
        live.forEach(p=>{ if(p.u < 0.45) fxDisc(L, p.cx, p.cy, p.r * 0.45, pal[0]); });
        if(ch >= 0.67 && t < dur) for(let r = 0; r < 3; r++){ const u = ((t / 260) + r / 3) % 1, x = a.x + dx * u, y = a.y + dy * u; fxRing(L, x, y, 4 + size + u * 4, 1, FX_GOLD[1], 1 - u * 0.5, 0.9); }
        parts.length = 0; parts.push(...live);
      } });
      if(ch >= 0.33 || max) fxAdd({ layer:'back', dur:dur, step(L, t){         // wings of flame open behind it as it pours
        const open = Math.min(1, t / 200), cv = t < dur - 150 ? 1 : (dur - t) / 150, span = ctx.from.h * (0.45 + 0.25 * ch);
        for(const sgn of [-1, 1]) fxPaint(L, ctx.from.x + sgn * 3, ctx.from.y - ctx.from.h * 0.15, span + 2, (x, y, dd, an, X, Y)=>{
          const th2 = Math.PI / 2 - Math.atan2(-y, x * sgn); if(th2 < 0.1 || th2 > 0.1 + 1.3 * open || !fxCover(X, Y, cv)) return 0;
          const g = (th2 - 0.1) / Math.max(0.01, 1.3 * open), reach = span * (0.55 + 0.45 * Math.sin(Math.PI * (0.15 + 0.7 * g))) * (0.86 + 0.14 * Math.abs(Math.sin(g * 5 * Math.PI)));
          if(dd > reach + 1) return 0; if(dd > reach) return pal[5]; const f = dd / reach; return f < 0.3 ? pal[0] : f < 0.55 ? pal[1] : f < 0.75 ? pal[2] : pal[3];
        });
      } });
      fxShake(1 + Math.round(2 * ch), dur);
    },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side), f = ctx.flame || { pal:FX_FIRE, ch:0.5 }, seed = ctx.seed + k * 31, rnd = fxRand(seed);
      fxFireBurst(at, layer, { seed, big:1.2 + f.ch * 0.6, pal:f.pal === FX_FIRE ? FX_FIRE : f.pal });
      const hgt = Math.min(at.h * (1 + f.ch * 0.4), at.foot - 2), wid = at.w * (0.14 + f.ch * 0.06);
      fxAdd({ layer, dur:820, step(L, t){
        const u = t / 820, rise = fxEaseOut(Math.min(1, t / 210)), cv = u < 0.62 ? 1 : 1 - (u - 0.62) / 0.38;
        fxTongue(L, at.x - wid * 0.9, at.foot, hgt * rise * 0.62, wid * 0.8, t, 1, f.pal, cv);
        fxTongue(L, at.x + wid * 0.9, at.foot, hgt * rise * 0.7, wid * 0.8, t, 2, f.pal, cv);
        fxTongue(L, at.x, at.foot, hgt * rise, wid * 1.15, t, 3, f.pal, cv);
      } });
      const feathers = [];
      for(let i = 0; i < 10 + Math.round(12 * f.ch); i++) feathers.push({ x:at.x + (rnd() - 0.5) * wid * 2.4, y:at.foot - rnd() * hgt * 0.6, vx:(rnd() - 0.5) * 100, vy:-(60 + rnd() * 80),
        life:520 + rnd() * 320, size:1, ramp:[FX_GOLD[0], FX_GOLD[1], FX_GOLD[2], FX_GOLD[3], FX_GOLD[4]], grav:170, drag:2.5, delay:120 + rnd() * 220, shape:'streak' });
      fxSpray(layer, feathers, 1250);
      fxShake(2 + Math.round(2 * f.ch) + (max ? 1 : 0), 180);
    },
  };
}
FX_MOVES['Incinerate'] = fxFlamethrower(false);
FX_MOVES['Incinerate Max'] = fxFlamethrower(true);

/* ---------- THE FOREST FAIRY ---------- */
FX_MOVES['Fairy Wind'] = {
  dur:700,
  cast(ctx){
    fxTargets(ctx).slice(0, 1).forEach(b=>{
      const a = fxMuzzle(ctx.from, b), ang = Math.atan2(b.y - a.y, b.x - a.x);
      [0, 1].forEach(i=> fxTravel('back', a, b, { delay:30 + i * 70, time:240, lift:i ? -12 : 12, linear:true }, (L, p, u, t)=>{
        fxCrescent(L, p.x, p.y, 8, ang, [FX_GRASS[0], FX_GRASS[1], FX_GRASS[3], FX_GRASS[5]]);
        fxStar4(L, p.x - Math.cos(ang) * 8, p.y - Math.sin(ang) * 8 + (i ? 3 : -3), 2, FX_FAIRY[1], FX_FAIRY[0]);
      }));
    });
  },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Fairy.burst(at, layer, { seed:ctx.seed + k, big:1 }); fxSpray(layer, fxLeafParts(at, 6, { seed:ctx.seed + k, vmin:40, vmax:110 }), 900); },
};
FX_MOVES['Giga Drain'] = {
  dur:1000,
  cast(ctx){
    const home = ctx.from;
    fxTargets(ctx).slice(0, 1).forEach(b=>{
      FX_KIT.Grass.shot(ctx, fxMuzzle(home, b), b, { k:0, big:1.1, layer:'back', delay:30 });
      fxAdd({ layer:'back', dur:1100, step(L, t){                // its strength drawn back, orb by orb
        for(let i = 0; i < 9; i++){ const u = (t - 380 - i * 55) / 420; if(u < 0 || u > 1) continue; const p = fxArc(b, home, 18 + (i % 3) * 8)(fxEaseIn(u)); fxDisc(L, p.x, p.y, 3, FX_GRASS[5]); fxDisc(L, p.x, p.y, 2, FX_GRASS[2]); fxSet(L, Math.round(p.x), Math.round(p.y), FX_GRASS[0]); }
      } });
    });
    fxLater(820, ()=>{ fxAdd({ layer:'front', dur:300, step(L, t){ if(((t / 70) | 0) % 2 === 0) fxGlow(L, ctx.fromId, 0, 0, FX_GRASS[1]); } }); fxSpray('front', fxBurstParts(home.x, home.y, 10, { seed:ctx.seed, ang:-Math.PI / 2, spread:1.6, vmin:20, vmax:50, ramp:[FX_GRASS[0], FX_GRASS[1], FX_GRASS[2]], lmin:400, lmax:700 }), 900); });
  },
  impact(ctx, at, k, side){ FX_KIT.Grass.burst(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.1 }); },
};
FX_MOVES['Overgrowth'] = {
  side:'self', dur:1200, hold:250,
  cast(ctx){
    fxMine(ctx).forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const rnd = fxRand(ctx.seed + n), blooms = [];
      for(let i = 0; i < 9; i++){ const ang = i / 9 * Math.PI * 2 + rnd() * 0.4; blooms.push({ x:a.x + Math.cos(ang) * a.w * 0.45, y:a.foot + Math.sin(ang) * a.w * 0.12, d:60 + i * 50, back:Math.sin(ang) < 0, col:[FX_FAIRY[2], FX_GOLD[1], FX_ICE[0]][i % 3] }); }
      for(const layer of ['back', 'front']) fxAdd({ layer:fxLayerOfId(id) === 'back' ? 'back' : layer, dur:1150, step(L, t){
        blooms.forEach(bl=>{
          if(bl.back !== (layer === 'back') || t < bl.d) return;
          const g = fxEaseOut(Math.min(1, (t - bl.d) / 250)), cv = t < 900 ? 1 : 1 - (t - 900) / 250, h = 10 * g;
          fxLine(L, bl.x, bl.y, bl.x, bl.y - h, FX_GRASS[3], 2, cv);
          fxLeaf(L, bl.x + 3, bl.y - h * 0.5, 5, -0.4, FX_LEAFC, cv);
          fxFlower(L, bl.x, bl.y - h, 3.5 * g, bl.col, FX_GOLD[2], FX_FAIRY[5], t * 0.002, cv);
        });
      } });
      fxAdd({ layer:'front', dur:900, step(L, t){ if(t > 400 && ((t / 80) | 0) % 2) fxGlow(L, id, 0, 0, FX_GRASS[1]); } });
    });
  },
};
function fxVerdantWrath(max){
  return {
    dur:1100, hold:max ? 600 : 450,
    cast(ctx){ fxMine(ctx).slice(0, 1).forEach(id=>{ const a = fxAnchor(id); if(a) fxPuffs('back', { x:a.x, y:a.foot }, 6, { seed:ctx.seed, pal:[FX_GRASS[1], FX_GRASS[2], FX_GRASS[3]], r:4, spread:a.w, rise:12, life:600 }); }); fxShake(2, 250); },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side), rnd = fxRand(ctx.seed + k), from = { x:at.x + (k % 2 ? 40 : -40), y:at.foot + 4 };
      fxAdd({ layer, dur:620, step(L, t){                       // a great thorned vine lashes up and over it
        const u = Math.min(1, t / 160), cv = t < 420 ? 1 : 1 - (t - 420) / 200, ctl = { x:(from.x + at.x) / 2, y:at.y - at.h * 0.9 };
        const pt = v=> ({ x:(1 - v) * (1 - v) * from.x + 2 * (1 - v) * v * ctl.x + v * v * at.x, y:(1 - v) * (1 - v) * from.y + 2 * (1 - v) * v * ctl.y + v * v * at.y });
        for(let pass = 0; pass < 2; pass++) for(let v = 0; v <= u; v += 0.012){ const p = pt(v), w = (max ? 4 : 3) * (1 - v * 0.5);
          if(pass === 0) fxDisc(L, p.x, p.y, w + 1, FX_GRASS[5], cv); else { fxDisc(L, p.x, p.y, w, FX_GRASS[3], cv); fxSet(L, Math.round(p.x), Math.round(p.y - w * 0.5), FX_GRASS[1]); }
          if(pass === 1 && Math.round(v * 80) % 9 === 0){ fxLine(L, p.x, p.y - w, p.x + 2, p.y - w - 3, FX_GROUND[4], 1, cv); } }
      } });
      fxLater(130, ()=>{ FX_KIT.Grass.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.6 : 1.4 }); fxRingBurst(at, layer, FX_GRASS, max ? 1.5 : 1.2); if(max) FX_KIT.Fairy.burst(at, layer, { seed:ctx.seed + k + 3, big:1 }); fxShake(max ? 4 : 3, 160); });
    },
  };
}
FX_MOVES['Verdant Wrath'] = fxVerdantWrath(false);
FX_MOVES['Verdant Wrath Max'] = fxVerdantWrath(true);

/* ---------- THE THUNDER NEWT ---------- */
FX_MOVES['Psyshock'] = {
  dur:700,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const a = fxMuzzle(ctx.from, b);
    fxTravel('back', a, b, { delay:30, time:240 }, (L, p, u, t)=>{ fxRing(L, p.x, p.y, 7, 1, FX_PSY[4]); fxRing(L, p.x, p.y, 6, 2, FX_PSY[2]); fxDisc(L, p.x, p.y, 3, FX_ELEC[1]); const st = (t / 40) | 0; fxZap(L, p.x, p.y, p.x + Math.cos(st) * 9, p.y + Math.sin(st * 1.7) * 9, ctx.seed + st, 1, 2); }); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k, big:1.05 }); fxSparks(at, layer, { seed:ctx.seed + k, big:0.8 }); },
};
FX_MOVES['Volt Wave'] = {
  dur:900,
  cast(ctx){
    const foes = fxTargets(ctx), a = ctx.from;
    foes.forEach((b, n)=> fxAdd({ layer:'back', dur:420, step(L, t){
      const u = Math.min(1, (t - n * 40) / 220); if(u <= 0) return;
      const st = (t / 40) | 0, ex = a.x + (b.x - a.x) * u, ey = a.y + (b.y - a.y) * u;
      fxZap(L, a.x, a.y, ex, ey, ctx.seed + st + n * 17, 2, 7);
      fxRing(L, ex, ey, 5, 2, FX_ELEC[1]);
    } }));
  },
  impact(ctx, at, k, side){ fxSparks(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.15 }); },
};
FX_MOVES['Tachypsychia'] = {
  side:'self', dur:1200,
  cast(ctx){
    const id = ctx.fromId, a = ctx.from;
    fxAdd({ layer:'back', dur:1150, step(L, t){              // a dial of time round it, its hand racing, copies trailing
      const g = fxEaseOut(Math.min(1, t / 250)), cv = t < 900 ? 1 : 1 - (t - 900) / 250, r = a.w * 0.5 * g;
      fxRing(L, a.x, a.y, r + 1, 1, FX_PSY[4], cv); fxRing(L, a.x, a.y, r, 2, FX_PSY[1], cv);
      for(let i = 0; i < 12; i++){ const an = i * Math.PI / 6; fxDisc(L, a.x + Math.cos(an) * (r - 4), a.y + Math.sin(an) * (r - 4), 1.2, i % 3 ? FX_PSY[2] : FX_ELEC[1], cv); }
      const hand = t * 0.03; fxLine(L, a.x, a.y, a.x + Math.cos(hand) * (r - 3), a.y + Math.sin(hand) * (r - 3), FX_ELEC[2], 2, cv);
      if(t > 300) fxGhostCopy(L, id, -6 - (t % 200) / 40, FX_PSY[2], 0.4 * cv);
    } });
    fxAdd({ layer:'front', dur:900, step(L, t){ if(t > 250 && t < 400) fxZap(L, a.x - 10, 0, a.x, a.y, ctx.seed + ((t / 40) | 0), 2, 8); if(t > 400 && ((t / 70) | 0) % 2) fxGlow(L, id, 0, 0, FX_ELEC[1]); } });
  },
};
function fxVoltConcussion(max){
  return {
    dur:1100, hold:max ? 600 : 450,
    cast(ctx){ FX_KIT.Electric.aura(ctx, ctx.fromId, { big:1.3 }); fxShake(2, 250); },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side);
      fxAdd({ layer, dur:220, step(L, t){ const st = (t / 45) | 0; fxZap(L, at.x + (k % 2 ? -12 : 12), 0, at.x, at.y, ctx.seed + k * 9 + st, max ? 4 : 3, 10); if(max) fxZap(L, at.x - 20, 0, at.x, at.y, ctx.seed + k * 11 + st, 2, 8); } });
      fxSparks(at, layer, { seed:ctx.seed + k, big:max ? 1.7 : 1.45 });
      fxRingBurst(at, layer, max ? FX_WHITEFIRE : FX_ELEC, max ? 1.6 : 1.3, 450);
      fxAdd({ layer, dur:120, step(L, t){ fxDisc(L, at.x, at.y, 18 * (1 - t / 120), FX_PSY[1], 0.5); } });
      fxShake(max ? 4 : 3, 150);
    },
  };
}
FX_MOVES['Volt Concussion'] = fxVoltConcussion(false);
FX_MOVES['Volt Concussion Max'] = fxVoltConcussion(true);

/* ---------- THE ANKYLOSAURUS ---------- */
FX_MOVES['Hammertail'] = {
  dur:700,
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side), dir = k % 2 ? 1 : -1;
    fxAdd({ layer, dur:200, step(L, t){                       // the club's swing, an arc of speed
      const u = Math.min(1, t / 110), cv = t < 130 ? 1 : 1 - (t - 130) / 70, r = at.w * 0.42;
      for(let v = 0; v <= u; v += 0.03){ const an = Math.PI * (0.9 + dir * 0.5) + dir * v * 1.6, x = at.x + Math.cos(an) * r, y = at.y + Math.sin(an) * r * 0.7; fxDisc(L, x, y, 2.5, v > u - 0.15 ? FX_STEEL[0] : FX_STEEL[2], cv); }
    } });
    FX_KIT.Ground.burst(at, layer, { seed:ctx.seed + k, big:1.05 });
  },
  cast(){},
};
FX_MOVES['Seismic Shock'] = {
  dur:900,
  cast(ctx){
    const a = ctx.from;
    fxTargets(ctx).forEach((b, n)=>{                            // a shock running through the ground: it bursts up, hop by hop, to each
      for(let i = 1; i <= 5; i++){
        const u = i / 5, at = { x:a.x + (b.x - a.x) * u, y:a.foot + (b.foot - a.foot) * u, foot:a.foot + (b.foot - a.foot) * u };
        fxLater(30 + n * 30 + i * 55, ()=>{
          fxPuffs('back', at, 2, { seed:ctx.seed + i + n * 7, pal:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[2]], r:2.5 + u * 2, spread:6, rise:10, life:380, stagger:30, thick:0.8 });
          fxSpray('back', fxRockParts(at, 2, { seed:ctx.seed + i * 3 + n, r:1.6 + u, vmin:50, vmax:100, life:400 }), 600);
        });
      }
    });
    fxShake(2, 300);
  },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Ground.burst(at, layer, { seed:ctx.seed + k, big:1.2 }); fxQuakeCrack(layer, at, { seed:ctx.seed + k, big:1.3 }); },
};
FX_MOVES['Steel Soul'] = {
  side:'self', dur:1100, hold:250,
  cast(ctx){
    const id = ctx.fromId, a = ctx.from;
    FX_KIT.Steel.aura(ctx, id, { big:1.3 });
    fxAdd({ layer:'front', dur:1000, step(L, t){             // plates of steel close round it
      const cv = t < 800 ? 1 : 1 - (t - 800) / 200;
      for(let i = 0; i < 6; i++){ const an = i * Math.PI / 3 + 0.3, g = fxEaseOut(Math.min(1, Math.max(0, (t - i * 60) / 200))), r = a.w * (0.75 - 0.3 * g), x = a.x + Math.cos(an) * r, y = a.y + Math.sin(an) * r * 0.75;
        if(g <= 0) continue; const pts = []; for(let j = 0; j < 6; j++){ const b = j * Math.PI / 3; pts.push([x + Math.cos(b) * 5, y + Math.sin(b) * 5]); } fxPolyLined(L, pts, FX_STEEL[2], FX_STEEL[5], cv * 0.85); fxSet(L, Math.round(x - 1), Math.round(y - 2), FX_STEEL[0]); }
    } });
    fxShake(1, 200);
  },
};
function fxRampage(max){
  return {
    dur:1200, hold:max ? 600 : 450,
    cast(ctx){ const a = ctx.from; fxPuffs('back', { x:a.x, y:a.foot }, 10, { seed:ctx.seed, pal:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[3]], r:5, spread:a.w * 1.2, rise:10, life:700, stagger:300 }); fxShake(3, 400); },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side);
      FX_KIT.Ground.burst({ x:at.x, y:at.foot - 4, w:at.w, h:at.h, foot:at.foot }, layer, { seed:ctx.seed + k, big:max ? 1.6 : 1.4 });
      fxGroundRing(layer, at, { cols:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[3]], line:FX_GROUND[5], r0:6, r1:at.w * 0.7, dur:450 });
      fxSpray(layer, fxRockParts({ x:at.x, y:at.foot }, max ? 9 : 6, { seed:ctx.seed + k * 3, r:2.6, vmin:100, vmax:200, life:650 }), 900);
      fxShake(max ? 4 : 3, 130);
    },
  };
}
FX_MOVES['Rampage'] = fxRampage(false);
FX_MOVES['Rampage Max'] = fxRampage(true);

/* ---------- THE CALADRIUS ---------- */
FX_MOVES['Glance'] = {
  dur:700,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const a = { x:ctx.from.x + 4, y:ctx.from.y - ctx.from.h * 0.25 };
    fxAdd({ layer:'back', dur:340, step(L, t){ const u = Math.min(1, t / 110), cv = t < 220 ? 1 : 1 - (t - 220) / 120; fxBeam(L, a, { x:a.x + (b.x - a.x) * u, y:a.y + (b.y - a.y) * u }, 2, FX_ICE, cv); fxStar4(L, a.x, a.y, 4, FX_ICE[0], FX_ICE[0]); } }); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Water.burst(at, layer, { seed:ctx.seed + k, big:0.9 }); fxSpray(layer, fxBurstParts(at.x, at.y, 8, { seed:ctx.seed, vmin:40, vmax:90, drag:3, ramp:[FX_ICE[0], FX_ICE[1], FX_ICE[2]], lmin:200, lmax:400 }), 600); },
};
FX_MOVES['Ice Barrier'] = {
  side:'self', dur:1200,
  cast(ctx){
    fxMine(ctx).forEach(id=>{
      const a = fxAnchor(id); if(!a) return;
      const dir = /^enemy-/.test(id) ? -1 : 1, rnd = fxRand(ctx.seed), sh = [];
      for(let i = 0; i < 6; i++) sh.push({ x:a.x + dir * a.w * 0.36 + (i - 2.5) * 4 * dir, h:a.h * (0.35 + rnd() * 0.35), w:3 + rnd() * 2, lean:(rnd() - 0.5) * 4, d:60 + i * 60 });
      fxAdd({ layer:fxLayerOfId(id), dur:1150, step(L, t){ const cv = t < 900 ? 1 : 1 - (t - 900) / 250; sh.forEach(s=>{ if(t < s.d) return; const g = fxEaseOut(Math.min(1, (t - s.d) / 200)); fxIceShard(L, s.x, a.foot, s.h * g, s.w, s.lean, cv); }); } });
      fxPuffs(fxLayerOfId(id), { x:a.x + dir * a.w * 0.36, y:a.foot - 4 }, 5, { seed:ctx.seed, pal:[FX_ICE[0], FX_ICE[1], FX_ICE[2]], r:4, spread:a.w * 0.4, rise:8, life:600, delay:300 });
    });
  },
};
FX_MOVES['Vita'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxMine(ctx).forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const rnd = fxRand(ctx.seed + n), bits = [];
      for(let i = 0; i < 12; i++){ const plus = i % 3 === 0; bits.push({ x:a.x + (rnd() - 0.5) * a.w * 0.9, y:a.foot - rnd() * a.h * 0.4, vx:(rnd() - 0.5) * 12, vy:-20 - rnd() * 24, life:900, ramp:[0], delay:rnd() * 500,
        draw(L, x, y, u){ const cv = u > 0.75 ? (1 - u) * 4 : 1; if(plus){ fxRect(L, x - 1, y - 3, 2, 7, FX_GRASS[1], cv); fxRect(L, x - 3, y - 1, 7, 2, FX_GRASS[1], cv); } else fxLeaf(L, x + Math.sin(u * 9) * 3, y, 6, Math.sin(u * 7) * 0.8, [FX_ICE[0], FX_ICE[1], FX_ICE[2], FX_ICE[4]], cv); } }); }
      fxSpray('front', bits, 1500);
      for(let i = 0; i < 3; i++) fxAdd({ layer:'back', dur:500 + i * 250, step(L, t){ if(t < i * 250) return; const u = (t - i * 250) / 500; fxRing(L, a.x, a.y, 6 + u * a.w * 0.5, 2, FX_GRASS[1], 1 - u, 0.8); } });
    });
  },
};
FX_MOVES['Conversio'] = {
  side:'self', dur:1500, hold:300,
  cast(ctx){
    const ids = fxMine(ctx), all = ids.length ? ids : [ctx.fromId];
    all.forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      fxAdd({ layer:'back', dur:1400, step(L, t){             // a pillar of light comes down
        const g = fxEaseOut(Math.min(1, t / 300)), cv = t < 1100 ? 1 : 1 - (t - 1100) / 300, w = a.w * 0.3 * g;
        for(let y = 0; y < a.foot; y++) for(let x = -w - 1; x <= w + 1; x++){ const X = Math.round(a.x + x), e = Math.abs(x) / Math.max(1, w); if(!fxCover(X, y, cv * (e > 1 ? 0.6 : 0.85))) continue; fxSet(L, X, y, e > 1 ? FX_GOLD[3] : e > 0.6 ? FX_GOLD[1] : FX_GOLD[0]); }
      } });
      const feathers = [], rnd = fxRand(ctx.seed + n);
      for(let i = 0; i < 12; i++) feathers.push({ x:a.x + (rnd() - 0.5) * a.w, y:-rnd() * 30, vx:(rnd() - 0.5) * 8, vy:40 + rnd() * 30, life:1300, ramp:[0], delay:200 + rnd() * 500,
        draw(L, x, y, u){ fxLeaf(L, x + Math.sin(u * 10) * 3, y, 7, Math.sin(u * 8) * 0.9, [FX_ICE[0], FX_ICE[1], FX_ICE[2], FX_GOLD[4]], u > 0.8 ? (1 - u) * 5 : 1); } });
      fxSpray('front', feathers, 1800);
      fxAdd({ layer:'front', dur:1200, step(L, t){ if(t > 500 && t < 1000) fxGlow(L, id, FX_GOLD[0], 0.4, FX_GOLD[2]); } });
    });
    fxShake(1, 300);
  },
};

/* ---------- THE WHALELORD ---------- */
const FX_ABYSS = [FX_ICE[1], fxRGB('#8fb4ff'), fxRGB('#5a6fd8'), fxRGB('#3a3a9c'), fxRGB('#22205e'), fxRGB('#0e0c2c')];
FX_MOVES['Malice'] = {
  dur:700,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> FX_KIT.Ghost.shot(ctx, fxMuzzle(ctx.from, b), b, { k:0, big:1.1, layer:ctx.side === 'player' ? 'front' : 'back', delay:30 })); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k, big:1.05 }); fxSplash(at, layer, { seed:ctx.seed + k, big:0.7 }); },
};
FX_MOVES['Grudge'] = {
  dur:900,
  cast(ctx){ fxTargets(ctx).forEach((b, n)=>{ const a = fxMuzzle(ctx.from, b); fxTravel('back', a, b, { delay:30 + n * 50, time:300 }, (L, p, u, t)=>{ fxFlameBall(L, p.x, p.y, 5, FX_ABYSS, t, ctx.seed + n, { wob:0.35, up:0.4, cols:[FX_ABYSS[3], FX_ABYSS[2], FX_ABYSS[1], FX_ABYSS[0]], outline:FX_ABYSS[5] }); }); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k, big:1.15 }); fxRingBurst(at, layer, FX_ABYSS, 1); },
};
FX_MOVES['Haunting Aria'] = {
  side:'self', dur:1500,
  cast(ctx){
    const a = ctx.from, rnd = fxRand(ctx.seed), notes = [];
    for(let i = 0; i < 12; i++){ const ang = -0.9 + rnd() * 1.6; notes.push({ x:a.x, y:a.y - a.h * 0.2, vx:Math.cos(ang) * (60 + rnd() * 60), vy:Math.sin(ang) * 40 - 20, life:1100, ramp:[0], drag:0.8, delay:i * 70,
      draw(L, x, y, u){ if(u > 0.8 && !fxCover(Math.round(x), Math.round(y), (1 - u) * 5)) return; fxNote(L, x, y + Math.sin(u * 12) * 3, i % 2 ? FX_ABYSS[1] : FX_GHOST[1], FX_ABYSS[5]); } }); }
    fxSpray('back', notes, 1700);
    for(let i = 0; i < 3; i++) fxAdd({ layer:'back', dur:700 + i * 200, step(L, t){ if(t < i * 200) return; const u = (t - i * 200) / 700; fxRing(L, a.x, a.y - a.h * 0.2, 6 + u * FX.W * 0.5, 2, FX_ABYSS[2], (1 - u) * 0.7, 0.6); } });
  },
};
function fxVengeance(max){
  return {
    dur:1100, hold:max ? 600 : 450,
    cast(ctx){ const a = ctx.from; fxPuffs('back', { x:a.x, y:a.y }, 10, { seed:ctx.seed, pal:[FX_ABYSS[3], FX_ABYSS[4], FX_ABYSS[5]], r:6, spread:a.w, spreadY:a.h * 0.5, rise:6, life:800, stagger:300, thick:0.7 }); fxShake(2, 300); },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side), dx = (k % 3 - 1) * 20;
      fxAdd({ layer, dur:220, step(L, t){                       // a spectral harpoon out of the dark
        const u = Math.min(1, t / 90), cv = t < 150 ? 1 : 1 - (t - 150) / 70, s = { x:at.x + dx - 10, y:-6 }, e = { x:s.x + (at.x - s.x) * u, y:s.y + (at.y - s.y) * u };
        fxBeam(L, s, e, max ? 4 : 3, FX_ABYSS, cv);
        const an = Math.atan2(at.y - s.y, at.x - s.x); fxPolyLined(L, fxRot([[6, 0], [-3, -5], [-1, 0], [-3, 5]], e.x, e.y, an), FX_ABYSS[1], FX_ABYSS[5], cv);
      } });
      fxLater(80, ()=>{ FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.6 : 1.35 }); fxSplash(at, layer, { seed:ctx.seed + k, big:max ? 1.2 : 1 }); fxShake(max ? 4 : 3, 140); });
    },
  };
}
FX_MOVES['Vengeance'] = fxVengeance(false);
FX_MOVES['Vengeance Max'] = fxVengeance(true);

/* ---------- THE MINDCAT ---------- */
const FX_FORGET = [fxRGB('#ffffff'), fxRGB('#cfe6ff'), fxRGB('#8ab8f5'), fxRGB('#5a86d8'), fxRGB('#35539c'), fxRGB('#1a2a52')];
FX_MOVES['Whisker Flick'] = {
  dur:600,
  cast(){},
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    fxAdd({ layer, dur:240, step(L, t){ const u = Math.min(1, t / 90), cv = t < 160 ? 1 : 1 - (t - 160) / 80;
      for(let i = 0; i < 3; i++){ const y0 = at.y - 8 + i * 6; for(let v = 0; v <= u; v += 0.04){ const x = at.x - 18 + v * 36, y = y0 + Math.sin(v * 3.14) * -6; fxDisc(L, x, y, 1, FX_PSY[4], cv); fxSet(L, Math.round(x), Math.round(y), FX_PSY[1]); } } } });
    FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k, big:0.9 });
  },
};
FX_MOVES['Mind Pulse'] = {
  dur:900,
  cast(ctx){ const a = ctx.from; for(let i = 0; i < 3; i++) fxAdd({ layer:'back', dur:600 + i * 100, step(L, t){ if(t < i * 100) return; const u = (t - i * 100) / 600, rr = 8 + u * FX.W * 0.9; fxRing(L, a.x, a.y, rr + 1, 1, FX_PSY[4], (1 - u), 0.7); fxRing(L, a.x, a.y, rr, 2, FX_PSY[i ? 2 : 1], (1 - u), 0.7); } }); },
  impact(ctx, at, k, side){ FX_KIT.Psychic.burst(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.15 }); },
};
function fxForgetMeNot(max){
  return {
    dur:1200, hold:max ? 600 : 450,
    cast(ctx){
      const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), rnd = fxRand(ctx.seed), fl = [];
      for(let i = 0; i < (max ? 12 : 8); i++){ const an = i / (max ? 12 : 8) * Math.PI * 2; fl.push({ an, r:b.w * (0.32 + rnd() * 0.12), d:60 + i * 45 }); }
      ctx.flowers = fl;
      fxAdd({ layer:'back', dur:1000, step(L, t){              // forget-me-nots open round it, turning
        const cv = t < 750 ? 1 : 0;
        fl.forEach(f=>{ if(t < f.d) return; const g = fxEaseOut(Math.min(1, (t - f.d) / 200)), an = f.an + t * 0.002, x = b.x + Math.cos(an) * f.r, y = b.y + Math.sin(an) * f.r * 0.7; fxFlower(L, x, y, 4.5 * g, FX_FORGET[2], FX_GOLD[1], FX_FORGET[5], t * 0.004, cv); });
        if(max && t > 300 && t < 750) for(let j = 0; j < 30; j++){ const f = j / 30, an = f * Math.PI * 4 + t * 0.01, r = 2 + f * 12; fxSet(L, Math.round(b.x + Math.cos(an) * r), Math.round(b.y + Math.sin(an) * r * 0.7), FX_PSY[2]); }
      } });
    },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side), rnd = fxRand(ctx.seed + k), petals = [];
      for(let i = 0; i < (max ? 22 : 14); i++){ const an = rnd() * 6.28, v = 50 + rnd() * 110; petals.push({ x:at.x, y:at.y, vx:Math.cos(an) * v, vy:Math.sin(an) * v - 20, life:700, ramp:[0], grav:80, drag:2.2, delay:rnd() * 60,
        draw(L, x, y, u){ fxDisc(L, x, y, 2, FX_FORGET[4], u > 0.75 ? (1 - u) * 4 : 1); fxDisc(L, x, y, 1.2, FX_FORGET[2], u > 0.75 ? (1 - u) * 4 : 1); } }); }
      fxSpray(layer, petals, 1000);
      FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.6 : 1.35 });
      fxShake(max ? 3 : 2, 150);
    },
  };
}
FX_MOVES['Forget-Me-Not'] = fxForgetMeNot(false);
FX_MOVES['Forget-Me-Not Max'] = fxForgetMeNot(true);

/* ---------- THE GHOST GUARDIAN ---------- */
const FX_SOUL = [fxRGB('#fbf2ff'), fxRGB('#e2b8ff'), fxRGB('#b46cf2'), fxRGB('#7e36c8'), fxRGB('#4a1a80'), fxRGB('#200a3a')];
FX_MOVES['Soulfire Slash'] = {
  dur:650,
  cast(){},
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    fxAdd({ layer, dur:300, step(L, t){ const u = Math.min(1, t / 100), cv = t < 190 ? 1 : 1 - (t - 190) / 110, r = at.w * 0.45;
      for(let v = 0; v <= u; v += 0.02){ const an = -2.4 + v * 2.2, x = at.x + Math.cos(an) * r, y = at.y + 6 + Math.sin(an) * r * 0.8, w = 3.5 * Math.sin(v * Math.PI) + 1; fxDisc(L, x, y, w + 1, FX_SOUL[5], cv); fxDisc(L, x, y, w, FX_SOUL[2], cv); fxSet(L, Math.round(x), Math.round(y), FX_SOUL[0]); } } });
    fxFireBurst(at, layer, { seed:ctx.seed + k, big:0.9, pal:FX_SOUL });
  },
};
FX_MOVES['Purple Pyre'] = {
  dur:1000,
  cast(ctx){
    fxTargets(ctx).forEach((b, n)=>{
      const rnd = fxRand(ctx.seed + n);
      for(let i = 0; i < 5; i++){ const x0 = b.x + (i - 2) * b.w * 0.14, hgt = b.h * (0.35 + rnd() * 0.3), d = 120 + n * 50 + rnd() * 120, life = 620;
        fxAdd({ layer:'back', dur:d + life, step(L, t){ if(t < d) return; const u = (t - d) / life, rise = u < 0.3 ? fxEaseOut(u / 0.3) : 1 - fxEaseIn((u - 0.3) / 0.7) * 0.9; fxTongue(L, x0, b.foot, hgt * rise, 3.5, t, i, FX_SOUL, u > 0.75 ? 1 - (u - 0.75) * 4 : 1); } }); }
    });
  },
  impact(ctx, at, k, side){ fxFireBurst(at, fxLayerFor(side), { seed:ctx.seed + k, big:1, pal:FX_SOUL }); },
};
function fxWraithblade(max){
  return {
    dur:1100, hold:max ? 600 : 450,
    cast(ctx){
      const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), a = fxMuzzle(ctx.from, b), an = Math.atan2(b.y - a.y, b.x - a.x), len = max ? 40 : 32;
      fxAdd({ layer:'back', dur:900, step(L, t){              // a spectral sword: drawn, then driven through
        if(t < 250){ const g = t / 250; fxGlow(L, ctx.fromId, 0, 0, FX_SOUL[2]); const p = { x:a.x, y:a.y - 10 }; fxPolyLined(L, fxRot([[len * g * 0.5, 0], [0, -3], [-6, -3], [-6, 3], [0, 3]], p.x, p.y, -Math.PI / 2), FX_SOUL[1], FX_SOUL[5]); return; }
        const u = Math.min(1, (t - 250) / 160 + 0.0), cv = t < 650 ? 1 : 1 - (t - 650) / 250, tip = { x:a.x + (b.x - a.x) * u * 1.15, y:a.y + (b.y - a.y) * u * 1.15 };
        const blade = [[0, 0], [-len, -3.5], [-len - 4, -6], [-len - 6, 0], [-len - 4, 6], [-len, 3.5]];
        fxPolyLined(L, fxRot(blade, tip.x, tip.y, an), FX_SOUL[1], FX_SOUL[5], cv);
        fxLine(L, tip.x - Math.cos(an) * (len - 2), tip.y - Math.sin(an) * (len - 2), tip.x - Math.cos(an) * 3, tip.y - Math.sin(an) * 3, FX_SOUL[0], 1, cv);
        for(let i = 1; i < 6; i++){ const q = { x:tip.x - Math.cos(an) * (len + 6 + i * 6), y:tip.y - Math.sin(an) * (len + 6 + i * 6) }; fxFlameBall(L, q.x, q.y, 3 - i * 0.4, FX_SOUL, t, ctx.seed + i, { wob:0.4, up:0.4, cols:[FX_SOUL[3], FX_SOUL[2], FX_SOUL[1]], outline:FX_SOUL[5], cover:cv * (1 - i * 0.15) }); }
      } });
    },
    impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxFireBurst(at, layer, { seed:ctx.seed + k, big:max ? 1.6 : 1.35, pal:FX_SOUL }); fxRingBurst(at, layer, FX_SOUL, max ? 1.6 : 1.3, 480); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:0.8 }); fxShake(max ? 4 : 3, 160); },
  };
}
FX_MOVES['Wraithblade'] = fxWraithblade(false);
FX_MOVES['Wraithblade Max'] = fxWraithblade(true);

/* ---------- THE CYBORG ---------- */
FX_MOVES['Second Hand'] = {
  dur:800,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> fxAdd({ layer:'back', dur:420, step(L, t){ const g = fxEaseOut(Math.min(1, t / 120)), cv = t < 330 ? 1 : 1 - (t - 330) / 90; if(cv > 0) fxClock(L, b.x, b.y - b.h * 0.5, 9 * g, t * 0.03, cv); } })); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxAdd({ layer, dur:200, step(L, t){ const u = Math.min(1, t / 80), cv = t < 130 ? 1 : 1 - (t - 130) / 70; fxLine(L, at.x - 16, at.y - 12, at.x - 16 + 32 * u, at.y - 12 + 26 * u, FX_STEEL[5], 3, cv); fxLine(L, at.x - 16, at.y - 12, at.x - 16 + 32 * u, at.y - 12 + 26 * u, FX_STEEL[0], 1, cv); } }); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:0.95 }); },
};
FX_MOVES['Clockwork Crush'] = {
  dur:800,
  cast(){},
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    fxAdd({ layer, dur:420, step(L, t){ const u = Math.min(1, t / 120), cv = t < 300 ? 1 : 1 - (t - 300) / 120, off = 22 * (1 - u) + 7;
      fxGear(L, at.x - off, at.y, 9, t * 0.02, FX_STEEL, cv); fxGear(L, at.x + off, at.y, 9, -t * 0.02 + 0.13, FX_STEEL, cv); } });
    fxLater(110, ()=> FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:1.15 }));
  },
};
FX_MOVES['Time Quake'] = {
  dur:1100, hold:300,
  cast(ctx){ const a = ctx.from; for(let i = 0; i < 4; i++) fxAdd({ layer:'back', dur:700 + i * 120, step(L, t){ if(t < i * 120) return; const u = (t - i * 120) / 700, rr = 8 + u * FX.W; fxRing(L, a.x, a.y, rr + 1, 1, FX_NIGHT[4], 1 - u, 0.65); fxRing(L, a.x, a.y, rr, 2, i % 2 ? FX_PSY[2] : FX_STEEL[1], 1 - u, 0.65); for(let j = 0; j < 12; j++){ const an = j * Math.PI / 6; fxDisc(L, a.x + Math.cos(an) * rr, a.y + Math.sin(an) * rr * 0.65, 1.5, FX_STEEL[0], 1 - u); } } }); fxShake(3, 500); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxAdd({ layer, dur:400, step(L, t){ fxClock(L, at.x, at.y, 10 * Math.min(1, t / 100), -t * 0.05, t < 300 ? 1 : 1 - (t - 300) / 100); } }); FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k, big:1.2 }); },
};
function fxSpacetimeRift(max){
  return {
    dur:1200, hold:max ? 600 : 450,
    cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxAdd({ layer:'back', dur:700, step(L, t){ const g = Math.min(1, t / 400); for(let i = 0; i < 4; i++){ const an = i * 1.57 + t * 0.01, r = (1 - g) * 40 + 4; fxStar4(L, b.x + Math.cos(an) * r, b.y + Math.sin(an) * r, 2, FX_ICE[0], FX_ICE[0]); } } }); fxShake(2, 400); },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side), an = (k * 0.7) % 1.2 - 0.6;
      fxAdd({ layer, dur:800, step(L, t){                     // the tear opens across it, then seals
        const g = t < 140 ? fxEaseOut(t / 140) : t < 520 ? 1 : 1 - (t - 520) / 280;
        fxRift(L, at.x, at.y, (max ? 54 : 44), (max ? 9 : 7) * g, an, ctx.seed + k, t);
        if(max && t > 100) for(let i = 0; i < 5; i++){ const a2 = i * 1.256 + 0.3; fxBolt(L, at.x, at.y, at.x + Math.cos(a2) * 26, at.y + Math.sin(a2) * 20, ctx.seed + i, FX_ICE[1], 1, 3, 4); }
      } });
      FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.5 : 1.3 });
      fxShake(max ? 4 : 3, 160);
    },
  };
}
FX_MOVES['Spacetime Rift'] = fxSpacetimeRift(false);
FX_MOVES['Spacetime Rift Max'] = fxSpacetimeRift(true);
/* (the Unicorn's passive and the Destiny Bond keep their type's art) */

/* ============================================================
   ELITE AND STARTER ULTIMATES — each its own art; a Max is the same, bigger, with a ring more, held a little longer
   ============================================================ */
/* Registers a move and its Max: build(max) → recipe; a held blow and a shake unless the recipe says otherwise. */
function fxSig(name, build, noMax){
  [false, true].forEach(max=>{
    if(max && noMax) return;
    const r = build(max);
    if(r.hold == null) r.hold = max ? 350 : 250;
    r.dur = r.dur || 1000;
    FX_MOVES[max ? name + ' Max' : name] = r;
  });
}
const fxLy = ctx=> ctx.side === 'player' ? 'front' : 'back';
/* the usual ending of a big blow: the type's burst, bigger; a ring; a shake */
function fxBigEnd(type, at, layer, ctx, k, max, pal){ FX_KIT[type].burst(at, layer, { seed:ctx.seed + k * 13, big:max ? 1.6 : 1.4, k }); fxRingBurst(at, layer, pal || fxRamp(type), max ? 1.5 : 1.2, 460); fxShake(max ? 3 : 2, 140); }
/* Something coming straight down out of the sky onto it, drawn as it lands. */
function fxSigSky(type, pal, w){ return max=> ({ cast(ctx){ FX_KIT[type].aura(ctx, ctx.fromId, { big:1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSkyStreak(layer, at, { cols:[pal[0], pal[2], pal[5]], w:(w || 6) * (max ? 1.4 : 1), len:at.y + 10, dx:0, dur:220 }); fxBigEnd(type, at, layer, ctx, k, max, pal); } }); }
/* A beam from its maker: gathering light first. */
function fxSigBeam(type, pal, gather){ return max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), a = fxMuzzle(ctx.from, b), g0 = gather || 220, rnd = fxRand(ctx.seed);
  const motes = []; for(let i = 0; i < 18; i++){ const an = rnd() * 6.28; motes.push({ an, d:20 + rnd() * 24, del:rnd() * 120 }); }
  fxAdd({ layer:fxLy(ctx), dur:g0 + 520, step(L, t){
    if(t < g0){ motes.forEach(m=>{ if(t < m.del) return; const d = m.d * (1 - (t - m.del) / (g0 - m.del)); fxSet(L, Math.round(a.x + Math.cos(m.an) * d), Math.round(a.y + Math.sin(m.an) * d), pal[1]); }); fxDisc(L, a.x, a.y, 2 + t / g0 * 4, pal[1]); return; }
    const cv = t < g0 + 360 ? 1 : 1 - (t - g0 - 360) / 160; fxBeam(L, a, b, (max ? 8 : 6) + Math.sin(t * 0.08), pal, cv, true, t);
  } }); }, impact(ctx, at, k, side){ fxBigEnd(type, at, fxLayerFor(side), ctx, k, max, pal); }, hold:max ? 450 : 350 }); }
/* Slashes across it: n of them, each a dark edge, a colour and a white heart. */
function fxSlashes(at, layer, pal, n, len, seed, wide){
  fxAdd({ layer, dur:340, step(L, t){
    const rnd = fxRand(seed);
    for(let i = 0; i < n; i++){
      const d0 = i * 40; if(t < d0) continue;
      const u = Math.min(1, (t - d0) / 80), cv = t < d0 + 180 ? 1 : 1 - (t - d0 - 180) / 120, an = rnd() * Math.PI, c = Math.cos(an), s = Math.sin(an), ox = (rnd() - 0.5) * 10, oy = (rnd() - 0.5) * 10;
      const x0 = at.x + ox - c * len, y0 = at.y + oy - s * len, x1 = at.x + ox + c * len * (2 * u - 1), y1 = at.y + oy + s * len * (2 * u - 1);
      fxLine(L, x0, y0, x1, y1, pal[5], (wide || 2) + 2, cv); fxLine(L, x0, y0, x1, y1, pal[2], wide || 2, cv); fxLine(L, x0, y0, x1, y1, pal[0], 1, cv);
    }
  } });
}
/* A rush: its maker streaks to the target, a trail of its colour behind. */
function fxRush(ctx, b, pal, layer){
  const a = ctx.from;
  fxAdd({ layer:layer || 'back', dur:300, step(L, t){ const u = Math.min(1, t / 220), cv = 1 - t / 300; for(let i = 0; i < 5; i++){ const off = (i - 2) * 4, x0 = a.x + (b.x - a.x) * u * 0.9, y0 = a.y + (b.y - a.y) * u * 0.9 + off; fxLine(L, x0, y0, x0 - (b.x - a.x) * 0.25, y0 - (b.y - a.y) * 0.25, i === 2 ? pal[0] : pal[2], i === 2 ? 2 : 1, cv); } } });
}
/* Jaws: two crescents snapping shut on it. */
function fxJaws(at, layer, pal, size, ms){
  fxAdd({ layer, dur:ms || 300, step(L, t){ const u = Math.min(1, t / 110), cv = t < 200 ? 1 : 1 - (t - 200) / 100, gap = 14 * (1 - u) + 2;
    fxCrescent(L, at.x, at.y - gap, size, Math.PI / 2, [pal[0], pal[2], pal[3], pal[5]], cv); fxCrescent(L, at.x, at.y + gap, size, -Math.PI / 2, [pal[0], pal[2], pal[3], pal[5]], cv);
    for(let i = -2; i <= 2; i++){ fxPoly(L, [[at.x + i * 4 - 1.5, at.y - gap + size * 0.1], [at.x + i * 4 + 1.5, at.y - gap + size * 0.1], [at.x + i * 4, at.y - gap + size * 0.1 + 4]], pal[0], cv); fxPoly(L, [[at.x + i * 4 - 1.5, at.y + gap - size * 0.1], [at.x + i * 4 + 1.5, at.y + gap - size * 0.1], [at.x + i * 4, at.y + gap - size * 0.1 - 4]], pal[0], cv); } } });
}

/* ---------- the starters ---------- */
fxSig('Waterfall', fxSigSky('Water', FX_WATER, 10));
fxSig('Fire Blast', max=> ({                                  // a fireball, and a great star of fire where it lands
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> fxFireball(ctx, fxMuzzle(ctx.from, b), b, { k:0, delay:40, time:260, r:max ? 8 : 7, layer:fxLy(ctx) })); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side);
    fxAdd({ layer, dur:620, step(L, t){ const g = fxEaseOut(Math.min(1, t / 160)), cv = t < 400 ? 1 : 1 - (t - 400) / 220, len = (max ? 30 : 24) * g;
      [-Math.PI / 2, -Math.PI / 2 + 1.257, -Math.PI / 2 - 1.257, Math.PI / 2 + 0.6, Math.PI / 2 - 0.6].forEach((an, i)=>{ for(let v = 0; v <= 1; v += 0.06){ const x = at.x + Math.cos(an) * len * v, y = at.y + Math.sin(an) * len * v; fxFlameBall(L, x, y, 4.5 * (1 - v * 0.55), FX_FIRE, t, ctx.seed + i * 7 + Math.round(v * 20), { wob:0.3, cols:[FX_FIRE[3], FX_FIRE[2], FX_FIRE[1], FX_FIRE[0]], outline:FX_FIRE[5], cover:cv }); } }); } });
    fxBigEnd('Fire', at, layer, ctx, k, max); },
}));
fxSig('Solar Beam', fxSigBeam('Grass', [FX_GOLD[0], FX_GOLD[1], FX_GRASS[1], FX_GRASS[2], FX_GRASS[3], FX_GRASS[5]], 320));
fxSig('Horn Drill', max=> ({                                  // a spinning drill bores into it
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const a = fxMuzzle(ctx.from, b), an = Math.atan2(b.y - a.y, b.x - a.x);
    fxTravel(fxLy(ctx), a, b, { delay:40, time:260, linear:true, tail:260, each(L, t){ if(t > 300 && t < 560) fxDrill(L, b.x - Math.cos(an) * 8, b.y - Math.sin(an) * 8, an, max ? 16 : 13, t); } }, (L, p, u, t)=> fxDrill(L, p.x, p.y, an, max ? 16 : 13, t)); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSpray(layer, fxRockParts(at, 8, { seed:ctx.seed, r:2, vmin:80, vmax:160, life:500 }), 800); fxSpray(layer, fxBurstParts(at.x, at.y, 10, { seed:ctx.seed + 1, vmin:100, vmax:200, ramp:[FX_ELEC[0], FX_ELEC[1], FX_ELEC[2]], shape:'streak', drag:3, lmin:150, lmax:300 }), 500); fxLater(220, ()=> fxBigEnd('Ground', at, layer, ctx, k, max)); },
}));
function fxDrill(L, x, y, an, len, t){
  const c = Math.cos(an), s = Math.sin(an), pts = [[x, y], [x - c * len - s * len * 0.35, y - s * len + c * len * 0.35], [x - c * len + s * len * 0.35, y - s * len - c * len * 0.35]];
  fxPolyLined(L, pts, FX_STEEL[2], FX_STEEL[5]);
  for(let i = 0; i < 4; i++){ const f = ((i / 4) + t * 0.01) % 1, d = len * f, w = len * 0.35 * f; fxLine(L, x - c * d - s * w, y - s * d + c * w, x - c * d + s * w, y - s * d - c * w, i % 2 ? FX_STEEL[4] : FX_STEEL[0], 1); }
}
fxSig('Thunder', fxSigSky('Electric', FX_ELEC, 7));
FX_MOVES['Thunder'].impact = FX_MOVES['Thunder Max'].impact = function(ctx, at, k, side){ const layer = fxLayerFor(side), max = /Max/.test(ctx.name);
  fxAdd({ layer, dur:260, step(L, t){ const st = (t / 45) | 0; fxZap(L, at.x + 6, 0, at.x, at.y, ctx.seed + st, max ? 5 : 4, 12); fxZap(L, at.x - 14, 0, at.x, at.y - 10, ctx.seed + st + 9, 1, 8); } });
  fxAdd({ layer:'back', dur:90, step(L){ for(let y = 0; y < FX.H; y += 2) for(let x = (y >> 1) & 1; x < FX.W; x += 2) fxSet(L, x, y, FX_ELEC[0]); } });
  fxBigEnd('Electric', at, layer, ctx, k, max); };
fxSig('Storm Dive', fxSigSky('Flying', FX_FLY, 7));
fxSig('Savage Strike', max=> ({ cast(ctx){ FX_KIT.Physical.aura(ctx, ctx.fromId, { big:1.1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side);
  [0, 1, 2].forEach(i=> fxLater(i * 70, ()=> FX_KIT.Physical.burst({ x:at.x + (i - 1) * 9, y:at.y + (i % 2 ? -6 : 4) }, layer, { seed:ctx.seed + i, big:max ? 1.3 : 1.1 }))); fxSlashes(at, layer, FX_PHYS, 3, 18, ctx.seed + k); fxShake(max ? 3 : 2, 150); } }));
fxSig('Umbral Rend', max=> ({ cast(ctx){ FX_KIT.Ghost.aura(ctx, ctx.fromId, { big:1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side);
  fxAdd({ layer, dur:420, step(L, t){ const u = Math.min(1, t / 120), cv = t < 260 ? 1 : 1 - (t - 260) / 160, r = max ? 30 : 24; fxCrescent(L, at.x - r * 0.45 + r * 0.9 * u, at.y, r, 0.25, [FX_GHOST[1], FX_GHOST[4], FX_GHOST[5], FX_GHOST[2]], cv); } });
  fxBigEnd('Ghost', at, layer, ctx, k, max); } }));
fxSig('Mind Shatter', max=> ({ cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> fxAdd({ layer:'back', dur:340, step(L, t){ const g = Math.min(1, t / 200), r = (max ? 18 : 14) * g; const pts = []; for(let i = 0; i < 6; i++){ const an = i * 1.047 + 0.5; pts.push([b.x + Math.cos(an) * r, b.y + Math.sin(an) * r]); } fxPolyLined(L, pts, FX_PSY[1], FX_PSY[4], 0.55); fxLine(L, b.x - r * 0.5, b.y - r * 0.5, b.x, b.y - r * 0.8, FX_ICE[0], 1); } })); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side), rnd = fxRand(ctx.seed + k), sh = [];   // the crystal shatters
    for(let i = 0; i < (max ? 14 : 10); i++){ const an = rnd() * 6.28, v = 80 + rnd() * 120, rot = rnd() * 6; sh.push({ x:at.x, y:at.y, vx:Math.cos(an) * v, vy:Math.sin(an) * v, life:520, ramp:[0], grav:200, drag:1.5, draw(L, x, y, u, c, age){ fxPolyLined(L, fxRot([[0, -4], [3, 2], [-3, 2]], x, y, rot + age * 0.02), FX_PSY[1], FX_PSY[4], u > 0.8 ? (1 - u) * 5 : 1); } }); }
    fxSpray(layer, sh, 800); fxBigEnd('Psychic', at, layer, ctx, k, max); } }));

/* ---------- the elites ---------- */
fxSig('Grand Charge', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_PHYS); fxPuffs('back', { x:ctx.from.x, y:ctx.from.foot }, 6, { seed:ctx.seed, pal:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[2]], r:4, spread:ctx.from.w, rise:8, life:500 }); },
  impact(ctx, at, k, side){ fxBigEnd('Physical', at, fxLayerFor(side), ctx, k, max); fxRingBurst(at, fxLayerFor(side), FX_PHYS, max ? 2 : 1.6, 520); } }));
fxSig('Grave Mischief', max=> ({ cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> fxAdd({ layer:'back', dur:700, step(L, t){ for(let i = 0; i < 3; i++){ const an = t * 0.012 + i * 2.09, r = b.w * 0.4 * (1 - t / 900); fxFlameBall(L, b.x + Math.cos(an) * r, b.y + Math.sin(an) * r * 0.6, 3.5, FX_GHOST, t, ctx.seed + i, { wob:0.3, up:0.4, cols:[FX_GHOST[3], FX_GHOST[2], FX_GHOST[1]], outline:FX_GHOST[5] }); fxSet(L, Math.round(b.x + Math.cos(an) * r - 1), Math.round(b.y + Math.sin(an) * r * 0.6 - 1), FX_GHOST[5]); } } })); },
  impact(ctx, at, k, side){ fxBigEnd('Ghost', at, fxLayerFor(side), ctx, k, max); FX_KIT.Fairy.burst(at, fxLayerFor(side), { seed:ctx.seed + 3, big:0.8 }); } }));
fxSig('Abyssal Gaze', max=> ({ hold:max ? 450 : 350,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const e = { x:b.x, y:Math.max(10, b.y - b.h * 0.85) };
    fxAdd({ layer:'back', dur:760, step(L, t){ const g = Math.min(1, t / 200), cv = t < 600 ? 1 : 1 - (t - 600) / 160;   // an eye opens over it and stares
      fxPaint(L, e.x, e.y, 16, (x, y, d, an, X, Y)=>{ const h = 7 * g * Math.cos(Math.asin(Math.min(1, Math.abs(x) / 15))); if(Math.abs(x) > 15 || Math.abs(y) > h + 1 || !fxCover(X, Y, cv)) return 0; return Math.abs(y) > h ? FX_NIGHT[5] : d < 4 ? FX_NIGHT[5] : d < 6 ? FX_PSY[3] : FX_ICE[1]; });
      if(t > 250) fxBeam(L, e, b, max ? 6 : 4, [FX_PSY[1], FX_PSY[2], FX_NIGHT[2], FX_NIGHT[3], FX_NIGHT[4], FX_NIGHT[5]], cv); } }); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxBigEnd('Psychic', at, layer, ctx, k, max, FX_NIGHT); fxPuffs(layer, at, 6, { seed:ctx.seed, pal:[FX_NIGHT[3], FX_NIGHT[4], FX_NIGHT[5]], r:3, spread:16, rise:4, life:500 }); } }));
fxSig('Slag Eruption', max=> ({ cast(ctx){ fxTargets(ctx).forEach((b, n)=>{ for(let i = 0; i < 4; i++){ const x0 = b.x + (i - 1.5) * b.w * 0.16, d = 80 + n * 60 + i * 40, hgt = b.h * (max ? 0.8 : 0.65);
    fxAdd({ layer:'back', dur:d + 600, step(L, t){ if(t < d) return; const u = (t - d) / 600, rise = u < 0.3 ? fxEaseOut(u / 0.3) : 1 - fxEaseIn((u - 0.3) / 0.7) * 0.9; fxTongue(L, x0, b.foot, hgt * rise, 4, t, i, [FX_FIRE[0], FX_FIRE[1], FX_FIRE[2], FX_SMOKE[2], FX_SMOKE[3], FX_SMOKE[5]], u > 0.75 ? 1 - (u - 0.75) * 4 : 1); } }); }
    fxSpray('back', fxRockParts({ x:b.x, y:b.foot }, 5, { seed:ctx.seed + n, r:2.2, vmin:90, vmax:170, life:600 }), 900); }); },
  impact(ctx, at, k, side){ fxFireBurst(at, fxLayerFor(side), { seed:ctx.seed + k, big:max ? 1.4 : 1.2 }); fxShake(max ? 3 : 2, 120); } }));
fxSig('Tesla Bolt', max=> ({ cast(ctx){ FX_KIT.Electric.aura(ctx, ctx.fromId, { big:1.2 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side), a = ctx.from;
  fxAdd({ layer:'back', dur:200, step(L, t){ const st = (t / 40) | 0; for(let i = 0; i < 3; i++) fxZap(L, a.x, a.y - a.h * 0.2, at.x, at.y, ctx.seed + st * 3 + i, i ? 1 : 2, 10); } }); fxBigEnd('Electric', at, layer, ctx, k, max); } }));
fxSig('Livewire', max=> ({ cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const a = fxMuzzle(ctx.from, b);
    fxAdd({ layer:fxLy(ctx), dur:520, step(L, t){ const u = Math.min(1, t / 160), cv = t < 400 ? 1 : 1 - (t - 400) / 120; for(let v = 0; v <= u; v += 0.01){ const x = a.x + (b.x - a.x) * v, y = a.y + (b.y - a.y) * v + Math.sin(v * 18 - t * 0.04) * 5 * Math.sin(v * Math.PI); fxDisc(L, x, y, 1.6, FX_ELEC[4], cv); fxSet(L, Math.round(x), Math.round(y), FX_ELEC[1]); } } }); }); },
  impact(ctx, at, k, side){ fxSparks(at, fxLayerFor(side), { seed:ctx.seed + k, big:max ? 1.5 : 1.3 }); fxShake(2, 100); } }));
fxSig('Omnislash', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_ELEC); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSlashes(at, layer, [FX_ICE[0], FX_ELEC[1], FX_ELEC[2], FX_ELEC[3], FX_ELEC[4], FX_ELEC[5]], max ? 7 : 5, 20, ctx.seed + k, 2); fxLater(150, ()=> fxBigEnd('Electric', at, layer, ctx, k, max)); } }));
fxSig('Fortress', max=> ({ cast(ctx){ FX_KIT.Steel.aura(ctx, ctx.fromId, { big:1 }); },     // shells lobbed from it, one a strike
  impact(ctx, at, k, side){ const layer = fxLayerFor(side), a = ctx.from;
    fxAdd({ layer:'back', dur:120, step(L, t){ const p = fxArc(a, at, 60)(0.6 + t / 300); fxDisc(L, p.x, p.y, 4, FX_STEEL[5]); fxDisc(L, p.x, p.y, 3, FX_STEEL[3]); fxSet(L, Math.round(p.x - 1), Math.round(p.y - 1), FX_STEEL[0]); } });
    fxSplash(at, layer, { seed:ctx.seed + k, big:max ? 1.4 : 1.2 }); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:0.9 }); fxShake(2, 110); } }));
fxSig('Iaijutsu', max=> ({ cast(ctx){ FX_KIT.Water.aura(ctx, ctx.fromId, { big:1 }); },       // one draw: a white line across, then the cut opens
  impact(ctx, at, k, side){ const layer = fxLayerFor(side);
    fxAdd({ layer, dur:420, step(L, t){ const cv = t < 300 ? 1 : 1 - (t - 300) / 120, len = max ? 40 : 32; if(t < 60){ fxLine(L, at.x - len, at.y + 4, at.x + len, at.y - 4, FX_ICE[0], 1); return; } fxLine(L, at.x - len, at.y + 4, at.x + len, at.y - 4, FX_WATER[5], 5, cv); fxLine(L, at.x - len, at.y + 4, at.x + len, at.y - 4, FX_WATER[1], 3, cv); fxLine(L, at.x - len, at.y + 4, at.x + len, at.y - 4, FX_ICE[0], 1, cv); } });
    fxLater(90, ()=> fxBigEnd('Water', at, layer, ctx, k, max)); } }));
fxSig('Dragon Dive', max=> ({ cast(ctx){ FX_KIT.Dragon.aura(ctx, ctx.fromId, { big:1.1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side);
  fxSkyStreak(layer, at, { cols:[FX_TEAL[0], FX_DRAGON[2], FX_DRAGON[5]], w:max ? 10 : 8, len:at.y + 10, dx:-30, dur:220 }); fxSplash(at, layer, { seed:ctx.seed + k, big:1.2 }); fxBigEnd('Dragon', at, layer, ctx, k, max); } }));
fxSig('Ansatsu', max=> ({ cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> fxAdd({ layer:'back', dur:330, step(L, t){ const cv = t < 260 ? 1 : 0; fxLine(L, b.x - 8, b.y - 8, b.x + 8, b.y + 8, FX_RED[3], 2, cv); fxLine(L, b.x + 8, b.y - 8, b.x - 8, b.y + 8, FX_RED[3], 2, cv); } })); fxPuffs('back', ctx.from, 6, { seed:ctx.seed, pal:[FX_SMOKE[1], FX_SMOKE[2], FX_SMOKE[3]], r:5, spread:ctx.from.w * 0.8, rise:6, life:500 }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSlashes(at, layer, [FX_ICE[0], FX_WATER[1], FX_WATER[3], FX_WATER[4], FX_WATER[5], FX_NIGHT[5]], 2, 24, ctx.seed + k, 3); fxLater(100, ()=> fxBigEnd('Physical', at, layer, ctx, k, max)); } }));
fxSig('Primal Rend', max=> ({ cast(ctx){ FX_KIT.Physical.aura(ctx, ctx.fromId, { big:1.1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side);
  fxAdd({ layer, dur:330, step(L, t){ const u = Math.min(1, t / 100), cv = t < 200 ? 1 : 1 - (t - 200) / 130, flip = k % 2 ? 1 : -1; for(let i = 0; i < 3; i++){ const ox = (i - 1) * 8, len = max ? 22 : 18, x0 = at.x + ox - flip * len * 0.6, y0 = at.y - len, x1 = at.x + ox + flip * len * 0.6, y1 = at.y + len * 0.8, ex = x0 + (x1 - x0) * u, ey = y0 + (y1 - y0) * u; fxLine(L, x0, y0, ex, ey, FX_RED[5], 5, cv); fxLine(L, x0, y0, ex, ey, FX_RED[2], 3, cv); fxLine(L, x0, y0, ex, ey, FX_RED[0], 1, cv); } } });
  FX_KIT.Physical.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.4 : 1.2 }); fxShake(2, 110); } }));
fxSig('Throat Take', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_ELEC); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxJaws(at, layer, FX_ELEC, max ? 15 : 13); fxLater(110, ()=> fxBigEnd('Electric', at, layer, ctx, k, max)); } }));
fxSig('Sky Splitter', max=> ({ hold:max ? 450 : 350,         // the sky splits: a bolt forks down onto every one of them
  cast(ctx){ const foes = fxTargets(ctx), top = { x:foes.length ? foes.reduce((s, p)=> s + p.x, 0) / foes.length : FX.W * 0.6, y:0 };
    fxAdd({ layer:'back', dur:620, step(L, t){ if(t < 200) return; const st = (t / 45) | 0, cv = t < 520 ? 1 : 1 - (t - 520) / 100; const fork = { x:top.x, y:20 }; fxZap(L, top.x, 0, fork.x, fork.y, ctx.seed + st, max ? 4 : 3, 4); foes.forEach((b, i)=> fxZap(L, fork.x, fork.y, b.x, b.y, ctx.seed + st * 5 + i, 2, 8)); } }); },
  impact(ctx, at, k, side){ fxBigEnd('Electric', at, fxLayerFor(side), ctx, k, max); } }));
fxSig('Dragon Drive', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_DRAGON); FX_KIT.Dragon.aura(ctx, ctx.fromId, { big:1 }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxDragonBurst(at, layer, { seed:ctx.seed + k, big:max ? 1.4 : 1.2 }); fxRingBurst(at, layer, FX_DRAGON, 1.2); fxShake(2, 110); } }));
FX_MOVES['Trample'] = { dur:1000, hold:250, cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_STEEL); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Ground.burst({ x:at.x, y:at.foot - 4, w:at.w, h:at.h, foot:at.foot }, layer, { seed:ctx.seed + k, big:1.4 }); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:0.9 }); fxShake(3, 120); } };
fxSig('Fiery Jaws', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_FIRE); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxJaws(at, layer, FX_FIRE, max ? 15 : 13); fxLater(110, ()=> fxBigEnd('Fire', at, layer, ctx, k, max)); } }));
fxSig('Lunacy', max=> ({ hold:max ? 450 : 350,                // a moon rises over it, and madness spirals down
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const m = { x:b.x + 10, y:Math.max(12, b.y - b.h * 0.95) };
    fxAdd({ layer:'back', dur:800, step(L, t){ const g = fxEaseOut(Math.min(1, t / 250)), cv = t < 650 ? 1 : 1 - (t - 650) / 150, r = (max ? 12 : 10) * g;
      fxPaint(L, m.x, m.y, r + 2, (x, y, d, an, X, Y)=>{ if(!fxCover(X, Y, cv)) return 0; const d2 = Math.hypot(x + r * 0.45, y - r * 0.2); if(d > r + 1 || d2 < r * 0.8) return 0; return d > r ? FX_FORGET[5] : FX_GOLD[d < r * 0.5 ? 0 : 1]; });
      if(t > 250) for(let j = 0; j < 40; j++){ const f = j / 40, an = f * Math.PI * 5 + t * 0.012, rr = 2 + f * 14; fxSet(L, Math.round(b.x + Math.cos(an) * rr), Math.round(m.y + 10 + f * (b.y - m.y - 10) + Math.sin(an) * rr * 0.3), f > 0.5 ? FX_PSY[2] : FX_GOLD[1]); } } }); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxBigEnd('Psychic', at, layer, ctx, k, max); fxSplash(at, layer, { seed:ctx.seed, big:0.8 }); } }));
fxSig('Piercing Stoop', max=> ({ cast(ctx){ const a = ctx.from; fxAdd({ layer:'back', dur:420, step(L, t){ const u = t / 420; fxLine(L, a.x, a.y - u * FX.H, a.x, a.y - u * FX.H + 24, FX_GOLD[2], 3, 1 - u); } }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSkyStreak(layer, at, { cols:[FX_GOLD[0], FX_GOLD[1], FX_GOLD[4]], w:max ? 7 : 5, len:at.y + 10, dx:20, dur:200 }); fxBigEnd('Flying', at, layer, ctx, k, max, FX_GOLD); } }));
fxSig('Grave Charge', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), a = fxMuzzle(ctx.from, b), an = Math.atan2(b.y - a.y, b.x - a.x);
    fxTravel(fxLy(ctx), a, b, { delay:60, time:240, linear:true }, (L, p)=>{ fxPolyLined(L, fxRot([[10, 0], [-14, -3], [-14, 3]], p.x, p.y, an), FX_SOUL[1], FX_SOUL[5]); for(let i = 1; i < 5; i++) fxDisc(L, p.x - Math.cos(an) * (14 + i * 4), p.y - Math.sin(an) * (14 + i * 4), 2.5 - i * 0.4, FX_SOUL[2], 1 - i * 0.2); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxBigEnd('Ghost', at, layer, ctx, k, max, FX_SOUL); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:0.9 }); } }));
fxSig('Shadow Rampage', max=> ({ cast(ctx){ fxTargets(ctx).forEach((b, n)=> fxAdd({ layer:'back', dur:700, step(L, t){ const d = 60 + n * 60; if(t < d) return; const u = Math.min(1, (t - d) / 200), cv = t < 560 ? 1 : 1 - (t - 560) / 140;   // threads drop onto each, then jerk
      for(let i = -1; i <= 1; i++){ const x = b.x + i * b.w * 0.2 + Math.sin(t * 0.03 + i) * 2; fxLine(L, x, 0, x, (b.y - b.h * 0.3) * u, FX_GHOST[2], 1, cv); fxRect(L, x - 1, (b.y - b.h * 0.3) * u - 1, 3, 3, FX_GHOST[1], cv); } } })); },
  impact(ctx, at, k, side){ fxBigEnd('Ghost', at, fxLayerFor(side), ctx, k, max); } }));
fxSig('Pounce', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), a = ctx.from, path = fxArc(a, b, 50);
    fxAdd({ layer:'back', dur:320, step(L, t){ const u = Math.min(1, t / 260); for(let v = Math.max(0, u - 0.3); v <= u; v += 0.02){ const p = path(v); fxDisc(L, p.x, p.y, 3, FX_GHOST[4], 0.7); } } }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSlashes(at, layer, FX_GHOST, 3, 16, ctx.seed + k); fxBigEnd('Ghost', at, layer, ctx, k, max); } }));
fxSig('Spirit Pounce', max=> ({ cast(ctx){ FX_KIT.Psychic.aura(ctx, ctx.fromId, { big:1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side), a = ctx.from;
  fxAdd({ layer:'back', dur:160, step(L, t){ const p = fxArc(a, at, 40)(Math.min(1, 0.55 + t / 300)); fxFlameBall(L, p.x, p.y, 5, FX_PSY, t, ctx.seed + k, { wob:0.3, up:0.4, cols:[FX_PSY[3], FX_PSY[2], FX_PSY[1], FX_PSY[0]], outline:FX_PSY[5] }); } });
  FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.4 : 1.2 }); fxShake(1, 100); } }));
fxSig('Pent-up Fury', max=> ({ hold:max ? 450 : 350, cast(ctx){ const id = ctx.fromId; fxAdd({ layer:'front', dur:600, step(L, t){ fxGlow(L, id, FX_RED[2], Math.min(0.6, t / 600), ((t / 60) | 0) % 2 ? FX_RED[3] : FX_RED[1]); } }); FX_KIT.Physical.aura(ctx, id, { big:1.2 }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxBigEnd('Physical', at, layer, ctx, k, max, FX_RED); fxRingBurst(at, layer, FX_PSY, max ? 2 : 1.6, 520); } }));
fxSig('Many-Head Strike', max=> ({ cast(ctx){ FX_KIT.Dragon.aura(ctx, ctx.fromId, { big:1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side), a = ctx.from, off = ((k % 3) - 1) * 26;
  fxAdd({ layer:'back', dur:220, step(L, t){ const u = Math.min(1, t / 110), cv = t < 160 ? 1 : 1 - (t - 160) / 60, s = { x:a.x + off * 0.3, y:a.y - a.h * 0.3 }, c = { x:(s.x + at.x) / 2 + off, y:Math.min(s.y, at.y) - 30 };   // a serpent's neck lunging, head first
    let px = s.x, py = s.y; for(let v = 0; v <= u; v += 0.03){ const x = (1 - v) * (1 - v) * s.x + 2 * (1 - v) * v * c.x + v * v * at.x, y = (1 - v) * (1 - v) * s.y + 2 * (1 - v) * v * c.y + v * v * at.y; fxDisc(L, x, y, 3.5, FX_DRAGON[5], cv); px = x; py = y; }
    for(let v = 0; v <= u; v += 0.03){ const x = (1 - v) * (1 - v) * s.x + 2 * (1 - v) * v * c.x + v * v * at.x, y = (1 - v) * (1 - v) * s.y + 2 * (1 - v) * v * c.y + v * v * at.y; fxDisc(L, x, y, 2.5, FX_PSY[2], cv); }
    fxPolyLined(L, fxRot([[7, 0], [-3, -5], [-3, 5]], px, py, Math.atan2(at.y - c.y, at.x - c.x)), FX_PSY[1], FX_DRAGON[5], cv); } });
  fxLater(90, ()=>{ fxDragonBurst(at, layer, { seed:ctx.seed + k, big:max ? 1.3 : 1.1 }); fxShake(1, 100); }); } }));
fxSig('Blinding Beam', max=> fxSigBeam('Psychic', [FX_ICE[0], FX_ICE[0], FX_GOLD[1], FX_GOLD[2], FX_PSY[3], FX_PSY[5]], 200)(max));
FX_MOVES['Blinding Beam'].impact = FX_MOVES['Blinding Beam Max'].impact = function(ctx, at, k, side){ const layer = fxLayerFor(side), max = /Max/.test(ctx.name);
  fxAdd({ layer:'back', dur:120, step(L){ for(let y = 0; y < FX.H; y += 2) for(let x = (y >> 1) & 1; x < FX.W; x += 2) fxSet(L, x, y, FX_ICE[0]); } });
  fxBigEnd('Psychic', at, layer, ctx, k, max, FX_GOLD); };
fxSig('Copycat', max=> ({ cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> fxAdd({ layer:'back', dur:520, step(L, t){ const g = fxEaseOut(Math.min(1, t / 180)), cv = t < 420 ? 1 : 1 - (t - 420) / 100, w = 12 * g, h = 18 * g, x = (ctx.from.x + b.x) / 2, y = (ctx.from.y + b.y) / 2;   // a mirror between them
    fxPolyLined(L, [[x - w, y - h], [x + w, y - h], [x + w, y + h], [x - w, y + h]], FX_ICE[2], FX_STEEL[5], cv); fxLine(L, x - w + 3, y + h - 3, x + w - 3, y - h + 3, FX_ICE[0], 2, cv); } })); },
  impact(ctx, at, k, side){ fxBigEnd('Psychic', at, fxLayerFor(side), ctx, k, max); } }));
function fxEnchant(ctx){
  const a = ctx.from, id = ctx.fromId;
  fxAdd({ layer:'back', dur:1100, step(L, t){                // a circle of runes beneath, fox fire circling
    const g = fxEaseOut(Math.min(1, t / 300)), cv = t < 850 ? 1 : 1 - (t - 850) / 250, rx = a.w * 0.5 * g;
    fxRing(L, a.x, a.foot, rx + 1, 1, FX_PSY[5], cv, 0.3); fxRing(L, a.x, a.foot, rx, 2, FX_PSY[2], cv, 0.3); fxRing(L, a.x, a.foot, rx * 0.65, 1, FX_FIRE[2], cv, 0.3);
    for(let i = 0; i < 6; i++){ const an = i * 1.047 + t * 0.004; fxStar4(L, a.x + Math.cos(an) * rx * 0.82, a.foot + Math.sin(an) * rx * 0.82 * 0.3, 2, FX_GOLD[1], FX_GOLD[0]); }
  } });
  for(const layer of ['back', 'front']) fxAdd({ layer, dur:1100, step(L, t){ for(let i = 0; i < 3; i++){ const an = t * 0.008 + i * 2.09, s = Math.sin(an); if((s < 0) !== (layer === 'back')) continue; fxFlameBall(L, a.x + Math.cos(an) * a.w * 0.45, a.y - 4 + s * 4, 3.5, FX_PSY, t, ctx.seed + i, { wob:0.35, up:0.5, cols:[FX_FIRE[3], FX_PSY[2], FX_PSY[1], FX_PSY[0]], outline:FX_PSY[5], cover:t > 900 ? 1 - (t - 900) / 200 : 1 }); } } });
}
FX_MOVES['Grand Enchantment'] = { side:'self', dur:1200, cast:fxEnchant };
FX_MOVES['Fiery Enchantment'] = { side:'self', dur:1200, cast:fxEnchant };
fxSig('Dragon Tide', max=> Object.assign({}, FX_MOVES['Tsunami'], { hold:max ? 450 : 350, impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSplash(at, layer, { seed:ctx.seed + k, big:1.2 }); fxDragonBurst(at, layer, { seed:ctx.seed + k, big:max ? 1.1 : 0.9 }); } }));
fxSig('Ion Breach', fxSigBeam('Psychic', [FX_ICE[0], FX_TEAL[1], FX_TEAL[2], FX_PSY[2], FX_PSY[4], FX_NIGHT[5]], 220));
fxSig('Moonbeam Waltz', max=> ({ hold:max ? 450 : 350,          // moonbeams waltz round it, then fall on it
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> fxAdd({ layer:'back', dur:800, step(L, t){ const cv = t < 650 ? 1 : 1 - (t - 650) / 150; for(let i = 0; i < (max ? 4 : 3); i++){ const an = t * 0.008 + i * 6.28 / (max ? 4 : 3), x = b.x + Math.cos(an) * b.w * 0.4 * (1 - t / 1000); fxLine(L, x, 0, x, b.foot, FX_ICE[1], 3, cv * 0.6); fxLine(L, x, 0, x, b.foot, FX_ICE[0], 1, cv); fxStar4(L, x, b.y + Math.sin(an) * 6, 3, FX_GOLD[1], FX_ICE[0]); } } })); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxBigEnd('Fairy', at, layer, ctx, k, max); } }));
fxSig('Claw Barrage', max=> ({ cast(ctx){ FX_KIT.Steel.aura(ctx, ctx.fromId, { big:1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxJaws(at, layer, FX_STEEL, max ? 13 : 11, 240); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.3 : 1.1 }); fxShake(1, 90); } }));

/* ---------- THE NEMESIS (the Wadjet) ---------- */
FX_MOVES['Fang of Night'] = { dur:700, cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_NIGHT, fxLy(ctx)); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxJaws(at, layer, FX_NIGHT, 14); fxLater(110, ()=>{ FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k, big:1.2 }); fxShake(2, 110); }); } };
FX_MOVES['Hood of Dread'] = { side:'self', dur:1200, hold:300,
  cast(ctx){ const a = ctx.from, id = ctx.fromId;
    fxAdd({ layer:fxLayerOfId(id) === 'back' ? 'back' : 'back', dur:1100, step(L, t){   // a cobra's hood flares behind it, its eyes opening
      const g = fxEaseOut(Math.min(1, t / 260)), cv = t < 850 ? 1 : 1 - (t - 850) / 250, rx = a.w * 0.62 * g, ry = a.h * 0.55 * g;
      fxPaint(L, a.x, a.y - a.h * 0.1, Math.max(rx, ry) + 2, (x, y, d, an, X, Y)=>{ const e = (x * x) / (rx * rx + 0.01) + (y * y) / (ry * ry + 0.01); if(e > 1.08 || !fxCover(X, Y, cv)) return 0; return e > 0.92 ? FX_NIGHT[5] : e > 0.6 ? FX_NIGHT[3] : FX_NIGHT[4]; });
      if(t > 300) [-1, 1].forEach(s=>{ const ex = a.x + s * rx * 0.5, ey = a.y - a.h * 0.3; fxDisc(L, ex, ey, 3.5, FX_GOLD[2], cv); fxDisc(L, ex, ey, 1.5, FX_NIGHT[5], cv); });
    } });
    fxShake(2, 300); } };
fxSig('Black Beam', max=> Object.assign(fxSigBeam('Ghost', [FX_PSY[1], FX_NIGHT[1], FX_NIGHT[3], FX_NIGHT[4], FX_NIGHT[5], FX_NIGHT[5]], 260)(max), { hold:max ? 600 : 450 }));
