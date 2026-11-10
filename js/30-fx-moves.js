/* ============================================================
   30-fx-moves.js — THE MOVES WITH ART OF THEIR OWN (4.15)
   The designer: "especially legendary monster signature moves and purchased high to ultra stone moves need special
   art to show they are a tier apart … legendaries get special art to make them feel more special, and perhaps a
   longer screen time to make the animation feel more impactful. consider using a little screen shake for legendary
   power2 and ultimate/max moves too … Elite and starter ultimate moves also get some special attention".
   Each entry of FX_MOVES (by the move's name): `cast(ctx)` at once, `impact(ctx, at, k, side)` on each blow that lands,
   `hold` (ms) to keep the blow back while it plays, `side:'self'` for a cast on its own side. Drawn with the tools and
   the type kits of 29-fx.js.

   (4.16) The designer's notes on the first draft, move by move, are with each below. The screen shakes are no longer
   here: 29-fx.js gives each move its shake as its blows land (fxShakeHit).
   ============================================================ */

/* An Ultra's size (the designer: "can we increase the size of the orb above the heads of the monsters that fires the
   moves by 2x width and height, please? also make the beams and explosions 1.5x bigger each to make it truly feel
   cataclysmic"). */
const FX_ULTRA_ORB = 2, FX_ULTRA_HIT = 1.5;
/* (4.19) The designer: "please reduce the size of the orb of fusion flare and increase the other ultra orb sizes to
   match. maybe reduce the fusion flare orb by 25%?": every Ultra's orb this big (its radius, in the art's pixels) —
   Fusion Flare's sphere three quarters of what it was (22), Vortex Blast's ball (8), Arc Explosion's (16) and Draco
   Meteor's (9) brought up to it; Verdant Nova's flower and Astral Bloom's ring of stars, as big as Fusion Flare's was,
   down with it (four fifths). */
const FX_ULTRA_ORB_R = 16.5;

/* OVERHEAT (Fire's Very High: your whole team runs hot). A ring of heat runs out across the ground, flames burst up
   round each of yours on the field (those behind it, behind it), embers rise — and (4.16, the designer: "can it have
   the monster turn yellow silhouette and have orange shimmering waves move upwards within the silhouette to show the
   buff nature of the move?") each of them turns a yellow silhouette, orange waves rising through it. */
FX_MOVES['Overheat'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_FIRE);
    const ids = fxMine(ctx);
    ids.forEach((id, n)=>{
      const a = fxAnchor(id);
      if(!a) return;
      const rnd = fxRand(ctx.seed + n * 101), base = { x:a.x, y:a.foot };
      fxAdd({ layer:fxUnderOf(id), dur:760, step(L, t){
        const u = fxEaseOut(t / 760), cv = u < 0.66 ? 1 : 1 - (u - 0.66) * 3, rr = 8 + u * a.w * 0.62;
        fxRing(L, base.x, base.y, rr + 1, 1, FX_FIRE[5], cv, 0.3);
        fxRing(L, base.x, base.y, rr, 2, FX_FIRE[u < 0.35 ? 1 : u < 0.7 ? 2 : 3], cv, 0.3);
      } });
      const N = 12;
      for(let i = 0; i < N; i++){
        const ang = (i / N) * Math.PI * 2 + rnd() * 0.4, x0 = base.x + Math.cos(ang) * a.w * 0.38, y0 = base.y + Math.sin(ang) * a.w * 0.1;
        const hgt = a.h * (0.26 + rnd() * 0.3) * (Math.sin(ang) < 0 ? 1.25 : 1), wd = 4 + rnd() * 3, delay = 70 + rnd() * 220, life = 640 + rnd() * 260;
        fxAdd({ layer:Math.sin(ang) < 0 ? fxUnderOf(id) : fxOverOf(id), dur:delay + life, step(L, t){
          if(t < delay) return;
          const u = (t - delay) / life, rise = u < 0.3 ? fxEaseOut(u / 0.3) : 1 - fxEaseIn((u - 0.3) / 0.7) * 0.85;
          fxTongue(L, x0, y0, hgt * rise, wd * (0.6 + 0.4 * rise), t, i, FX_FIRE, u > 0.78 ? 1 - (u - 0.78) * 4.5 : 1);
        } });
      }
      const rising = [];
      for(let i = 0; i < 30; i++) rising.push({ x:base.x + (rnd() - 0.5) * a.w * 0.85, y:base.y - rnd() * a.h * 0.35, vx:(rnd() - 0.5) * 12, vy:-(30 + rnd() * 50),
        life:420 + rnd() * 380, size:1 + (rnd() < 0.25 ? 1 : 0), ramp:[FX_FIRE[1], FX_FIRE[2], FX_FIRE[3], FX_FIRE[4]], drag:0.5, delay:100 + rnd() * 700 });
      fxSpray(fxOverOf(id), rising, 1300);
      fxBuffLook(id, fxBuffOf('Fire'), 1050, 200);
    });
  },
};

/* FUSION FLARE (Fire's Ultra: 5 to 9 strikes on them at random). (4.18, the designer: "the fusion flare lasers still
   have Z position over the fire cloud that shoots them. please change it. also, could we have less of an amorphous fire
   with line radiant effects which feels a bit like a child's drawing, and more of an intense fireball sphere which
   actually radiates bright intense particles? … i do like the gathering energy but can we have those in glowing balls
   and particles instead of lines too?"). Glowing balls of fire and sparks are drawn in to a point just over your
   monster, where a sphere of fire swells — churning, lit from above, white-hot at its heart — throwing off bright sparks
   all the while; each strike a lance of flame from it (under it) to the one struck, the sphere flaring as it fires, and
   a blast there; when the strikes stop it bursts into sparks. */
const FX_SUN = [fxRGB('#fffef4'), fxRGB('#fff3a6'), fxRGB('#ffd447'), fxRGB('#ff9c1f'), fxRGB('#ec5418'), fxRGB('#b0230d'), fxRGB('#5c0b05')];
function fxFireSphere(L, x, y, R, t, flare){
  if(R < 1) return;
  const gw = R / 22;                                                  // (4.19) its glow with it, as it was round a sphere of 22
  fxDisc(L, x, y, R + 8 * gw, FX_SUN[4], 0.18); fxDisc(L, x, y, R + 5 * gw, FX_SUN[3], 0.32); fxDisc(L, x, y, R + 2.5 * gw, FX_SUN[2], 0.55);   // its glow
  const Ri = Math.ceil(R), R2 = R * R, fl = flare || 0;
  for(let dy = -Ri; dy <= Ri; dy++) for(let dx = -Ri; dx <= Ri; dx++){
    const d2 = dx * dx + dy * dy;
    if(d2 > R2) continue;
    const d = Math.sqrt(d2) / R;
    const n = Math.sin(dx * 0.55 + t * 0.013) * Math.sin(dy * 0.5 - t * 0.017) * 0.55 + Math.sin((dx - dy) * 0.31 + t * 0.022) * 0.45;   // its churn
    const v = d * 0.92 - (-dx - dy) / (R * 3.2) - n * 0.12 - fl * 0.25;                                                           // lit from above, left
    fxSet(L, Math.round(x + dx), Math.round(y + dy), v < 0.2 ? FX_SUN[0] : v < 0.4 ? FX_SUN[1] : v < 0.6 ? FX_SUN[2] : v < 0.78 ? FX_SUN[3] : v < 0.92 ? FX_SUN[4] : FX_SUN[5]);
  }
}
FX_MOVES['Fusion Flare'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_FIRE);
    const S = FX_ULTRA_ORB, R0 = FX_ULTRA_ORB_R, rnd = fxRand(ctx.seed), balls = [], motes = [], sparks = [];   // (4.19) 16.5, a quarter less than 4.18's 22
    for(let i = 0; i < 10; i++) balls.push({ ang:rnd() * 6.28, d:(30 + rnd() * 26) * S * 0.8, delay:rnd() * 200, time:240 + rnd() * 120, r:2 + rnd() * 2 });
    for(let i = 0; i < 36; i++) motes.push({ ang:rnd() * 6.28, d:(24 + rnd() * 40) * S * 0.8, delay:rnd() * 260, time:200 + rnd() * 140 });
    let last = 0;
    const host = fxHost(ctx, { r:R0, min:900, end(h){ fxSpray(ctx.foe ? 'back' : 'front', fxBurstParts(h.x, h.y, 46, { seed:ctx.seed + 9, vmin:70, vmax:230, ramp:[FX_SUN[0], FX_SUN[1], FX_SUN[2], FX_SUN[3]], grav:30, drag:2, lmin:240, lmax:620 }), 800); } }, (L, h, t, g, fade)=>{
      const dt = Math.min(0.05, Math.max(0, t - last) / 1000); last = t;
      balls.forEach(b=>{                                             // glowing balls of fire drawn in
        const u = (t - b.delay) / b.time;
        if(u < 0 || u > 1) return;
        const d = b.d * (1 - fxEaseIn(u)), x = h.x + Math.cos(b.ang + u * 0.6) * d, y = h.y + Math.sin(b.ang + u * 0.6) * d * 0.8;
        fxDisc(L, x, y, b.r + 2.5, FX_SUN[3], 0.35); fxDisc(L, x, y, b.r + 0.8, FX_SUN[4]); fxDisc(L, x, y, b.r, FX_SUN[2]); fxDisc(L, x - b.r * 0.3, y - b.r * 0.3, Math.max(1, b.r * 0.5), FX_SUN[0]);
      });
      motes.forEach(m=>{                                             // and sparks
        const u = (t - m.delay) / m.time;
        if(u < 0 || u > 1) return;
        const d = m.d * (1 - fxEaseIn(u)), x = h.x + Math.cos(m.ang) * d, y = h.y + Math.sin(m.ang) * d * 0.8;
        fxSet(L, Math.round(x), Math.round(y), FX_SUN[u < 0.5 ? 2 : 0]); fxSet(L, Math.round(x + Math.cos(m.ang) * 1.5), Math.round(y + Math.sin(m.ang) * 1.2), FX_SUN[3]);
      });
      const fl = h.fired ? Math.max(0, 1 - (performance.now() - h.fired) / 120) : 0;
      const R = R0 * fxEaseOut(Math.min(1, t / 380)) * fade * (1 + 0.05 * Math.sin(t * 0.03) + fl * 0.08);
      if(t > 200 && fade > 0.3){                                     // bright sparks thrown off it all the while, more as it fires
        const n = Math.round(dt * 170 * (1 + fl * 2));
        for(let i = 0; i < n; i++){ const a = rnd() * 6.28, v = 70 + rnd() * 140; sparks.push({ x:h.x + Math.cos(a) * R, y:h.y + Math.sin(a) * R, vx:Math.cos(a) * v, vy:Math.sin(a) * v, age:0, life:220 + rnd() * 300 }); }
      }
      for(let i = sparks.length - 1; i >= 0; i--){
        const p = sparks[i];
        p.age += dt * 1000;
        if(p.age > p.life){ sparks.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.2; p.vy *= 1 - dt * 1.2;
        const u = p.age / p.life, c = FX_SUN[u < 0.25 ? 0 : u < 0.5 ? 1 : u < 0.75 ? 2 : 3];
        fxLine(L, p.x - p.vx * 0.03, p.y - p.vy * 0.03, p.x, p.y, FX_SUN[3], 1, 0.7);
        fxSet(L, Math.round(p.x), Math.round(p.y), c);
        if(u < 0.35) fxSet(L, Math.round(p.x) + 1, Math.round(p.y), c);
      }
      fxFireSphere(L, h.x, h.y, R, t, fl);
    });
    host.fired = 0;
  },
  impact(ctx, at, k, side){
    const h = fxHostHit(ctx), H = FX_ULTRA_HIT, layer = fxLayerFor(side);
    h.fired = performance.now();
    fxAdd({ layer:'back', dur:170, step(L, t){                    // the lance, under the sphere: dark edge, red, yellow, a white heart
      const thin = t > 110 ? 3 : 0;
      fxLine(L, h.x, h.y, at.x, at.y, FX_SUN[5], 11 - thin);
      fxLine(L, h.x, h.y, at.x, at.y, FX_SUN[4], 8 - thin);
      fxLine(L, h.x, h.y, at.x, at.y, FX_SUN[2], 5 - thin);
      if(t < 110) fxLine(L, h.x, h.y, at.x, at.y, FX_SUN[0], 2);
    } });
    fxAdd({ layer, dur:500, step(L, t){                          // the blast: a flash, a cross of light, a ring of heat
      if(t < 70){
        fxDisc(L, at.x, at.y, (9 + t / 7) * H, FX_SUN[0]);
        const len = (14 + t / 2) * H;
        fxLine(L, at.x - len, at.y, at.x + len, at.y, FX_SUN[0], 2);
        fxLine(L, at.x, at.y - len, at.x, at.y + len, FX_SUN[0], 2);
      }
      const u = t / 500, rr = (8 + fxEaseOut(u) * 26) * H;
      fxRing(L, at.x, at.y, rr + 1, 1, FX_SUN[5], 1 - u, 0.8);
      fxRing(L, at.x, at.y, rr, 3, FX_SUN[u < 0.5 ? 2 : 3], 1 - u, 0.8);
    } });
    fxFireBurst(at, layer, { seed:ctx.seed + k * 13, big:1.45 * H });
    fxSpray(layer, fxBurstParts(at.x, at.y, 18, { seed:ctx.seed + k * 7, vmin:120, vmax:260, ramp:[FX_SUN[0], FX_SUN[1], FX_SUN[2]], shape:'streak', drag:3, lmin:160, lmax:340 }), 560);
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
   draw(L, host, t, grow, fade). Each strike sets host.last (fxHostHit). (4.18) The designer: "The firing orb should be
   lower, right above the monster's sprite, and should be higher than the beams on the Z plane": it hangs just over the
   top of its maker's picture (`r` its reach below its middle), drawn over everything there (yours: the front canvas;
   theirs: the back one) and over its own beams (z 1). */
function fxHost(ctx, o, draw){
  const a = ctx.from, r = o.r || 16, top = ctx.fromId ? fxSpriteTop(ctx.fromId) : null;
  const y = top != null ? top - r - 2 : a.y - a.h * (o.up == null ? 0.8 : o.up);
  const host = ctx.host = { x:a.x + (o.dx || 2), y:Math.max(r + 4, y), last:performance.now(), endAt:0 };
  if(o.at) Object.assign(host, o.at(ctx));
  /* (4.18) Gone when the fight lets the Ultra go (fxHostsEnd, from releaseInvert) — or, with nothing to say so (theirs
     with no strikes left, a film of it), once no strike has come for a while. The strikes can come half a second apart
     and more on a busy machine: waiting only 450 ms let an orb (or Devastate's monster) go between two of them. */
  FX.hosts = (FX.hosts || []).filter(h=> !h.gone).concat([host]);
  fxAdd({ layer:o.layer || (ctx.foe ? 'back' : 'front'), z:o.z == null ? 1 : o.z, dur:o.dur || 9000, step(L, t){
    if(!host.endAt && (host.stop ? t > 120 : (t > (o.min || 900) && performance.now() - host.last > (o.idle || 1400)))) host.endAt = t;
    const grow = Math.min(1, t / (o.grow || 300)), fade = host.endAt ? Math.max(0, 1 - (t - host.endAt) / 240) : 1;
    if(fade <= 0){ if(!host.gone){ host.gone = true; if(o.end) o.end(host); } return; }
    draw(L, host, t, grow * fade, fade);
  } });
  return host;
}
function fxHostHit(ctx){ if(ctx.host) ctx.host.last = performance.now(); return ctx.host || { x:ctx.from.x, y:ctx.from.y - 30 }; }
function fxHostsEnd(){ (FX.hosts || []).forEach(h=>{ if(!h.gone) h.stop = true; }); FX.hosts = []; }   // (each one's own art reads its stop)
/* A streak from the sky onto `at`, for what falls on it (drawn as it lands: the fall is too quick to see whole).
   (4.16) From the side it was sent from — the top left onto theirs, the top right onto yours (fxSkyFrom) — and half as
   wide again. o: { side (the side it falls on), cols:[light, mid, edge], w, slant, dur } */
function fxSkyStreak(layer, at, o){
  const s = fxSkyFrom(at, o.side || (layer === 'front' ? 'player' : 'enemy'), o.slant), w = Math.round((o.w || 3) * FX_RAIN_W);
  fxAdd({ layer, dur:o.dur || 180, step(L, t){
    const u = t / (o.dur || 180), cv = 1 - u;
    fxLine(L, s.x, s.y, at.x, at.y, o.cols[2], w + 2, cv);
    fxLine(L, s.x, s.y, at.x, at.y, o.cols[1], w, cv);
    fxLine(L, s.x + (at.x - s.x) * 0.4, s.y + (at.y - s.y) * 0.4, at.x, at.y, o.cols[0], Math.max(1, Math.round(w / 3)), cv);
  } });
  return s;
}
/* (4.16) A drink (Leech Seed's, Giga Drain's, theirs — the designer: "everytime leech seed heals, could bright and light
   green orbs be drained from the enemies' side towards the player's monsters? likewise for giga drain"): bright green
   orbs drawn along a curve from the one drunk from to each it feeds, one after another. The fight calls it as the drink
   lands; it is not a move's art (FX.ctx is left alone). */
const FX_SAP = [fxRGB('#f6ffe8'), fxRGB('#d4ff9e'), fxRGB('#a6f26a'), fxRGB('#6fd24a'), fxRGB('#3f9a34')];
function fxSapOrb(L, x, y, r, cover){
  fxDisc(L, x, y, r + 3, FX_SAP[2], 0.4 * (cover == null ? 1 : cover));
  fxDisc(L, x, y, r + 0.6, FX_SAP[3], cover);
  fxDisc(L, x, y, r, FX_SAP[1], cover);
  fxDisc(L, x - r * 0.3, y - r * 0.3, Math.max(1, r * 0.45), FX_SAP[0], cover);
}
/* (4.20) A GREEN SUN, ITS SOLAR BEAM, ITS BURST (the designer: "could you have green solar beams firing from a bright green
   orb and exploding into bright green balls a la the giga drain particles instead of leaf particles instead?" — Verdant
   Nova's; and Verdant Wrath's, smaller). The sun: an orb of bright green light, shaded from its top left, light churning
   in it, a glow round it (as Fusion Flare's sphere, in green); `flare` 0–1 as it fires. */
function fxGreenSun(L, x, y, r, t, flare){
  if(r < 1) return;
  const fl = flare || 0, R = r * (1 + fl * 0.1);
  fxDisc(L, x, y, R * 1.5, FX_SAP[3], 0.16 + fl * 0.16); fxDisc(L, x, y, R * 1.28, FX_SAP[2], 0.26 + fl * 0.2); fxDisc(L, x, y, R * 1.12, FX_SAP[1], 0.38 + fl * 0.2);   // its light
  fxDisc(L, x, y, R + 0.8, FX_SAP[4]);
  const Ri = Math.ceil(R), R2 = R * R;
  for(let dy = -Ri; dy <= Ri; dy++) for(let dx = -Ri; dx <= Ri; dx++){
    const d2 = dx * dx + dy * dy;
    if(d2 > R2) continue;
    const d = Math.sqrt(d2) / R, n = Math.sin(dx * 0.6 + t * 0.012) * Math.sin(dy * 0.55 - t * 0.015) * 0.5 + Math.sin((dx + dy) * 0.33 - t * 0.02) * 0.5;
    const v = d * 0.9 - (-dx - dy) / (R * 3.2) - n * 0.1 - fl * 0.3;
    fxSet(L, Math.round(x + dx), Math.round(y + dy), v < 0.18 ? FX_SAP[0] : v < 0.42 ? FX_SAP[1] : v < 0.7 ? FX_SAP[2] : v < 0.9 ? FX_SAP[3] : FX_SAP[4]);
  }
}
/* A solar beam from `a` to `b`, `w` wide: a dark green edge, green, light green, white at its heart; it shoots out in
   55 ms, burns, thins and goes. */
function fxSolarBeam(layer, a, b, w, o){
  o = o || {};
  const dur = o.dur || 300, x0 = a.x, y0 = a.y;
  fxAdd({ layer, z:o.z || 0, dur, step(L, t){
    const u = Math.min(1, t / 55), ex = x0 + (b.x - x0) * u, ey = y0 + (b.y - y0) * u;
    const late = t < 160 ? 0 : (t - 160) / (dur - 160), cv = 1 - late, ww = w * (1 - late * 0.6) * (1 + 0.08 * Math.sin(t * 0.09));
    fxLine(L, x0, y0, ex, ey, FX_SAP[3], Math.round(ww + 5), 0.35 * cv);
    fxLine(L, x0, y0, ex, ey, FX_SAP[4], Math.round(ww + 2), cv);
    fxLine(L, x0, y0, ex, ey, FX_SAP[2], Math.round(ww), cv);
    fxLine(L, x0, y0, ex, ey, FX_SAP[1], Math.max(1, Math.round(ww * 0.55)), cv);
    fxLine(L, x0, y0, ex, ey, FX_SAP[0], Math.max(1, Math.round(ww * 0.22)), cv);
  } });
}
/* Where it strikes: a flash, a ring of green light spreading, and bright green balls bursting out — as Giga Drain's
   motes (fxSapOrb), each its own light round it, shrinking as it goes. */
function fxSapBurst(at, layer, o){
  const big = o.big || 1, rnd = fxRand(o.seed || 1), parts = [], n = Math.round(13 * big), rs = Math.sqrt(big);
  fxFlash(layer, at, 9 * big, FX_SAP[0], 70);
  fxAdd({ layer, dur:460, step(L, t){ const u = fxEaseOut(t / 460), rr = (7 + u * 22) * big; fxRing(L, at.x, at.y, rr + 1.5, 2, FX_SAP[4], 1 - u, 0.85); fxRing(L, at.x, at.y, rr, 2, FX_SAP[1], 1 - u, 0.85); } });
  for(let i = 0; i < n; i++){
    const ang = rnd() * 6.28, v = (55 + rnd() * 120) * rs, r = (1.4 + rnd() * 1.8) * rs;
    parts.push({ x:at.x + Math.cos(ang) * 3, y:at.y + Math.sin(ang) * 3, vx:Math.cos(ang) * v, vy:Math.sin(ang) * v * 0.8 - 15, grav:30, drag:2.4, life:420 + rnd() * 380, delay:rnd() * 40, ramp:[0],
      draw(L, x, y, u){ fxSapOrb(L, x, y, r * (1 - u * 0.45), u < 0.65 ? 1 : 1 - (u - 0.65) / 0.35); } });
  }
  fxSpray(layer, parts, 900);
}
function fxDrainOrbs(fromId, toIds, o){
  if(!FX.on || !ui.battle || !fxReady()) return false;
  const a = fxAnchor(fromId);
  if(!a) return false;
  const tos = ((toIds && toIds.length) ? toIds : (/^enemy-/.test(fromId) ? fxYoursIds() : fxFoesIds())).map(id=> fxAnchor(id)).filter(Boolean);
  if(!tos.length) return false;
  const now = performance.now(), n = now - (FX.drainAt || 0) < 300 ? 2 : ((o && o.n) || 5);   // a barrage's drinks: fewer each
  FX.drainAt = now;
  tos.forEach((b, j)=>{
    for(let i = 0; i < n; i++){
      const d = j * 70 + i * 75, life = 560, lift = 22 + (i % 3) * 12 + j * 6, path = fxArc(a, b, lift), r = 4.6 - (i % 2) * 0.9;
      fxAdd({ layer:'front', dur:d + life + 20, step(L, t){
        const u = (t - d) / life;
        if(u < 0 || u > 1) return;
        const p = path(fxEaseIn(u)), q = path(fxEaseIn(Math.max(0, u - 0.06)));
        fxLine(L, q.x, q.y, p.x, p.y, FX_SAP[2], 3, 0.5);
        fxSapOrb(L, p.x, p.y, r, u < 0.12 ? u / 0.12 : 1);
      } });
    }
    fxLater(j * 70 + n * 75 + 460, ()=> fxSpray('front', fxBurstParts(b.x, b.y, 8, { seed:j * 31 + 7, ang:-Math.PI / 2, spread:2.4, vmin:20, vmax:60, grav:-40, drag:1.4, ramp:[FX_SAP[0], FX_SAP[1], FX_SAP[2]], lmin:320, lmax:560 }), 700));
  });
  return true;
}
/* (4.17) A life drawn out (Giga Drain's; the designer: "Let giga drain flash the enemy or enemies (faintly flashing a red
   tint while bright light green particles float to forest fairy and she glows bright green as the particles arrive)").
   The one drunk from flashes a faint red twice; motes of bright light green lift off its body and float across to the
   one drinking, swaying as they come, each a tiny spark where it reaches it; and that one glows bright green as they
   arrive — more of it with each — then fades. o: { seed, n (motes) }. Returns when the last arrives (ms). */
