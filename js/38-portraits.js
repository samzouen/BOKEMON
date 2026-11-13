/* ============================================================
   38-portraits.js — (4.38) THE PAINTER'S SHOP: PORTRAITS

   The designer: "the painter's shop is run by painter, who offers to do a painting of the player's monsters (the player
   looks weird and the painter refuses to draw the player), he says, since in the fairy kingdom all citizens are
   monsters. the player can first purchase a painting for Cuain who enthusiastically volunteers … that looks horrendously
   like a bad and juvenile drawing of a fish instead of a whale, with hilarious and quick banter-like dialogue because the
   artist cannot see Cuain. it has to rely on Cuain's inflated descriptions of itself, related through the player … Then,
   for the monkey king, monkey king whispers instructions and directs the artist to draw the monkey hilariously well.
   Cuain expresses immense frustration towards the artist for drawing the monkey king so well compared to him, and the
   monkey king replying that the artist had barely begun to capture … the full glory of his handsome and majestic aspect.
   these portraits can be used in place of the party image on both the home screen and the party screen, though Cuain
   will express great dismay when it replaces him, and refuse to talk to the player, rotating between 'I'm not talking
   until you take down that insulting portrait.' '...' and 'Harrumph!!' The monkey king's portrait can be changed too.
   Finally, if the player asks again after both … the player can buy one more blank canvas which allows a photo to be
   taken … or to be uploaded, that can be used in place of their own. They can change this photo any time. these
   pictures go into the player's item storage and can be used from there … Overworld and battle sprites still use the
   original sprites. each painting costs 10 silver medals but blank canvases cost 30 silver medals, which Cuain remarks
   is an absolute rip off after his portrait is done."

   The Painter's stall in the market square (21-castle.js: caPainterTalk asks here). In your bag (07-screens.js's Items
   page): the paintings, each to put up or take down. The home page's team (teamBannerHtml) and the party page
   (partyHeadHtml) show a painting put up instead of the monster's picture, your photo instead of your look; nowhere
   else (the map, fights, scenes: the sprites as they are). Cuain and the Monkey King can be talked to from the party
   page (Talk) — Cuain, his portrait up, will not.
   The save: state.inventory.paintings = { intro, cuain:{ has, on }, mk:{ has, on }, canvas:{ has, on, photo, at } };
   the photo a small square JPEG (PT.photoPx), kept with the save.
   ============================================================ */
const PT = {
  cur:'silver', price:{ cuain:10, mk:10, canvas:30 },
  src:{ cuain:'assets/ui/whalelord_painting.png', mk:'assets/ui/monkey_king_painting.png' },
  photoPx:192, photoQ:0.8,                                                  // the photo kept: 192px square, JPEG
};
function ptState(){
  if(!state.inventory || typeof state.inventory !== 'object') state.inventory = {};
  const inv = state.inventory;
  if(!inv.paintings || typeof inv.paintings !== 'object') inv.paintings = {};
  const p = inv.paintings;
  ['cuain', 'mk', 'canvas'].forEach(k=>{ if(!p[k] || typeof p[k] !== 'object') p[k] = {}; });
  return p;
}
const ptHasCuain = ()=> (state.party || []).concat(state.storage || []).some(m=> m && (isCuain(m) || m.species === 'whalelord'));
const ptHasMk = ()=> (state.party || []).concat(state.storage || []).some(m=> m && m.species === 'monkey_king');
function ptAny(){ const p = ptState(); return !!(p.cuain.has || p.mk.has || p.canvas.has); }

/* ---------- what shows instead: a painting put up, your photo ---------- */
function ptPicOf(m){
  if(!m || !state) return null;
  const p = ptState();
  if((isCuain(m) || m.species === 'whalelord') && p.cuain.has && p.cuain.on) return PT.src.cuain;
  if(m.species === 'monkey_king' && p.mk.has && p.mk.on) return PT.src.mk;
  return null;
}
function ptFramed(src, px, cls){
  ptCss();
  const pad = Math.max(2, Math.round(px * 0.07));                         // (its own: a % would be of the box it sits in)
  return `<span class="pt-frame${cls ? ' ' + cls : ''}" style="width:${px}px;height:${px}px;padding:${pad}px">${src ? `<img src="${src}" alt="" draggable="false">` : '<i class="pt-blank-in"></i>'}</span>`;
}
/* a monster's picture on the home page and the party page: its painting, if one is up (else null) */
function ptMonPic(m, px){ const s = ptPicOf(m); return s ? ptFramed(s, px, 'pt-mon') : null; }
/* yours: the canvas's photo, if it is up */
function ptMyPhoto(){ const c = ptState().canvas; return c.has && c.on && c.photo ? c.photo : null; }
function ptMyPic(px){ const s = ptMyPhoto(); return s ? ptFramed(s, px, 'pt-me') : null; }

