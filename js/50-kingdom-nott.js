/* ============================================================
   50-kingdom-nott.js — (4.77) NÓTT, THE FAIRY KING'S STEED.
   The designer: "new elements should be gained only after each time the entire castle is upgraded and completes its
   final fight (making a fourth fight) before the new element is gained. elements are gained through the fairy king's
   steed, Nótt, who is a ghostly, immortal steed. she coaches the prince/princess by appearing in their dreams in a dark,
   fantastic realm." — and "she fights alongside the player as a companion-like figure." (Her pictures: nott_front and
   nott_back, the designer's.)
   · The first element, Fire, the night after the fifth battle won in the meadow — the city cannot be cleared without
     it, so it cannot wait for a castle. Her first dream: who she is.
   · Every other element: a castle level's final raid. At castle levels 2 to 9 the aliens raid three times; once the
     whole castle has gone up a level they come a fourth time, all at once (46-kingdom-city.js's kcRaidNext, n 4; the
     raid itself 49-kingdom-raid.js). Held off, that night she comes: castle level 2's final raid brings Water, 3's
     Grass, … 9's the stronger Physical (KD_FORM_ORDER[level]). The guardians' fights are no more.
   · A save from before 4.77 has its forms from the guardians: they stay its own, and the dream of a form already known
     is skipped. One that has never met her meets her first, in a dream with no gift.
   · Her dream: a dark realm of strange stars, a moon and drifting mist; she comes out of the mist and speaks; her gift
     flies to the heir, who changes; the heir wakes, and the city's own card says what the form does (kdEvolve).
   · In battle, once met: she stands at the heir's side, a ghost nothing can hurt. Every right answer charges her as it
     charges the heir; full (NOTT.charge), she gallops through the enemy chosen — a Basic move's worth of the heir's
     attack (NOTT.pow), the same whatever its type, but every special enemy's rule kept (45-kingdom.js's kdbGate).
   K.nott: { met, last }.
   ============================================================ */
const NOTT = { charge:6, pow:2, firstWins:5 };
const kdNottMet = K=> !!(K && K.nott && K.nott.met);
const nottImg = (view, px, cls)=> `<img class="nott-pic ${cls || ''}" src="assets/mon/nott_${view === 'back' ? 'back' : 'front'}.png" alt="Nótt" style="width:${px}px;height:${px}px">`;
const nottFace = ()=> `<img src="assets/mon/nott_front.png" alt="">`;

/* the dream owed now: a form ({ form }), or her meeting with no gift ({ form:null }) — or nothing */
function kdDreamDue(K){
  const P = K && K.partner;
  if(!P || !Array.isArray(P.forms)) return null;
  const has = f=> P.forms.includes(f);
  if(!has('fire')) return (K.wins || 0) >= NOTT.firstWins ? { form:'fire' } : null;
  const R = (K.city && K.city.raids) || {};
  for(let L = 2; L <= 9; L++){ const f = KD_FORM_ORDER[L]; if(f && !has(f) && (R[L] || 0) >= 4) return { form:f, L }; }
  if(!kdNottMet(K)) return { form:null };                            // the guardians' forms, and she not met yet
  return null;
}
/* what the next element waits for: { form, rows:[{ say, have, want }] } — for the kingdom screen */
function kdNottNext(K){
  const P = K.partner, next = KD_FORM_ORDER.find(f=> f !== 'physical' && !P.forms.includes(f));
  if(!next) return null;
  if(next === 'fire') return { form:next, why:`Nótt comes in a dream after ${NOTT.firstWins} battles won in the meadow.`,
    rows:[{ say:'Battles won in the meadow', have:Math.min(K.wins || 0, NOTT.firstWins), want:NOTT.firstWins }] };
  const L = KD_FORM_ORDER.indexOf(next), C = K.city, CL = C ? kcCastle(K) : 0, won = C ? kcRaidsWon(K, L) : 0;
  return { form:next, L, why:`Nótt comes in a dream once castle level ${L}'s final raid is held off: the whole castle at level ${L + 1}, and the aliens beaten back a fourth time.`,
    rows:[{ say:`Raids of castle level ${L} held off`, have:Math.min(won, 3), want:3 },
          { say:`The whole castle at level ${L + 1}`, have:Math.min(CL, L + 1), want:L + 1 },
          { say:'Its final raid', have:won >= 4 ? 1 : 0, want:1 }] };
}
function kdNottCardHtml(K){
  const N = kdNottNext(K);
  if(!N) return `<div class="kd-card kd-next kd-nott-card"><div class="kd-nott-head">${nottImg('front', 54)}<div><b>Every element is learnt</b><small>Nótt still rides beside ${escapeHtml(K.partner.name)}.</small></div></div></div>`;
  return `<div class="kd-card kd-next kd-nott-card"><div class="kd-nott-head">${nottImg('front', 54)}<div><b>Next element: ${KD_FORMS[N.form].name}</b><small>${N.why}</small></div></div>
    ${N.rows.map(r=> `<div class="kd-need ${r.have >= r.want ? 'ok' : ''}"><span>${r.say}</span><em>${r.want === 1 ? (r.have ? 'held off' : 'to come') : `${r.have} / ${r.want}`}</em><i><b style="width:${Math.round(r.have * 100 / r.want)}%"></b></i></div>`).join('')}</div>`;
}