const FX_DRAINRED = fxRGB('#ff2a36');
const FX_DRINKGLOW = [fxRGB('#3fb82e'), fxRGB('#7cf04c'), fxRGB('#b4ff78')];   // a bright green, in three shades
/* A soft light round a sprite: its outline `d` pixels out, `cover` of it (a dither). */
function fxHalo(L, id, c, cover, d){
  const B = fxSpriteBox(id);
  if(!B || cover <= 0) return;
  for(let y = -d; y < B.H + d; y++) for(let x = -d; x < B.W + d; x++){
    if(fxBoxAt(B, x, y) >= 0) continue;
    let near = false;
    for(let k = 1; k <= d && !near; k++) near = fxBoxAt(B, x - k, y) >= 0 || fxBoxAt(B, x + k, y) >= 0 || fxBoxAt(B, x, y - k) >= 0 || fxBoxAt(B, x, y + k) >= 0;
    const X = Math.round(B.x0 + x), Y = Math.round(B.y0 + y);
    if(near && fxCover(X, Y, cover)) fxSet(L, X, Y, c);
  }
}
const FX_DRINK_MS = 700;   // when the first of them reach the one drinking: the fight shows the drink then (fxDrinkMs)
function fxLifeDrain(fromId, toId, o){
  o = o || {};
  const a = fxAnchor(fromId), b = fxAnchor(toId);
  if(!a || !b) return 0;
  const rnd = fxRand(o.seed || 1), n = o.n || 12, motes = [];
  fxAdd({ layer:fxOverOf(fromId), z:-1, dur:840, step(L, t){        // the red, twice, faint
    const pulse = 0.5 - 0.5 * Math.cos(t / 840 * Math.PI * 4);
    fxGlow(L, fromId, FX_DRAINRED, 0.36 * pulse * (1 - t / 840 * 0.35));
  } });
  for(let i = 0; i < n; i++){
    const sx = a.x + (rnd() - 0.5) * a.w * 0.56, sy = a.y - a.h * 0.12 + (rnd() - 0.5) * a.h * 0.5;
    const ex = b.x + (rnd() - 0.5) * b.w * 0.34, ey = b.y - b.h * 0.08 + (rnd() - 0.5) * b.h * 0.34;
    const del = Math.round(i * 34 + rnd() * 60), life = Math.round(590 + rnd() * 230);
    const cx = (sx + ex) / 2 + (rnd() - 0.5) * 70, cy = Math.min(sy, ey) - 18 - rnd() * 34;   // each its own arc
    motes.push({ sx, sy, ex, ey, cx, cy, del, life, wob:1.5 + rnd() * 2.5, ph:rnd() * 6.28, r:1.5 + rnd() * 1, star:rnd() < 0.3 });
  }
  const at = (m, v)=>{ const w = 1 - v; return { x:w * w * m.sx + 2 * w * v * m.cx + v * v * m.ex, y:w * w * m.sy + 2 * w * v * m.cy + v * v * m.ey }; };
  const ease = u=> u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
  const arrive = motes.map(m=> m.del + m.life).sort((x, y)=> x - y), first = arrive[0], last = arrive[arrive.length - 1];
  fxAdd({ layer:'front', dur:last + 160, step(L, t){                  // the motes
    motes.forEach(m=>{
      const u = (t - m.del) / m.life;
      if(u < 0) return;
      if(u > 1){ const k = t - m.del - m.life; if(k < 140) fxStar4(L, m.ex, m.ey, 3 * (1 - k / 140) + 0.5, FX_SAP[0], FX_SAP[0]); return; }   // a spark as it reaches
      const e = ease(u), p = at(m, e), q = at(m, Math.max(0, e - 0.06)), sw = Math.sin(t * 0.011 + m.ph) * m.wob * Math.sin(u * Math.PI);
      const cv = u < 0.14 ? u / 0.14 : 1, x = p.x + sw, y = p.y;
      fxLine(L, q.x + sw * 0.6, q.y, x, y, FX_SAP[2], 1, 0.55 * cv);
      fxDisc(L, x, y, m.r + 2, FX_SAP[2], 0.34 * cv);                    // its light round it
      if(m.star && ((t + m.ph * 100) % 360) < 120) fxStar4(L, x, y, m.r + 2.2, FX_SAP[1], FX_SAP[0]);
      else { fxDisc(L, x, y, m.r + 0.8, FX_SAP[3], cv); fxDisc(L, x, y, m.r, FX_DRINKGLOW[2], cv); fxSet(L, Math.round(x), Math.round(y), FX_SAP[0]); }   // edged, to stand out on a pale sky
    });
  } });
  fxAdd({ layer:fxOverOf(toId), z:-1, dur:last + 560, step(L, t){   // the one drinking, glowing as they come
    if(t < first - 40) return;
    let k = 0;
    while(k < arrive.length && arrive[k] <= t) k++;
    const fill = k / arrive.length, fade = t <= last ? 1 : Math.max(0, 1 - (t - last) / 520), shim = 0.88 + 0.12 * Math.sin(t * 0.028);
    const cv = (0.22 + 0.5 * fill) * fade * shim;
    if(cv <= 0.02) return;
    fxTint(L, toId, { ramp:FX_DRINKGLOW, rim:fill > 0.2 && fade > 0.35 ? FX_SAP[0] : null, cover:cv });   // her own light and dark, in green
    fxHalo(L, toId, FX_DRINKGLOW[1], cv * 0.5, 2);
  } });
  fxLater(last - 60, ()=> fxSpray(fxOverOf(toId), fxBurstParts(b.x, b.y - b.h * 0.1, 10, { seed:(o.seed || 1) + 5, ang:-Math.PI / 2, spread:2.2, vmin:20, vmax:62,
    grav:-36, drag:1.3, ramp:[FX_SAP[0], FX_SAP[1], FX_SAP[2]], lmin:340, lmax:600 }), 800));
  return last;
}
/* (4.17) The drink handed on: a Giga Drain drinks to the one drinking first (her) — when it is another's, its share goes
   on from her to that one as the motes reach her. */
function fxPassDrink(fromId, toIds){
  if(!FX.on || !ui.battle || !fxReady()) return false;
  fxLater(FX_DRINK_MS - 60, ()=> fxDrainOrbs(fromId, toIds, { n:3 }));
  return true;
}
function fxDrinkMs(){ return FX.on && ui.battle && fxReady() ? FX_DRINK_MS : 0; }
/* (4.16) A seedling: a stem, two leaves opening at its top, swaying (Leech Seed). */
function fxSeedling(L, x, y, g, k, cover, t){
  if(g <= 0) return;
  const h = 19 * g, sway = Math.sin(t * 0.008 + k * 1.9) * 2.2 * g, top = { x:x + sway, y:y - h };
  fxLine(L, x, y, top.x, top.y, FX_GRASS[5], 3, cover);
  fxLine(L, x, y, top.x, top.y, FX_GRASS[3], 1, cover);
  const open = Math.min(1, g * 1.3) * 0.75;
  fxLeaf(L, top.x - 5.5 * g, top.y + 1, 11 * g, Math.PI + 0.5 - open, FX_LEAFC, cover);
  fxLeaf(L, top.x + 5.5 * g, top.y + 1, 11 * g, -0.5 + open, FX_LEAFC, cover);
}
/* (4.16) A shield, pointed below (Counter's guard, Spike Armour's, Steel Aegis's): `pal` [light, mid, dark, line]. */
function fxShieldPts(cx, cy, ww, hh){ return [[cx - ww, cy - hh * 0.8], [cx, cy - hh], [cx + ww, cy - hh * 0.8], [cx + ww * 0.9, cy + hh * 0.2], [cx, cy + hh], [cx - ww * 0.9, cy + hh * 0.2]]; }
/* (4.16) HIGH STONES' beam (the designer: "can all twin moves be beam effects coloured appropriate to their type, with
   type-appropriate impact effects a la your current ones? the twin nature is not on one monster, each bolt is singular
   but hits a different monster"): a beam from its maker to the one struck, as the strike lands. */
function fxTwinBeam(ctx, at, pal, o){
  const a = fxMuzzle(ctx.from, at), seed = ctx.seed + (o.k || 0) * 13, w = o.w || 6;
  fxAdd({ layer:ctx.side === 'player' ? 'front' : 'back', dur:320, step(L, t){
    const u = Math.min(1, t / 60), cv = t < 180 ? 1 : 1 - (t - 180) / 140, e = { x:a.x + (at.x - a.x) * u, y:a.y + (at.y - a.y) * u };
    if(o.zap){ fxZap(L, a.x, a.y, e.x, e.y, seed + ((t / 45) | 0), w - 2, 5); return; }
    fxBeam(L, a, e, w + (t < 110 ? 2 : 0), pal, cv, !!o.rings, t);
    if(o.along) o.along(L, a, e, t, seed, cv);
  } });
  fxAdd({ layer:ctx.side === 'player' ? 'front' : 'back', dur:140, step(L, t){ fxDisc(L, a.x, a.y, (w * 0.9) * (1 - t / 140) + 1, pal[0]); } });
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
   HIGH STONES — (4.16) a beam a strike (fxTwinBeam), each to a different one of them, coloured for its type; that
   type's burst and a ring where it lands. (Until 4.16: two shots braided together on each.)
   ============================================================ */
function fxHigh(type, pal, o){
  o = o || {};
  return {
    dur:800,
    cast(ctx){ fxStoneTell(ctx, pal); },                              // a glint where it leaves; each beam goes with its strike
    aura(ctx){ fxStoneTell(ctx, pal); FX_KIT[type].aura(ctx, ctx.fromId, { big:1.2 }); },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side);
      fxTwinBeam(ctx, at, pal, Object.assign({ k }, o));
      FX_KIT[type].burst(at, layer, { seed:ctx.seed + k * 13, big:1.25, k });
      fxRingBurst(at, layer, pal, 1);
    },
  };
}
/* along a beam, a little of its type: what it sheds as it goes */
function fxAlongBeam(make){ return (L, a, e, t, seed, cv)=>{ const rnd = fxRand(seed + ((t / 40) | 0)); for(let i = 0; i < 4; i++){ const f = rnd(); make(L, a.x + (e.x - a.x) * f, a.y + (e.y - a.y) * f, rnd, t, cv); } }; }
FX_MOVES['Twin Blaze'] = fxHigh('Fire', FX_FIRE, { along:fxAlongBeam((L, x, y, rnd, t, cv)=> fxFlameBall(L, x + (rnd() - 0.5) * 6, y - 4 - rnd() * 4, 2.5, FX_FIRE, t, 3, { wob:0.4, up:0.6, cols:[FX_FIRE[3], FX_FIRE[2], FX_FIRE[1]], outline:FX_FIRE[5], cover:cv })) });
FX_MOVES['Twin Torrent'] = fxHigh('Water', FX_WATER, { along:fxAlongBeam((L, x, y, rnd, t, cv)=>{ fxRing(L, x + (rnd() - 0.5) * 8, y + (rnd() - 0.5) * 8, 2.2, 1, FX_WATER[0], cv); }) });
FX_MOVES['Twin Razor'] = fxHigh('Grass', [FX_GRASS[0], FX_GRASS[1], FX_GRASS[2], FX_GRASS[3], FX_GRASS[4], FX_GRASS[5]], { along:fxAlongBeam((L, x, y, rnd, t, cv)=> fxLeaf(L, x, y + (rnd() - 0.5) * 8, 6, rnd() * 6, FX_LEAFC, cv)) });
FX_MOVES['Twin Bolt'] = fxHigh('Electric', FX_ELEC, { zap:true, w:7 });            // a bolt, one to each (the designer: "electric bolts are ok")
FX_MOVES['Twin Boulder'] = fxHigh('Ground', FX_GROUND, { along:fxAlongBeam((L, x, y, rnd, t, cv)=> fxRock(L, x, y + (rnd() - 0.5) * 6, 2.2, rnd() * 6, 5, FX_ROCKC, cv)) });
FX_MOVES['Twin Gale'] = fxHigh('Flying', FX_FLY, { along:fxAlongBeam((L, x, y, rnd, t, cv)=> fxLine(L, x - 5, y + (rnd() - 0.5) * 10, x + 5, y + (rnd() - 0.5) * 10, FX_FLY[0], 1, cv)) });
FX_MOVES['Twin Strike'] = fxHigh('Physical', FX_PHYS, { w:7 });
FX_MOVES['Twin Hex'] = fxHigh('Ghost', FX_GHOST, { along:fxAlongBeam((L, x, y, rnd, t, cv)=> fxDisc(L, x, y - 3 - rnd() * 5, 2.5, FX_GHOST[4], 0.6 * cv)) });
FX_MOVES['Twin Shock'] = fxHigh('Psychic', FX_PSY, { rings:true });
FX_MOVES['Twin Breath'] = fxHigh('Dragon', FX_DRAGON, { along:fxAlongBeam((L, x, y, rnd, t, cv)=> fxFlameBall(L, x + (rnd() - 0.5) * 6, y - 4 - rnd() * 4, 2.5, FX_DRAGON, t, 5, { wob:0.4, up:0.6, cols:[FX_DRAGON[3], FX_DRAGON[2], FX_DRAGON[1]], outline:FX_DRAGON[5], cover:cv })) });
FX_MOVES['Twin Cannon'] = fxHigh('Steel', FX_STEEL, { w:7, along:fxAlongBeam((L, x, y, rnd, t, cv)=> fxSet(L, Math.round(x + (rnd() - 0.5) * 10), Math.round(y + (rnd() - 0.5) * 10), FX_ELEC[1])) });
FX_MOVES['Twin Gleam'] = fxHigh('Fairy', FX_FAIRY, { along:fxAlongBeam((L, x, y, rnd, t, cv)=> fxGlitter(L, x + (rnd() - 0.5) * 10, y + (rnd() - 0.5) * 10, (rnd() * 9) | 0, t, 2.5, cv)) });

/* ============================================================
   VERY HIGH STONES — a cast each of its own (Overheat is above). (4.16) Each one cast on its own side turns its monsters
   a silhouette of its colour with waves rising through it (the designer: "give the silhouette upward shimmer wave
   treatment since it is a buff. do this for buffs, please").
   ============================================================ */
/* ICE TOMB (Water): every one of them frozen, and a chill over their side. (4.16, the designer: "ice tomb is too spiny
   and long to look like ice blocks. can we have it fatter as an ice crystal rising over the enemy sprites as translucent
   layers with sparkle/bloom shimmers?") A great crystal of ice grows up over each of them, a smaller one either side,
   all of it see-through so the frozen one shows inside; its faces catch the light, a shimmer climbs through it and it
   twinkles; frost smokes off it, and snow drifts down over their side. */
const FX_ICE = [fxRGB('#ffffff'), fxRGB('#dff6ff'), fxRGB('#a9e3fb'), fxRGB('#6cb8e6'), fxRGB('#3f7fb8'), fxRGB('#1f3f66')];
function fxIceShard(L, x, y, h, w, lean, cover){
  const pts = [[x - w, y], [x - w * 0.6 + lean * 0.5, y - h * 0.7], [x + lean, y - h], [x + w * 0.7 + lean * 0.4, y - h * 0.6], [x + w, y]];
  fxPolyLined(L, pts, FX_ICE[2], FX_ICE[5], cover);
  fxPoly(L, [[x - w * 0.4, y], [x + lean * 0.8, y - h * 0.9], [x + lean * 0.2, y]], FX_ICE[1], cover);
  fxLine(L, x + lean * 0.9, y - h * 0.95, x + lean * 0.5, y - h * 0.5, FX_ICE[0], 1, cover);
}
/* A crystal standing on `foot`: three faces of a six-sided prism and the three facets of its point, each a see-through
   layer (`thin`: how much of each shows); `shine` 0–1 how far up the shimmer has climbed. */
function fxIceCrystal(L, cx, foot, w, h, lean, thin, shine, cover){
  if(h < 2) return;
  const top = foot - h, cap = Math.min(h * 0.3, w * 1.1), sh = top + cap, fx = cx + lean, k = w * 0.42;
  const P = (x, y)=> [x + lean * (1 - (y - top) / h), y];             // leaning with its height
  const faces = [
    [[P(cx - w, foot), P(cx - w, sh), P(cx - k, sh + cap * 0.18), P(cx - k, foot)], FX_ICE[1], 0.62],
    [[P(cx - k, foot), P(cx - k, sh + cap * 0.18), P(cx + k, sh + cap * 0.18), P(cx + k, foot)], FX_ICE[2], 0.5],
    [[P(cx + k, foot), P(cx + k, sh + cap * 0.18), P(cx + w, sh), P(cx + w, foot)], FX_ICE[3], 0.58],
    [[P(cx - w, sh), [fx, top], P(cx - k, sh + cap * 0.18)], FX_ICE[0], 0.7],
    [[P(cx - k, sh + cap * 0.18), [fx, top], P(cx + k, sh + cap * 0.18)], FX_ICE[1], 0.62],
    [[P(cx + k, sh + cap * 0.18), [fx, top], P(cx + w, sh)], FX_ICE[2], 0.62],
  ];
  faces.forEach(([pts, c, a])=> fxPoly(L, pts, c, a * thin * cover));
  /* its edges: dark round the outside, light down the faces */
  const out = [P(cx - w, foot), P(cx - w, sh), [fx, top], P(cx + w, sh), P(cx + w, foot)];
  for(let i = 0; i + 1 < out.length; i++) fxLine(L, out[i][0], out[i][1], out[i + 1][0], out[i + 1][1], FX_ICE[4], 1, cover);
  [[P(cx - k, foot), P(cx - k, sh + cap * 0.18)], [P(cx + k, foot), P(cx + k, sh + cap * 0.18)], [P(cx - k, sh + cap * 0.18), [fx, top]], [P(cx + k, sh + cap * 0.18), [fx, top]]]
    .forEach(([p, q])=> fxLine(L, p[0], p[1], q[0], q[1], FX_ICE[0], 1, 0.85 * cover));
  /* the shimmer: a band of light climbing through it, a softer glow either side (the bloom) */
  if(shine > 0 && shine < 1){
    const y0 = foot - h * shine, half = y=> (y > sh ? w : w * Math.max(0, (y - top) / cap));
    for(let y = Math.round(y0 - 4); y <= Math.round(y0 + 4); y++){
      const d = Math.abs(y - y0), hw = half(y) - 1;
      if(hw <= 0) continue;
      const sx = lean * (1 - (y - top) / h);
      for(let x = Math.round(cx - hw + sx); x <= Math.round(cx + hw + sx); x++) if(fxCover(x, y, (d < 1.5 ? 0.95 : 0.4) * cover)) fxSet(L, x, y, FX_ICE[0]);
    }
  }
}
FX_MOVES['Ice Tomb'] = {
  side:'self', dur:1400,
  cast(ctx){
    fxStoneTell(ctx, FX_ICE);
    const ids = fxTheirs(ctx), rnd = fxRand(ctx.seed);
    ids.forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const layer = fxOverOf(id), d0 = 140 + n * 90, glints = [];
      for(let i = 0; i < 7; i++) glints.push({ x:(rnd() - 0.5) * a.w * 0.9, y:-rnd() * a.h * 0.95, ph:rnd() * 3 });
      fxAdd({ layer, dur:d0 + 1250, step(L, t){
        if(t < d0) return;
        const u = t - d0, g = fxEaseOut(Math.min(1, u / 380)), cv = u < 950 ? 1 : Math.max(0, 1 - (u - 950) / 300);
        const shine = u < 380 ? 0 : ((u - 380) / 520) % 1;
        fxIceCrystal(L, a.x - a.w * 0.34, a.foot + 1, a.w * 0.17, a.h * 0.62 * g, -a.w * 0.06, 0.85, 0, cv);   // the two smaller, behind
        fxIceCrystal(L, a.x + a.w * 0.34, a.foot + 1, a.w * 0.17, a.h * 0.58 * g, a.w * 0.06, 0.85, 0, cv);
        fxIceCrystal(L, a.x, a.foot + 2, a.w * 0.36, a.h * 1.06 * g, 0, 1, shine, cv);                         // the great one, over it
        if(g >= 1) glints.forEach((s, i)=>{ const ph = (u * 0.004 + s.ph) % 3; if(ph < 0.6) fxStar4(L, a.x + s.x * 0.8, a.foot + s.y, 3.5 * Math.sin(ph / 0.6 * Math.PI) + 0.5, FX_ICE[0], FX_ICE[0]); });
      } });
      fxPuffs(layer, { x:a.x, y:a.foot - 4 }, 7, { seed:ctx.seed + n, pal:[FX_ICE[0], FX_ICE[1], FX_ICE[2]], r:4.5, spread:a.w * 0.9, rise:10, life:700, delay:450, thick:0.5 });
    });
    const side = ctx.foe ? 'player' : 'enemy', dir = side === 'player' ? -1 : 1, flakes = [];   // the snow comes from your side onto theirs
    for(let i = 0; i < 26; i++) flakes.push({ x:FX.W * (side === 'player' ? rnd() * 0.62 : 0.38 + rnd() * 0.62) - dir * 20, y:-4 - rnd() * 30, vx:dir * (6 + rnd() * 6), vy:24 + rnd() * 26, life:1300, ramp:[0], delay:rnd() * 300,
      draw(L, x, y, u){ const sx = x + Math.sin(u * 12 + y) * 2; if(u > 0.85 && !fxCover(Math.round(sx), Math.round(y), (1 - u) * 6.6)) return; fxStar4(L, sx, y, 1.5 * FX_RAIN_W, FX_ICE[0]); fxSet(L, Math.round(sx), Math.round(y), FX_ICE[3]); } });
    fxSpray('back', flakes, 1700);
  },
};

/* LEECH SEED (Grass): a field of seeds. (4.16, the designer: "could we have one green orb projectile fired for each enemy
   sprite, landing on the bottom of each sprite and then sprouting green seedlings in front of each sprite?") A green orb
   thrown to the foot of each of them, bursting there, and seedlings come up in front of it. Each drink after (every
   heal) draws bright green orbs back to your side: fxDrainOrbs, from the fight. */
function fxSeedOrb(L, x, y, r, t){
  fxDisc(L, x, y, r + 1, FX_GRASS[5]);
  fxDisc(L, x, y, r, FX_GRASS[2]);
  fxDisc(L, x - r * 0.3, y - r * 0.3, r * 0.45, FX_GRASS[0]);
  fxLeaf(L, x + 1, y - r - 2, 5, -0.9 + Math.sin(t * 0.03) * 0.3, FX_LEAFC);
}
FX_MOVES['Leech Seed'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_GRASS);
    fxTheirs(ctx).forEach((id, n)=>{
      const b = fxAnchor(id); if(!b) return;
      const a = fxMuzzle(ctx.from, b), land = { x:b.x, y:b.foot - 1 }, t1 = 60 + n * 90, layer = fxOverOf(id);
      fxTravel(ctx.foe ? 'front' : 'back', a, land, { delay:t1, time:330, lift:Math.hypot(land.x - a.x, land.y - a.y) * 0.32 }, (L, p, u, t)=> fxSeedOrb(L, p.x, p.y, 5, t));
      fxLater(t1 + 330, ()=>{
        fxSpray(layer, fxBurstParts(land.x, land.y - 2, 12, { seed:ctx.seed + n, ang:-Math.PI / 2, spread:2.6, vmin:40, vmax:110, grav:260, drag:1, ramp:[FX_GRASS[0], FX_GRASS[1], FX_GRASS[2], FX_GRASS[3]], lmin:260, lmax:480 }), 700);
        fxGroundRing(layer, { x:land.x, y:land.y, foot:land.y }, { cols:[FX_GRASS[1], FX_GRASS[2]], line:FX_GRASS[5], r0:3, r1:b.w * 0.32, dur:420 });
      });
      fxAdd({ layer, dur:t1 + 1300, step(L, t){
        if(t < t1 + 360) return;
        const u = t - t1 - 360, g = fxEaseOut(Math.min(1, u / 420)), cv = u < 720 ? 1 : Math.max(0, 1 - (u - 720) / 220);
        [-1, 0, 1, 2].forEach((s, i)=>{ const gx = s === 2 ? -1.9 : s; fxSeedling(L, land.x + gx * b.w * 0.17, land.y + (s === 0 ? 2 : 0), Math.max(0, g - i * 0.08) * (s === 0 ? 1.15 : 0.85), i, cv, t); });
      } });
    });
  },
};

/* OVERCHARGE (Electric): your side charged. Lightning comes down onto each of yours from above (4.16: from the side it
   was sent from, as all that rains down), crackles round them — and each turns a silhouette of white-gold light, waves
   rising through it (the designer: "overcharge looks good but needs the silhouette upward shimmering waves treatment
   too"). */
FX_MOVES['Overcharge'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_ELEC);
    fxMine(ctx).forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const layer = fxOverOf(id), top = fxSkyFrom(a, /^enemy-/.test(id) ? 'enemy' : 'player', 0.25), t0 = 80 + n * 120;
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
      } });
      fxBuffLook(id, fxBuffOf('Electric'), 1050, t0 + 90);
      fxSpray(layer, fxBurstParts(a.x, a.y, 14, { seed:ctx.seed + n, vmin:80, vmax:180, drag:3, ramp:[FX_ELEC[0], FX_ELEC[1], FX_ELEC[2]], lmin:150, lmax:300, shape:'streak', delay:t0 + 80 }), t0 + 600);
    });
  },
};

/* SPIKE ARMOUR (Ground): spikes of rock burst up in a ring round each of yours, then settle as armour. (4.16, the
   designer: "can we have 1.5x wider bases for the spikes to make them look less spiny? also a shield like counter. also
   give the silhouette upward shimmer wave treatment since it is a buff.") Broader spikes, a shield of stone before each,
   each a silhouette of sandstone, waves rising through it. */
function fxSpike(L, x, y, h, w, lean, pal, cover){
  fxPolyLined(L, [[x - w, y], [x + lean, y - h], [x + w, y]], pal[1], pal[3], cover);
  fxPoly(L, [[x - w * 0.2, y], [x + lean * 0.9, y - h * 0.85], [x + w * 0.6, y]], pal[2], cover);
  fxLine(L, x - w * 0.6, y - 1, x + lean * 0.8, y - h * 0.8, pal[0], 1, cover);
}
/* A guard before one monster, rising: `pal` [light, mid, dark, line], `face` its own colour inside. (4.20, the
   designer: "the three moves with a shield: spike armour, counter and steel aegis should all have the shields placed
   under the monster sprite in Z position (so it looks like the shield is in between the player monster and the enemy
   monsters)": it stands on the canvas between the two sides (fxGuardLayer) — behind one of yours, before one of theirs.) */