/* ---------- drawn icons (no emoji) ---------- */
const PT_ICON = {
  frame:px=> `<svg class="pt-ic" width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="3.5" width="19" height="17" rx="2" fill="#e2b552" stroke="#8a5a14" stroke-width="1.4"/><rect x="5.5" y="6.5" width="13" height="11" fill="#7fc0e6" stroke="#8a5a14" stroke-width="1"/><path d="M5.5 15.5l4-4 3 3 2-2 4 4v1h-13z" fill="#4f9a5a"/><circle cx="15.5" cy="9.5" r="1.4" fill="#fff4b0"/></svg>`,
  talk:px=> `<svg class="pt-ic" width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-9l-4.5 3.5v-3.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5z" fill="#fffaf0" stroke="#5a4a3a" stroke-width="1.5" stroke-linejoin="round"/><circle cx="8" cy="11" r="1.2" fill="#5a4a3a"/><circle cx="12" cy="11" r="1.2" fill="#5a4a3a"/><circle cx="16" cy="11" r="1.2" fill="#5a4a3a"/></svg>`,
  camera:px=> `<svg class="pt-ic" width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 8a2 2 0 0 1 2-2h2.2l1.5-2h5.6l1.5 2h2.2a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" fill="#5a6f8a" stroke="#2f3a4a" stroke-width="1.3" stroke-linejoin="round"/><circle cx="12" cy="12.6" r="4.1" fill="#dfe9f3" stroke="#2f3a4a" stroke-width="1.3"/><circle cx="12" cy="12.6" r="2" fill="#2f3a4a"/></svg>`,
  picture:px=> `<svg class="pt-ic" width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="15" rx="2" fill="#fffaf0" stroke="#5a4a3a" stroke-width="1.4"/><path d="M5 17l4.5-5 3.5 3.5 2.5-2.5 3.5 4z" fill="#4f9a5a"/><circle cx="16" cy="8.8" r="1.6" fill="#e2b552"/></svg>`,
};

/* ---------- the reveal: the painting on its easel, the cloth whisked off ---------- */
function ptReveal(src, title, opts){
  opts = opts || {};
  ptCss();
  return new Promise(done=>{
    const ov = document.createElement('div');
    ov.className = 'pt-reveal' + (opts.quick ? ' pt-quick' : '');
    ov.innerHTML = `<div class="pt-stage">
        <div class="pt-big"><img src="${src}" alt="${escapeHtml(title || '')}" draggable="false">${opts.quick ? '' : '<i class="pt-cloth"></i>'}</div>
        <div class="pt-title">${escapeHtml(title || '')}</div>
        ${opts.sub ? `<div class="pt-sub">${opts.sub}</div>` : ''}
        <button class="btn btn-primary pt-go">${opts.button || 'Continue'}</button>
      </div>`;
    document.body.appendChild(ov);
    if(!opts.quick && opts.sound) setTimeout(()=>{ try { opts.sound(); } catch(e){} }, 520);
    const fin = ()=>{ ov.classList.add('pt-off'); setTimeout(()=> ov.remove(), 260); done(); };
    ov.querySelector('.pt-go').addEventListener('click', fin);
    if(opts.quick) ov.addEventListener('click', e=>{ if(e.target === ov) fin(); });
  });
}
/* its sounds, made as they play (33-catch.js's hall): a sad trombone for Cuain's, a warm swell and a harp for the
   Monkey King's; and the cloth whisked off */