/* ============================================================
   THE DREAM
   ============================================================ */
const NOTT_LESSON = {
  fire:     [`"Fire. It burns back the wild, so your city has room to grow."`],
  water:    [`"Water. It finds a way round every stone. It will feed your fields, and fill a moat round your walls."`],
  grass:    [`"Grass. Cut it down and it grows back stronger. Your fields will grow richer for it."`],
  electric: [`"Lightning. Quick thoughts, quick hands: strike before your enemy can."`],
  flying:   [`"The wind. It carries anyone brave enough to leap."`],
  psychic:  [`"The mind. It sees what eyes cannot. Think first — then act."`],
  ghost:    [`"This gift is my own: the dark itself. You have walked in it with me, so you need never fear it."`],
  fairy:    [`"Your forefather's own light. It heals — and it shines brightest when things are darkest."`],
  physical1:[`"The last gift was in you all along: your own strength, grown greater."`, `"Every gift is yours now. And still I will ride beside you."`],
};
async function kdNottDreamDue(){
  const K = kd(), d = kdDreamDue(K);
  if(!d || ui.kdDreaming || ui.kdTalk || ui.screen !== 'kingdom' || document.querySelector('.kd-over, #kdRaid, .scene-say, #kdDream')) return;
  await kdNottDream(d.form);
  if(ui.screen === 'kingdom') renderKingdom();
}
async function kdNottDream(form){
  const K = kd(), P = K.partner, first = !kdNottMet(K), was = P.form, name = escapeHtml(P.name);
  const she = kdGender(K) === 'female', him = she ? 'her' : 'him', his = she ? 'her' : 'his', heir = typeof kdHeir === 'function' ? kdHeir() : 'one';
  ui.kdDreaming = true;
  kdNottCss();
  const box = document.createElement('div');
  box.className = 'kd-dream'; box.id = 'kdDream';
  const stars = Array.from({ length:70 }, (_, i)=> `<i style="left:${(i * 37.7) % 100}%;top:${(i * 53.3) % 72}%;--d:${(i % 7) * 0.6}s;--s:${1 + (i % 3)}px"></i>`).join('');
  box.innerHTML = `<div class="kdd-sky"><div class="kdd-stars">${stars}</div><div class="kdd-moon"></div><div class="kdd-neb"></div><div class="kdd-mist a"></div><div class="kdd-mist b"></div><div class="kdd-ground"></div></div>
    <div class="kdd-stage"><div class="kdd-nott" id="kddNott">${nottImg('front', 300)}</div><div class="kdd-heir" id="kddHeir">${kdPartnerArt(was, 'back', 320)}</div><div class="kdd-fx" id="kddFx"></div></div>`;
  document.body.appendChild(box);
  const say = (who, html)=> sceneSay(who === 'nott' ? [nottFace()] : [kdPartnerArt(P.form, 'front', 64)], who === 'nott' ? 'Nótt' : '', html);
  const wait = ms=> new Promise(r=> setTimeout(r, ms * (typeof SCENE_SPEED === 'number' ? SCENE_SPEED : 1)));
  try {
    requestAnimationFrame(()=> box.classList.add('on'));
    await wait(900);
    if(first){
      await say('n', `${name} falls asleep in the palace — and wakes somewhere else. A dark sky full of strange stars. Mist drifts round ${his} feet.`);
      box.classList.add('nott-in'); await wait(1200);
      await say('n', `Out of the mist comes a horse, dark as the night between the stars, her mane drifting like smoke.`);
      await say('nott', `"Do not be afraid, little ${heir}. I am Nótt. Long ago I carried the Fairy King, your forefather, into every battle he fought."`);
      await say('nott', `"Kings pass. I do not. I have waited a long, long time for one of his blood to call me."`);
      if(form) await say('nott', `"You have freed ${NOTT.firstWins} of your people. That is a beginning. Take the first of the old gifts."`);
      else await say('nott', `"The guardians of old gave you your gifts until now. From now on, the gifts are mine to give."`);
    } else {
      await say('n', `That night ${name} dreams of the dark realm again. Nótt is waiting in the mist.`);
      box.classList.add('nott-in'); await wait(1000);
      await say('nott', `"Your castle stands a level higher, and it held against the aliens' last raid. Your forefather would be proud."`);
    }
    if(form){
      await kdNottGift(box, form);
      P.forms.push(form); P.form = form;
      K.nott = Object.assign(K.nott || {}, { met:true, last:form });
      await saveProfile();
      for(const line of NOTT_LESSON[form] || []) await say('nott', line);
    } else { K.nott = Object.assign(K.nott || {}, { met:true }); await saveProfile(); }
    if(first || !form) await say('nott', `"Build well. When your whole castle has risen a level and held off its final raid, I will come again with the next gift. Until then, I ride beside you in your battles."`);
    box.classList.add('waking');
    await say('n', form ? `${name} wakes in the palace, a warm glow still inside ${him}.` : `${name} wakes in the palace. Somewhere far off, hooves.`);
  } finally {
    box.classList.remove('on'); await wait(600); box.remove();
    ui.kdDreaming = false;
  }
  if(form && typeof kdEvolve === 'function') await kdEvolve(form, was);
}
/* her gift: a light of its type from her to the heir; a burst; the heir in the new form */
async function kdNottGift(box, form){
  const F = KD_FORMS[form], col = (typeof TYPE_COLORS !== 'undefined' && TYPE_COLORS[F.type]) || '#c9a4ff';
  const fx = box.querySelector('#kddFx'), n = box.querySelector('#kddNott'), h = box.querySelector('#kddHeir');
  box.style.setProperty('--gift', col);
  const wait = ms=> new Promise(r=> setTimeout(r, ms * (typeof SCENE_SPEED === 'number' ? SCENE_SPEED : 1)));
  if(fx && n && h){
    const a = n.getBoundingClientRect(), b = h.getBoundingClientRect(), f = fx.getBoundingClientRect();
    const orb = document.createElement('div'); orb.className = 'kdd-orb';
    orb.style.left = (a.left + a.width * 0.45 - f.left) + 'px'; orb.style.top = (a.top + a.height * 0.35 - f.top) + 'px';
    orb.style.setProperty('--tx', (b.left + b.width / 2 - a.left - a.width * 0.45) + 'px');
    orb.style.setProperty('--ty', (b.top + b.height * 0.45 - a.top - a.height * 0.35) + 'px');
    fx.appendChild(orb);
    await wait(80); orb.classList.add('go');
    await wait(1100);
    orb.remove();
  }
  if(h){ h.classList.add('burst'); h.innerHTML = kdPartnerArt(form, 'back', 320); }
  try { if(typeof playSfx === 'function') playSfx('evolution'); } catch(e){}
  await wait(900);
}