const fxGuardLayer = id=> 'back';                                     // under yours (fxUnderOf), over theirs (fxOverOf): both the back canvas
function fxGuard(L, id, a, g, cv, pal, face){
  const dir = /^enemy-/.test(id) ? -1 : 1, cx = a.x + dir * a.w * 0.36, cy = a.y - a.h * 0.04, hh = a.h * 0.42 * g, ww = a.w * 0.2 * g;
  const pts = fxShieldPts(cx, cy, ww, hh);
  fxPolyLined(L, pts, pal[1], pal[3], cv * 0.7);
  fxPoly(L, pts.map(([x, y])=> [cx + (x - cx) * 0.62, cy + (y - cy) * 0.62]), face || pal[0], cv * 0.55);
  return { cx, cy, ww, hh, pts };
}
FX_MOVES['Spike Armour'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_GROUND);
    fxMine(ctx).forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const rnd = fxRand(ctx.seed + n), spikes = [];
      for(let i = 0; i < 9; i++){ const ang = i / 9 * Math.PI * 2 + rnd() * 0.3; spikes.push({ ang, x:a.x + Math.cos(ang) * a.w * 0.44, y:a.foot + Math.sin(ang) * a.w * 0.11, h:a.h * (0.2 + rnd() * 0.15), w:(3 + rnd() * 1.5) * 1.5, d:60 + i * 32 }); }
      for(const behind of [true, false]) fxAdd({ layer:behind ? fxUnderOf(id) : fxOverOf(id), dur:1150, step(L, t){
        spikes.forEach(s=>{
          if((Math.sin(s.ang) < 0) !== behind || t < s.d) return;
          const u = t - s.d, g = u < 140 ? fxEaseOut(u / 140) : u < 600 ? 1 : Math.max(0, 1 - (u - 600) / 300);
          fxSpike(L, s.x, s.y, s.h * g, s.w, Math.cos(s.ang) * 3, FX_ROCKC);
        });
      } });
      fxAdd({ layer:fxGuardLayer(id), dur:1150, step(L, t){         // a shield of stone before it, as Counter's — (4.20) between it and them
        if(t < 180) return;
        const g = fxEaseOut(Math.min(1, (t - 180) / 180)), cv = t < 850 ? 1 : 1 - (t - 850) / 300;
        const s = fxGuard(L, id, a, g, cv, FX_ROCKC, FX_GROUND[0]);
        if(g >= 1) fxRock(L, s.cx, s.cy - s.hh * 0.1, s.ww * 0.45, 0.3, 9, FX_ROCKC, cv);
      } });
      fxBuffLook(id, fxBuffOf('Ground'), 1000, 260);
      fxPuffs(fxUnderOf(id), { x:a.x, y:a.foot }, 6, { seed:ctx.seed + 7, pal:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[2]], r:4, spread:a.w * 0.9, rise:8, life:600, delay:80 });
    });
  },
};

/* MIRAGE (Flying): your side blurs. Copies of each of yours shimmer out to its sides and the air wavers round them; (4.16)
   and each turns a silhouette of sky, waves rising through it. */
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
      fxAdd({ layer:fxUnderOf(id), dur:1250, step(L, t){
        const out = fxEaseOut(Math.min(1, t / 300)), cv = t < 900 ? 0.5 : 0.5 * (1 - (t - 900) / 350);
        fxGhostCopy(L, id, -a.w * 0.32 * out, FX_FLY[2], cv);
        fxGhostCopy(L, id, a.w * 0.32 * out, FX_FLY[1], cv);
        for(let i = 0; i < 4; i++){ const y = a.foot - (i + 0.5) * a.h * 0.22; for(let x = -a.w * 0.5; x < a.w * 0.5; x += 2) if(((x + i * 3 + (t / 30)) | 0) % 7 < 3) fxSet(L, Math.round(a.x + x), Math.round(y + Math.sin(x * 0.4 + t * 0.02) * 1.5), FX_FLY[0]); }
      } });
      fxBuffLook(id, fxBuffOf('Flying'), 1050, 150);
    });
  },
};

/* COUNTER (Physical): a guard. A shield of light flashes up before each of yours, gold edged; (4.16) and each turns a
   silhouette of warm light, waves rising through it. */
FX_MOVES['Counter'] = {
  side:'self', dur:1200,
  cast(ctx){
    fxStoneTell(ctx, FX_PHYS);
    fxMine(ctx).forEach(id=>{
      const a = fxAnchor(id); if(!a) return;
      fxAdd({ layer:fxGuardLayer(id), dur:1000, step(L, t){          // (4.20) between it and them
        const g = fxEaseOut(Math.min(1, t / 160)), cv = t < 700 ? 1 : 1 - (t - 700) / 300;
        const s = fxGuard(L, id, a, g, cv, [FX_PHYS[0], FX_PHYS[1], FX_PHYS[2], FX_PHYS[4]], FX_PHYS[0]);
        if(t > 120 && t < 260) fxLine(L, s.cx - s.ww, s.cy - s.hh * 0.5, s.cx + s.ww, s.cy + s.hh * 0.3, FX_PHYS[0], 2);
      } });
      fxBuffLook(id, fxBuffOf('Physical'), 1000, 120);
      fxGroundRing(fxUnderOf(id), a, { cols:[FX_PHYS[1], FX_PHYS[2], FX_PHYS[3]], line:FX_PHYS[5], r1:a.w * 0.6, dur:650 });
    });
  },
};

/* CURSE (Ghost): their side cursed. A ring of runes turns beneath each of them, purple smoke rises, they darken — and
   (4.16, the designer: "curse can overlay purple on the tops of the enemies' sprites as well") a purple shadow lies
   over the tops of them. */
FX_MOVES['Curse'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_GHOST);
    fxTheirs(ctx).forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const layer = fxOverOf(id);
      fxAdd({ layer:fxUnderOf(id), dur:1250, step(L, t){
        const g = fxEaseOut(Math.min(1, t / 300)), cv = t < 950 ? 1 : 1 - (t - 950) / 300, rx = a.w * 0.48 * g;
        fxRing(L, a.x, a.foot, rx + 1, 1, FX_GHOST[5], cv, 0.3);
        fxRing(L, a.x, a.foot, rx, 2, FX_GHOST[2], cv, 0.3);
        fxRing(L, a.x, a.foot, rx * 0.7, 1, FX_GHOST[3], cv, 0.3);
        for(let i = 0; i < 8; i++){ const ang = i / 8 * Math.PI * 2 + t * 0.003, x = a.x + Math.cos(ang) * rx * 0.85, y = a.foot + Math.sin(ang) * rx * 0.85 * 0.3;
          fxRect(L, x - 1, y - 1, 3, 3, FX_GHOST[1], cv); fxSet(L, Math.round(x), Math.round(y), FX_GHOST[5]); }
      } });
      fxAdd({ layer, z:-1, dur:1250, step(L, t){
        if(t < 300 || t > 1150) return;
        const cv = t < 450 ? (t - 300) / 150 : t > 1000 ? 1 - (t - 1000) / 150 : 1;
        fxGlow(L, id, FX_GHOST[4], (0.3 + 0.12 * Math.sin(t * 0.02)) * cv, FX_GHOST[2]);
        fxTopTint(L, id, FX_GHOST[3], 0.5, 0.85 * cv);
      } });
      fxPuffs(layer, { x:a.x, y:a.foot - 2 }, 8, { seed:ctx.seed + n, pal:[FX_GHOST[2], FX_GHOST[3], FX_GHOST[4]], r:4, spread:a.w * 0.8, rise:16, life:700, delay:200, stagger:300, thick:0.65 });
    });
  },
};

/* DISCOMBOBULATE (Psychic): their side bewildered. Pink rings wash over them, and stars and spirals circle their heads. */
FX_MOVES['Discombobulate'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_PSY);
    const ids = fxTheirs(ctx), mid = ids.length ? ids.map(fxAnchor).filter(Boolean) : [];
    if(mid.length){ const c = { x:mid.reduce((s, p)=> s + p.x, 0) / mid.length, y:mid[0].y };
      for(let i = 0; i < 3; i++) fxAdd({ layer:fxOverOf(ids[0]), dur:700 + i * 120, step(L, t){ if(t < i * 120) return; const u = fxEaseOut((t - i * 120) / 700), rr = 8 + u * FX.W * 0.4; fxRing(L, c.x, c.y, rr + 1, 1, FX_PSY[4], (1 - u) * 0.8, 0.45); fxRing(L, c.x, c.y, rr, 2, FX_PSY[2], (1 - u) * 0.8, 0.45); } }); }
    ids.forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const hy = a.y - a.h * 0.45, layer = fxOverOf(id);
      fxAdd({ layer, dur:1250, step(L, t){
        if(t < 250) return;
        const cv = t < 1000 ? 1 : 1 - (t - 1000) / 250;
        for(let i = 0; i < 3; i++){ const ang = t * 0.008 + i * 2.09; fxStar4(L, a.x + Math.cos(ang) * a.w * 0.3, hy + Math.sin(ang) * 4, 2.5, i ? FX_GOLD[1] : FX_PSY[1], FX_PSY[0]); }
        for(let j = 0; j < 26; j++){ const f = j / 26, ang = f * Math.PI * 4 + t * 0.01, r = 1 + f * 7, X = Math.round(a.x + Math.cos(ang) * r), Y = Math.round(hy - 8 + Math.sin(ang) * r * 0.6); if(fxCover(X, Y, cv)) fxSet(L, X, Y, FX_PSY[3]); }
      } });
    });
  },
};

/* DRAGON DANCE (Dragon): Mach Dragon. (4.16, the designer: "dragon dance should [turn] the monster a bluish-purple
   silhouette the same colour as the dragon fire you've made, and shimmer waves upwards within the silhouette to
   indicate a strengthening. at the same time, have 3 purplish sword silhouettes appear above the monster and dance
   tilting left and right while circling around the monster. the swords should be roughly half the height of a sprite
   and should be positioned not entirely above but rather near the sprite. have the Z layers put the nearest swords
   above the sprite and the furthest swords below the sprite. this can also be used as the animation while violent
   dance is attacking, with dragon-purple claw slashes appearing on the targets hit.") */
function fxSword(L, x, y, h, tilt, cover){
  const c = Math.cos(tilt), s = Math.sin(tilt), P = (dx, dy)=> [x + dx * c - dy * s, y + dx * s + dy * c];   // (dx, dy) up the blade is -dy
  const bw = Math.max(2, h * 0.075), blade = [P(-bw, -h * 0.18), P(-bw, -h * 0.86), P(0, -h), P(bw, -h * 0.86), P(bw, -h * 0.18)];
  fxPolyLined(L, blade, FX_DRAGON[2], FX_DRAGON[5], cover);
  fxLine(L, ...P(0, -h * 0.2), ...P(0, -h * 0.9), FX_DRAGON[1], 1, cover);                                      // its edge catching the light
  fxPolyLined(L, [P(-h * 0.2, -h * 0.2), P(h * 0.2, -h * 0.2), P(h * 0.2, -h * 0.13), P(-h * 0.2, -h * 0.13)], FX_DRAGON[3], FX_DRAGON[5], cover);   // the guard
  fxPolyLined(L, [P(-bw * 0.7, -h * 0.13), P(bw * 0.7, -h * 0.13), P(bw * 0.7, 0), P(-bw * 0.7, 0)], FX_DRAGON[4], FX_DRAGON[5], cover);         // the grip
  fxDisc(L, ...P(0, h * 0.04), Math.max(1.2, bw * 0.8), FX_DRAGON[1], cover);                                   // the pommel
}
/* Three swords dancing round a monster for `dur` ms: the near ones over it, the far ones behind. */
function fxSwordDance(id, dur, delay){
  const a = fxAnchor(id);
  if(!a) return;
  const B = fxSpriteBox(id), seen = B ? (B.mk.bot - B.mk.top + 1) / B.sy : a.h * 0.8;   // its height as it stands, not its picture's square
  const D = dur || 1100, d0 = delay || 0, h = Math.max(14, seen * 0.55), cx = a.x, cy = a.y + h * 0.42, rx = a.w * 0.52, ry = a.w * 0.13;
  for(const near of [false, true]) fxAdd({ layer:near ? fxOverOf(id) : fxUnderOf(id), dur:d0 + D, step(L, t){
    if(t < d0) return;
    const u = t - d0, g = fxEaseOut(Math.min(1, u / 220)), cv = u > D - 200 ? Math.max(0, (D - u) / 200) : 1;
    for(let i = 0; i < 3; i++){
      const ph = u * 0.0062 + i * 2.094, s = Math.sin(ph);
      if((s > 0) !== near) continue;                                                     // the near half of the round is in front
      const x = cx + Math.cos(ph) * rx * g, y = cy + s * ry - Math.sin(u * 0.009 + i) * 3;
      fxSword(L, x, y, h * (0.9 + 0.1 * s) * g, Math.sin(u * 0.011 + i * 1.7) * 0.5, cv);
    }
  } });
}
FX_MOVES['Dragon Dance'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_DRAGON);
    fxMine(ctx).forEach((id, n)=>{
      fxBuffLook(id, fxBuffOf('Dragon'), 1150, 60 + n * 60);
      fxSwordDance(id, 1150, 60 + n * 60);
    });
  },
};
/* VIOLENT DANCE (the Dragon Very High passive's strikes): the dance on the one striking, and dragon-purple claws raked
   across the one struck. */
FX_MOVES['Violent Dance'] = {
  dur:900, window:1600,
  cast(ctx){ if(ctx.fromId){ fxBuffLook(ctx.fromId, fxBuffOf('Dragon'), 900, 0); fxSwordDance(ctx.fromId, 900, 0); } },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side), flip = k % 2 ? 1 : -1;
    fxAdd({ layer, dur:340, step(L, t){
      const u = Math.min(1, t / 100), cv = t < 200 ? 1 : 1 - (t - 200) / 140;
      for(let i = 0; i < 3; i++){
        const ox = (i - 1) * 7, len = 19, x0 = at.x + ox - flip * len * 0.6, y0 = at.y - len, x1 = at.x + ox + flip * len * 0.6, y1 = at.y + len * 0.8, ex = x0 + (x1 - x0) * u, ey = y0 + (y1 - y0) * u;
        fxLine(L, x0, y0, ex, ey, FX_DRAGON[5], 5, cv); fxLine(L, x0, y0, ex, ey, FX_DRAGON[2], 3, cv); fxLine(L, x0, y0, ex, ey, FX_DRAGON[0], 1, cv);
      }
    } });
    fxDragonBurst(at, layer, { seed:ctx.seed + k * 13, big:0.9 });
  },
};

/* STEEL AEGIS (Steel): shields for your team. (4.16, the designer: "steel soul should involve the monster glowing
   completely light grey with a diagonal white bloom like a metallic reflection running through it. use this for steel
   aegis too, and let steel aegis also incorporate a silver grey shield shape that blooms white together with the
   monsters on the field.") Each of yours turns light grey, a bloom of white crossing it; a silver shield stands before
   each, the bloom crossing it with them. */
FX_MOVES['Steel Aegis'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxStoneTell(ctx, FX_STEEL);
    fxMine(ctx).forEach(id=>{
      const a = fxAnchor(id); if(!a) return;
      const D = 1150, d0 = 60;
      fxMetal(id, D, d0);
      fxAdd({ layer:fxGuardLayer(id), dur:d0 + D, step(L, t){         // (4.20) between it and them
        if(t < d0) return;
        const u = t - d0, g = fxEaseOut(Math.min(1, u / 200)), cv = u > D - 220 ? Math.max(0, (D - u) / 220) : 1;
        const s = fxGuard(L, id, a, g, cv, FX_STEELC, FX_STEEL[1]);
        /* the bloom crossing the shield, in step with the one crossing its monster (fxMetal) */
        const pos = ((u - 120) / (D * 0.45)) % 1.0, x0 = s.cx - s.ww, y0 = s.cy - s.hh, span = s.ww * 2 + s.hh * 2 * 0.6, at = -span * 0.15 + pos * span * 1.3;
        for(let y = Math.round(y0); y <= s.cy + s.hh; y++) for(let x = Math.round(x0); x <= s.cx + s.ww; x++){
          const d = Math.abs((x - x0) + (y - y0) * 0.6 - at);
          if(d > 5.5) continue;
          const i = (y * FX.W + x) | 0;
          if(x < 0 || y < 0 || x >= FX.W || y >= FX.H || !L.buf[i]) continue;          // only where the shield is
          if(d < 2.2 || fxCover(x, y, 0.55 * cv)) L.buf[i] = FX_STEEL[0];
        }
      } });
    });
  },
};

/* DIAMOND DUST (Fairy). (4.18, the designer: "for diamond dust, can we remove the laser curtain line that sweeps?
   instead, can we have starry sparkling pink dust fall progressively down through the whole screen from left to right
   for the player and right to left for enemies?"): a fall of pink diamond dust that spreads across the whole field —
   it starts falling at the left edge (theirs: the right) and the fall sweeps across, each speck falling the whole height
   of the screen, twinkling, stars among it catching the light. (4.16: pink, as all that rains down half as big again.) */
FX_MOVES['Diamond Dust'] = {
  side:'self', dur:1700,
  cast(ctx){
    fxStoneTell(ctx, FX_FAIRY);
    const rnd = fxRand(ctx.seed), dust = [], cols = [FX_GLITTER[1], FX_GLITTER[2], FX_GLITTER[3], FX_GLITTER[5]], sweep = 950, ltr = !ctx.foe;
    for(let i = 0; i < 230; i++){
      const f = rnd(), sz = (1.2 + rnd() * 2.6) * FX_RAIN_W, col = cols[i % 4], star = rnd() < 0.22, vy = 150 + rnd() * 80;
      dust.push({ x:(ltr ? f : 1 - f) * (FX.W + 24) - 12, y:-6 - rnd() * 30, vx:(rnd() - 0.5) * 10 + (ltr ? 8 : -8), vy, life:Math.round((FX.H + 50) / vy * 1000), ramp:[0],
        delay:f * sweep + rnd() * 140,                                   // the fall begins where the sweep has reached
        draw(L, X, Y, u, c, age){
          if(u > 0.86 && !fxCover(Math.round(X), Math.round(Y), (1 - u) * 7)) return;
          const tw = Math.abs(Math.sin(age * 0.011 + sz * 3 + i));
          if(star && tw > 0.45) fxStar4(L, X, Y, sz * 1.5 * tw + 1, col, FX_GLITTER[0]);
          else if(tw > 0.72) fxStar4(L, X, Y, sz * tw * 0.8 + 0.5, col, FX_GLITTER[0]);
          else { fxSet(L, Math.round(X), Math.round(Y), col); if(sz > 2.6) fxSet(L, Math.round(X) + 1, Math.round(Y), col); }
        } });
    }
    fxSpray('back', dust.filter((d, i)=> i % 4), 3400);              // most over their side and behind yours…
    fxSpray('front', dust.filter((d, i)=> !(i % 4)), 3400);          // …a quarter in front of everything
  },
};

/* ============================================================
   ULTRA STONES — a host over its maker while 5 to 9 strikes fall, each strike its own blast (Fusion Flare is above).
   (4.16) The host twice the size, the beams and blasts half again (FX_ULTRA_ORB, FX_ULTRA_HIT); what comes out of the
   sky comes from the side it was sent from.
   ============================================================ */
/* VORTEX BLAST (Water): a whirlpool turns over your monster; each strike is a spear of water from it, and a splash. */
FX_MOVES['Vortex Blast'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_WATER);
    const S = FX_ULTRA_ORB;
    /* (4.19) its ball as big as every Ultra's orb, the whirlpool turning round it — wider, its arms thicker, the far
       half behind the ball and the near half in front */
    const RB = FX_ULTRA_ORB_R * 0.95;
    fxHost(ctx, { r:Math.round(RB + 3) }, (L, h, t, g)=>{
      const arms = front=>{ for(let arm = 0; arm < 3; arm++) for(let j = 0; j < 54; j++){
        const f = j / 54, ang = arm * 2.09 + f * 4.2 - t * 0.012, r = (3 + f * 14) * S * g;
        if((Math.sin(ang) >= 0) !== front) continue;
        const X = h.x + Math.cos(ang) * r, Y = h.y + Math.sin(ang) * r * 0.5;
        fxDisc(L, X, Y, (1.6 - f * 0.6) * 2.1, FX_WATER[5]); fxDisc(L, X, Y, (1.6 - f * 0.6) * 1.2, f < 0.3 ? FX_WATER[0] : f < 0.65 ? FX_WATER[1] : FX_WATER[2]);
      } };
      arms(false);
      fxWaterBall(L, h.x, h.y, RB * g + 1, t, ctx.seed, 1, 0.05);
      arms(true);
    });
  },
  impact(ctx, at, k, side){
    const h = fxHostHit(ctx), layer = fxLayerFor(side), H = FX_ULTRA_HIT;
    fxAdd({ layer:'back', dur:170, step(L, t){ const cv = 1 - t / 170; fxLine(L, h.x, h.y, at.x, at.y, FX_WATER[5], Math.round(6 * H), cv); fxLine(L, h.x, h.y, at.x, at.y, FX_WATER[2], Math.round(4 * H), cv); fxLine(L, h.x, h.y, at.x, at.y, FX_WATER[0], 2, cv); } });
    fxSplash(at, layer, { seed:ctx.seed + k * 13, big:1.35 * H });
  },
};

/* VERDANT NOVA (Grass). (4.20, the designer: "could you have green solar beams firing from a bright green orb and
   exploding into bright green balls a la the giga drain particles instead of leaf particles instead?"): a green sun
   swells over your monster, motes of green light drifting off it; each strike a solar beam from it to the one struck,
   the sun flaring as it fires, and there a burst of bright green balls. (Until 4.20 a flower of blades throwing razor
   leaves.) */
FX_MOVES['Verdant Nova'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_GRASS);
    const R = FX_ULTRA_ORB_R, rnd = fxRand(ctx.seed), motes = [];
    let last = 0, acc = 0;
    fxHost(ctx, { r:Math.round(R + 2) }, (L, h, t, g, fade)=>{
      const dt = Math.min(0.05, Math.max(0, t - last) / 1000); last = t;
      const fl = h.fired ? Math.max(0, 1 - (performance.now() - h.fired) / 140) : 0;
      const r = R * fxEaseOut(Math.min(1, t / 360)) * fade * (1 + 0.04 * Math.sin(t * 0.026));
      if(t > 160 && fade > 0.3){                                       // motes of green light drifting off it, more as it fires
        acc += dt * 26 * (1 + fl * 4);
        while(acc >= 1){ acc--; const a = rnd() * 6.28, v = 14 + rnd() * 26; motes.push({ x:h.x + Math.cos(a) * r, y:h.y + Math.sin(a) * r, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 6, age:0, life:520 + rnd() * 420, r:1 + rnd() * 1.1 }); }
      }
      for(let i = motes.length - 1; i >= 0; i--){
        const m = motes[i];
        m.age += dt * 1000;
        if(m.age > m.life){ motes.splice(i, 1); continue; }
        m.x += m.vx * dt; m.y += m.vy * dt;
        const u = m.age / m.life;
        fxSapOrb(L, m.x, m.y, m.r * (1 - u * 0.5), u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3);
      }
      fxGreenSun(L, h.x, h.y, r, t, fl);
    });
  },
  impact(ctx, at, k, side){
    const h = fxHostHit(ctx), H = FX_ULTRA_HIT;
    h.fired = performance.now();
    fxSolarBeam('back', h, at, 6 * H);                                  // under the sun, as every Ultra's beam
    fxLater(40, ()=> fxSapBurst(at, fxLayerFor(side), { seed:ctx.seed + k * 13, big:1.3 * H }));
  },
};

/* ARC EXPLOSION (Electric): a ball of plasma crackles over your monster; each strike is a bolt from it and an
   explosion of sparks. */
FX_MOVES['Arc Explosion'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_ELEC);
    const S = FX_ULTRA_ORB;
    const k = FX_ULTRA_ORB_R / 16;                                     // (4.19) its ball as big as every Ultra's orb (it was 16)
    fxHost(ctx, { r:Math.round(18 * k) }, (L, h, t, g)=>{
      const st = (t / 45) | 0, rnd = fxRand(ctx.seed + st);
      fxDisc(L, h.x, h.y, (7 * g + 1) * S * k, FX_ELEC[4]); fxDisc(L, h.x, h.y, 6 * g * S * k, FX_ELEC[2]); fxDisc(L, h.x, h.y, 4 * g * S * k, FX_ELEC[1]); fxDisc(L, h.x, h.y, 2 * g * S * k, FX_ELEC[0]);
      for(let i = 0; i < 6; i++){ const a1 = rnd() * 6.28; fxZap(L, h.x, h.y, h.x + Math.cos(a1) * 14 * S * k * g, h.y + Math.sin(a1) * 14 * S * k * g, ctx.seed + st * 4 + i, 1, 4); }
    });
  },
  impact(ctx, at, k, side){
    const h = fxHostHit(ctx), layer = fxLayerFor(side), H = FX_ULTRA_HIT;
    fxAdd({ layer:'back', dur:150, step(L, t){ fxZap(L, h.x, h.y, at.x, at.y, ctx.seed + k * 9 + ((t / 50) | 0), Math.round(3 * H), 8); } });
    fxSparks(at, layer, { seed:ctx.seed + k * 13, big:1.5 * H });
    fxRingBurst(at, layer, FX_ELEC, 1.2 * H, 380);
  },
};

/* TECTONIC CRUSH (Ground). (4.18, the designer: "Ground ultra should cause great rock particles to burst with black
   impact rings from the ground, not rain from the top"): the ground shakes under their side; each strike breaks the
   ground open under the one struck — great rocks thrown up round it, tumbling and falling back (some in front of it,
   some behind), earth and dust bursting, black rings spreading out over the ground from where it broke. */