const PT_SND = { wah:0.095, choir:0.04, pad:0.11, harp:0.07 };
const ptSound = {
  live(){ try { return typeof czSound !== 'undefined' ? czSound.live() : null; } catch(e){ return null; } },
  whisk(ctx, B, t){ czsAir(ctx, B.in, t, 0.45, 900, 3200, 0.06, { peak:0.35, q:0.9 }); },
  /* wah, wah, wah, waaah: a muted brass, each note lower, the last one wobbling */
  wah(ctx, out, t){
    const B = czsBusOf(ctx, out);
    ptSound.whisk(ctx, B, t);
    const notes = [[67, 0.42], [66, 0.42], [65, 0.42], [64, 1.5]];
    let at = t + 0.35;
    notes.forEach(([m, d], i)=>{
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(czsMidi(m) * 0.5, at);
      if(i === 3){ vib.frequency.value = 6; vg.gain.value = czsMidi(m) * 0.5 * 0.03; vib.connect(vg); vg.connect(o.frequency); vib.start(at + 0.25); vib.stop(at + d); }
      lp.type = 'lowpass'; lp.Q.value = 3; lp.frequency.setValueAtTime(380, at); lp.frequency.linearRampToValueAtTime(1300, at + 0.12); lp.frequency.exponentialRampToValueAtTime(420, at + d);
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(PT_SND.wah, at + 0.05); g.gain.setValueAtTime(PT_SND.wah, at + d - 0.12); g.gain.linearRampToValueAtTime(0, at + d);
      o.connect(lp); lp.connect(g); g.connect(B.in); o.start(at); o.stop(at + d + 0.02);
      at += d + 0.04;
    });
    return 5;
  },
  /* the Monkey King's: a warm major chord swelling, a harp swept up it, a choir's "ah" */
  ta(ctx, out, t){
    const B = czsBusOf(ctx, out);
    ptSound.whisk(ctx, B, t);
    czsPad(ctx, B, t + 0.2, 2.4, [52, 59, 64, 68, 71], { vol:PT_SND.pad, att:0.5, rel:1.2, cut0:500, cut1:2600, detune:9, width:0.7 });
    [64, 68, 71, 76, 80, 83, 88].forEach((m, i)=> czsPluck(ctx, B, t + 0.3 + i * 0.07, czsMidi(m), { vol:PT_SND.harp, dur:1.6, pan:(i / 6 - 0.5) * 1.2 }));
    [64, 68, 71].forEach((m, i)=>{
      const a = czsAh(ctx, t + 0.5, czsMidi(m), { vol:0.5 }), env = ctx.createGain(), s = t + 0.5;
      env.gain.setValueAtTime(0, s); env.gain.linearRampToValueAtTime(PT_SND.choir, s + 0.5); env.gain.setValueAtTime(PT_SND.choir, s + 1.4); env.gain.linearRampToValueAtTime(0, s + 2.3);
      a.out.connect(env); czsTo(ctx, env, B.in, (i - 1) * 0.5);
      a.all.forEach(o=>{ o.start(s); o.stop(s + 2.4); });
    });
    return 5;
  },
  play(fn){ const L = ptSound.live(); if(!L) return; try { fn(L.ctx, L.out, L.t); } catch(e){} },
};