/* ============================================================
   IN BATTLE: at the heir's side (45-kingdom.js asks: kdNottHtml, kdNottCharge, kdNottDraw)
   ============================================================ */
function kdNottHtml(B){
  if(!kdNottMet(kd())) return '';
  return `<div class="kdb-nott" id="kdbNott" aria-label="Nótt">${nottImg('back', B.foes.length > 1 ? 160 : 180)}<div class="kdb-nmeter" id="kdbNottM"><i><b></b></i><em>Nótt</em></div></div>`;
}
/* a right answer: she charges too; full, she gallops through the enemy chosen */
function kdNottCharge(B, n){
  if(!B || B.over || !kdNottMet(kd()) || !(n > 0)) return;
  B.nott = Math.min(NOTT.charge, (B.nott || 0) + n);
  if(B.nott >= NOTT.charge){ B.nott = 0; setTimeout(()=> kdNottStrike(B), 350); }
  kdNottDraw(B);
}
function kdNottStrike(B){
  const K = kd(), P = K.partner;
  if(ui.kdB !== B || B.over) return;
  const f = kdbTarget(B); if(!f) return;
  const el = $('#kdbNott');
  if(el){ el.classList.remove('gallop'); void el.offsetWidth; el.classList.add('gallop'); }
  setTimeout(()=>{
    if(ui.kdB !== B || B.over || f.down) return;
    const fe = screenEl.querySelectorAll('.kdb-foe')[B.foes.indexOf(f)], pic = fe && fe.querySelector('.kdb-foepic');
    if(!kdbGate(f, 'Ghost', 'nott')){ kdbFloatOn(f, 'No effect', 'immune'); return; }
    const dmg = Math.max(1, Math.round(kdAtk(P) * NOTT.pow * (0.9 + kqRand() * 0.2)));
    f.hp = Math.max(0, f.hp - dmg);
    kdbFloatOn(f, `−${dmg}`, 'nott');
    if(pic){ pic.classList.remove('hurt'); void pic.offsetWidth; pic.classList.add('hurt'); }
    kdbSay(`Nótt gallops through ${escapeHtml(f.name)}!`);
    kdbCheckDown(B); kdbDraw();
  }, 380);
}
function kdNottDraw(B){
  const m = $('#kdbNottM'); if(!m) return;
  const f = Math.max(0, Math.min(1, (B.nott || 0) / NOTT.charge));
  m.querySelector('b').style.width = (f * 100).toFixed(1) + '%';
  m.classList.toggle('near', f >= 0.66);
}