const FX_INK = [fxRGB('#0b090d'), fxRGB('#1d1820'), fxRGB('#3a3040')];
FX_MOVES['Tectonic Crush'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_GROUND);
    fxTheirs(ctx).forEach((id, n)=>{ const a = fxAnchor(id); if(a) fxPuffs(fxOverOf(id), { x:a.x, y:a.foot }, 5, { seed:ctx.seed + n, pal:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[2]], r:4, spread:a.w * 0.9, rise:6, life:500, stagger:200 }); });
  },
  impact(ctx, at, k, side){
    const id = at.id, over = id ? fxOverOf(id) : fxLayerFor(side), under = id ? fxUnderOf(id) : fxUnderFor(side), H = FX_ULTRA_HIT, rnd = fxRand(ctx.seed + k * 31);
    const g = { x:at.x, y:at.foot - 2, foot:at.foot };
    fxAdd({ layer:under, dur:560, step(L, t){                       // black rings out over the ground, behind it…
      const u = fxEaseOut(t / 560);
      for(let i = 0; i < 2; i++){ const rr = (8 + u * (28 + i * 16)) * H; fxRing(L, g.x, g.foot, rr + 2, 2, FX_INK[2], (1 - u) * (1 - i * 0.35), 0.3); fxRing(L, g.x, g.foot, rr, 4 - i, FX_INK[0], (1 - u) * (1 - i * 0.35), 0.3); }
    } });
    fxAdd({ layer:over, dur:240, step(L, t){                        // …and the break itself, black, in front of its feet
      const u = fxEaseOut(t / 240), rr = (5 + u * 18) * H;
      fxRing(L, g.x, g.foot, rr, 3, FX_INK[0], 1 - u, 0.3);
      for(let i = 0; i < 6; i++){ const a = i * 1.047 + k, l = rr * 1.25; fxLine(L, g.x + Math.cos(a) * rr * 0.3, g.foot + Math.sin(a) * rr * 0.1, g.x + Math.cos(a) * l, g.foot + Math.sin(a) * l * 0.3, FX_INK[1], 2, 1 - u); }
    } });
    const rocks = [];
    for(let i = 0; i < 9; i++){                                     // great rocks thrown up
      const a = -Math.PI / 2 + (rnd() - 0.5) * 2.2, v = 150 + rnd() * 170, sz = (4 + rnd() * 5) * H, rot0 = rnd() * 6, spin = (rnd() - 0.5) * 0.02;
      rocks.push({ x:g.x + (rnd() - 0.5) * at.w * 0.5, y:g.foot - 2, vx:Math.cos(a) * v * 0.8, vy:Math.sin(a) * v, life:640 + rnd() * 220, ramp:[0], grav:640, drag:0.15, delay:rnd() * 60,
        draw(L, x, y, u, c, age){ fxRock(L, x, y, sz, rot0 + age * spin, ctx.seed + k * 7 + i, FX_ROCKC, u > 0.8 ? (1 - u) * 5 : 1); } });
    }
    fxSpray(over, rocks.filter((r, i)=> i % 2 === 0), 1000);
    fxSpray(under, rocks.filter((r, i)=> i % 2 === 1), 1000);
    FX_KIT.Ground.burst(g, over, { seed:ctx.seed + k * 13, big:1.35 * H });
    fxPuffs(over, g, 7, { seed:ctx.seed + k * 5, pal:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[3]], r:5 * H, spread:at.w * 0.9, rise:14, life:620, stagger:80 });
  },
};

/* SONIC SKYDIVE (Flying). (4.18, the designer: "Sonic skydive makes the player's monster sprite glow and then shoot up
   into the sky, then its inverted front sprite as a grey blue silhouette strikes diagonally downwards from enemy monster
   top left onto each one it hits, causing an impact wave on each hit. It fades out after each strike and trails
   afterimages as it flies downwards onto each enemy."): your monster glows, then shoots up off the top of the screen,
   images of it trailing; each strike, a grey-blue silhouette of it, upside down and head first, dives out of the sky
   from above the one struck on its left (theirs: its right) onto it, images of it trailing, a wave of air bursting out
   where it strikes, and fades; after the last it comes back where it stood. */
const FX_SKYSIL = [fxRGB('#46557a'), fxRGB('#7b8db2'), fxRGB('#b9c8e2')];
FX_MOVES['Sonic Skydive'] = {
  dur:900, window:6500, hold:420,
  cast(ctx){
    fxStoneTell(ctx, FX_FLY);
    const id = ctx.fromId, a = id ? fxSpriteMid(id) : null;
    if(!id || !a) return;
    fxFrontImg(id);                                                    // its front, loading for the dive
    fxAdd({ layer:fxOverOf(id), z:-1, dur:320, step(L, t){ fxTint(L, id, { ramp:[FX_FLY[2], FX_FLY[1], FX_FLY[0]], rim:FX_FLY[0], cover:Math.min(1, t / 220) }); } });   // it glows
    fxLater(300, ()=>{ ctx.hidden = fxSpriteHide(id, 40, 9000); });
    const climb = a.y + a.h * 0.6 + 30;
    fxAdd({ layer:fxOverOf(id), z:1, dur:640, step(L, t){             // and shoots up into the sky, images trailing
      if(t < 300) return;
      const u = fxEaseIn(Math.min(1, (t - 300) / 300));
      for(let j = 4; j >= 0; j--){ const v = Math.max(0, u - j * 0.09); if(j && v <= 0) continue; fxSpriteAt(L, id, a.x, a.y - v * climb, { ramp:[FX_FLY[2], FX_FLY[1], FX_FLY[0]], cover:j ? 0.5 - j * 0.09 : 1 }); }
    } });
    fxHost(ctx, { r:0, z:-1, min:800, end(){ fxSpriteShow(id, 260, ctx.hidden); } }, ()=>{});   // back when the dives are done
  },
  impact(ctx, at, k, side){
    fxHostHit(ctx);
    const id = ctx.fromId, over = at.id ? fxOverOf(at.id) : fxLayerFor(side), H = FX_ULTRA_HIT, dir = ctx.foe ? -1 : 1;
    const end = { x:at.x, y:at.y - at.h * 0.05 }, s0 = { x:end.x - dir * at.w * 1.5, y:end.y - at.h * 1.8 };    // from above it, on its left
    const rot = Math.atan2(end.y - s0.y, end.x - s0.x) - Math.PI / 2, front = fxFrontImg(id);                 // head first along the dive, seen from the front
    fxAdd({ layer:over, z:1, dur:300, step(L, t){
      const u = Math.min(1, 0.4 + t / 70 * 0.6), cv = t < 90 ? 1 : Math.max(0, 1 - (t - 90) / 170);
      for(let j = 4; j >= 0; j--){
        const v = u - j * 0.12;
        if(v < 0) continue;
        const p = { x:s0.x + (end.x - s0.x) * v, y:s0.y + (end.y - s0.y) * v };
        fxSpriteAt(L, id, p.x, p.y, { img:front, ramp:FX_SKYSIL, flipY:true, rot, cover:(j ? 0.55 - j * 0.1 : 1) * cv, edge:j ? null : FX_FLY[4] });
      }
    } });
    fxAdd({ layer:over, dur:420, step(L, t){                        // the wave of air where it strikes
      if(t < 40) return;
      const u = fxEaseOut((t - 40) / 380);
      for(let i = 0; i < 3; i++){ const rr = (6 + u * (16 + i * 8)) * H; fxRing(L, end.x, end.y + i * 3, rr + 1, 1, FX_FLY[4], (1 - u) * (1 - i * 0.25), 0.45); fxRing(L, end.x, end.y + i * 3, rr, 3, FX_FLY[1], (1 - u) * (1 - i * 0.25), 0.45); }
    } });
    fxLater(40, ()=> FX_KIT.Flying.burst(at, over, { seed:ctx.seed + k * 13, big:1.25 * H }));
  },
};

/* DEVASTATE (Physical). (4.18, the designer: "make the monster glow intense reddish then fade out and reappear on the
   enemy side, causing an explosion as it lands multiple times on each monster (above them and the explosion in Z value:
   player's monster, then the enemy monster's, then an expanding impact ring"): your monster glows an intense red and
   fades away; each strike it reappears over the one struck and comes down on it — itself in front, the one struck under
   it, the blast and a ring spreading out behind them both — and is gone again; after the last it is back where it stood.
   Theirs on yours the same. */
FX_MOVES['Devastate'] = {
  dur:900, window:6500, hold:300,
  cast(ctx){
    fxStoneTell(ctx, FX_PHYS);
    const id = ctx.fromId, a = id ? fxSpriteMid(id) : null;
    if(!id || !a) return;
    fxAdd({ layer:fxOverOf(id), z:-1, dur:560, step(L, t){             // red, more and more of it, then gone with it
      const u = Math.min(1, t / 300), out = t < 360 ? 1 : Math.max(0, 1 - (t - 360) / 180);
      fxTint(L, id, { ramp:[FX_RED[3], FX_RED[2], FX_RED[1]], rim:FX_RED[0], cover:Math.min(1, u * 1.15) * out });
    } });
    fxAdd({ layer:fxUnderOf(id), dur:560, step(L, t){                 // its red aura, beating
      const u = Math.min(1, t / 300), out = t < 360 ? 1 : Math.max(0, 1 - (t - 360) / 180), r = a.w * 0.45 * (1 + 0.12 * Math.sin(t * 0.04));
      fxDisc(L, a.x, a.y, r + 6, FX_RED[3], 0.3 * u * out); fxDisc(L, a.x, a.y, r, FX_RED[2], 0.45 * u * out);
    } });
    fxLater(340, ()=>{ ctx.hidden = fxSpriteHide(id, 180, 9000); });
    fxHost(ctx, { r:0, z:-1, min:900, end(){                            // back where it stood when the strikes are done, a red flash with it
      if(fxSpriteShow(id, 220, ctx.hidden) === false) return;           // (gone again for its next strike: no flash where it isn't)
      fxAdd({ layer:fxOverOf(id), z:-1, dur:300, step(L, t){ fxTint(L, id, { ramp:[FX_RED[3], FX_RED[2], FX_RED[1]], cover:1 - t / 300 }); } });
    } }, ()=>{});
  },
  impact(ctx, at, k, side){
    fxHostHit(ctx);
    const id = ctx.fromId, over = at.id ? fxOverOf(at.id) : fxLayerFor(side), under = at.id ? fxUnderOf(at.id) : fxUnderFor(side), H = FX_ULTRA_HIT;
    fxAdd({ layer:over, z:1, dur:320, step(L, t){                     // it, coming down on the one struck, in front of it
      const u = Math.min(1, t / 70), y = at.y - 6 - 30 * (1 - fxEaseIn(u)), cv = t < 160 ? 1 : Math.max(0, 1 - (t - 160) / 160);
      fxSpriteAt(L, id, at.x - (ctx.foe ? -1 : 1) * 4, y, { edge:FX_RED[2], cover:cv });
    } });
    fxLater(60, ()=>{                                                 // behind them both: the blast, and a ring spreading out
      FX_KIT.Physical.burst(at, under, { seed:ctx.seed + k * 13, big:1.55 * H });
      fxAdd({ layer:under, dur:460, step(L, t){ const u = fxEaseOut(t / 460), rr = (10 + u * 34) * H; fxRing(L, at.x, at.y, rr + 2, 2, FX_RED[4], 1 - u, 0.9); fxRing(L, at.x, at.y, rr, 4, FX_PHYS[u < 0.5 ? 1 : 2], 1 - u, 0.9); } });
      fxFlash(under, at, 14 * H, FX_RED[1], 70);
    });
  },
};

/* SHADOW SHRED (Ghost): darkness gathers round your monster, eyes in it; each strike rakes great shadow claws across
   one of them, shards of shadow flying. */
FX_MOVES['Shadow Shred'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_GHOST);
    const a = ctx.from;
    fxPuffs(fxUnderOf(ctx.fromId), { x:a.x, y:a.y }, 12, { seed:ctx.seed, pal:[FX_GHOST[3], FX_GHOST[4], FX_GHOST[5]], r:7, spread:a.w * 1.1, spreadY:a.h * 0.55, rise:4, life:700, stagger:200, thick:0.7 });
    fxAdd({ layer:fxOverOf(ctx.fromId), dur:700, step(L, t){ if(t > 150 && t < 600){ const e = 3; fxRect(L, a.x - 9, a.y - a.h * 0.3, e, e, FX_PSY[1]); fxRect(L, a.x + 6, a.y - a.h * 0.3, e, e, FX_PSY[1]); } } });
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side), rot = (k * 1.3) % 3, H = FX_ULTRA_HIT;
    fxAdd({ layer, dur:330, step(L, t){
      const u = Math.min(1, t / 90), cv = t < 200 ? 1 : 1 - (t - 200) / 130;
      for(let i = 0; i < 3; i++){
        const ang = -1 + rot * 0.5, ox = (i - 1) * 8 * H, len = 22 * H, c = Math.cos(ang), s = Math.sin(ang);
        const x0 = at.x - c * len - s * ox, y0 = at.y - s * len + c * ox, x1 = at.x + c * len * (2 * u - 1) - s * ox, y1 = at.y + s * len * (2 * u - 1) + c * ox;
        fxLine(L, x0, y0, x1, y1, FX_GHOST[5], 7, cv); fxLine(L, x0, y0, x1, y1, FX_GHOST[2], 4, cv); fxLine(L, x0, y0, x1, y1, FX_GHOST[0], 2, cv);
      }
    } });
    FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k * 13, big:1.3 * H });
  },
};

/* MINDSTORM (Psychic): a storm of pink rings gathers over their side; each strike is psychic lightning from it. */
FX_MOVES['Mindstorm'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_PSY);
    const foes = fxTheirs(ctx).map(fxAnchor).filter(Boolean), S = FX_ULTRA_ORB;
    fxHost(ctx, { at:()=> foes.length ? { x:foes.reduce((s, p)=> s + p.x, 0) / foes.length, y:Math.max(16, Math.min(...foes.map(p=> p.y - p.h * 0.8))) } : {} }, (L, h, t, g)=>{
      for(let i = 0; i < 5; i++){ const rx = (10 + i * 7) * S * g, ang0 = t * 0.004 * (i % 2 ? 1 : -1);
        for(let j = 0; j < 60; j++){ const ang = ang0 + j / 60 * Math.PI * 2; if(j % 12 > 8) continue; const X = h.x + Math.cos(ang) * rx, Y = h.y + Math.sin(ang) * rx * 0.3; fxDisc(L, X, Y, 2.2, FX_PSY[4]); fxDisc(L, X, Y, 1, i % 2 ? FX_PSY[1] : FX_PSY[2]); } }
    });
  },
  impact(ctx, at, k, side){
    const h = fxHostHit(ctx), layer = fxLayerFor(side), H = FX_ULTRA_HIT;
    fxAdd({ layer:'back', dur:160, step(L, t){ const st = (t / 50) | 0, sx = h.x + (k % 3 - 1) * 16; fxBolt(L, sx, h.y, at.x, at.y, ctx.seed + k * 7 + st, FX_PSY[4], Math.round(4 * H), 7); fxBolt(L, sx, h.y, at.x, at.y, ctx.seed + k * 7 + st, FX_PSY[1], Math.round(2 * H), 7); } });
    FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k * 13, big:1.4 * H });
  },
};

/* (4.20) A western dragon, head up and wings spread (Draco Meteor's — the designer: "could you do a western dragon shape
   with head facing up and wings spread in dragon fire purple rising into the air instead of the cloud? it should trail
   afterimage shadows instead of a line"). In units of its half-span, from its chest, y down: its right wing (bat-winged,
   the fingers fanning from the wrist, the membrane scalloped between them), its body from snout to tail, a horn, a hind
   leg; the left side its mirror. */
const FX_WYRM = {
  S:[0.12, -0.2], W:[0.5, -0.6],                                       // the wing's root (its pivot as it beats), its wrist
  wing:[[0.12, -0.2], [0.5, -0.6], [0.98, -0.8], [0.8, -0.5], [1.0, -0.3], [0.76, -0.12], [0.86, 0.06], [0.6, 0.04], [0.58, 0.24], [0.34, 0.12], [0.12, 0.1]],
  tips:[[0.98, -0.8], [1.0, -0.3], [0.86, 0.06], [0.58, 0.24]],
  side:[[0, -0.96], [0.05, -0.88], [0.08, -0.78], [0.11, -0.69], [0.08, -0.62], [0.06, -0.52], [0.1, -0.38], [0.17, -0.24], [0.18, -0.06], [0.15, 0.1], [0.13, 0.2], [0.07, 0.3]],
  belly:[[0, -0.5], [0.05, -0.36], [0.075, -0.1], [0.05, 0.12], [0, 0.24]],
  horn:[[0.07, -0.67], [0.25, -0.57], [0.085, -0.6]],
  leg:[[0.12, 0.12], [0.23, 0.26], [0.2, 0.32], [0.15, 0.3], [0.08, 0.2]],
};
function fxWyrm(L, x, y, U, flap, cover, shadow){
  const P = FX_DRAGON, cv = cover == null ? 1 : cover, W = FX_WYRM;
  const at = (p, m)=> [x + p[0] * m * U, y + p[1] * U];
  const wingAt = (p, m)=>{                                             // a point of a wing, beaten about its root
    const dx = p[0] - W.S[0], dy = p[1] - W.S[1], c = Math.cos(flap), s = Math.sin(flap);
    return at([W.S[0] + dx * c + dy * s, W.S[1] - dx * s + dy * c], m);
  };
  const tail = [];                                                     // its tail, swaying a little, a spade at its end
  for(let i = 0; i <= 6; i++){ const v = i / 6; tail.push([0.05 * Math.sin(v * 3.8 + flap * 2), 0.28 + v * 0.5, 0.065 * (1 - v) + 0.014]); }
  const tailPoly = tail.map(([cx, cy, w])=> [cx + w, cy]).concat(tail.slice().reverse().map(([cx, cy, w])=> [cx - w, cy]));
  const e = tail[tail.length - 1], spade = [[e[0], e[1] - 0.03], [e[0] + 0.1, e[1] + 0.06], [e[0], e[1] + 0.17], [e[0] - 0.1, e[1] + 0.06]];
  const body = W.side.concat(W.side.slice(1).reverse().map(([px, py])=> [-px, py]));
  const toW = pts=> pts.map(p=> at(p, 1));
  if(shadow){                                                          // an afterimage: one dark shape
    for(const m of [1, -1]) fxPoly(L, W.wing.map(p=> wingAt(p, m)), P[4], cv);
    fxPoly(L, toW(body), P[4], cv); fxPoly(L, toW(tailPoly), P[4], cv); fxPoly(L, toW(spade), P[4], cv);
    return;
  }
  for(const m of [1, -1]){
    fxPolyLined(L, W.wing.map(p=> wingAt(p, m)), P[3], P[5], cv);   // the membrane
    const wr = wingAt(W.W, m), sh = wingAt(W.S, m);
    fxLine(L, sh[0], sh[1], wr[0], wr[1], P[2], 2, cv);               // its arm
    W.tips.forEach(tp=>{ const q = wingAt(tp, m); fxLine(L, wr[0], wr[1], q[0], q[1], P[1], 1, cv); });   // its fingers
    fxPolyLined(L, W.leg.map(p=> at(p, m)), P[3], P[5], cv);
  }
  fxPolyLined(L, toW(tailPoly), P[2], P[5], cv); fxPolyLined(L, toW(spade), P[3], P[5], cv);
  fxPolyLined(L, toW(body), P[2], P[5], cv);
  fxPoly(L, W.belly.concat(W.belly.slice(1, -1).reverse().map(([px, py])=> [-px, py])).map(p=> at(p, 1)), P[1], 0.85 * cv);   // its belly, lighter
  for(let j = 0; j < 9; j++){ const py = -0.44 + j * 0.075, hw = 0.05 + 0.025 * Math.sin((j + 1) / 10 * Math.PI); fxLine(L, x - hw * U, y + py * U, x + hw * U, y + py * U, P[2], 1, 0.7 * cv); }   // its scales
  for(const m of [1, -1]){ fxPolyLined(L, W.horn.map(p=> at(p, m)), P[1], P[4], cv); const ey = at([0.045, -0.79], m); fxSet(L, Math.round(ey[0]), Math.round(ey[1]), P[0]); }   // horns; eyes alight
}

/* DRACO METEOR (Dragon). (4.20, the designer: "for draco meteor, could you do a western dragon shape with head facing up
   and wings spread in dragon fire purple rising into the air instead of the cloud? it should trail afterimage shadows
   instead of a line. let the falling beam/projectiles and explosions be bigger as well."): a dragon of dragon fire rises
   out of your monster, wings beating, its shadows trailing below it, embers of its fire falling, up and out of the sky;
   the blows held till it is gone (`hold`); each strike a meteor coming down on one of them — a wider streak, a bigger
   stone, a bigger blast of dragon fire and a ring of it. (Until 4.20 an orb, a line under it.) */
FX_MOVES['Draco Meteor'] = {
  dur:900, window:6500, hold:480,
  cast(ctx){
    fxStoneTell(ctx, FX_DRAGON);
    const a = ctx.from, U = 38 * FX_ULTRA_ORB_R / 16.5, y0 = a.y - a.h * 0.1, y1 = -U * 1.3, T = 780, rnd = fxRand(ctx.seed), embers = [];   // its half-span, about a monster's breadth
    const pos = t=>{ const u = t < 120 ? 0 : fxEaseIn(Math.min(1, (t - 120) / (T - 120))); return { x:a.x + Math.sin(u * 2.4) * U * 0.12, y:y0 + (y1 - y0) * u }; };
    let last = 0;
    fxAdd({ layer:'back', dur:T + 520, step(L, t){
      const dt = Math.min(0.05, Math.max(0, t - last) / 1000); last = t;
      const g = Math.min(1, t / 160), s = U * (0.55 + 0.45 * fxEaseOut(g)), flap = tt=> 0.26 * Math.sin(tt * 0.032);
      if(t < T){
        for(let i = 0; i < 2; i++){ const p = pos(t), ang = rnd() * 6.28; embers.push({ x:p.x + Math.cos(ang) * s * 0.5, y:p.y + s * (0.1 + rnd() * 0.3), vx:(rnd() - 0.5) * 30, vy:40 + rnd() * 50, age:0, life:300 + rnd() * 300 }); }
        for(let j = 4; j >= 1; j--){ const tj = t - j * 70; if(tj < 40) continue; const p = pos(tj); fxWyrm(L, p.x, p.y, s, flap(tj), (0.52 - j * 0.1) * g, true); }   // its shadows, trailing — each apart
      }
      for(let i = embers.length - 1; i >= 0; i--){                     // embers of its fire, falling
        const m = embers[i];
        m.age += dt * 1000;
        if(m.age > m.life){ embers.splice(i, 1); continue; }
        m.x += m.vx * dt; m.y += m.vy * dt;
        const u = m.age / m.life;
        fxDisc(L, m.x, m.y, 1.6 * (1 - u) + 0.5, FX_DRAGON[u < 0.4 ? 1 : 2], 1 - u * 0.6);
      }
      if(t < T){ const p = pos(t); fxWyrm(L, p.x, p.y, s, flap(t), g, false); }
    } });
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side), H = FX_ULTRA_HIT;
    fxSkyStreak(layer, at, { side, cols:[FX_FIRE[1], FX_DRAGON[2], FX_DRAGON[4]], w:10, slant:k % 2 ? 0.32 : 0.5, dur:220 });
    fxAdd({ layer, dur:160, step(L, t){ fxRock(L, at.x, at.y, 11 * H, k, ctx.seed + k, [FX_DRAGON[1], FX_DRAGON[3], FX_DRAGON[4], FX_DRAGON[5]], 1 - t / 160); } });
    fxDragonBurst(at, layer, { seed:ctx.seed + k * 13, big:2.1 * H });
    fxFireBurst(at, layer, { seed:ctx.seed + k * 17, big:1.15 * H });
    fxAdd({ layer, dur:480, step(L, t){ const u = fxEaseOut(t / 480), rr = (10 + u * 26) * H; fxRing(L, at.x, at.y, rr + 2, 2, FX_DRAGON[5], 1 - u, 0.85); fxRing(L, at.x, at.y, rr, 3, FX_DRAGON[u < 0.5 ? 1 : 2], 1 - u, 0.85); } });
  },
};

/* GIGATON SMASH (Steel). (4.18, the designer: "Steel's ultra's hammer looks poorly made, instead please make the monster
   turn steel shiny and fire multiple steel images of it linearly from the bottom right of the screen towards each enemy,
   one image per hit, all travelling in parallel paths"): your monster turns to steel, a bloom of white running across
   it while the strikes fall; each strike, a steel image of it shoots in a straight line out of the bottom right of the
   screen onto the one struck — every one on the same slant, so their paths run side by side — images of it trailing
   back along the way it came, and rings on it with sparks. (4.19, the designer, of the images: "it should go in from
   bottom left to top right, please!": they come out of the bottom left now, from behind it, up onto them; theirs out of
   the top right down onto yours.) */