/* ---------- the Painter's words ---------- */
const PT_LINES = {
  intro:[
    ['painter', `<b>"Ah, a customer! My canvases are ready at last. Portraits — ${PT.price.cuain} silver medals each!"</b>`],
    ['painter', `He squints at you over his brush.<br><br><b>"Not of you, though. Hmm. Where is your tail? Your wings? Your — anything? Everyone in the kingdom is a monster, friend. I wouldn't know where to start with… that."</b>`],
  ],
  cuainVolunteers:[
    ['cuain', `A cold wind, and the smell of the sea. Cuain is at your shoulder, very interested.<br><br><b>"Then paint ME."</b>`],
    ['painter', `The painter jumps.<br><br><b>"Who said that?!"</b>`],
    ['you', `<b>"That's Cuain. He's a ghost. He's… right here."</b>`],
    ['painter', `He waves his brush through the air, straight through Cuain.<br><br><b>"A sitter I can't see? Ha! A challenge! You'll have to tell me what he looks like."</b>`],
  ],
  cuainAsk:`<b>"So! ${PT.price.cuain} silver medals for the ghost's portrait?"</b>`,
  cuain:[
    ['painter', `<b>"Brushes ready! Tell me about him."</b>`],
    ['cuain', `<b>"Tell him I am the Lord of the Northern Deep. Vast as a storm. Old as the ice."</b>`],
    ['you', `<b>"He says he's… big. And old."</b>`],
    ['painter', `<i>Scritch, scritch.</i><br><br><b>"Big and old. Got it."</b>`],
    ['cuain', `<b>"Black as the deep sea, with patches as white as the foam."</b>`],
    ['you', `<b>"Black, with white spots."</b>`],
    ['painter', `<b>"I'm out of white. Yellow is nearly white. Yellow spots!"</b>`],
    ['cuain', `<b>"My fins cut the waves like the sails of a great ship!"</b>`],
    ['you', `<b>"He's got… lots of fins?"</b>`],
    ['painter', `<b>"Lots of fins! Purple ones. Purple is a very fin-ish colour."</b>`],
    ['cuain', `<b>"And my smile has struck terror into sailors for a thousand years."</b>`],
    ['you', `<b>"He has a big smile. With teeth."</b>`],
    ['painter', `<b>"A happy fish with teeth! Lovely!"</b>`],
    ['cuain', `<b>"I am NOT. A. FISH!"</b>`],
    ['you', `<b>"…He says he's not a fish."</b>`],
    ['painter', `<b>"Too late — it's finished! Behold!"</b>`],
  ],
  cuainAfter:[
    ['cuain', `<b>"……"</b>`],
    ['cuain', `<b>"What. Is. THAT."</b>`],
    ['painter', `<b>"Big, old, black with white — well, yellow — spots, lots of fins and a lovely smile. Exactly as described!"</b>`],
    ['cuain', `<b>"I look like a burnt sardine. With HANDS."</b>`],
    ['painter', `He wipes away a tear.<br><br><b>"Thank you. I put my heart into those hands."</b>`],
    [null, `<i>Cuain's portrait is in your bag (Items). You can put it up as his picture on the home and party pages.</i>`],
    ['cuain', `<b>"Don't you DARE."</b>`],
  ],
  mkGreet:[
    ['painter', `<b>"Back for another portrait? ${PT.price.mk} silver medals!"</b>`],
    ['mk', `The Monkey King strolls up to the easel and looks the painter up and down.<br><br><b>"I shall sit for you, painter. You may begin."</b>`],
  ],
  mkAsk:`<b>"The Monkey King himself! ${PT.price.mk} silver medals, and I'll paint the best portrait of my life."</b>`,
  mk:[
    ['mk', `He leans in close and whispers in the painter's ear.<br><br><i>"…The light behind me, like a sunrise. Mountains below me. They should look like they're bowing."</i>`],
    ['painter', `<i>Swish, swish.</i><br><br><b>"Mountains… bowing…"</b>`],
    ['mk', `<i>"Flames on my crown. My cape, flowing. More flowing. And the staff — longer. Longer. LONGER."</i>`],
    ['painter', `<b>"It won't fit on the canvas!"</b>`],
    ['mk', `<i>"Then hold it at a slant. Heroically."</i>`],
    ['painter', `He paints faster and faster, his eyes shining, his tongue between his teeth…<br><br><b>"It's… it's done."</b>`],
  ],
  mkAfter:[
    ['painter', `<b>"My… my masterpiece."</b> He sniffs.`],
    ['cuain', `The air turns very cold.<br><br><b>"WHAT?! HIS looks like THAT, and MINE looks like a PUDDLE WITH TEETH?!"</b>`],
    ['mk', `<b>"Calm yourself, little fish. The poor fellow has barely begun to capture my full glory. A thousand canvases could not hold how handsome and majestic I am."</b>`],
    ['cuain', `<b>"I. Am. NOT. A. FISH."</b>`],
    ['mk', `He glances at Cuain's portrait.<br><br><b>"The painting says otherwise."</b>`],
    [null, `<i>The Monkey King's portrait is in your bag (Items).</i>`],
  ],
  canvasGreet:[
    ['painter', `<b>"You again! I still can't paint you, I'm afraid… but! I have just the thing."</b>`],
    ['painter', `He brings out a blank canvas that shimmers faintly.<br><br><b>"A magic canvas. Hold it up and it catches whatever is in front of it, in a flash — or lay a picture of yours on it. You, on a canvas! ${PT.price.canvas} silver medals."</b>`],
    ['cuain', `<b>"${PT.price.canvas}?! For a BLANK one? Mine had PAINT on it, and it was ${PT.price.cuain}! That is an absolute rip-off."</b>`],
    ['painter', `<b>"Blank canvases are very expensive. They're so full of possibility."</b>`],
  ],
  canvasAsk:`<b>"The magic canvas — ${PT.price.canvas} silver medals?"</b>`,
  canvas:[
    ['painter', `<b>"Thank you! Point it at yourself and smile — or pick a picture you like. You can change it whenever you want."</b>`],
    [null, `<i>The magic canvas is in your bag (Items): take a photo or choose a picture, then put it up as your picture on the home page.</i>`],
  ],
  later:[
    `<b>"Every portrait I paint hangs in somebody's heart. And one of them hangs in somebody's nightmares."</b>`,
    `<b>"I'm practising crowns. Crowns are hard. Your Monkey King's took me four tries."</b>`,
    `<b>"If your ghost friend wants a second sitting, I'm free. …He doesn't? Oh."</b>`,
  ],
  noOne:`<b>"Bring me a monster to paint, friend, and I'll make it immortal!"</b>`,
  notNow:`<b>"Another time, then! My brushes will wait."</b>`,
  poor:n=> `<b>"Ah — that's ${n} silver medals, friend. Come back when your purse is heavier."</b>`,
  wet:`<b>"Hm, my paint's still wet — give me a moment and ask again."</b>`,
};
/* Cuain's and the Monkey King's words on the party page (Talk) */
const PT_TALK = {
  cuain:[
    `<b>"When I was young, the whole northern sea sang my name. Now I am a ghost in a child's bag. …It is a very nice bag."</b>`,
    `<b>"The Monkey King says he once ate the peaches of immortality. I once ate a ship's anchor. I do not recommend it."</b>`,
    `<b>"Keep practising your characters. I have watched ten thousand winters — I can wait for one more stroke."</b>`,
    `<b>"Hm? No, I was not humming. Ghosts do not hum."</b>`,
  ],
  cuainSulk:[`<b>"I'm not talking until you take down that insulting portrait."</b>`, `<b>"..."</b>`, `<b>"Harrumph!!"</b>`],
  cuainUp:[`<b>"You… you put it UP? Where EVERYONE can see it?!"</b>`, `Cuain turns his back on you, which for a whale takes quite a while.`],
  cuainDown:`<b>"…Hmph. Thank you. We shall never speak of it again."</b>`,
  mk:[
    `<b>"Seventy-two transformations, and still the most handsome is this one."</b>`,
    `<b>"Five hundred years under a mountain teaches patience. Five minutes with that whale undoes it."</b>`,
    `<b>"Practise your strokes, little one. Even my staff began as a single line."</b>`,
  ],
  mkPortrait:[
    `<b>"Ah, my portrait. Look upon it as often as you like. Everyone does."</b>`,
    `<b>"Seventy-two transformations, and still the most handsome is this one. The painting agrees."</b>`,
    `<b>"Practise your strokes, little one. One day you may paint me almost as well as he did."</b>`,
  ],
  mkUp:`<b>"An excellent choice. A likeness worthy of the home page — almost."</b>`,
  mkDown:`<b>"Taken down? …Ah, I understand. It was too dazzling. Mortals need a rest from such things."</b>`,
};