function kdNottCss(){
  if(document.getElementById('kdNottCss')) return;
  const st = document.createElement('style'); st.id = 'kdNottCss';
  st.textContent = `
  /* the dream: a dark realm of strange stars, a moon, a violet haze, mist low along the ground */
  .kd-dream{position:fixed;inset:0;z-index:80;opacity:0;transition:opacity .8s ease;overflow:hidden;background:#05030d;}
  .kd-dream.on{opacity:1;}
  .kd-dream.waking .kdd-sky{filter:brightness(1.6) saturate(.6);transition:filter 1.4s ease;}
  .kdd-sky{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 110%, #1d1240 0%, #0d0724 45%, #05030d 80%);}
  .kdd-stars i{position:absolute;width:var(--s);height:var(--s);border-radius:50%;background:#f1ecff;box-shadow:0 0 6px rgba(220,205,255,.9);animation:kddTwinkle 3.2s ease-in-out infinite;animation-delay:var(--d);}
  @keyframes kddTwinkle{0%,100%{opacity:.25;}50%{opacity:1;}}
  .kdd-moon{position:absolute;right:12%;top:9%;width:min(18vw,140px);aspect-ratio:1;border-radius:50%;
    background:radial-gradient(circle at 38% 36%, #fbf7ff 0%, #e4dcff 45%, #b6a6ea 75%, #8a78c8 100%);
    box-shadow:0 0 40px 10px rgba(190,170,255,.35), 0 0 120px 40px rgba(150,110,240,.18);}
  .kdd-neb{position:absolute;left:-10%;top:5%;width:80%;height:55%;border-radius:50%;filter:blur(40px);opacity:.55;
    background:radial-gradient(closest-side, rgba(140,70,220,.55), rgba(70,40,160,.25) 60%, transparent);animation:kddDrift 26s ease-in-out infinite alternate;}
  .kdd-mist{position:absolute;left:-20%;right:-20%;height:34%;bottom:-4%;border-radius:50%;filter:blur(26px);opacity:.7;
    background:radial-gradient(closest-side, rgba(200,180,255,.35), rgba(120,90,200,.18) 60%, transparent);animation:kddDrift 18s ease-in-out infinite alternate;}
  .kdd-mist.b{bottom:8%;opacity:.45;animation-duration:24s;animation-direction:alternate-reverse;}
  .kdd-ground{position:absolute;left:0;right:0;bottom:0;height:26%;background:linear-gradient(180deg, transparent, rgba(40,24,80,.55));}
  @keyframes kddDrift{from{transform:translateX(-4%);}to{transform:translateX(4%);}}
  .kdd-stage{position:absolute;inset:0;}
  .kdd-nott{position:absolute;left:50%;top:22%;transform:translate(-70%, 0);opacity:0;transition:opacity 1.4s ease, transform 1.6s ease;
    filter:drop-shadow(0 0 16px rgba(170,120,255,.85)) drop-shadow(0 0 40px rgba(120,80,230,.45));}
  .kd-dream.nott-in .kdd-nott{opacity:.93;transform:translate(-62%, 0);}
  .kdd-nott img{width:min(56vw,300px) !important;height:auto !important;image-rendering:pixelated;animation:kddFloat 4.2s ease-in-out infinite;}
  .kdd-heir{position:absolute;right:10%;bottom:9%;filter:drop-shadow(0 8px 10px rgba(0,0,0,.5));}
  .kdd-heir img{width:min(50vw,320px) !important;height:auto !important;image-rendering:pixelated;}
  .kdd-heir.burst{animation:kddBurst 1.2s ease-out;}
  @keyframes kddBurst{0%{filter:brightness(3) drop-shadow(0 0 30px var(--gift));}100%{filter:brightness(1) drop-shadow(0 0 0 transparent);}}
  @keyframes kddFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
  .kdd-fx{position:absolute;inset:0;pointer-events:none;}
  .kdd-orb{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:radial-gradient(circle, #fff 0%, var(--gift) 55%, transparent 72%);
    box-shadow:0 0 24px 8px var(--gift);opacity:0;transition:transform 1s cubic-bezier(.5,0,.3,1), opacity .2s ease;}
  .kdd-orb.go{opacity:1;transform:translate(var(--tx), var(--ty)) scale(1.4);}
  /* in battle: at the heir's side, a ghost */
  /* on the open ground to the right, below the enemies (the heir and its card hold the left) */
  .kdb-nott{position:absolute;right:6%;bottom:10px;z-index:0;pointer-events:none;opacity:.9;max-width:34%;
    filter:drop-shadow(0 0 10px rgba(170,120,255,.8));}
  .kdb-nott img{display:block;image-rendering:pixelated;max-width:100%;height:auto !important;margin:0 0 -18px;}
  .kdb-nott.gallop{animation:kdbGallop .76s ease-in-out;}
  @keyframes kdbGallop{40%{transform:translate(-30%, -95%) scale(.92);opacity:.6;}60%{transform:translate(-34%, -100%) scale(.9);opacity:.5;}100%{transform:none;}}
  .kdb-nmeter{position:absolute;left:14%;right:14%;bottom:-6px;display:flex;align-items:center;gap:6px;}
  .kdb-nmeter i{flex:1;height:7px;border-radius:4px;background:rgba(30,20,60,.35);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);}
  .kdb-nmeter b{display:block;height:100%;width:0;background:linear-gradient(90deg, #6d4bd8, #c9a4ff);transition:width .25s ease;}
  .kdb-nmeter.near b{box-shadow:0 0 8px #c9a4ff;}
  .kdb-nmeter em{font:800 11px 'Nunito',sans-serif;font-style:normal;color:#fff;text-shadow:0 1px 3px rgba(20,0,40,.9);}
  .kdb-float.foe.nott{color:#e6d6ff;-webkit-text-stroke:1px #4b2a9c;font-size:28px;}
  /* the kingdom's card: the next element */
  .kd-nott-head{display:flex;gap:10px;align-items:center;margin-bottom:6px;}
  .kd-nott-head img{flex:0 0 auto;image-rendering:pixelated;filter:drop-shadow(0 0 6px rgba(150,110,240,.55));}
  .kd-nott-head small{display:block;font-size:12px;font-weight:600;color:var(--ink-soft);line-height:1.35;margin-top:2px;}
  @media (prefers-reduced-motion: reduce){ .kdd-nott img, .kdd-stars i, .kdd-neb, .kdd-mist{animation:none !important;} }
  `;
  document.head.appendChild(st);
}