FX_MOVES['Gigaton Smash'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_STEEL);
    const id = ctx.fromId, foes = fxTheirs(ctx).map(fxAnchor).filter(Boolean);
    const mid = foes.length ? { x:foes.reduce((s, p)=> s + p.x, 0) / foes.length, y:foes.reduce((s, p)=> s + p.y, 0) / foes.length } : { x:FX.W * 0.62, y:FX.H * 0.3 };
    const from = ctx.foe ? { x:FX.W + 12, y:-12 } : { x:-12, y:FX.H + 12 }, dx = mid.x - from.x, dy = mid.y - from.y, d = Math.hypot(dx, dy) || 1;   // (4.19) yours from the bottom left, theirs from the top right
    ctx.slant = { x:dx / d, y:dy / d };                                  // one slant for them all: parallel paths
    if(id) fxHost(ctx, { r:0, layer:fxOverOf(id), z:-1, min:700 }, (L, h, t, g)=>{ fxSheen(L, id, { pos:((t - 80) / 520) % 1, cover:Math.min(1, t / 160) * Math.min(1, g * 1.5) }); });   // it, in steel, while they fall
  },
  impact(ctx, at, k, side){
    fxHostHit(ctx);
    const id = ctx.fromId, sl = ctx.slant || (ctx.foe ? { x:-0.6, y:0.8 } : { x:0.6, y:-0.8 }), over = at.id ? fxOverOf(at.id) : fxLayerFor(side), H = FX_ULTRA_HIT;
    const back = Math.hypot(FX.W, FX.H), s0 = { x:at.x - sl.x * back, y:at.y - sl.y * back };   // well off the screen, back along the slant
    const ramp = [FX_STEEL[3], FX_STEEL[2], FX_STEEL[1]];
    fxAdd({ layer:over, z:1, dur:330, step(L, t){
      const u = Math.min(1, 0.55 + t / 60 * 0.45), cv = t < 120 ? 1 : Math.max(0, 1 - (t - 120) / 200);
      for(let j = 5; j >= 0; j--){                                    // images of it trailing back along its path
        const v = u - j * 0.075;
        if(v < 0) continue;
        fxSpriteAt(L, id, s0.x + (at.x - s0.x) * v, s0.y + (at.y - s0.y) * v, j ? { ramp, cover:(0.5 - j * 0.07) * cv } : { ramp, cover:cv, edge:FX_STEEL[5], band:(t / 220) % 1, white:FX_STEEL[0] });
      }
    } });
    fxLater(50, ()=>{
      FX_KIT.Steel.burst(at, over, { seed:ctx.seed + k * 13, big:1.45 * H });
      fxRingBurst(at, over, FX_STEEL, 1.3 * H, 400);
      fxFlash(over, at, 12 * H, FX_STEEL[0], 60);
    });
  },
};

/* ASTRAL BLOOM (Fairy): a flower of starlight opens over your monster, turning; each strike is a falling star onto one
   of them, bursting in pink glitter. */
FX_MOVES['Astral Bloom'] = {
  dur:900, window:6500,
  cast(ctx){
    fxStoneTell(ctx, FX_FAIRY);
    const S = FX_ULTRA_ORB;
    const k = 0.8;                                                     // (4.19) its ring of stars brought to every Ultra's orb (it was a fifth over); the star at its heart as it was
    fxHost(ctx, { r:Math.round(22 * k) }, (L, h, t, g)=>{
      for(let i = 0; i < 6; i++){ const ang = i * Math.PI / 3 + t * 0.002, x = h.x + Math.cos(ang) * 9 * S * k * g, y = h.y + Math.sin(ang) * 9 * S * k * g;
        fxFlameBall(L, x, y, (4 * g + 0.5) * S * k, FX_FAIRY, t, ctx.seed + i, { wob:0.05, cols:[FX_FAIRY[3], FX_FAIRY[2], FX_FAIRY[1]], outline:FX_FAIRY[5] }); }
      fxStar4(L, h.x, h.y, (6 * g + 1) * S, FX_GLITTER[1], FX_GLITTER[0]);
      for(let i = 0; i < 6; i++){ const ang = -t * 0.004 + i * 1.047; fxGlitter(L, h.x + Math.cos(ang) * 18 * S * k * g, h.y + Math.sin(ang) * 10 * S * k * g, i, t, 3); }
    });
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side), H = FX_ULTRA_HIT;
    fxHostHit(ctx);
    fxSkyStreak(layer, at, { side, cols:[FX_GLITTER[0], FX_FAIRY[2], FX_FAIRY[4]], w:3, slant:k % 2 ? 0.3 : 0.5 });
    fxAdd({ layer, dur:200, step(L, t){ fxStar4(L, at.x, at.y, 12 * H * (1 - t / 200) + 1, FX_GLITTER[1], FX_GLITTER[0]); } });
    FX_KIT.Fairy.burst(at, layer, { seed:ctx.seed + k * 13, big:1.45 * H });
  },
};

/* ============================================================
   THE LEGENDARIES — every move of theirs its own art. Their Power 2, Ultimate and Max keep the blow back a while
   (`hold`) so the art has its time, and shake the field as they land. (4.16) Each drawn in its one element (the
   designer: "let's decide on a predominant element for each legendary so you don't have to mix effects from both
   elements which can feel out of place": the phoenix fire, the forest fairy grass, the water dragon water, the
   ankylosaurus ground, the thunder newt electric, the Monkey King physical, the Whalelord ghost, the caladrius water;
   the Cyborg, the Ghost Guardian and the Mindcat as they were).
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
/* A small five-petalled flower (the Mindcat's forget-me-nots, the forest fairy's Overgrowth). */
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
/* (4.16) What bursts behind a struck monster, and the monster backlit by it (the designer, of Incinerate Max: "set the
   burning animation behind the monster sprite rather than in front, and turn the monster sprite very dark (overly black
   slightly transparent layer) to create the impression of being backlit strongly by bright flames"; and of
   Heavensplitter: "the target sprite explodes with golden light (turning dark and backlit for impact)"). */
function fxBacklit(id, edge, rim, dur){
  if(!id) return;
  const D = dur || 850;
  fxAdd({ layer:fxOverOf(id), z:-1, dur:D, step(L, t){ const a = t < 70 ? t / 70 : t > D - 260 ? Math.max(0, (D - t) / 260) : 1; fxDark(L, id, { a, edge, rim }); } });
}

/* ---------- THE MONKEY KING (physical) ---------- */
FX_MOVES['Jingu Thrust'] = {
  dur:700,
  cast(ctx){
    fxTargets(ctx).slice(0, 1).forEach(b=>{
      const a = fxMuzzle(ctx.from, b);
      fxAdd({ layer:ctx.side === 'player' ? 'front' : 'back', dur:460, step(L, t){
        const u = t < 120 ? fxEaseOut(t / 120) : t < 300 ? 1 : 1 - (t - 300) / 160;
        fxStaff(L, a, { x:a.x + (b.x - a.x) * u, y:a.y + (b.y - a.y) * u }, 4);
      } });
    });
  },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Physical.burst(at, layer, { seed:ctx.seed + k, big:1.15 }); fxRingBurst(at, layer, FX_GOLD, 0.9); },
};
/* CLOUD STEP (4.16, the designer: "cloud step can be a black foot hitting a monster hard"): he springs off a cloud, and a
   great black foot comes in from his side and slams into it, sole first. */
/* the sole of his foot, toes up (a right foot: its arch and his thumb of a big toe on the left) */
const FX_SOLE = [[0, 1], [0.2, 0.95], [0.29, 0.76], [0.3, 0.46], [0.37, 0.12], [0.4, -0.18], [0.34, -0.4], [0.17, -0.5], [-0.08, -0.52], [-0.28, -0.43],
                 [-0.35, -0.22], [-0.25, 0.04], [-0.19, 0.34], [-0.23, 0.68], [-0.17, 0.92]];
const FX_TOES = [[0.33, -0.6, 0.085], [0.19, -0.7, 0.095], [0.02, -0.75, 0.105], [-0.15, -0.73, 0.11], [-0.5, -0.36, 0.14]];
function fxFoot(L, x, y, s, rot, cover, flip){
  const f = flip ? -1 : 1, P = pts=> fxRot(pts.map(([u, v])=> [u * s * f, v * s]), x, y, rot), ink = fxRGB('#141011'), rim = FX_PHYS[0];
  FX_TOES.forEach(([u, v, r])=>{ const p = P([[u, v]])[0]; fxDisc(L, p[0], p[1], r * s + 1.4, rim, cover); });
  fxPolyLined(L, P(FX_SOLE), ink, rim, cover);
  FX_TOES.forEach(([u, v, r])=>{ const p = P([[u, v]])[0]; fxDisc(L, p[0], p[1], r * s, ink, cover); });
  const gl = P([[-0.16, -0.3], [0.2, -0.33]]), g2 = P([[-0.05, 0.62], [0.15, 0.6]]);
  fxLine(L, gl[0][0], gl[0][1], gl[1][0], gl[1][1], fxRGB('#3a3234'), 1, cover);                     // creases of the sole, catching a little light
  fxLine(L, g2[0][0], g2[0][1], g2[1][0], g2[1][1], fxRGB('#3a3234'), 1, cover);
}
FX_MOVES['Cloud Step'] = {
  dur:800,
  cast(ctx){
    const b = fxTargets(ctx)[0];
    if(!b) return;
    const a = ctx.from, dir = b.x >= a.x ? 1 : -1, s = b.h * 0.3, layer = ctx.side === 'player' ? 'front' : 'back';
    fxAdd({ layer:fxUnderOf(ctx.fromId), dur:420, step(L, t){ const u = t / 420; fxCloudPuff(L, a.x - dir * 4, a.foot - 2 + u * 3, 7 + u * 4, 1 - u); } });   // the cloud he springs from
    ctx.foot = { dir, s };
    fxAdd({ layer, dur:340, step(L, t){                        // the foot coming in fast from his side, speed lines behind it
      if(t < 170) return;
      const u = fxEaseIn(Math.min(1, (t - 170) / 160)), x = b.x - dir * (b.w * 0.32 + 46 * (1 - u)), y = b.y - 2 - 10 * (1 - u);
      for(let i = 0; i < 4; i++) fxLine(L, x - dir * (s * 0.5 + 6 + i * 3), y - s * 0.5 + i * s * 0.33, x - dir * (s * 0.5 + 22 + i * 5), y - s * 0.5 + i * s * 0.33, FX_PHYS[1], 1, 0.8);
      fxFoot(L, x, y, s, dir * 0.42, 1, dir < 0);
    } });
  },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side), f = ctx.foot || { dir:1, s:at.h * 0.3 }, x = at.x - f.dir * at.w * 0.32, y = at.y - 2;
    fxAdd({ layer, dur:420, step(L, t){                        // pressed home, a shudder, then gone
      const cv = t < 230 ? 1 : 1 - (t - 230) / 190, j = t < 120 ? Math.sin(t * 0.25) * 1.5 : 0;
      fxFoot(L, x + j + f.dir * Math.min(4, t / 20), y, f.s * (t < 60 ? 1.06 : 1), f.dir * 0.42, cv, f.dir < 0);
    } });
    fxAdd({ layer, dur:220, step(L, t){ const u = t / 220; fxImpactStar(L, at.x - f.dir * 4, at.y, (14 + 10 * u) * 1.2, 10, 0.2, [FX_PHYS[0], FX_GOLD[1], FX_GLITTER[0]], fxRGB('#141011'), 1 - u); } });
    FX_KIT.Physical.burst(at, layer, { seed:ctx.seed + k, big:1.3 });
  },
};
/* 72 TRANSFORMATIONS (4.16, the designer: "72 transformations should give monkey king two translucent clones like mirage
   does"): two of him, in his own colours and half see-through, spring out of puffs of cloud either side of him and
   waver there; he glows with it. */
FX_MOVES['72 Transformations'] = {
  side:'self', dur:1500,
  cast(ctx){
    const id = ctx.fromId, a = ctx.from;
    if(!id || !a) return;
    [-1, 1].forEach((s, i)=> fxLater(60 + i * 90, ()=>{
      const x = a.x + s * a.w * 0.42, y = a.y;
      fxAdd({ layer:fxOverOf(id), dur:520, step(L, t){ const u = t / 520; for(let j = 0; j < 5; j++){ const ang = j * 1.256 + i; fxCloudPuff(L, x + Math.cos(ang) * (4 + u * 12), y + Math.sin(ang) * (3 + u * 7), 5 * (1 - u * 0.5), 1 - u); } } });
      fxSpray(fxOverOf(id), fxBurstParts(x, y, 10, { seed:ctx.seed + i, vmin:40, vmax:100, ramp:[FX_GOLD[0], FX_GOLD[1], FX_GOLD[2]], drag:3, lmin:200, lmax:380, shape:'streak' }), 500);
    }));
    fxAdd({ layer:fxUnderOf(id), dur:1450, step(L, t){       // the two clones, behind him, wavering
      if(t < 120) return;
      const u = t - 120, out = fxEaseOut(Math.min(1, u / 260)), cv = u < 1000 ? 0.55 : Math.max(0, 0.55 * (1 - (u - 1000) / 330));
      fxClone(L, id, { dx:-a.w * 0.42 * out, cover:cv, t:u, wob:1.4 });
      fxClone(L, id, { dx:a.w * 0.42 * out, cover:cv, t:u + 400, wob:1.4 });
    } });
    fxBuffLook(id, fxBuffOf('Physical'), 1100, 200);
  },
};
/* HEAVENSPLITTER and its Max (4.16, the designer: "a golden beam of light emerging from above monkey king … directly
   upwards offscreen, then rotating clockwise (against enemies) or anticlockwise (against players) … it should sweep
   until it hits the base of the screen and then the target sprite explodes with golden light (turning dark and backlit
   for impact). for the critical hit variant with bonus words completed, the screen colour should be inverted except for
   monkey king and the beam weapon, and the beam should be noticeably thicker and more intense, and the explosion size
   should be bigger." (4.18) And: "I think monkey king's golden beam should rotate from his body's golden aura, centred on
   his sprite as the axis of rotation, instead of being a weapon now, and needs afterimages to make it look less
   clunky."). A golden aura gathers round him; out of it a beam of pure light springs straight up off the top of the
   screen, then falls — turning about the middle of him, gathering speed, fading images of itself trailing behind — over
   them and on down until it strikes the ground at the screen's edge; the one struck bursts with golden light behind it,
   itself black against it. */
function fxLightBeam(L, p, ang, len, w, cover, hot, t){
  const c = Math.cos(ang), s = Math.sin(ang), e = { x:p.x + c * len, y:p.y + s * len }, cv = cover == null ? 1 : cover;
  fxLine(L, p.x, p.y, e.x, e.y, FX_GOLD[2], w + (hot ? 16 : 11), (hot ? 0.34 : 0.22) * cv);          // its glow
  fxLine(L, p.x, p.y, e.x, e.y, FX_GOLD[1], w + 5, 0.6 * cv);
  fxLine(L, p.x, p.y, e.x, e.y, FX_GOLD[1], w, cv);
  fxLine(L, p.x, p.y, e.x, e.y, FX_GOLD[0], Math.max(1, w - (hot ? 3 : 4)), cv);
  fxLine(L, p.x, p.y, e.x, e.y, fxRGB('#ffffff'), Math.max(1, Math.round(w * 0.35)), cv);           // a white heart
  if(hot && t != null){ const nx = -s, ny = c; for(let i = 0; i < 12; i++){ const d = (t * 0.4 + i * 53) % len, o = ((i * 37) % 11) - 5; fxStar4(L, p.x + c * d + nx * o, p.y + s * d + ny * o, 2.5, FX_GLITTER[0], FX_GLITTER[0]); } }
}
function fxHeavensplitter(max){
  const HOLD = max ? 600 : 450;
  return {
    dur:1300, hold:HOLD,
    cast(ctx){
      const a = ctx.from, b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), crit = !!ctx.crit, id = ctx.fromId;
      const mid = (id && fxSpriteMid(id)) || { x:a.x, y:a.y - a.h * 0.1 }, p = { x:mid.x, y:mid.y };                 // the middle of him: what it turns about
      const dir = ctx.side === 'player' ? -1 : 1, len = Math.hypot(FX.W, FX.H) * 1.3;
      const hit = 330 + HOLD, rise = 230, end = hit - 30;
      let land = Math.atan2(FX.H - p.y, (dir > 0 ? FX.W : 0) - p.x);                                                 // the base of the screen at its far edge
      if(dir < 0 && land > 0) land -= Math.PI * 2;                                                                     // anticlockwise: through the left
      const up = -Math.PI / 2, w = (max ? 11 : 9) + (crit ? 7 : 0);
      const angAt = t=> t < rise ? up : t < end ? up + (land - up) * fxEaseIn((t - rise) / (end - rise)) : land;
      ctx.split = { p, dir, b, crit };
      if(id) fxAdd({ layer:fxOverOf(id), z:-1, dur:hit + 420, step(L, t){                                            // his golden aura
        const g = Math.min(1, t / 200), cv = t < hit ? 1 : Math.max(0, 1 - (t - hit) / 400), beat = 0.85 + 0.15 * Math.sin(t * 0.03);
        fxHalo(L, id, FX_GOLD[1], 0.75 * g * cv, 3);
        fxHalo(L, id, FX_GOLD[2], 0.35 * g * cv * beat, 5);
        fxGlow(L, id, FX_GOLD[0], 0.25 * g * cv * beat, FX_GOLD[0]);
        if(crit) fxInvertKeep(id);                                                                                     // his sprite kept, if the fight was drawn afresh
      } });
      fxAdd({ layer:id ? fxUnderOf(id) : 'back', dur:hit + 420, step(L, t){                                             // the beam, out of him: behind him
        let l = len, cv = 1;
        if(t < rise) l = len * fxEaseOut(t / rise);
        else if(t >= end) cv = t < hit + 120 ? 1 : Math.max(0, 1 - (t - hit - 120) / 300);
        const ang = angAt(t);
        if(t >= rise && t < end + 90) for(let j = 4; j >= 1; j--){                                                      // its afterimages, falling behind it
          const aj = angAt(Math.max(rise, t - j * 26));
          if(Math.abs(aj - ang) < 0.004) continue;
          fxLightBeam(L, p, aj, len, Math.max(2, w - j * 1.5), (0.5 - j * 0.1) * cv, false);
        }
        fxLightBeam(L, p, ang, l, w, cv, crit, t);
        if(t < rise + 60) fxDisc(L, p.x, p.y, 5 + 7 * Math.min(1, t / 120), FX_GOLD[0], 0.85);                        // where it springs from
      } });
      fxLater(end, ()=>{                                                                                                // where it strikes the ground: dust and a flash
        const g = { x:p.x + Math.cos(land) * ((FX.H - p.y) / Math.max(0.2, Math.sin(land))), y:FX.H - 2 };
        if(!(g.x >= -20 && g.x <= FX.W + 20)) return;
        fxPuffs('front', g, 6, { seed:ctx.seed + 5, pal:[FX_CLOUD[1], FX_CLOUD[2], FX_CLOUD[3]], r:6, spread:30, rise:12, life:500, stagger:60 });
        fxFlash('front', g, 12, FX_GOLD[0], 70);
      });
      if(crit){                                                                                                         // the screen turned over, but for him and the beam
        const img = fxSpriteOf(id);
        fxInvertFor(rise, hit + 480, img);
      }
    },
    impact(ctx, at, k, side){
      const S = ctx.split || {}, big = (max ? 1.25 : 1) * (S.crit ? 1.5 : 1), id = at.id, behind = id ? fxUnderOf(id) : fxUnderFor(side), seed = ctx.seed + k * 13;
      fxAdd({ layer:behind, dur:720, step(L, t){                 // golden light bursting from behind it: rays, a disc, rings
        const u = Math.min(1, t / 160), cv = t < 420 ? 1 : Math.max(0, 1 - (t - 420) / 300), n = S.crit ? 20 : 14;
        fxDisc(L, at.x, at.y - at.h * 0.05, (16 + 18 * u) * big, FX_GOLD[1], 0.55 * cv);
        fxDisc(L, at.x, at.y - at.h * 0.05, (10 + 12 * u) * big, FX_GOLD[0], cv);
        for(let i = 0; i < n; i++){ const ang = i / n * 6.28 + 0.13, l0 = 8 * big, l1 = (30 + 34 * u + (i % 2 ? 0 : 16)) * big; fxLine(L, at.x + Math.cos(ang) * l0, at.y + Math.sin(ang) * l0, at.x + Math.cos(ang) * l1, at.y + Math.sin(ang) * l1, i % 2 ? FX_GOLD[1] : FX_GOLD[0], i % 2 ? 2 : 3, cv); }
        const rr = (18 + 46 * fxEaseOut(Math.min(1, t / 520))) * big; fxRing(L, at.x, at.y, rr, 3, FX_GOLD[2], Math.max(0, 1 - t / 520), 0.85);
      } });
      fxBacklit(id, FX_GOLD[2], FX_GOLD[0], 900);
      fxSpray(fxLayerFor(side), fxBurstParts(at.x, at.y, Math.round(20 * big), { seed, vmin:90, vmax:240 * big, grav:120, drag:1.6, ramp:[FX_GOLD[0], FX_GOLD[1], FX_GOLD[2], FX_GOLD[3]], lmin:300, lmax:700 }), 1000);
      fxPuffs(behind, { x:at.x, y:at.foot }, 8, { seed:seed + 3, pal:[FX_CLOUD[1], FX_CLOUD[2], FX_CLOUD[3]], r:5 * big, spread:at.w * 1.1, rise:8, life:600, stagger:80 });
    },
  };
}
FX_MOVES['Heavensplitter'] = fxHeavensplitter(false);
FX_MOVES['Heavensplitter Max'] = fxHeavensplitter(true);
/* ---------- THE WATER DRAGON (water) ---------- */
FX_MOVES['Aqua Fang'] = {
  dur:700,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> FX_KIT.Water.shot(ctx, fxMuzzle(ctx.from, b), b, { k:0, big:1.1, layer:ctx.side === 'player' ? 'front' : 'back', delay:30 })); },
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side);
    fxAdd({ layer, dur:300, step(L, t){                       // jaws of water snapping shut
      const u = Math.min(1, t / 110), cv = t < 200 ? 1 : 1 - (t - 200) / 100, gap = 14 * (1 - u) + 2;
      fxCrescent(L, at.x, at.y - gap, 13, Math.PI / 2, [FX_WATER[0], FX_WATER[2], FX_WATER[3], FX_WATER[5]], cv);
      fxCrescent(L, at.x, at.y + gap, 13, -Math.PI / 2, [FX_WATER[0], FX_WATER[2], FX_WATER[3], FX_WATER[5]], cv);
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
/* Tsunami: a great wave rolls across their side. (The designer: "tsunami looks great by the way!") */
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
  },
  impact(ctx, at, k, side){ fxSplash(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.3 }); },
};
/* CATACLYSM's charge (4.16, the designer: "water dragon charge should be a bright pulsing ball with a dragon-purple tint
   gathering over the top of the sprite. draw little orbs of light fading in and gathering into the ball as it grows
   bigger. it should grow bigger and pulse more intensely with every charge."): a ball of light over its head, tinted the
   dragon's purple, motes of light fading in round it and drawn into it; bigger, brighter and beating harder with each
   charge it holds (one to four). */
const FX_CHARGE = [fxRGB('#ffffff'), fxRGB('#f0f1ff'), fxRGB('#d2d5ff'), fxRGB('#a6a9ff'), fxRGB('#7c70f2'), fxRGB('#3a2c9a')];
function fxChargeCount(ctx){
  if(ctx.foe){ const e = fxMonOf(ctx.fromId); return e ? Math.max(1, Math.min(4, e.chargeTurns || 1)) : 1; }
  const c = typeof chargeState === 'function' ? chargeState() : null;
  return c ? Math.max(1, Math.min(4, c.charges || 1)) : 1;
}
function fxDragonCharge(ctx){
  const a = ctx.from, n = fxChargeCount(ctx), R = 5 + n * 3.5, D = 1250;
  const c = { x:a.x + 2, y:Math.max(R + 6, a.y - a.h * 0.6 - R - 4) }, rnd = fxRand(ctx.seed), motes = [];
  ctx.chargeBall = { n, R };
  for(let i = 0; i < 10 + n * 7; i++) motes.push({ ang:rnd() * 6.28, d:R + 16 + rnd() * (24 + n * 7), del:rnd() * 560, life:420 + rnd() * 220, r:0.9 + rnd() * 1.3, spin:(rnd() - 0.5) * 1.2 });
  fxAdd({ layer:ctx.foe ? 'back' : 'front', dur:D, step(L, t){
    const grow = fxEaseOut(Math.min(1, t / 760)), fade = t > D - 240 ? Math.max(0, (D - t) / 240) : 1;
    const beat = Math.sin(t * (0.011 + n * 0.0045)), pulse = 1 + (0.05 + n * 0.04) * beat, r = R * grow * pulse;
    motes.forEach(m=>{                                                   // motes fading in where they are, then drawn in
      const u = (t - m.del) / m.life;
      if(u < 0 || u > 1) return;
      const fin = Math.min(1, u * 3.5), pull = fxEaseIn(Math.max(0, (u - 0.25) / 0.75)), d = m.d * (1 - pull) + r * pull, ang = m.ang + m.spin * pull;
      const x = c.x + Math.cos(ang) * d, y = c.y + Math.sin(ang) * d * 0.85;
      fxDisc(L, x, y, m.r + 1.2, FX_CHARGE[4], 0.45 * fin * fade);
      fxDisc(L, x, y, m.r, FX_CHARGE[1], fin * fade);
    });
    if(r < 1) return;
    fxDisc(L, c.x, c.y, r * 1.7 + 3, FX_CHARGE[4], (0.22 + 0.06 * n + 0.12 * Math.max(0, beat)) * fade);   // its glow, beating
    fxDisc(L, c.x, c.y, r + 1, FX_CHARGE[5], fade);
    fxDisc(L, c.x, c.y, r, FX_CHARGE[3], fade);
    fxDisc(L, c.x, c.y, r * 0.78, FX_CHARGE[2], fade);
    fxDisc(L, c.x, c.y, r * 0.5, FX_CHARGE[0], fade);
    if(beat > 0.55) for(let i = 0; i < 4 + n * 2; i++){ const ang = i / (4 + n * 2) * 6.28 + t * 0.002; fxLine(L, c.x + Math.cos(ang) * (r + 2), c.y + Math.sin(ang) * (r + 2), c.x + Math.cos(ang) * (r + 4 + n * 2.5), c.y + Math.sin(ang) * (r + 4 + n * 2.5), FX_CHARGE[1], 1, fade); }
  } });
}
FX_MOVES['Cataclysm'] = { side:'self', dur:1250, cast:fxDragonCharge };
FX_MOVES['Cataclysm Max'] = { side:'self', dur:1250, cast:fxDragonCharge };
FX_MOVES['Charge'] = {
  dur:1250,
  cast(ctx){
    if(ctx.type === 'Water' || ctx.self) return fxDragonCharge(ctx);
    fxTargets(ctx).slice(0, 1).forEach(b=> FX_KIT.Physical.shot(ctx, fxMuzzle(ctx.from, b), b, { k:0, big:1.3, layer:'back', delay:30 }));   // the Tricerarmor's Charge
  },
  aura(ctx){ fxDragonCharge(ctx); },
  impact(ctx, at, k, side){ FX_KIT[ctx.type === 'Water' ? 'Water' : 'Steel'].burst(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.35 }); },
};
/* UNLEASH (4.16, the designer: "unleash beams need to be much fatter - maybe 3x the width"): great beams of water come
   down on each of them out of the sky, from the side they were sent from. */