/* lines in turn, the talk already ours (ui.caTalk) */
async function ptSay(seq){
  const here = ui.screen;
  for(const l of seq){
    if(ui.screen !== here) return false;
    const [who, html] = Array.isArray(l) ? l : [null, l];
    await caSay(who ? [caFaceOf(who)] : [], who ? caNameOf(who) : '', html);
  }
  return ui.screen === here;
}
/* bought: the medals spent, the painting yours — kept only if it is saved (as a stall's purchase is) */
async function ptBuy(k){
  const cost = PT.price[k], p = ptState();
  if(medalCount(PT.cur) < cost) return 'poor';
  const snap = { medals:Object.assign({}, state.medals), was:Object.assign({}, p[k]) };
  await spend(PT.cur, cost);
  p[k].has = true; p[k].at = Date.now();
  const sv = typeof showSyncingOverlay === 'function' ? showSyncingOverlay('Syncing…') : null;
  const ok = await saveProfile({ awaitCloud:true });
  if(sv) hideSyncingOverlay(sv);
  if(!ok){ state.medals = snap.medals; ptState()[k] = snap.was; if(typeof showSyncFailure === 'function') showSyncFailure(); return 'unsaved'; }
  return 'ok';
}
/* the next thing he offers: Cuain's portrait (if Cuain is with you), the Monkey King's, then the canvas */
function ptNext(){
  const p = ptState();
  if(!p.cuain.has && ptHasCuain()) return 'cuain';
  if(!p.mk.has && ptHasMk()) return 'mk';
  if(!p.canvas.has && (p.cuain.has || !ptHasCuain()) && (p.mk.has || !ptHasMk()) && (p.cuain.has || p.mk.has)) return 'canvas';
  return null;
}
async function ptPainterTalk(){
  if(ui.caTalk) return;
  ui.caTalk = true;
  releaseKeys();
  const p = ptState(), face = [caFace('painter')], name = caNameOf('painter');
  try {
    let fresh = false;
    if(!p.intro){
      if(!await ptSay(PT_LINES.intro)) return;
      p.intro = true; fresh = true; saveProfile();
    }
    const k = ptNext();
    if(!k){ await ptSay([['painter', ptHasCuain() || ptHasMk() || ptAny() ? caTurn('painterLater', PT_LINES.later) : PT_LINES.noOne]]); return; }
    if(k === 'cuain' && !await ptSay(PT_LINES.cuainVolunteers)) return;
    if(k === 'mk' && !await ptSay(fresh ? PT_LINES.mkGreet.slice(1) : PT_LINES.mkGreet)) return;   // ("Back for another?" not on a first visit)
    if(k === 'canvas' && !await ptSay(PT_LINES.canvasGreet)) return;
    const what = { cuain:'Yes, paint him', mk:'Yes, paint him', canvas:'Buy the canvas' }[k];
    const yes = await r5Ask(face, name, PT_LINES[k + 'Ask'] + `<br><br><small>${medalIcon(PT.cur)} You have ${medalCount(PT.cur)}.</small>`, what, 'Not now');
    if(!yes){ await ptSay([['painter', PT_LINES.notNow]]); return; }
    const r = await ptBuy(k);
    if(r === 'poor'){ await ptSay([['painter', PT_LINES.poor(PT.price[k])]]); return; }
    if(r !== 'ok'){ await ptSay([['painter', PT_LINES.wet]]); return; }
    try { playSfx('ui_click'); } catch(e){}
    if(k === 'cuain'){
      if(!await ptSay(PT_LINES.cuain)) return;
      await ptReveal(PT.src.cuain, `${caNameOf('cuain')}, Lord of the Northern Deep`, { sub:'by the Painter', sound:()=> ptSound.play(ptSound.wah) });
      await ptSay(PT_LINES.cuainAfter);
    } else if(k === 'mk'){
      if(!await ptSay(PT_LINES.mk)) return;
      await ptReveal(PT.src.mk, 'The Monkey King, Great Sage Equal to Heaven', { sub:'by the Painter', sound:()=> ptSound.play(ptSound.ta) });
      await ptSay(PT_LINES.mkAfter);
    } else {
      await ptSay(PT_LINES.canvas);
    }
  } finally {
    ui.caTalk = false;
    if(typeof refreshWalk === 'function') try { refreshWalk(); } catch(e){}
  }
}