function fxUnleash(max){
  return {
    dur:1000,
    cast(ctx){
      const ids = ctx.tids.length ? ctx.tids : fxTheirs(ctx), rnd = fxRand(ctx.seed), W = max ? 15 : 12;
      ids.forEach((id, n)=>{
        const b = fxAnchor(id); if(!b) return;
        const side = fxSideOf(id), layer = fxLayerFor(side);
        for(let i = 0; i < 3; i++){
          const d = 30 + n * 60 + i * 80, x = b.x + (i - 1) * b.w * 0.18 + (rnd() - 0.5) * 6, at = { x, y:b.y + 4 }, s = fxSkyFrom(at, side, 0.36);
          fxAdd({ layer, dur:d + 260, step(L, t){
            if(t < d) return;
            const u = Math.min(1, (t - d) / 70), cv = t < d + 150 ? 1 : 1 - (t - d - 150) / 110, e = { x:s.x + (at.x - s.x) * u, y:s.y + (at.y - s.y) * u };
            fxLine(L, s.x, s.y, e.x, e.y, FX_WATER[5], W + 2, cv);
            fxLine(L, s.x, s.y, e.x, e.y, FX_WATER[2], W, cv);
            fxLine(L, s.x, s.y, e.x, e.y, FX_WATER[1], Math.round(W * 0.55), cv);
            fxLine(L, s.x, s.y, e.x, e.y, FX_ICE[0], Math.round(W * 0.22), cv);
            if(u >= 1) fxDisc(L, at.x, at.y, W * 0.8, FX_WATER[0], cv * 0.8);
          } });
        }
      });
    },
    impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSplash(at, layer, { seed:ctx.seed + k, big:max ? 1.8 : 1.5 }); fxRingBurst(at, layer, FX_WATER, max ? 1.6 : 1.3, 460); },
  };
}
FX_MOVES['Unleash'] = fxUnleash(false);
FX_MOVES['Unleash Max'] = fxUnleash(true);                     // the Rocky Caverns' finale
/* HYPERBEAM (4.16, the designer: "hyperbeam can be fatter too"). */
function fxHyperbeam(max){
  return {
    dur:1100,
    cast(ctx){
      const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), a = fxMuzzle(ctx.from, b), W = max ? 19 : 15;
      fxAdd({ layer:ctx.side === 'player' ? 'front' : 'back', dur:900, step(L, t){
        if(t < 200){ fxDisc(L, a.x, a.y, 3 + t / 18, FX_TEAL[1]); fxRing(L, a.x, a.y, 16 - t / 16, 2, FX_TEAL[0]); return; }
        const cv = t < 700 ? 1 : 1 - (t - 700) / 200, w = t < 260 ? W * 0.45 : W + Math.sin(t * 0.06) * 2.5;
        fxLine(L, a.x, a.y, b.x, b.y, FX_TEAL[2], w + 8, 0.3 * cv);
        fxBeam(L, a, b, w, [FX_ICE[0], FX_TEAL[1], FX_WATER[2], FX_WATER[3], FX_WATER[4], FX_WATER[5]], cv, true, t);
        fxLine(L, a.x, a.y, b.x, b.y, FX_ICE[0], Math.max(2, Math.round(w * 0.3)), cv);
        fxDisc(L, a.x, a.y, w * 0.75, FX_ICE[0], cv);
      } });
    },
    impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSplash(at, layer, { seed:ctx.seed + k, big:max ? 2 : 1.7 }); fxRingBurst(at, layer, FX_TEAL, max ? 1.9 : 1.6, 500); },
  };
}
FX_MOVES['Hyperbeam'] = fxHyperbeam(false);
FX_MOVES['Hyperbeam Max'] = fxHyperbeam(true);                 // the Rocky Caverns' finale
FX_MOVES['Dragon Legacy'] = { side:'self', dur:900, cast(ctx){ FX_KIT.Water.aura(ctx, ctx.fromId, { big:1.2 }); } };

/* ---------- THE PHOENIX (fire) ---------- */
/* Scorch: a dart of flame shaped like a feather. */
FX_MOVES['Scorch'] = {
  dur:700,
  cast(ctx){
    fxTargets(ctx).slice(0, 1).forEach(b=>{
      const a = fxMuzzle(ctx.from, b), ang = Math.atan2(b.y - a.y, b.x - a.x), S = FX_SHOT;
      fxTravel(ctx.side === 'player' ? 'front' : 'back', a, b, { delay:30, time:230, lift:10 }, (L, p, u, t, path)=>{
        for(let k = 6; k >= 1; k--){ const q = path(Math.max(0, u - k * 0.025)); fxDisc(L, q.x, q.y, (3 - k * 0.35) * S, FX_FIRE[2 + (k >> 1)], 1 - k * 0.1); }
        fxLeaf(L, p.x, p.y, 13 * S, ang, [FX_FIRE[1], FX_FIRE[2], FX_FIRE[3], FX_FIRE[5]]);
      });
    });
  },
  impact(ctx, at, k, side){ fxFireBurst(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.05 }); },
};
/* Firestorm: fire falls out of the sky on each of them (the designer: "i love firestorm … just increase the size of the
   firestorm projectiles, please"): twice the size now, and from the side it was sent from. */
FX_MOVES['Firestorm'] = {
  dur:900,
  cast(ctx){
    const foes = fxTargets(ctx), rnd = fxRand(ctx.seed), side = ctx.side === 'player' ? 'player' : 'enemy', layer = side === 'player' ? 'front' : 'back';
    foes.forEach((b, n)=>{ for(let i = 0; i < 3; i++){ const d = 30 + n * 40 + i * 80, x = b.x + (rnd() - 0.5) * b.w * 0.5, at = { x, y:b.y - 4 }, s = fxSkyFrom(at, side, 0.32), ang = Math.atan2(at.y - s.y, at.x - s.x);
      fxTravel(layer, s, at, { delay:d, time:230, lift:0, linear:true }, (L, p, u, t)=>{
        fxLine(L, p.x - Math.cos(ang) * 18, p.y - Math.sin(ang) * 18, p.x, p.y, FX_FIRE[3], 5, 0.7);
        fxFlameBall(L, p.x, p.y, 3.5 * FX_SHOT, FX_FIRE, t, ctx.seed + i, { wob:0.3, up:0.2, cols:[FX_FIRE[3], FX_FIRE[2], FX_FIRE[1], FX_FIRE[0]], outline:FX_FIRE[5] });
      }); } });
  },
  impact(ctx, at, k, side){ fxFireBurst(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.15 }); },
};
/* Nova: the phoenix blazes, and a ring of solar fire sweeps out across the field. (The designer: "i love … nova by the
   way! … the nova animation could possibly be used for overheat star and wildfire's aoe damage procs, too": the two
   below play it.) */
function fxNovaCast(ctx){
  const a = ctx.from;
  if(ctx.fromId && document.getElementById(ctx.fromId)) fxAdd({ layer:fxOverOf(ctx.fromId), dur:300, step(L, t){ fxGlow(L, ctx.fromId, FX_GOLD[1], t < 200 ? 1 : 0, FX_FIRE[3]); } });
  fxAdd({ layer:'back', dur:900, step(L, t){
    if(t < 150) return;
    const u = fxEaseOut((t - 150) / 750), rr = 10 + u * FX.W * 0.95, cv = 1 - u * 0.7;
    fxRing(L, a.x, a.y, rr + 2, 2, FX_FIRE[5], cv, 0.6); fxRing(L, a.x, a.y, rr, 3, FX_FIRE[2], cv, 0.6); fxRing(L, a.x, a.y, rr - 3, 2, FX_GOLD[1], cv, 0.6);
  } });
  fxSpray('back', fxBurstParts(a.x, a.y, 30, { seed:ctx.seed, vmin:120, vmax:260, ramp:[FX_GOLD[0], FX_GOLD[1], FX_FIRE[2], FX_FIRE[3]], drag:1.2, lmin:400, lmax:700, delay:150 }), 1000);
}
function fxNovaImpact(ctx, at, k, side){ const layer = fxLayerFor(side); fxFireBurst(at, layer, { seed:ctx.seed + k, big:1.3 }); fxSpray(layer, fxBurstParts(at.x, at.y, 6, { seed:ctx.seed + k + 1, vmin:20, vmax:50, ramp:[FX_ICE[0], FX_GOLD[1]], grav:-30, lmin:400, lmax:600, delay:200 }), 900); }
/* NOVA itself (4.18, the designer: "could nova's ring be thicker and more pronounced and dim the background so it looks
   bright? also please first gradually turn phoenix's sprite glowing white and with a pulsing aura that expands before
   the thick ring of nova fires out. this will create the impression of more damage and distinguish it from overheat star
   and wildfire."): the field darkens; the phoenix turns white, more and more, a golden aura round it beating and
   widening, pulses running out of it; then a thick ring of solar fire bursts out of it across the field — dark-edged,
   red, gold, white-hot at its front, a glow behind it — sparks flying with it, reaching them as the blow lands. Wildfire's
   scorch and Overheat ✦'s burn keep the plain ring above. */
const FX_WHITEGLOW = [fxRGB('#ffe7a8'), fxRGB('#fff6d8'), fxRGB('#ffffff')];
function fxNovaWind(ctx){
  const id = ctx.fromId, a = ctx.from, W = 640;                          // the wind-up, before the ring
  fxDimOn(0.42);
  fxLater(W + 900, ()=> fxDimOff());
  if(id){
    fxAdd({ layer:fxOverOf(id), z:-1, dur:W + 260, step(L, t){          // whiter and whiter
      const u = Math.min(1, t / W), cv = t < W ? 0.12 + 0.88 * u * u : Math.max(0, 1 - (t - W) / 260);
      fxTint(L, id, { ramp:FX_WHITEGLOW, rim:FX_WHITEGLOW[2], cover:cv });
    } });
    fxAdd({ layer:fxUnderOf(id), dur:W + 200, step(L, t){               // its aura, beating and widening
      const u = Math.min(1, t / W), beat = 0.5 + 0.5 * Math.sin(t * 0.03 + u * 6), cv = t < W ? 1 : Math.max(0, 1 - (t - W) / 200);
      const r = a.w * (0.42 + 0.3 * u) * (1 + 0.08 * beat);
      fxDisc(L, a.x, a.y, r + 8, FX_GOLD[2], 0.22 * cv);
      fxDisc(L, a.x, a.y, r + 3, FX_GOLD[1], 0.38 * cv * (0.6 + 0.4 * beat));
      fxDisc(L, a.x, a.y, r * 0.8, FX_GOLD[0], 0.5 * cv * u);
    } });
    for(let i = 0; i < 3; i++) fxAdd({ layer:fxUnderOf(id), dur:W, step(L, t){   // pulses running out of it, wider each time
      const t0 = i * 200;
      if(t < t0) return;
      const u = (t - t0) / 260;
      if(u > 1) return;
      fxRing(L, a.x, a.y, a.w * (0.35 + u * (0.5 + i * 0.2)), 2, FX_GOLD[1], 1 - u, 0.8);
    } });
  }
  fxLater(W, ()=>{                                                      // and the thick ring
    fxFlash(fxOverOf(id || ''), a, 20, FX_WHITEGLOW[2], 90);
    fxAdd({ layer:'back', dur:1000, step(L, t){
      const u = fxEaseOut(t / 900), rr = 14 + u * FX.W * 1.05, cv = t < 700 ? 1 : Math.max(0, 1 - (t - 700) / 300), sy = 0.62;
      fxRing(L, a.x, a.y, rr - 14, 4, FX_GOLD[2], cv * 0.35, sy);                       // a glow behind its front
      fxRing(L, a.x, a.y, rr + 5, 3, FX_FIRE[5], cv, sy);
      fxRing(L, a.x, a.y, rr + 2, 4, FX_FIRE[3], cv, sy);
      fxRing(L, a.x, a.y, rr - 2, 4, FX_FIRE[2], cv, sy);
      fxRing(L, a.x, a.y, rr - 5, 3, FX_GOLD[1], cv, sy);
      fxRing(L, a.x, a.y, rr - 8, 2, FX_GOLD[0], cv, sy);
    } });
    fxSpray('back', fxBurstParts(a.x, a.y, 44, { seed:ctx.seed, vmin:150, vmax:330, ramp:[FX_GOLD[0], FX_GOLD[1], FX_FIRE[2], FX_FIRE[3]], drag:1.1, lmin:450, lmax:800 }), 1100);
  });
}
FX_MOVES['Nova'] = { dur:1500, hold:650, cast:fxNovaWind, aura(ctx){ fxNovaWind(ctx); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxFireBurst(at, layer, { seed:ctx.seed + k, big:1.55 }); fxFlash(layer, at, 14, FX_GOLD[0], 60);
    fxSpray(layer, fxBurstParts(at.x, at.y, 10, { seed:ctx.seed + k + 1, vmin:30, vmax:80, ramp:[FX_ICE[0], FX_GOLD[1]], grav:-30, lmin:400, lmax:650, delay:120 }), 900); } };
/* Wildfire's scorch and Overheat ✦'s burn: Nova's ring, from the one burning (from your side when it burns from the
   bench); the fight holds the burn back a moment (fxHoldFor) so the ring reaches them as it lands. */
FX_MOVES['Wildfire'] = { dur:1100, hold:300, cast:fxNovaCast, impact:fxNovaImpact };
FX_MOVES['Overheat Burn'] = { dur:1100, hold:300, cast:fxNovaCast, impact:fxNovaImpact };
/* INCINERATE and its Max (4.16, the designer: "incinerate max: i like your previous beam better than the flamethrower.
   could you go back to that but colour code it according to the damage coefficient like you did later? also, could you
   set the burning animation behind the monster sprite rather than in front, and turn the monster sprite very dark …").
   As the first draft: it flares up where it stands, wings of flame opening behind it, and a stream of fire pours across
   to its target, pouring until the blow lands — in the colours of how far past its base it was written: orange at its
   base, sacred gold halfway (and a Max at its least), white-gold at full, rings of flame running along it. Where it lands
   a pillar of fire goes up behind the one struck, throwing off sparks like feathers, and that one is black against it. */
function fxIncinerate(max){
  const HOLD = max ? 450 : 350;
  return {
    dur:1100, hold:HOLD,
    cast(ctx){
      const ch = ctx.charge == null ? 0.5 : ctx.charge, P = ch >= 0.67 ? FX_WHITEFIRE : (ch >= 0.33 || max) ? FX_SACRED : FX_FIRE;
      ctx.flame = { pal:P, ch };
      const a = ctx.from, b = ctx.to[0] || fxEnemyRowMiddle(), hit = 330 + HOLD, span = 1 + ch * 0.35;
      fxAdd({ layer:fxUnderOf(ctx.fromId), dur:hit + 260, step(L, t){             // the wings: five feathers of flame a side
        const open = fxEaseOut(Math.min(1, t / 240)), fade = t < hit - 60 ? 1 : Math.max(0, 1 - (t - hit + 60) / 300);
        if(fade <= 0) return;
        for(const sgn of [-1, 1]) for(let i = 0; i < 5; i++){
          const ox = a.x + sgn * 5, oy = a.y - a.h * 0.12, spread = (0.3 + i * 0.26) * open, len = a.h * (0.62 - Math.abs(i - 1.5) * 0.07) * (0.4 + 0.6 * open) * span;
          for(let j = 9; j >= 0; j--){
            const f = j / 9, ang = -Math.PI / 2 + sgn * (spread + f * 0.5 * open), d = len * f;
            fxFlameBall(L, ox + Math.cos(ang) * d, oy + Math.sin(ang) * d, 3.6 * (1 - f * 0.65) * span, P, t, ctx.seed + i * 11 + j, { wob:0.2, cols:[P[3], P[2], P[1], P[0]], outline:P[5], cover:fade });
          }
        }
      } });
      const path = fxArc({ x:a.x + 8, y:a.y - 8 }, b, 16), wmax = (3.5 + 3 * ch) * (max ? 1.25 : 1);
      fxAdd({ layer:ctx.side === 'player' ? 'front' : 'back', dur:hit + 420, step(L, t){   // the stream
        if(t < 110) return;
        const head = Math.min(1, (t - 110) / 220), tail = t < hit ? 0 : Math.min(1, (t - hit) / 280);
        if(tail >= 1) return;
        for(let u = tail; u <= head; u += 0.028){
          const p = path(u), w = 3 + wmax * Math.sin(Math.min(1, u) * Math.PI) + 1.2 * Math.sin(t * 0.03 + u * 9);
          fxFlameBall(L, p.x, p.y, w, P, t + u * 300, ctx.seed + Math.round(u * 40), { wob:0.35, cols:[P[4], P[3], P[2], P[1], P[0]], outline:P[5] });
        }
        if(ch >= 0.67 && t < hit) for(let r = 0; r < 3; r++){ const u = ((t / 260) + r / 3) % 1; if(u > head) continue; const p = path(u); fxRing(L, p.x, p.y, wmax + 6 + u * 4, 1, FX_GOLD[1], 1 - u * 0.5, 0.9); }
      } });
    },
    impact(ctx, at, k, side){
      const f = ctx.flame || { pal:FX_FIRE, ch:0.5 }, P = f.pal, seed = ctx.seed + k * 31, rnd = fxRand(seed), id = at.id, behind = id ? fxUnderOf(id) : fxUnderFor(side);
      fxFireBurst(at, behind, { seed, big:1.3 + f.ch * 0.5, pal:P });
      const hgt = at.h * (1.25 + f.ch * 0.4), wid = at.w * (0.16 + f.ch * 0.06);
      fxAdd({ layer:behind, dur:900, step(L, t){              // the pillar behind it: five tongues, the middle tallest
        const u = t / 900, rise = fxEaseOut(Math.min(1, t / 210)), cv = u < 0.62 ? 1 : 1 - (u - 0.62) / 0.38;
        fxTongue(L, at.x - wid * 2.1, at.foot, hgt * rise * 0.5, wid * 0.75, t, 4, P, cv);
        fxTongue(L, at.x + wid * 2.1, at.foot, hgt * rise * 0.55, wid * 0.75, t, 5, P, cv);
        fxTongue(L, at.x - wid * 1.0, at.foot, hgt * rise * 0.72, wid * 0.85, t, 1, P, cv);
        fxTongue(L, at.x + wid * 1.0, at.foot, hgt * rise * 0.78, wid * 0.85, t, 2, P, cv);
        fxTongue(L, at.x, at.foot, hgt * rise, wid * 1.2, t, 3, P, cv);
      } });
      const feathers = [];
      for(let i = 0; i < 12 + Math.round(12 * f.ch); i++) feathers.push({ x:at.x + (rnd() - 0.5) * wid * 3, y:at.foot - rnd() * hgt * 0.6, vx:(rnd() - 0.5) * 110, vy:-(60 + rnd() * 90),
        life:520 + rnd() * 320, size:1, ramp:[P[0], P[1], P[2], P[3], P[4]], grav:170, drag:2.5, delay:120 + rnd() * 220, shape:'streak' });
      fxSpray(behind, feathers, 1250);
      fxBacklit(id, P[2], P[1], 950);
    },
  };
}
FX_MOVES['Incinerate'] = fxIncinerate(false);
FX_MOVES['Incinerate Max'] = fxIncinerate(true);

/* ---------- THE FOREST FAIRY (grass) ---------- */
FX_MOVES['Fairy Wind'] = {
  dur:700,
  cast(ctx){
    fxTargets(ctx).slice(0, 1).forEach(b=>{
      const a = fxMuzzle(ctx.from, b), ang = Math.atan2(b.y - a.y, b.x - a.x);
      [0, 1].forEach(i=> fxTravel(ctx.side === 'player' ? 'front' : 'back', a, b, { delay:30 + i * 70, time:240, lift:i ? -16 : 16, linear:true }, (L, p, u, t)=>{
        fxCrescent(L, p.x, p.y, 8 * FX_SHOT, ang, [FX_GRASS[0], FX_GRASS[1], FX_GRASS[3], FX_GRASS[5]]);
        fxLeaf(L, p.x - Math.cos(ang) * 14, p.y - Math.sin(ang) * 14 + (i ? 4 : -4), 7, t * 0.04 + i, FX_LEAFC);
      }));
    });
  },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Grass.burst(at, layer, { seed:ctx.seed + k, big:1 }); fxSpray(layer, fxLeafParts(at, 6, { seed:ctx.seed + k, vmin:40, vmax:110 }), 900); },
};
/* GIGA DRAIN (4.17, the designer: "Let giga drain flash the enemy or enemies (faintly flashing a red tint while bright
   light green particles float to forest fairy and she glows bright green as the particles arrive)"): no leaves thrown
   now. As it lands, each one it reaches flashes a faint red and its life floats across to her as motes of bright light
   green; she glows bright green as they come (fxLifeDrain) — the Forest Guardian's gift from every one of them. A share
   that goes on to another of yours is handed on from her (fxPassDrink, from the fight), and the fight shows the drink as
   the motes reach her (fxDrinkMs). */
FX_MOVES['Giga Drain'] = {
  dur:1500,
  cast(ctx){                                                     // a breath of green round her as she reaches for them
    const id = ctx.fromId, a = ctx.from;
    if(!id || !a) return;
    fxAdd({ layer:fxOverOf(id), z:-1, dur:330, step(L, t){ const u = t / 330; fxGlow(L, id, FX_SAP[2], 0.16 * Math.sin(u * Math.PI)); } });
  },
  impact(ctx, at, k, side){
    if(!at.id || !ctx.fromId) return;
    fxLifeDrain(at.id, ctx.fromId, { seed:ctx.seed + k * 13, n:ctx.tids.length > 1 ? 9 : 12 });
  },
};
FX_MOVES['Overgrowth'] = {
  side:'self', dur:1300, hold:250,
  cast(ctx){
    fxMine(ctx).forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const rnd = fxRand(ctx.seed + n), blooms = [], petals = [FX_ICE[0], FX_GOLD[1], FX_GRASS[0]];
      for(let i = 0; i < 9; i++){ const ang = i / 9 * Math.PI * 2 + rnd() * 0.4; blooms.push({ x:a.x + Math.cos(ang) * a.w * 0.45, y:a.foot + Math.sin(ang) * a.w * 0.12, d:60 + i * 50, back:Math.sin(ang) < 0, col:petals[i % 3] }); }
      for(const behind of [true, false]) fxAdd({ layer:behind ? fxUnderOf(id) : fxOverOf(id), dur:1150, step(L, t){
        blooms.forEach(bl=>{
          if(bl.back !== behind || t < bl.d) return;
          const g = fxEaseOut(Math.min(1, (t - bl.d) / 250)), cv = t < 900 ? 1 : 1 - (t - 900) / 250, h = 10 * g;
          fxLine(L, bl.x, bl.y, bl.x, bl.y - h, FX_GRASS[3], 2, cv);
          fxLeaf(L, bl.x + 3, bl.y - h * 0.5, 5, -0.4, FX_LEAFC, cv);
          fxFlower(L, bl.x, bl.y - h, 3.5 * g, bl.col, FX_GOLD[2], FX_GRASS[5], t * 0.002, cv);
        });
      } });
      fxBuffLook(id, fxBuffOf('Grass'), 1050, 250);
    });
  },
};
/* VERDANT WRATH (the Forest Fairy's Ultimate) and its Max. (4.20, the designer: "forest fairy's verdant wrath should
   also do a similar attack where three small orbs fire three solar beams at the target, hitting it three times"): small
   green suns gather round her, one for each strike (the Max's three; the Ultimate's two, as it strikes twice); each
   strike one of them fires a solar beam at the one struck — flaring, then spent — and there a burst of bright green
   balls, as Verdant Nova's. (Until 4.20 thorned vines lashing up.) */