/* ---------- in your bag (the Items page) ---------- */
function ptStorageHtml(){
  if(!ptAny()) return '';
  ptCss();
  const p = ptState(), cards = [];
  const btn = (act, label, on)=> `<button class="mini-btn${on ? ' on' : ''}" data-pt="${act}">${label}</button>`;
  if(p.cuain.has) cards.push(`<div class="pt-card">
      <button class="pt-thumb" data-pt="view:cuain" aria-label="Look at it">${ptFramed(PT.src.cuain, 64)}</button>
      <div class="pt-info"><div class="pt-nm">${escapeHtml(caNameOf('cuain'))}'s portrait</div>
        <div class="pt-st">${p.cuain.on ? `Up: ${escapeHtml(caNameOf('cuain'))}'s picture on the home and party pages` : 'In your bag'}</div>
        <div class="pt-acts">${p.cuain.on ? btn('down:cuain', 'Take it down') : btn('up:cuain', `Set as ${escapeHtml(caNameOf('cuain'))}'s picture`)}</div></div></div>`);
  if(p.mk.has) cards.push(`<div class="pt-card">
      <button class="pt-thumb" data-pt="view:mk" aria-label="Look at it">${ptFramed(PT.src.mk, 64)}</button>
      <div class="pt-info"><div class="pt-nm">The Monkey King's portrait</div>
        <div class="pt-st">${p.mk.on ? 'Up: his picture on the home and party pages' : 'In your bag'}</div>
        <div class="pt-acts">${p.mk.on ? btn('down:mk', 'Take it down') : btn('up:mk', "Set as the Monkey King's picture")}</div></div></div>`);
  if(p.canvas.has) cards.push(`<div class="pt-card">
      ${p.canvas.photo ? `<button class="pt-thumb" data-pt="view:canvas" aria-label="Look at it">${ptFramed(p.canvas.photo, 64)}</button>` : `<span class="pt-thumb">${ptFramed(null, 64, 'pt-empty')}</span>`}
      <div class="pt-info"><div class="pt-nm">The magic canvas</div>
        <div class="pt-st">${!p.canvas.photo ? 'Blank — take a photo or choose a picture' : p.canvas.on ? 'Up: your picture on the home page' : 'In your bag'}</div>
        <div class="pt-acts">${btn('photo:camera', `${PT_ICON.camera(16)} Take a photo`)}${btn('photo:file', `${PT_ICON.picture(16)} Choose a picture`)}
          ${p.canvas.photo ? (p.canvas.on ? btn('down:canvas', 'Take it down') : btn('up:canvas', 'Set as your picture')) : ''}</div></div></div>`);
  return `<div class="pt-box"><div class="stor-sec-head pt-head">${PT_ICON.frame(20)} Paintings <span>${cards.length}</span></div>${cards.join('')}</div>`;
}
function ptStorageWire(){
  screenEl.querySelectorAll('[data-pt]').forEach(b=> b.addEventListener('click', e=>{
    e.stopPropagation();
    const [act, k] = b.dataset.pt.split(':');
    if(act === 'view') return ptView(k);
    if(act === 'photo') return ptPickPhoto(k === 'camera');
    if(act === 'up' || act === 'down') return ptSet(k, act === 'up');
  }));
}
function ptView(k){
  const p = ptState();
  const src = k === 'canvas' ? p.canvas.photo : PT.src[k];
  if(!src) return;
  const title = k === 'cuain' ? `${caNameOf('cuain')}, Lord of the Northern Deep` : k === 'mk' ? 'The Monkey King, Great Sage Equal to Heaven' : 'You';
  return ptReveal(src, title, { quick:true, sub:k === 'canvas' ? 'on the magic canvas' : 'by the Painter', button:'Close' });
}
/* put up or taken down; Cuain and the Monkey King have something to say about it */
async function ptSet(k, on){
  const p = ptState();
  if(!p[k].has || (k === 'canvas' && on && !p.canvas.photo)) return;
  p[k].on = !!on;
  await saveProfile();
  if(ui.screen === 'storage') renderStorage();
  const line = k === 'cuain' ? (on ? PT_TALK.cuainUp.map((h, i)=> i ? [null, h] : ['cuain', h]) : [['cuain', PT_TALK.cuainDown]])
    : k === 'mk' ? [['mk', on ? PT_TALK.mkUp : PT_TALK.mkDown]] : null;
  if(line && !ui.caTalk){ ui.caTalk = true; try { await ptSay(line); } finally { ui.caTalk = false; } }
  else if(!line) toast(on ? 'Your picture is up on the home page.' : 'Your picture is taken down.');
}

/* ---------- the magic canvas: a photo, taken or chosen; kept small, square ---------- */
function ptPickPhoto(camera){
  let inp = document.getElementById('ptPhotoIn');
  if(inp) inp.remove();
  inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.id = 'ptPhotoIn';
  if(camera) inp.setAttribute('capture', 'user');
  inp.style.cssText = 'position:fixed;left:-9999px;width:1px;height:1px;opacity:0;';
  inp.addEventListener('change', ()=>{ const f = inp.files && inp.files[0]; inp.remove(); if(f) ptTakeFile(f); });
  document.body.appendChild(inp);
  inp.click();
}
function ptSquare(img, px){
  const c = document.createElement('canvas'), w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, s = Math.min(w, h);
  c.width = c.height = px;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, px, px);
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, px, px);
  return c.toDataURL('image/jpeg', PT.photoQ);
}
async function ptTakeFile(file){
  const p = ptState();
  if(!p.canvas.has || !file) return false;
  let url = null;
  try {
    const src = await new Promise((res, rej)=>{ const r = new FileReader(); r.onload = ()=> res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    const img = await new Promise((res, rej)=>{ const im = new Image(); im.onload = ()=> res(im); im.onerror = rej; im.src = src; });
    url = ptSquare(img, PT.photoPx);
  } catch(e){ toast("That picture couldn't be opened. Try another."); return false; }
  const was = { photo:p.canvas.photo, at:p.canvas.at, on:p.canvas.on };
  p.canvas.photo = url; p.canvas.at = Date.now();
  if(!was.photo) p.canvas.on = true;                                       // (the first: up at once)
  const ok = await saveProfile({ awaitCloud:true });
  if(!ok){ Object.assign(p.canvas, was); if(typeof showSyncFailure === 'function') showSyncFailure(); }
  else toast(p.canvas.on ? 'Your picture is up on the home page.' : 'The canvas has your picture now.');
  if(ui.screen === 'storage') renderStorage();
  return ok;
}

/* ---------- Talk: Cuain and the Monkey King, on the party page ---------- */
function ptTalker(m){ return !m ? null : (isCuain(m) || m.species === 'whalelord') ? 'cuain' : m.species === 'monkey_king' ? 'mk' : null; }
function ptTalkBtn(m){ return ptTalker(m) ? `<button class="mini-btn" data-ptalk="${m.uid}">${PT_ICON.talk(15)} Talk</button>` : ''; }
async function ptTalk(m){
  const who = ptTalker(m);
  if(!who || ui.caTalk) return;
  const p = ptState();
  const line = who === 'cuain' ? (p.cuain.on ? caTurn('ptCuainSulk', PT_TALK.cuainSulk) : caTurn('ptCuain', PT_TALK.cuain))
    : (p.mk.on ? caTurn('ptMkUp', PT_TALK.mkPortrait) : caTurn('ptMk', PT_TALK.mk));
  ui.caTalk = true;
  try { await ptSay([[who, line]]); } finally { ui.caTalk = false; }
  saveProfile();
}
function ptTalkWire(root){
  (root || screenEl).querySelectorAll('[data-ptalk]').forEach(b=> b.addEventListener('click', e=>{
    e.stopPropagation();
    const m = (state.party || []).concat(state.storage || []).find(x=> x.uid === b.dataset.ptalk);
    if(m) ptTalk(m);
  }));
}

/* ---------- the looks ---------- */
function ptCss(){
  if(document.getElementById('ptCss')) return;
  const st = document.createElement('style');
  st.id = 'ptCss';
  st.textContent = `
  .pt-frame{ display:inline-block; box-sizing:border-box; border-radius:9%; vertical-align:middle; flex:0 0 auto;
    background:linear-gradient(135deg, #f8dc85 0%, #c4902f 32%, #f4d47c 52%, #a8741f 78%, #e9c46a 100%);
    box-shadow:inset 0 0 0 1px rgba(90,58,12,.55), inset 0 0 0 3px rgba(255,240,190,.35), 0 2px 5px rgba(40,25,5,.3); }
  .pt-frame img{ width:100%; height:100%; display:block; object-fit:cover; border-radius:4%; box-shadow:inset 0 0 0 1px rgba(60,35,5,.4); background:#f4efe4; }
  .pt-frame .pt-blank-in{ display:block; width:100%; height:100%; border-radius:4%; background:repeating-linear-gradient(45deg, #fbf7ee 0 6px, #f1eadb 6px 12px); box-shadow:inset 0 0 0 1px rgba(60,35,5,.3); }
  .ht-mon .pt-frame{ margin:0 4px; }
  .pt-ic{ display:inline-block; vertical-align:-3px; }
  .pt-box{ margin:14px 0 6px; }
  .pt-head{ display:flex; align-items:center; gap:7px; }
  .pt-card{ display:flex; gap:12px; align-items:center; padding:10px; margin-top:8px; border-radius:14px; background:var(--paper, #fffaf0);
    border:2px solid var(--line, #e4dccb); }
  .pt-thumb{ border:0; padding:0; background:none; cursor:pointer; flex:0 0 auto; line-height:0; }
  .pt-info{ flex:1; min-width:0; }
  .pt-nm{ font-family:'Baloo 2',cursive; font-weight:700; font-size:16px; line-height:1.2; }
  .pt-st{ font-size:12px; font-weight:700; color:var(--ink-soft, #7a6e60); margin:2px 0 6px; }
  .pt-acts{ display:flex; flex-wrap:wrap; gap:6px; }
  .pt-acts .mini-btn{ display:inline-flex; align-items:center; gap:5px; }
  .pt-reveal{ position:fixed; inset:0; z-index:9000; display:flex; align-items:center; justify-content:center; padding:16px;
    background:rgba(24,18,10,.84); animation:ptIn .3s ease-out both; }
  .pt-reveal.pt-off{ animation:ptOut .25s ease-in both; }
  .pt-stage{ display:flex; flex-direction:column; align-items:center; gap:10px; max-width:100%; }
  .pt-big{ position:relative; width:min(78vw, 56vh, 460px); aspect-ratio:1; box-sizing:border-box; padding:4.5%; border-radius:3%; overflow:hidden;
    background:linear-gradient(135deg, #f8dc85 0%, #c4902f 30%, #f4d47c 50%, #a8741f 76%, #e9c46a 100%);
    box-shadow:inset 0 0 0 2px rgba(90,58,12,.6), inset 0 0 0 7px rgba(255,240,190,.3), 0 14px 40px rgba(0,0,0,.55); }
  .pt-big img{ width:100%; height:100%; object-fit:cover; display:block; box-shadow:inset 0 0 0 2px rgba(60,35,5,.5); }
  .pt-cloth{ position:absolute; inset:-2%; transform-origin:50% 0; animation:ptCloth 1.15s cubic-bezier(.55,.05,.7,.4) .5s both;
    background:
      repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 3%, rgba(255,255,255,.06) 6%, rgba(0,0,0,.14) 10%),
      linear-gradient(180deg, #b3202f, #7e1220 70%, #5e0c17); box-shadow:0 8px 18px rgba(0,0,0,.4); }
  .pt-title{ color:#fbecc4; font-family:'Baloo 2',cursive; font-weight:800; font-size:20px; text-align:center; text-shadow:0 2px 4px rgba(0,0,0,.6); line-height:1.15; }
  .pt-sub{ color:#d9c9a3; font-size:13px; font-weight:700; font-style:italic; margin-top:-6px; }
  .pt-go{ width:auto; padding:10px 22px; }
  .pt-quick .pt-big{ cursor:default; }
  @keyframes ptIn{ from{ opacity:0; } to{ opacity:1; } }
  @keyframes ptOut{ to{ opacity:0; } }
  @keyframes ptCloth{ 0%{ transform:translateY(0) scaleY(1); } 25%{ transform:translateY(-3%) scaleY(1.02) skewX(-2deg); }
    100%{ transform:translateY(-118%) scaleY(.6) skewX(8deg); opacity:.9; } }
  @media (prefers-reduced-motion: reduce){ .pt-cloth{ animation:ptFade .4s .3s both; } @keyframes ptFade{ to{ opacity:0; } } }`;
  document.head.appendChild(st);
}