function fxVerdantWrath(max){
  const N = max ? 3 : 2;
  return {
    dur:1100, hold:max ? 600 : 450,
    cast(ctx){
      const id = ctx.fromId, f = ctx.from;
      if(!f) return;
      if(id) fxPuffs(fxUnderOf(id), { x:f.x, y:f.foot }, 6, { seed:ctx.seed, pal:[FX_GRASS[1], FX_GRASS[2], FX_GRASS[3]], r:4, spread:f.w, rise:12, life:600 });
      const a = id ? fxSpriteMid(id) : f, top = id ? fxSpriteTop(id) : f.y - f.h * 0.5, w = a.w || f.w, hh = a.h || f.h;
      const spots = N === 3 ? [[-0.5, 0.2], [0, -1], [0.5, 0.2]] : [[-0.46, 0.12], [0.46, 0.12]];
      const orbs = ctx.orbs = spots.map(([sx, sy], i)=> ({ x:a.x + sx * w, y:sy < 0 ? top - 9 : top + sy * hh, born:i * 90, fired:0, ph:i * 2.1 }));
      const end = 330 + (max ? 600 : 450) + N * 380 + 900;
      fxAdd({ layer:id ? fxOverOf(id) : (ctx.foe ? 'back' : 'front'), z:1, dur:end, step(L, t){
        const now = performance.now();
        orbs.forEach(o=>{
          if(t < o.born) return;
          const g = fxEaseOut(Math.min(1, (t - o.born) / 220)), since = o.fired ? now - o.fired : -1;
          let r = 5.5 * g * (1 + 0.06 * Math.sin(t * 0.03 + o.ph)), fl = 0;
          if(since >= 0){ fl = Math.max(0, 1 - since / 90); r *= since < 80 ? 1.25 : Math.max(0, 1 - (since - 80) / 180); }   // flares as it fires, then is spent
          else if(t > end - 300) r *= Math.max(0, (end - t) / 300);    // never fired (a miss): it fades
          if(r < 0.6) return;
          fxGreenSun(L, o.x, o.y + Math.sin(t * 0.008 + o.ph) * 1.5, r, t, fl);
        });
      } });
    },
    impact(ctx, at, k, side){
      const o = ctx.orbs && ctx.orbs[k % ctx.orbs.length];
      if(o){ o.fired = performance.now(); fxSolarBeam('back', o, at, max ? 5 : 4); }
      fxLater(40, ()=> fxSapBurst(at, fxLayerFor(side), { seed:ctx.seed + k * 13, big:max ? 1.2 : 1.05 }));
    },
  };
}
FX_MOVES['Verdant Wrath'] = fxVerdantWrath(false);
FX_MOVES['Verdant Wrath Max'] = fxVerdantWrath(true);

/* ---------- THE THUNDER NEWT (electric) ---------- */
/* Psyshock: a ball of crackling light thrown at it (4.16: all electric now, and twice the size). */
FX_MOVES['Psyshock'] = {
  dur:700,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const a = fxMuzzle(ctx.from, b);
    fxTravel(ctx.side === 'player' ? 'front' : 'back', a, b, { delay:30, time:240 }, (L, p, u, t)=>{
      const st = (t / 40) | 0;
      fxDisc(L, p.x, p.y, 13, FX_ELEC[3], 0.4); fxDisc(L, p.x, p.y, 10, FX_ELEC[4]); fxDisc(L, p.x, p.y, 9, FX_ELEC[3]); fxDisc(L, p.x, p.y, 7, FX_ELEC[2]); fxDisc(L, p.x, p.y, 4.5, FX_ELEC[1]); fxDisc(L, p.x, p.y, 2.2, FX_ELEC[0]);
      for(let i = 0; i < 4; i++) fxZap(L, p.x, p.y, p.x + Math.cos(st + i * 1.6) * 18, p.y + Math.sin(st * 1.7 + i * 1.6) * 18, ctx.seed + st + i, 1, 3);
    }); }); },
  impact(ctx, at, k, side){ fxSparks(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.15 }); },
};
FX_MOVES['Volt Wave'] = {
  dur:900,
  cast(ctx){
    const foes = fxTargets(ctx), a = ctx.from;
    foes.forEach((b, n)=> fxAdd({ layer:ctx.side === 'player' ? 'front' : 'back', dur:420, step(L, t){
      const u = Math.min(1, (t - n * 40) / 220); if(u <= 0) return;
      const st = (t / 40) | 0, ex = a.x + (b.x - a.x) * u, ey = a.y + (b.y - a.y) * u;
      fxZap(L, a.x, a.y, ex, ey, ctx.seed + st + n * 17, 2, 7);
      fxRing(L, ex, ey, 6, 2, FX_ELEC[1]);
    } }));
  },
  impact(ctx, at, k, side){ fxSparks(at, fxLayerFor(side), { seed:ctx.seed + k, big:1.15 }); },
};
/* Tachypsychia: its time quickened — a dial of lightning round it, its hand racing, copies trailing; it glows with it. */
FX_MOVES['Tachypsychia'] = {
  side:'self', dur:1300,
  cast(ctx){
    const id = ctx.fromId, a = ctx.from;
    if(!a) return;
    fxAdd({ layer:fxUnderOf(id), dur:1150, step(L, t){
      const g = fxEaseOut(Math.min(1, t / 250)), cv = t < 900 ? 1 : 1 - (t - 900) / 250, r = a.w * 0.5 * g;
      fxRing(L, a.x, a.y, r + 1, 1, FX_ELEC[4], cv); fxRing(L, a.x, a.y, r, 2, FX_ELEC[1], cv);
      for(let i = 0; i < 12; i++){ const an = i * Math.PI / 6; fxDisc(L, a.x + Math.cos(an) * (r - 4), a.y + Math.sin(an) * (r - 4), 1.2, i % 3 ? FX_ELEC[2] : FX_ELEC[0], cv); }
      const hand = t * 0.03; fxLine(L, a.x, a.y, a.x + Math.cos(hand) * (r - 3), a.y + Math.sin(hand) * (r - 3), FX_ELEC[3], 2, cv);
      if(t > 300) fxGhostCopy(L, id, -6 - (t % 200) / 40, FX_ELEC[2], 0.4 * cv);
    } });
    const top = fxSkyFrom(a, /^enemy-/.test(id || '') ? 'enemy' : 'player', 0.25);
    fxAdd({ layer:fxOverOf(id), dur:900, step(L, t){ if(t > 250 && t < 400) fxZap(L, top.x, top.y, a.x, a.y, ctx.seed + ((t / 40) | 0), 2, 8); } });
    fxBuffLook(id, fxBuffOf('Electric'), 1000, 320);
  },
};
function fxVoltConcussion(max){
  return {
    dur:1100, hold:max ? 600 : 450,
    cast(ctx){ FX_KIT.Electric.aura(ctx, ctx.fromId, { big:1.3 }); },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side), s1 = fxSkyFrom(at, side, 0.22), s2 = fxSkyFrom(at, side, 0.42);
      fxAdd({ layer, dur:220, step(L, t){ const st = (t / 45) | 0; fxZap(L, s1.x, s1.y, at.x, at.y, ctx.seed + k * 9 + st, max ? 5 : 4, 10); if(max) fxZap(L, s2.x, s2.y, at.x, at.y, ctx.seed + k * 11 + st, 2, 8); } });
      fxSparks(at, layer, { seed:ctx.seed + k, big:max ? 1.7 : 1.45 });
      fxRingBurst(at, layer, FX_ELEC, max ? 1.6 : 1.3, 450);
      fxAdd({ layer, dur:120, step(L, t){ fxDisc(L, at.x, at.y, 18 * (1 - t / 120), FX_ELEC[0], 0.5); } });
    },
  };
}
FX_MOVES['Volt Concussion'] = fxVoltConcussion(false);
FX_MOVES['Volt Concussion Max'] = fxVoltConcussion(true);

/* ---------- THE ANKYLOSAURUS (ground) ---------- */
FX_MOVES['Hammertail'] = {
  dur:700,
  impact(ctx, at, k, side){
    const layer = fxLayerFor(side), dir = k % 2 ? 1 : -1;
    fxAdd({ layer, dur:200, step(L, t){                       // the club's swing, an arc of speed
      const u = Math.min(1, t / 110), cv = t < 130 ? 1 : 1 - (t - 130) / 70, r = at.w * 0.42;
      for(let v = 0; v <= u; v += 0.03){ const an = Math.PI * (0.9 + dir * 0.5) + dir * v * 1.6, x = at.x + Math.cos(an) * r, y = at.y + Math.sin(an) * r * 0.7; fxDisc(L, x, y, 3.2, FX_GROUND[5], cv); fxDisc(L, x, y, 2.4, v > u - 0.15 ? FX_GROUND[0] : FX_GROUND[2], cv); }
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
  },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Ground.burst(at, layer, { seed:ctx.seed + k, big:1.2 }); fxQuakeCrack(layer, at, { seed:ctx.seed + k, big:1.3 }); },
};
/* STEEL SOUL (4.16, the designer: "steel soul should involve the monster glowing completely light grey with a diagonal
   white bloom like a metallic reflection running through it"). */
FX_MOVES['Steel Soul'] = {
  side:'self', dur:1300, hold:250,
  cast(ctx){
    const id = ctx.fromId, a = ctx.from;
    if(!a) return;
    fxMetal(id, 1200, 30);
    fxGroundRing(fxUnderOf(id), a, { cols:[FX_STEEL[1], FX_STEEL[2], FX_STEEL[3]], line:FX_STEEL[5], r1:a.w * 0.55, dur:650 });
    fxSpray(fxOverOf(id), [0, 1, 2, 3].map(i=> ({ x:a.x + (i - 1.5) * a.w * 0.24, y:a.y - a.h * 0.28 + (i % 2) * 10, vx:0, vy:0, life:320, ramp:[0], delay:300 + i * 140, draw(L, x, y, u){ fxStar4(L, x, y, 4.5 * Math.sin(u * Math.PI) + 1, FX_STEEL[0], FX_STEEL[0]); } })), 1000);
  },
};
function fxRampage(max){
  return {
    dur:1200, hold:max ? 600 : 450,
    cast(ctx){ const a = ctx.from; fxPuffs(fxUnderOf(ctx.fromId), { x:a.x, y:a.foot }, 10, { seed:ctx.seed, pal:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[3]], r:5, spread:a.w * 1.2, rise:10, life:700, stagger:300 }); },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side);
      FX_KIT.Ground.burst({ x:at.x, y:at.foot - 4, w:at.w, h:at.h, foot:at.foot }, layer, { seed:ctx.seed + k, big:max ? 1.6 : 1.4 });
      fxGroundRing(layer, at, { cols:[FX_GROUND[1], FX_GROUND[2], FX_GROUND[3]], line:FX_GROUND[5], r0:6, r1:at.w * 0.7, dur:450 });
      fxSpray(layer, fxRockParts({ x:at.x, y:at.foot }, max ? 9 : 6, { seed:ctx.seed + k * 3, r:2.6, vmin:100, vmax:200, life:650 }), 900);
    },
  };
}
FX_MOVES['Rampage'] = fxRampage(false);
FX_MOVES['Rampage Max'] = fxRampage(true);

/* ---------- THE CALADRIUS (water) ---------- */
FX_MOVES['Glance'] = {
  dur:700,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const a = { x:ctx.from.x + 4, y:ctx.from.y - ctx.from.h * 0.25 };
    fxAdd({ layer:ctx.side === 'player' ? 'front' : 'back', dur:340, step(L, t){ const u = Math.min(1, t / 110), cv = t < 220 ? 1 : 1 - (t - 220) / 120; fxBeam(L, a, { x:a.x + (b.x - a.x) * u, y:a.y + (b.y - a.y) * u }, 3, FX_ICE, cv); fxStar4(L, a.x, a.y, 5, FX_ICE[0], FX_ICE[0]); } }); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Water.burst(at, layer, { seed:ctx.seed + k, big:0.9 }); fxSpray(layer, fxBurstParts(at.x, at.y, 8, { seed:ctx.seed, vmin:40, vmax:90, drag:3, ramp:[FX_ICE[0], FX_ICE[1], FX_ICE[2]], lmin:200, lmax:400 }), 600); },
};
FX_MOVES['Ice Barrier'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxMine(ctx).forEach(id=>{
      const a = fxAnchor(id); if(!a) return;
      const dir = /^enemy-/.test(id) ? -1 : 1, rnd = fxRand(ctx.seed), sh = [];
      for(let i = 0; i < 6; i++) sh.push({ x:a.x + dir * a.w * 0.36 + (i - 2.5) * 4 * dir, h:a.h * (0.35 + rnd() * 0.35), w:3 + rnd() * 2, lean:(rnd() - 0.5) * 4, d:60 + i * 60 });
      fxAdd({ layer:fxOverOf(id), dur:1150, step(L, t){ const cv = t < 900 ? 1 : 1 - (t - 900) / 250; sh.forEach(s=>{ if(t < s.d) return; const g = fxEaseOut(Math.min(1, (t - s.d) / 200)); fxIceShard(L, s.x, a.foot, s.h * g, s.w, s.lean, cv); }); } });
      fxPuffs(fxOverOf(id), { x:a.x + dir * a.w * 0.36, y:a.foot - 4 }, 5, { seed:ctx.seed, pal:[FX_ICE[0], FX_ICE[1], FX_ICE[2]], r:4, spread:a.w * 0.4, rise:8, life:600, delay:300 });
      fxBuffLook(id, fxBuffOf('Water'), 1050, 150);
    });
  },
};
/* Vita: life for its side, in water's colours (a fall of pale blue light, crosses and feathers). */
FX_MOVES['Vita'] = {
  side:'self', dur:1300,
  cast(ctx){
    fxMine(ctx).forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      const rnd = fxRand(ctx.seed + n), bits = [];
      for(let i = 0; i < 12; i++){ const plus = i % 3 === 0; bits.push({ x:a.x + (rnd() - 0.5) * a.w * 0.9, y:a.foot - rnd() * a.h * 0.4, vx:(rnd() - 0.5) * 12, vy:-20 - rnd() * 24, life:900, ramp:[0], delay:rnd() * 500,
        draw(L, x, y, u){ const cv = u > 0.75 ? (1 - u) * 4 : 1; if(plus){ fxRect(L, x - 1, y - 3, 3, 7, FX_WATER[3], cv); fxRect(L, x - 3, y - 1, 7, 3, FX_WATER[3], cv); fxRect(L, x - 0, y - 2, 1, 5, FX_ICE[0], cv); fxRect(L, x - 2, y, 5, 1, FX_ICE[0], cv); } else fxLeaf(L, x + Math.sin(u * 9) * 3, y, 6, Math.sin(u * 7) * 0.8, [FX_ICE[0], FX_ICE[1], FX_ICE[2], FX_ICE[4]], cv); } }); }
      fxSpray(fxOverOf(id), bits, 1500);
      for(let i = 0; i < 3; i++) fxAdd({ layer:fxUnderOf(id), dur:500 + i * 250, step(L, t){ if(t < i * 250) return; const u = (t - i * 250) / 500; fxRing(L, a.x, a.y, 6 + u * a.w * 0.5, 2, FX_WATER[1], 1 - u, 0.8); } });
      fxBuffLook(id, fxBuffOf('Water'), 1100, 200);
    });
  },
};
/* Conversio: a pillar of pale water-light comes down on each of its side, feathers falling through it. */
FX_MOVES['Conversio'] = {
  side:'self', dur:1500, hold:300,
  cast(ctx){
    const ids = fxMine(ctx), all = ids.length ? ids : [ctx.fromId];
    all.forEach((id, n)=>{
      const a = fxAnchor(id); if(!a) return;
      fxAdd({ layer:fxUnderOf(id), dur:1400, step(L, t){             // a pillar of light comes down
        const g = fxEaseOut(Math.min(1, t / 300)), cv = t < 1100 ? 1 : 1 - (t - 1100) / 300, w = a.w * 0.3 * g;
        for(let y = 0; y < a.foot; y++) for(let x = -w - 1; x <= w + 1; x++){ const X = Math.round(a.x + x), e = Math.abs(x) / Math.max(1, w); if(!fxCover(X, y, cv * (e > 1 ? 0.6 : 0.85))) continue; fxSet(L, X, y, e > 1 ? FX_WATER[3] : e > 0.6 ? FX_WATER[1] : FX_ICE[0]); }
      } });
      const feathers = [], rnd = fxRand(ctx.seed + n);
      for(let i = 0; i < 12; i++) feathers.push({ x:a.x + (rnd() - 0.5) * a.w, y:-rnd() * 30, vx:(rnd() - 0.5) * 8, vy:40 + rnd() * 30, life:1300, ramp:[0], delay:200 + rnd() * 500,
        draw(L, x, y, u){ fxLeaf(L, x + Math.sin(u * 10) * 3, y, 7 * FX_RAIN_W, Math.sin(u * 8) * 0.9, [FX_ICE[0], FX_ICE[1], FX_ICE[2], FX_WATER[4]], u > 0.8 ? (1 - u) * 5 : 1); } });
      fxSpray(fxOverOf(id), feathers, 1800);
      fxBuffLook(id, fxBuffOf('Water'), 900, 450);
    });
  },
};

/* ---------- THE WHALELORD (ghost) ---------- */
FX_MOVES['Malice'] = {
  dur:700,
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> FX_KIT.Ghost.shot(ctx, fxMuzzle(ctx.from, b), b, { k:0, big:1.1, layer:ctx.side === 'player' ? 'front' : 'back', delay:30 })); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k, big:1.15 }); },
};
FX_MOVES['Grudge'] = {
  dur:900,
  cast(ctx){ fxTargets(ctx).forEach((b, n)=>{ const a = fxMuzzle(ctx.from, b); fxTravel(ctx.side === 'player' ? 'front' : 'back', a, b, { delay:30 + n * 50, time:300 }, (L, p, u, t)=>{ fxFlameBall(L, p.x, p.y, 5 * FX_SHOT, FX_GHOST, t, ctx.seed + n, { wob:0.35, up:0.4, cols:[FX_GHOST[3], FX_GHOST[2], FX_GHOST[1], FX_GHOST[0]], outline:FX_GHOST[5] }); fxRect(L, p.x - 4, p.y - 2, 2, 2, FX_GHOST[5]); fxRect(L, p.x + 2, p.y - 2, 2, 2, FX_GHOST[5]); }); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k, big:1.15 }); fxRingBurst(at, layer, FX_GHOST, 1); },
};
FX_MOVES['Haunting Aria'] = {
  side:'self', dur:1500,
  cast(ctx){
    const a = ctx.from, rnd = fxRand(ctx.seed), notes = [];
    for(let i = 0; i < 12; i++){ const ang = -0.9 + rnd() * 1.6; notes.push({ x:a.x, y:a.y - a.h * 0.2, vx:Math.cos(ang) * (60 + rnd() * 60) * (ctx.foe ? -1 : 1), vy:Math.sin(ang) * 40 - 20, life:1100, ramp:[0], drag:0.8, delay:i * 70,
      draw(L, x, y, u){ if(u > 0.8 && !fxCover(Math.round(x), Math.round(y), (1 - u) * 5)) return; fxNote(L, x, y + Math.sin(u * 12) * 3, i % 2 ? FX_GHOST[1] : FX_GHOST[2], FX_GHOST[5]); } }); }
    fxSpray('back', notes, 1700);
    for(let i = 0; i < 3; i++) fxAdd({ layer:'back', dur:700 + i * 200, step(L, t){ if(t < i * 200) return; const u = (t - i * 200) / 700; fxRing(L, a.x, a.y - a.h * 0.2, 6 + u * FX.W * 0.5, 2, FX_GHOST[2], (1 - u) * 0.7, 0.6); } });
    if(ctx.fromId) fxBuffLook(ctx.fromId, fxBuffOf('Ghost'), 1100, 150);
  },
};
/* VENGEANCE and its Max (4.18, the designer: "Whalelord's vengeance max should fade him out and create a black-purplish
   fog around the enemies, then create a black impact ring on each one"): he fades away; a black-purple fog rolls in
   round every one of them, thickening; as each blow lands a black ring bursts out from the one it lands on, dark shards
   flying; he comes back as the fog lifts. (Until 4.18 a spectral harpoon out of the sky; and it was never played in a
   fight of yours.) */
const FX_GLOOM = [fxRGB('#09060e'), fxRGB('#1c1228'), fxRGB('#33204a'), fxRGB('#4d3070'), fxRGB('#6c4a96')];
function fxVengeance(max){
  const HOLD = max ? 600 : 450, B = max ? 1.3 : 1.1;
  return {
    dur:1500, hold:HOLD,
    cast(ctx){
      const id = ctx.fromId, back = 330 + HOLD + 1100;
      if(id){
        const a = ctx.from;
        fxPuffs(fxUnderOf(id), { x:a.x, y:a.y }, 10, { seed:ctx.seed, pal:[FX_GLOOM[3], FX_GLOOM[2], FX_GLOOM[1]], r:6, spread:a.w, spreadY:a.h * 0.5, rise:6, life:700, stagger:200, thick:0.7 });
        fxAdd({ layer:fxOverOf(id), z:-1, dur:340, step(L, t){ fxTint(L, id, { ramp:[FX_GLOOM[0], FX_GLOOM[1], FX_GLOOM[3]], cover:Math.min(1, t / 200) }); } });   // darkening as he goes
        fxLater(160, ()=>{ ctx.hidden = fxSpriteHide(id, 260, back + 4000); });
        fxLater(back, ()=> fxSpriteShow(id, 380, ctx.hidden));
      }
      fxTheirs(ctx).forEach((tid, n)=>{                                   // the fog round each of them, behind and before it
        const b = fxAnchor(tid);
        if(!b) return;
        const rnd = fxRand(ctx.seed + n * 17), wisps = [];
        for(let i = 0; i < 24; i++) wisps.push({ ang:rnd() * 6.28, d:b.w * (0.18 + rnd() * 0.36), r:(7 + rnd() * 7) * B, ph:rnd() * 6.28, front:i % 3 === 0, delay:rnd() * 260 });
        const life = 330 + HOLD + 900;
        for(const front of [false, true]) fxAdd({ layer:front ? fxOverOf(tid) : fxUnderOf(tid), dur:life, step(L, t){
          wisps.forEach(w=>{
            if(w.front !== front || t < w.delay) return;
            const u = (t - w.delay) / (life - w.delay), g = fxEaseOut(Math.min(1, (t - w.delay) / 380)), cv = (u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25) * (front ? 0.5 : 0.8);
            const ang = w.ang + t * 0.0012 * (w.ph > 3 ? 1 : -1), x = b.x + Math.cos(ang) * w.d * (1.25 - 0.25 * g), y = b.y + Math.sin(ang) * w.d * 0.55 + Math.sin(t * 0.004 + w.ph) * 2;
            fxDisc(L, x, y, w.r * g + 3, FX_GLOOM[0], cv * 0.45);                                   // its dark edge, thin
            fxDisc(L, x, y, w.r * g, FX_GLOOM[1], cv * 0.7);
            fxDisc(L, x, y - w.r * 0.2, w.r * g * 0.62, FX_GLOOM[2], cv * 0.75);
            fxDisc(L, x - w.r * 0.25, y - w.r * 0.35, w.r * g * 0.28, FX_GLOOM[3], cv * 0.6);
          });
        } });
      });
    },
    impact(ctx, at, k, side){
      const id = at.id, over = id ? fxOverOf(id) : fxLayerFor(side);
      fxAdd({ layer:over, dur:520, step(L, t){                            // a black ring bursting out from it
        const u = fxEaseOut(t / 520), rr = (8 + u * 30) * B, cv = 1 - u;
        fxRing(L, at.x, at.y, rr + 3, 3, FX_GLOOM[3], cv, 0.82);
        fxRing(L, at.x, at.y, rr, 5, FX_GLOOM[0], cv, 0.82);
        fxRing(L, at.x, at.y, rr * 0.62, 2, FX_GLOOM[1], cv * 0.8, 0.82);
      } });
      fxFlash(over, at, 10 * B, FX_GLOOM[4], 60);
      fxSpray(over, fxBurstParts(at.x, at.y, 14, { seed:ctx.seed + k * 9, vmin:70, vmax:190, ramp:[FX_GLOOM[4], FX_GLOOM[3], FX_GLOOM[1], FX_GLOOM[0]], drag:2, lmin:240, lmax:520, shape:'streak' }), 700);
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
    impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxFireBurst(at, layer, { seed:ctx.seed + k, big:max ? 1.6 : 1.35, pal:FX_SOUL }); fxRingBurst(at, layer, FX_SOUL, max ? 1.6 : 1.3, 480); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:0.8 }); },
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
  cast(ctx){ const a = ctx.from; for(let i = 0; i < 4; i++) fxAdd({ layer:'back', dur:700 + i * 120, step(L, t){ if(t < i * 120) return; const u = (t - i * 120) / 700, rr = 8 + u * FX.W; fxRing(L, a.x, a.y, rr + 1, 1, FX_NIGHT[4], 1 - u, 0.65); fxRing(L, a.x, a.y, rr, 2, i % 2 ? FX_PSY[2] : FX_STEEL[1], 1 - u, 0.65); for(let j = 0; j < 12; j++){ const an = j * Math.PI / 6; fxDisc(L, a.x + Math.cos(an) * rr, a.y + Math.sin(an) * rr * 0.65, 1.5, FX_STEEL[0], 1 - u); } } }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxAdd({ layer, dur:400, step(L, t){ fxClock(L, at.x, at.y, 10 * Math.min(1, t / 100), -t * 0.05, t < 300 ? 1 : 1 - (t - 300) / 100); } }); FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k, big:1.2 }); },
};
function fxSpacetimeRift(max){
  return {
    dur:1200, hold:max ? 600 : 450,
    cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxAdd({ layer:'back', dur:700, step(L, t){ const g = Math.min(1, t / 400); for(let i = 0; i < 4; i++){ const an = i * 1.57 + t * 0.01, r = (1 - g) * 40 + 4; fxStar4(L, b.x + Math.cos(an) * r, b.y + Math.sin(an) * r, 2, FX_ICE[0], FX_ICE[0]); } } }); },
    impact(ctx, at, k, side){
      const layer = fxLayerFor(side), an = (k * 0.7) % 1.2 - 0.6;
      fxAdd({ layer, dur:800, step(L, t){                     // the tear opens across it, then seals
        const g = t < 140 ? fxEaseOut(t / 140) : t < 520 ? 1 : 1 - (t - 520) / 280;
        fxRift(L, at.x, at.y, (max ? 54 : 44), (max ? 9 : 7) * g, an, ctx.seed + k, t);
        if(max && t > 100) for(let i = 0; i < 5; i++){ const a2 = i * 1.256 + 0.3; fxBolt(L, at.x, at.y, at.x + Math.cos(a2) * 26, at.y + Math.sin(a2) * 20, ctx.seed + i, FX_ICE[1], 1, 3, 4); }
      } });
      FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.5 : 1.3 });
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
function fxBigEnd(type, at, layer, ctx, k, max, pal){ FX_KIT[type].burst(at, layer, { seed:ctx.seed + k * 13, big:max ? 1.6 : 1.4, k }); fxRingBurst(at, layer, pal || fxRamp(type), max ? 1.5 : 1.2, 460); }
/* Something coming straight down out of the sky onto it, drawn as it lands. */
function fxSigSky(type, pal, w){ return max=> ({ cast(ctx){ FX_KIT[type].aura(ctx, ctx.fromId, { big:1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSkyStreak(layer, at, { side, cols:[pal[0], pal[2], pal[5]], w:(w || 6) * (max ? 1.4 : 1), slant:0.3, dur:220 }); fxBigEnd(type, at, layer, ctx, k, max, pal); } }); }
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
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> fxFireball(ctx, fxMuzzle(ctx.from, b), b, { k:0, delay:40, time:260, r:(max ? 8 : 7) * FX_SHOT, layer:fxLy(ctx) })); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side);
    fxAdd({ layer, dur:620, step(L, t){ const g = fxEaseOut(Math.min(1, t / 160)), cv = t < 400 ? 1 : 1 - (t - 400) / 220, len = (max ? 30 : 24) * g;
      [-Math.PI / 2, -Math.PI / 2 + 1.257, -Math.PI / 2 - 1.257, Math.PI / 2 + 0.6, Math.PI / 2 - 0.6].forEach((an, i)=>{ for(let v = 0; v <= 1; v += 0.06){ const x = at.x + Math.cos(an) * len * v, y = at.y + Math.sin(an) * len * v; fxFlameBall(L, x, y, 4.5 * (1 - v * 0.55), FX_FIRE, t, ctx.seed + i * 7 + Math.round(v * 20), { wob:0.3, cols:[FX_FIRE[3], FX_FIRE[2], FX_FIRE[1], FX_FIRE[0]], outline:FX_FIRE[5], cover:cv }); } }); } });
    fxBigEnd('Fire', at, layer, ctx, k, max); },
}));
fxSig('Solar Beam', fxSigBeam('Grass', [FX_GOLD[0], FX_GOLD[1], FX_GRASS[1], FX_GRASS[2], FX_GRASS[3], FX_GRASS[5]], 320));
fxSig('Horn Drill', max=> ({                                  // a spinning drill bores into it
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const a = fxMuzzle(ctx.from, b), an = Math.atan2(b.y - a.y, b.x - a.x);
    fxTravel(fxLy(ctx), a, b, { delay:40, time:260, linear:true, tail:260, each(L, t){ if(t > 300 && t < 560) fxDrill(L, b.x - Math.cos(an) * 8, b.y - Math.sin(an) * 8, an, (max ? 16 : 13) * FX_SHOT, t); } }, (L, p, u, t)=> fxDrill(L, p.x, p.y, an, (max ? 16 : 13) * FX_SHOT, t)); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSpray(layer, fxRockParts(at, 8, { seed:ctx.seed, r:2, vmin:80, vmax:160, life:500 }), 800); fxSpray(layer, fxBurstParts(at.x, at.y, 10, { seed:ctx.seed + 1, vmin:100, vmax:200, ramp:[FX_ELEC[0], FX_ELEC[1], FX_ELEC[2]], shape:'streak', drag:3, lmin:150, lmax:300 }), 500); fxLater(220, ()=> fxBigEnd('Ground', at, layer, ctx, k, max)); },
}));
function fxDrill(L, x, y, an, len, t){
  const c = Math.cos(an), s = Math.sin(an), pts = [[x, y], [x - c * len - s * len * 0.35, y - s * len + c * len * 0.35], [x - c * len + s * len * 0.35, y - s * len - c * len * 0.35]];
  fxPolyLined(L, pts, FX_STEEL[2], FX_STEEL[5]);
  for(let i = 0; i < 4; i++){ const f = ((i / 4) + t * 0.01) % 1, d = len * f, w = len * 0.35 * f; fxLine(L, x - c * d - s * w, y - s * d + c * w, x - c * d + s * w, y - s * d - c * w, i % 2 ? FX_STEEL[4] : FX_STEEL[0], 1); }
}
fxSig('Thunder', fxSigSky('Electric', FX_ELEC, 7));
FX_MOVES['Thunder'].impact = FX_MOVES['Thunder Max'].impact = function(ctx, at, k, side){ const layer = fxLayerFor(side), max = /Max/.test(ctx.name);
  const s1 = fxSkyFrom(at, side, 0.18), s2 = fxSkyFrom(at, side, 0.4);
  fxAdd({ layer, dur:260, step(L, t){ const st = (t / 45) | 0; fxZap(L, s1.x, s1.y, at.x, at.y, ctx.seed + st, max ? 6 : 5, 12); fxZap(L, s2.x, s2.y, at.x, at.y - 10, ctx.seed + st + 9, 2, 8); } });
  fxAdd({ layer:'back', dur:90, step(L){ for(let y = 0; y < FX.H; y += 2) for(let x = (y >> 1) & 1; x < FX.W; x += 2) fxSet(L, x, y, FX_ELEC[0]); } });
  fxBigEnd('Electric', at, layer, ctx, k, max); };
fxSig('Storm Dive', fxSigSky('Flying', FX_FLY, 7));
fxSig('Savage Strike', max=> ({ cast(ctx){ FX_KIT.Physical.aura(ctx, ctx.fromId, { big:1.1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side);
  [0, 1, 2].forEach(i=> fxLater(i * 70, ()=> FX_KIT.Physical.burst({ x:at.x + (i - 1) * 9, y:at.y + (i % 2 ? -6 : 4) }, layer, { seed:ctx.seed + i, big:max ? 1.3 : 1.1 }))); fxSlashes(at, layer, FX_PHYS, 3, 18, ctx.seed + k); } }));
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
  impact(ctx, at, k, side){ fxFireBurst(at, fxLayerFor(side), { seed:ctx.seed + k, big:max ? 1.4 : 1.2 }); } }));
fxSig('Tesla Bolt', max=> ({ cast(ctx){ FX_KIT.Electric.aura(ctx, ctx.fromId, { big:1.2 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side), a = ctx.from;
  fxAdd({ layer:'back', dur:200, step(L, t){ const st = (t / 40) | 0; for(let i = 0; i < 3; i++) fxZap(L, a.x, a.y - a.h * 0.2, at.x, at.y, ctx.seed + st * 3 + i, i ? 1 : 2, 10); } }); fxBigEnd('Electric', at, layer, ctx, k, max); } }));
fxSig('Livewire', max=> ({ cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const a = fxMuzzle(ctx.from, b);
    fxAdd({ layer:fxLy(ctx), dur:520, step(L, t){ const u = Math.min(1, t / 160), cv = t < 400 ? 1 : 1 - (t - 400) / 120; for(let v = 0; v <= u; v += 0.01){ const x = a.x + (b.x - a.x) * v, y = a.y + (b.y - a.y) * v + Math.sin(v * 18 - t * 0.04) * 5 * Math.sin(v * Math.PI); fxDisc(L, x, y, 1.6, FX_ELEC[4], cv); fxSet(L, Math.round(x), Math.round(y), FX_ELEC[1]); } } }); }); },
  impact(ctx, at, k, side){ fxSparks(at, fxLayerFor(side), { seed:ctx.seed + k, big:max ? 1.5 : 1.3 }); } }));
fxSig('Omnislash', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_ELEC); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSlashes(at, layer, [FX_ICE[0], FX_ELEC[1], FX_ELEC[2], FX_ELEC[3], FX_ELEC[4], FX_ELEC[5]], max ? 7 : 5, 20, ctx.seed + k, 2); fxLater(150, ()=> fxBigEnd('Electric', at, layer, ctx, k, max)); } }));
fxSig('Fortress', max=> ({ cast(ctx){ FX_KIT.Steel.aura(ctx, ctx.fromId, { big:1 }); },     // shells lobbed from it, one a strike
  impact(ctx, at, k, side){ const layer = fxLayerFor(side), a = ctx.from;
    fxAdd({ layer:'back', dur:120, step(L, t){ const p = fxArc(a, at, 60)(0.6 + t / 300); fxDisc(L, p.x, p.y, 8, FX_STEEL[5]); fxDisc(L, p.x, p.y, 6.5, FX_STEEL[3]); fxDisc(L, p.x - 2, p.y - 2, 2, FX_STEEL[0]); } });
    fxSplash(at, layer, { seed:ctx.seed + k, big:max ? 1.4 : 1.2 }); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:0.9 }); } }));
fxSig('Iaijutsu', max=> ({ cast(ctx){ FX_KIT.Water.aura(ctx, ctx.fromId, { big:1 }); },       // one draw: a white line across, then the cut opens
  impact(ctx, at, k, side){ const layer = fxLayerFor(side);
    fxAdd({ layer, dur:420, step(L, t){ const cv = t < 300 ? 1 : 1 - (t - 300) / 120, len = max ? 40 : 32; if(t < 60){ fxLine(L, at.x - len, at.y + 4, at.x + len, at.y - 4, FX_ICE[0], 1); return; } fxLine(L, at.x - len, at.y + 4, at.x + len, at.y - 4, FX_WATER[5], 5, cv); fxLine(L, at.x - len, at.y + 4, at.x + len, at.y - 4, FX_WATER[1], 3, cv); fxLine(L, at.x - len, at.y + 4, at.x + len, at.y - 4, FX_ICE[0], 1, cv); } });
    fxLater(90, ()=> fxBigEnd('Water', at, layer, ctx, k, max)); } }));
fxSig('Dragon Dive', max=> ({ cast(ctx){ FX_KIT.Dragon.aura(ctx, ctx.fromId, { big:1.1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side);
  fxSkyStreak(layer, at, { side, cols:[FX_TEAL[0], FX_DRAGON[2], FX_DRAGON[5]], w:max ? 10 : 8, slant:0.45, dur:220 }); fxSplash(at, layer, { seed:ctx.seed + k, big:1.2 }); fxBigEnd('Dragon', at, layer, ctx, k, max); } }));
fxSig('Ansatsu', max=> ({ cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> fxAdd({ layer:'back', dur:330, step(L, t){ const cv = t < 260 ? 1 : 0; fxLine(L, b.x - 8, b.y - 8, b.x + 8, b.y + 8, FX_RED[3], 2, cv); fxLine(L, b.x + 8, b.y - 8, b.x - 8, b.y + 8, FX_RED[3], 2, cv); } })); fxPuffs('back', ctx.from, 6, { seed:ctx.seed, pal:[FX_SMOKE[1], FX_SMOKE[2], FX_SMOKE[3]], r:5, spread:ctx.from.w * 0.8, rise:6, life:500 }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSlashes(at, layer, [FX_ICE[0], FX_WATER[1], FX_WATER[3], FX_WATER[4], FX_WATER[5], FX_NIGHT[5]], 2, 24, ctx.seed + k, 3); fxLater(100, ()=> fxBigEnd('Physical', at, layer, ctx, k, max)); } }));
fxSig('Primal Rend', max=> ({ cast(ctx){ FX_KIT.Physical.aura(ctx, ctx.fromId, { big:1.1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side);
  fxAdd({ layer, dur:330, step(L, t){ const u = Math.min(1, t / 100), cv = t < 200 ? 1 : 1 - (t - 200) / 130, flip = k % 2 ? 1 : -1; for(let i = 0; i < 3; i++){ const ox = (i - 1) * 8, len = max ? 22 : 18, x0 = at.x + ox - flip * len * 0.6, y0 = at.y - len, x1 = at.x + ox + flip * len * 0.6, y1 = at.y + len * 0.8, ex = x0 + (x1 - x0) * u, ey = y0 + (y1 - y0) * u; fxLine(L, x0, y0, ex, ey, FX_RED[5], 5, cv); fxLine(L, x0, y0, ex, ey, FX_RED[2], 3, cv); fxLine(L, x0, y0, ex, ey, FX_RED[0], 1, cv); } } });
  FX_KIT.Physical.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.4 : 1.2 }); } }));
fxSig('Throat Take', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_ELEC); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxJaws(at, layer, FX_ELEC, max ? 15 : 13); fxLater(110, ()=> fxBigEnd('Electric', at, layer, ctx, k, max)); } }));
fxSig('Sky Splitter', max=> ({ hold:max ? 450 : 350,         // the sky splits: a bolt forks down onto every one of them
  cast(ctx){ const foes = fxTargets(ctx), mid = { x:foes.length ? foes.reduce((s, p)=> s + p.x, 0) / foes.length : FX.W * 0.6, y:24 }, top = fxSkyFrom(mid, ctx.side === 'player' ? 'player' : 'enemy', 0.5);
    fxAdd({ layer:ctx.side === 'player' ? 'front' : 'back', dur:620, step(L, t){ if(t < 200) return; const st = (t / 45) | 0, cv = t < 520 ? 1 : 1 - (t - 520) / 100; const fork = { x:mid.x - (mid.x - top.x) * 0.25, y:20 }; fxZap(L, top.x, top.y, fork.x, fork.y, ctx.seed + st, max ? 5 : 4, 4); foes.forEach((b, i)=> fxZap(L, fork.x, fork.y, b.x, b.y, ctx.seed + st * 5 + i, 2, 8)); } }); },
  impact(ctx, at, k, side){ fxBigEnd('Electric', at, fxLayerFor(side), ctx, k, max); } }));
fxSig('Dragon Drive', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_DRAGON); FX_KIT.Dragon.aura(ctx, ctx.fromId, { big:1 }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxDragonBurst(at, layer, { seed:ctx.seed + k, big:max ? 1.4 : 1.2 }); fxRingBurst(at, layer, FX_DRAGON, 1.2); } }));
FX_MOVES['Trample'] = { dur:1000, hold:250, cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_STEEL); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); FX_KIT.Ground.burst({ x:at.x, y:at.foot - 4, w:at.w, h:at.h, foot:at.foot }, layer, { seed:ctx.seed + k, big:1.4 }); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:0.9 }); } };
fxSig('Fiery Jaws', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_FIRE); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxJaws(at, layer, FX_FIRE, max ? 15 : 13); fxLater(110, ()=> fxBigEnd('Fire', at, layer, ctx, k, max)); } }));
fxSig('Lunacy', max=> ({ hold:max ? 450 : 350,                // a moon rises over it, and madness spirals down
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=>{ const m = { x:b.x + 10, y:Math.max(12, b.y - b.h * 0.95) };
    fxAdd({ layer:'back', dur:800, step(L, t){ const g = fxEaseOut(Math.min(1, t / 250)), cv = t < 650 ? 1 : 1 - (t - 650) / 150, r = (max ? 12 : 10) * g;
      fxPaint(L, m.x, m.y, r + 2, (x, y, d, an, X, Y)=>{ if(!fxCover(X, Y, cv)) return 0; const d2 = Math.hypot(x + r * 0.45, y - r * 0.2); if(d > r + 1 || d2 < r * 0.8) return 0; return d > r ? FX_FORGET[5] : FX_GOLD[d < r * 0.5 ? 0 : 1]; });
      if(t > 250) for(let j = 0; j < 40; j++){ const f = j / 40, an = f * Math.PI * 5 + t * 0.012, rr = 2 + f * 14; fxSet(L, Math.round(b.x + Math.cos(an) * rr), Math.round(m.y + 10 + f * (b.y - m.y - 10) + Math.sin(an) * rr * 0.3), f > 0.5 ? FX_PSY[2] : FX_GOLD[1]); } } }); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxBigEnd('Psychic', at, layer, ctx, k, max); fxSplash(at, layer, { seed:ctx.seed, big:0.8 }); } }));
fxSig('Piercing Stoop', max=> ({ cast(ctx){ const a = ctx.from; fxAdd({ layer:'back', dur:420, step(L, t){ const u = t / 420; fxLine(L, a.x, a.y - u * FX.H, a.x, a.y - u * FX.H + 24, FX_GOLD[2], 3, 1 - u); } }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSkyStreak(layer, at, { side, cols:[FX_GOLD[0], FX_GOLD[1], FX_GOLD[4]], w:max ? 7 : 5, slant:0.38, dur:200 }); fxBigEnd('Flying', at, layer, ctx, k, max, FX_GOLD); } }));
fxSig('Grave Charge', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), a = fxMuzzle(ctx.from, b), an = Math.atan2(b.y - a.y, b.x - a.x);
    fxTravel(fxLy(ctx), a, b, { delay:60, time:240, linear:true }, (L, p)=>{ fxPolyLined(L, fxRot([[20, 0], [-28, -6], [-28, 6]], p.x, p.y, an), FX_SOUL[1], FX_SOUL[5]); for(let i = 1; i < 5; i++) fxDisc(L, p.x - Math.cos(an) * (28 + i * 8), p.y - Math.sin(an) * (28 + i * 8), (2.5 - i * 0.4) * 2, FX_SOUL[2], 1 - i * 0.2); }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxBigEnd('Ghost', at, layer, ctx, k, max, FX_SOUL); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:0.9 }); } }));
fxSig('Shadow Rampage', max=> ({ cast(ctx){ fxTargets(ctx).forEach((b, n)=> fxAdd({ layer:'back', dur:700, step(L, t){ const d = 60 + n * 60; if(t < d) return; const u = Math.min(1, (t - d) / 200), cv = t < 560 ? 1 : 1 - (t - 560) / 140;   // threads drop onto each, then jerk
      for(let i = -1; i <= 1; i++){ const x = b.x + i * b.w * 0.2 + Math.sin(t * 0.03 + i) * 2; fxLine(L, x, 0, x, (b.y - b.h * 0.3) * u, FX_GHOST[2], 1, cv); fxRect(L, x - 1, (b.y - b.h * 0.3) * u - 1, 3, 3, FX_GHOST[1], cv); } } })); },
  impact(ctx, at, k, side){ fxBigEnd('Ghost', at, fxLayerFor(side), ctx, k, max); } }));
fxSig('Pounce', max=> ({ cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(), a = ctx.from, path = fxArc(a, b, 50);
    fxAdd({ layer:'back', dur:320, step(L, t){ const u = Math.min(1, t / 260); for(let v = Math.max(0, u - 0.3); v <= u; v += 0.02){ const p = path(v); fxDisc(L, p.x, p.y, 6, FX_GHOST[4], 0.7); } } }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxSlashes(at, layer, FX_GHOST, 3, 16, ctx.seed + k); fxBigEnd('Ghost', at, layer, ctx, k, max); } }));
fxSig('Spirit Pounce', max=> ({ cast(ctx){ FX_KIT.Psychic.aura(ctx, ctx.fromId, { big:1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side), a = ctx.from;
  fxAdd({ layer:'back', dur:160, step(L, t){ const p = fxArc(a, at, 40)(Math.min(1, 0.55 + t / 300)); fxFlameBall(L, p.x, p.y, 5 * FX_SHOT, FX_PSY, t, ctx.seed + k, { wob:0.3, up:0.4, cols:[FX_PSY[3], FX_PSY[2], FX_PSY[1], FX_PSY[0]], outline:FX_PSY[5] }); } });
  FX_KIT.Psychic.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.4 : 1.2 }); } }));
fxSig('Pent-up Fury', max=> ({ hold:max ? 450 : 350, cast(ctx){ const id = ctx.fromId; fxAdd({ layer:fxOverOf(id), z:-1, dur:600, step(L, t){ fxGlow(L, id, FX_RED[2], Math.min(0.6, t / 600), ((t / 60) | 0) % 2 ? FX_RED[3] : FX_RED[1]); } }); FX_KIT.Physical.aura(ctx, id, { big:1.2 }); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxBigEnd('Physical', at, layer, ctx, k, max, FX_RED); fxRingBurst(at, layer, FX_PSY, max ? 2 : 1.6, 520); } }));
fxSig('Many-Head Strike', max=> ({ cast(ctx){ FX_KIT.Dragon.aura(ctx, ctx.fromId, { big:1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side), a = ctx.from, off = ((k % 3) - 1) * 26;
  fxAdd({ layer:'back', dur:220, step(L, t){ const u = Math.min(1, t / 110), cv = t < 160 ? 1 : 1 - (t - 160) / 60, s = { x:a.x + off * 0.3, y:a.y - a.h * 0.3 }, c = { x:(s.x + at.x) / 2 + off, y:Math.min(s.y, at.y) - 30 };   // a serpent's neck lunging, head first
    let px = s.x, py = s.y; for(let v = 0; v <= u; v += 0.03){ const x = (1 - v) * (1 - v) * s.x + 2 * (1 - v) * v * c.x + v * v * at.x, y = (1 - v) * (1 - v) * s.y + 2 * (1 - v) * v * c.y + v * v * at.y; fxDisc(L, x, y, 3.5, FX_DRAGON[5], cv); px = x; py = y; }
    for(let v = 0; v <= u; v += 0.03){ const x = (1 - v) * (1 - v) * s.x + 2 * (1 - v) * v * c.x + v * v * at.x, y = (1 - v) * (1 - v) * s.y + 2 * (1 - v) * v * c.y + v * v * at.y; fxDisc(L, x, y, 2.5, FX_PSY[2], cv); }
    fxPolyLined(L, fxRot([[7, 0], [-3, -5], [-3, 5]], px, py, Math.atan2(at.y - c.y, at.x - c.x)), FX_PSY[1], FX_DRAGON[5], cv); } });
  fxLater(90, ()=>{ fxDragonBurst(at, layer, { seed:ctx.seed + k, big:max ? 1.3 : 1.1 }); }); } }));
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
  cast(ctx){ fxTargets(ctx).slice(0, 1).forEach(b=> fxAdd({ layer:'back', dur:800, step(L, t){ const cv = t < 650 ? 1 : 1 - (t - 650) / 150; for(let i = 0; i < (max ? 4 : 3); i++){ const an = t * 0.008 + i * 6.28 / (max ? 4 : 3), x = b.x + Math.cos(an) * b.w * 0.4 * (1 - t / 1000), sk = fxSkyFrom({ x, y:b.foot }, ctx.side === 'player' ? 'player' : 'enemy', 0.25); fxLine(L, sk.x, sk.y, x, b.foot, FX_ICE[1], 5, cv * 0.6); fxLine(L, sk.x, sk.y, x, b.foot, FX_ICE[0], 2, cv); fxStar4(L, x, b.y + Math.sin(an) * 6, 3, FX_GOLD[1], FX_ICE[0]); } } })); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxBigEnd('Fairy', at, layer, ctx, k, max); } }));
fxSig('Claw Barrage', max=> ({ cast(ctx){ FX_KIT.Steel.aura(ctx, ctx.fromId, { big:1 }); }, impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxJaws(at, layer, FX_STEEL, max ? 13 : 11, 240); FX_KIT.Steel.burst(at, layer, { seed:ctx.seed + k, big:max ? 1.3 : 1.1 }); } }));

/* ---------- THE NEMESIS (the Wadjet) ---------- */
FX_MOVES['Fang of Night'] = { dur:700, cast(ctx){ const b = fxTargets(ctx)[0] || fxEnemyRowMiddle(); fxRush(ctx, b, FX_NIGHT, fxLy(ctx)); },
  impact(ctx, at, k, side){ const layer = fxLayerFor(side); fxJaws(at, layer, FX_NIGHT, 14); fxLater(110, ()=>{ FX_KIT.Ghost.burst(at, layer, { seed:ctx.seed + k, big:1.2 }); }); } };
FX_MOVES['Hood of Dread'] = { side:'self', dur:1200, hold:300,
  cast(ctx){ const a = ctx.from, id = ctx.fromId;
    fxAdd({ layer:fxLayerOfId(id) === 'back' ? 'back' : 'back', dur:1100, step(L, t){   // a cobra's hood flares behind it, its eyes opening
      const g = fxEaseOut(Math.min(1, t / 260)), cv = t < 850 ? 1 : 1 - (t - 850) / 250, rx = a.w * 0.62 * g, ry = a.h * 0.55 * g;
      fxPaint(L, a.x, a.y - a.h * 0.1, Math.max(rx, ry) + 2, (x, y, d, an, X, Y)=>{ const e = (x * x) / (rx * rx + 0.01) + (y * y) / (ry * ry + 0.01); if(e > 1.08 || !fxCover(X, Y, cv)) return 0; return e > 0.92 ? FX_NIGHT[5] : e > 0.6 ? FX_NIGHT[3] : FX_NIGHT[4]; });
      if(t > 300) [-1, 1].forEach(s=>{ const ex = a.x + s * rx * 0.5, ey = a.y - a.h * 0.3; fxDisc(L, ex, ey, 3.5, FX_GOLD[2], cv); fxDisc(L, ex, ey, 1.5, FX_NIGHT[5], cv); });
    } });
 } };
fxSig('Black Beam', max=> Object.assign(fxSigBeam('Ghost', [FX_PSY[1], FX_NIGHT[1], FX_NIGHT[3], FX_NIGHT[4], FX_NIGHT[5], FX_NIGHT[5]], 260)(max), { hold:max ? 600 : 450 }));
