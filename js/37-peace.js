/* ============================================================
   37-peace.js — THE PEACE (4.34)
   The designer (2026-11-12): "Can we also add a healing gift from the four tribe guardians at the epilogue, who
   transfer a portion of their energy to accelerate the king's recovery. The tribes also offer ground stone as a
   parting gift to the princess from the tribes' earth ancestor, who thanks the king for proving that peace was
   possible through his reign after they were sealed, and his noble selflessness in trusting and helping each of them.
   They declare that unity saved the tribes which have pledged peace and cooperation, and Cuain teases Monkey King
   about how familiar the lesson sounds. Thereafter, on different days of the week, different permutations of tribal
   members, guardians, ancestors and palace citizens can be found visiting each others' villages and the castle, and
   the two empty stalls in the castle square become their shops (4 vendors; 2 per stall). They sell consumable boosts
   of which 10 can be stored at any one time. In battles which cannot be fled, such as trainer battles or important
   storyline battles, the flee button becomes the "Item" button. Item boosts are undispellable. Each costs 1 silver
   medal to purchase. Only 2 items can be used per battle.
     Fire tribe: Fire mote: whole party gains 25% ATK for 5 turns.
     Water tribe: Spring water: cleanses 1 debuff per turn for 5 turns.
     Earth tribe: Slate shield: grants 5 team shields
     Grass tribe: Fruit punch: heals the equivalent of 40% an elite's monster HP per turn for 5 turns, calculated at
     the level of the highest levelled monster in the team. Prioritises active monsters but spills over to most
     damaged benched party monsters, until the heal is depleted completely."
   Asked: Cuain is in the party ("he promises that he will be there when you need — he's in the party!"), so he is in
   the hall with you; ten of each boost; a boost is used as a switch is, without spending the turn.
     · The epilogue: straight after the finale (26-invasion.js's invFinaleNem), in the great hall — or, for a save
       already past the finale, the next time you come to the castle (peaceEpilogueDue). invState().said.epilogue.
     · The Ground Stone (04-battle.js's ELEMENTAL_STONES: nobody gave it until now) to the princess — she is Ground and
       Fairy, so she carries it, if she carries nothing yet.
     · Visits (PEACE_WEEK): one table for the week — every guardian and ancestor somewhere at least once, a guardian
       or an ancestor at the castle every day (an ancestor before the throne, a guardian by the fountain), another
       visiting a village, two of the castle's people at a village, two tribes' people about the market, and each
       other village with visitors of another tribe. Away, a guardian's lodge and an ancestor's place stand empty.
     · The stalls: the market's fruit stall (west) is the Grass and Water Tribes' now, its flower stall (east) the
       Fire and Earth Tribes'; a vendor of each behind its counter.
     · The boosts: state.inventory.boosts { id: count }, ten of each at most; in a fight that cannot be fled
       (b.noFleeBase), the Item button where Flee was — two a fight, free as a switch is; their effects are never
       swept, stolen or held open by a dust (unsweepable, noDust), and a Slate Shield's shields are never swept or
       stolen (the team's `fixed`, 04-battle.js) — a blow still uses them up.
   ============================================================ */
const PEACE = { order:['grass', 'water', 'earth', 'fire'] };
function peaceOn(){ return typeof invOn === 'function' && invOn() && invStage() === 'done'; }
function peaceDone(){ return peaceOn() && !!invState().said.epilogue; }
function peaceHas(sp){ return (state.party || []).concat(state.storage || []).some(m=> m && m.species === sp); }
const peaceTribe = k=> JG_TRIBES[k].short;                               // 'Grass', 'Water', 'Earth', 'Fire'

/* ---------- the speakers: Cuain and the Monkey King, in your party ---------- */
if(typeof caFaceOf === 'function'){
  const _peaceFaceOf = caFaceOf;
  caFaceOf = function(who){
    if(who === 'cuain') return faceMon('whalelord');
    if(who === 'mk') return faceMon('monkey_king', { stage:1, crowned:true });
    return _peaceFaceOf.apply(this, arguments);
  };
}
if(typeof caNameOf === 'function'){
  const _peaceNameOf = caNameOf;
  caNameOf = function(who){
    if(who === 'cuain') return typeof whaleName === 'function' ? whaleName() : 'Cuain';
    if(who === 'mk') return 'The Monkey King';
    return _peaceNameOf.apply(this, arguments);
  };
}

/* ============================================================
   THE EPILOGUE
   ============================================================ */
const PEACE_HALL = {
  king:{ x:20, y:2.9 },                                                   // where the light lands: the King, on his throne (19, 3, two wide)
  guard:{ grass:15, water:17, earth:22, fire:24 }, anc:{ grass:14.6, water:17.4, earth:21.6, fire:24.4 },
  up:{ grass:{ x:16.2, y:5.6 }, water:{ x:17.6, y:5.2 }, earth:{ x:21.4, y:5.2 }, fire:{ x:22.8, y:5.6 } },
  colour:{ grass:'#5fcf4a', water:'#4ab4ff', earth:'#e0b24a', fire:'#ff6a2a' },
  prin:{ x:19.5, y:5 },
};
/* the four of them, the ancestors behind, the princess before the throne (as the finale has them) */
function peaceHallActors(){
  const ids = [];
  JG_TRIBE_KEYS.forEach(k=>{
    const sp = k === 'earth' ? 'ground' : k;
    invActor('fg' + k, `tribal_guardian_${sp}`, PEACE_HALL.guard[k], 7, 1.6); invActor('fa' + k, `tribal_ancestor_${k}`, PEACE_HALL.anc[k], 9.6, 2.2);
    ids.push('fg' + k, 'fa' + k);
  });
  invActor('prin', 'fairy_princess1', PEACE_HALL.prin.x, PEACE_HALL.prin.y, 1.5);
  { const pe = document.getElementById('sa-prin'); if(pe) pe.classList.add('inv-princess-glow'); }
  ids.push('prin');
  return ids;
}
/* the King on his throne (the palace's own figure of him) */
function peaceKingEl(){
  const t = typeof deckThings === 'function' && DECKS.r6_palace ? deckThings(DECKS.r6_palace).find(x=> x.who === 'king') : null;
  return t && t.el;
}
/* the epilogue's words, in the great hall, the four guardians and their ancestors there (ids: theirs, the scene's) */
async function peaceEpilogue(){
  peaceCss();
  const K = JG_TRIBE_KEYS, v = invState();
  /* 1. the guardians' gift: their strength, into the King */
  await L([['g_earth', `<b>"Fairy King. At every one of our villages you gave the last of your strength for us. Now let the four of us give some of ours back."</b>`],
           ['g_water', `<b>"Hold still, Your Majesty. This will feel like spring rain."</b>`]]);
  await Promise.all(K.map(k=> invActorTo('fg' + k, PEACE_HALL.up[k].x, PEACE_HALL.up[k].y, 700)));
  peacePowerUp();                                                           // (4.37) the boosts' power-up: "the healing beams can use the same!"
  /* their light, streaming to the throne while it is told */
  const beams = [];
  K.forEach((k, i)=> setTimeout(()=>{ const u = PEACE_HALL.up[k]; beams.push(peaceBeam(u.x + 0.5, u.y + 0.2, PEACE_HALL.king.x, PEACE_HALL.king.y, PEACE_HALL.colour[k])); }, i * 220 * SCENE_SPEED));
  await sceneWait(1100);
  { const ke = peaceKingEl(); if(ke) ke.classList.add('peace-healed'); }
  peaceSparkle(PEACE_HALL.king.x, PEACE_HALL.king.y, '#fff3b0', 12);
  try {
    await L([`The four guardians raise their staffs, and light flows from each of them to the throne: the blue of deep water, the red of embers, the gold of sunlit stone, the green of new leaves.`]);
  } finally { beams.forEach(el=>{ if(!el) return; el.classList.add('off'); setTimeout(()=> el.remove(), 600); }); }
  await L([['king', `The colour comes back into the King's face. He sits up, and flexes his hands.<br><br><b>"…Ah. Warmth, in my hands again. I feel as though I have slept for a whole week."</b>`],
           ['advisor', `<b>"Hoo! Look at his cheeks! …You will still CONVALESCE, Your Majesty. But perhaps only a little."</b>`],
           ['g_grass', `<b>"Our strength will speed your healing, King. It cannot do all the work. Rest!"</b>`],
           ['g_fire', `<b>"And EAT something. You look like a twig."</b>`]]);
  await Promise.all(K.map(k=> invActorTo('fg' + k, PEACE_HALL.guard[k], 7, 600)));
  /* 2. the Earth Ancestor, for all four tribes */
  await invActorTo('faearth', 20.3, 8.3, 800);                               // onto the carpet, before the throne
  await L([['a_earth', `The Earth Ancestor steps forward, slow as a mountain, and bows its great head to the throne.<br><br><b>"Fairy King. Two hundred years ago, you sealed us in steel. In the dark we swore that we would have our revenge."</b>`],
           ['a_earth', `<b>"Then we woke, and found that your castle had done what we never could. It kept the peace — for two hundred years. You proved that peace was possible."</b>`],
           ['a_earth', `<b>"And then you came to each of us yourself. You trusted us — the ancestors who swore to destroy you — with your life. You woke us with your own hands, and gave your strength to every village until you could barely stand. You asked for nothing in return."</b>`],
           ['a_earth', `<b>"That is a nobility none of us showed you. Thank you."</b>`],
           ['a_fire', `<b>"…Hmph. What the old rock said. Don't make me say it twice."</b>`],
           ['a_earth', `<b>"The aliens did not beat us, because we did not stand alone. The tribes and the castle, side by side: unity saved us — every one of us."</b>`],
           ['a_water', `<b>"So the four tribes have made a pledge, to each other and to you: peace between our villages and with this castle, and help whenever it is asked."</b>`],
           ['a_grass', `<b>"No more hidden paths! Our gates are open now — to each other, and to your people too."</b>`],
           ['king', `<b>"Then this is the best day of my reign. Thank you — all of you."</b>`]]);
  /* 3. the tribes' parting gift to the princess: the Ground Stone */
  const had = typeof ownsStone === 'function' && ownsStone('groundStone');
  await L([['a_earth', `The Earth Ancestor turns to the princess.<br><br><b>"And you, little one. You go to keep your father's promise, far from home. The tribes have something for you."</b>`]]);
  if(!had){
    peaceStoneFly(20.7, 6.9, PEACE_HALL.prin.x, PEACE_HALL.prin.y - 0.4, 1100);
    await sceneWait(1200);
    peaceSparkle(PEACE_HALL.prin.x, PEACE_HALL.prin.y - 0.4, '#ffe28a', 10);
  }
  const prin = (state.party || []).concat(state.storage || []).find(m=> m && m.species === 'fairy_princess');
  let carries = false;
  if(!had && typeof addStone === 'function'){
    addStone('groundStone', 1);
    if(prin && typeof stoneCarriedBy === 'function' && !stoneCarriedBy(prin) && typeof attachStone === 'function'){ attachStone('groundStone', prin); carries = true; }
    try { playSfx('stone_high'); } catch(e){}
  }
  v.said.stoneGiven = true;
  saveProfile();
  const pic = typeof stonePic === 'function' ? stonePic('groundStone', 22) : '';
  await L(had ? [['a_earth', `<b>"We would have given you the earth's own stone — but I see it travels with you already. Then take our blessing with it: may it keep your feet steady."</b>`],
                 ['princess', `<b>"Thank you. I'll keep it close — always."</b>`]]
              : [`The Earth Ancestor opens one great hand. In it lies a stone, warm and brown as good soil, glowing faintly gold. ${pic}`,
                 ['a_earth', `<b>"The Ground Stone, from all four tribes. There is earth in you, little one, as there is in us. Wherever you go, it will keep your feet steady."</b>`],
                 ['princess', `She holds it in both hands.<br><br><b>"For me? …I'll keep it safe. Thank you — thank you all!"</b>`],
                 `${pic} <b>The Ground Stone</b> is yours${carries ? ' — the Little Princess carries it: she learns half again as fast' : ''}.`]);
  /* 4. the lesson — and the Monkey King has heard it before */
  if(peaceHas('whalelord') && peaceHas('monkey_king')){
    await L([['cuain', `<b>"Unity saved them. Hm."</b><br><br>The ghost of a whale, somewhere at the back of the hall, sounds thoughtful.<br><br><b>"Monkey King — doesn't that lesson sound familiar?"</b>`],
             ['mk', `<b>"…I have no idea what you mean, whale."</b>`],
             ['cuain', `<b>"'For thousands of years I fought alone. I thought that was what made me strong.' You said that the day you joined us. I remember every word."</b>`],
             ['mk', `<b>"Hmph. Then the tribes learned in two hundred years what took me two thousand. Some of us are slower students than others."</b>`],
             ['princess', `<b>"Two THOUSAND years?"</b>`],
             ['mk', `<b>"Do not do the arithmetic, little one."</b>`]]);
  }
  /* 5. the King's farewell */
  await L([['king', `<b>"Stay for the feast, all of you — and come back often. These gates will never be shut to you again."</b>`],
           `The tribes stay three days for the feasting. By the time they leave, two of the market's empty stalls have tribal traders behind them — and the castle has new friends coming to visit.`]);
  { const ke = peaceKingEl(); if(ke) ke.classList.remove('peace-healed'); }
  v.said.epilogue = true;
  saveProfile();
}
/* the story's last page, once the tribes have made their peace */
function peaceLastPage(here){
  return `The castle is saved, and the four tribes have pledged their peace — to each other, and to the castle.` +
    (here === undefined ? '' : ` The Little Princess has joined you in her father's place${here ? '' : ' (she is waiting in storage: your six were full)'}.`) +
    `<br><br><i>The tribes come and go now: on different days of the week you may meet their people, their guardians and their ancestors visiting each other's villages and the castle — and the castle's people visiting theirs. Two of the market's stalls are the tribes' own: four traders with boosts for the fights you cannot flee, a silver medal each.</i>` +
    `<br><br><i>The Royal Commander holds the rift at the jungle's northern edge, where his soldiers fight the aliens that keep coming through it. Go inside the perimeter any day: every alien there counts for the King's challenge and the tribes' and the castle's daily thanks. Half of the jungle's aliens are still out there, too, and now and then one leaps out on its paths.</i>`;
}
/* a save past the finale without it: the next time you come to the castle (26-invasion.js's invSceneDue asks) */
function peaceEpilogueDue(key){
  if(!peaceOn() || invState().said.epilogue || !invState().said.finale) return null;
  if(key === 'r6_palace') return invScene(()=> peaceEpilogueRun());
  if(key === CA_KEY) return caLines([['knight', `<b>"There you are! The tribes have come — guardians, ancestors and all — and His Majesty asks for you in the great hall!"</b>`]])
    .then(()=>{ if(ui.screen === CA_KEY) caGo('r6_palace', [19, 14]); });
  return null;
}
async function peaceEpilogueRun(){
  const ids = peaceHallActors();
  await sceneLook({ x:12, y:0.5, w:16, h:12 }, { ms:900 });
  await L([`The four tribes have come to the castle — guardians, ancestors and all — and the great hall is fuller than it has been in two hundred years.`,
           ['king', `<b>"My friends! Come — you should be here for this."</b>`]]);
  await peaceEpilogue();
  ids.forEach(id=> sceneActorGone(id));
  await sceneCamFree(500);
  await new Promise(res=> storyModal(jgMonImg('tribal_ancestor_earth_front', 140), 'The tribes make their peace', peaceLastPage(), ()=> res(), { subtitle:"The Fairy King's castle", bg:'palace' }));
  ui.walkFresh = false;
  go('r6_palace');
}

/* ---------- the pictures: the guardians' light, the stone, sparkles ---------- */
/* (4.37) The designer: "boosts should have a power up sound that's more strong and not high pitched, and the healing
   beams can use the same!" — a boost used and the guardians' light both play the power-up made in the catch's hall
   (33-catch.js's czSound.powerUp: a low charge, a boom and a power chord struck): until 4.37 'power_up', which has no
   file of its own (level_up.mp3, bright, stood in), and a Slate Shield the stones' sound. */
function peacePowerUp(level){ try { if(typeof czSound !== 'undefined' && czSound.powerUp) czSound.powerUp({ level:level == null ? 1 : level }); } catch(e){} }
/* a stream of light from (x0, y0) to (x1, y1), squares — it stays till it is put out (.off), or `ms` if given */
function peaceBeam(x0, y0, x1, y1, colour, ms){
  const world = $('#walkWorld');
  if(!world) return null;
  const T = WALK_T, dx = (x1 - x0) * T, dy = (y1 - y0) * T, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
  const el = document.createElement('div');
  el.className = 'peace-beam';
  el.style.cssText = `left:${x0 * T}px;top:${y0 * T}px;width:${len}px;height:${0.3 * T}px;margin-top:${-0.15 * T}px;transform:rotate(${ang}rad);--pc:${colour};--in:${Math.max(1, 600 * SCENE_SPEED)}ms;`;
  world.appendChild(el);
  if(ms){ setTimeout(()=>{ el.classList.add('off'); setTimeout(()=> el.remove(), 600); }, ms * SCENE_SPEED); }
  return el;
}
function peaceSparkle(x, y, colour, n){
  const world = $('#walkWorld');
  if(!world) return;
  const T = WALK_T;
  for(let i = 0; i < (n || 10); i++){
    const s = document.createElement('i');
    const a = i / (n || 10) * Math.PI * 2, r = (0.6 + Math.random() * 0.8) * T;
    s.className = 'peace-spark';
    s.style.cssText = `left:${x * T}px;top:${y * T}px;--dx:${(Math.cos(a) * r).toFixed(1)}px;--dy:${(Math.sin(a) * r - 0.4 * T).toFixed(1)}px;--pc:${colour};animation-duration:${900 * SCENE_SPEED}ms;animation-delay:${(i * 30 * SCENE_SPEED).toFixed(0)}ms;`;
    world.appendChild(s);
    setTimeout(()=> s.remove(), (900 + i * 30) * SCENE_SPEED + 100);
  }
}
function peaceStoneFly(x0, y0, x1, y1, ms){
  const world = $('#walkWorld');
  if(!world) return;
  const T = WALK_T, el = document.createElement('div');
  el.className = 'peace-stone';
  el.style.cssText = `left:${(x0 - 0.4) * T}px;top:${(y0 - 0.4) * T}px;width:${0.8 * T}px;height:${0.8 * T}px;`;
  el.innerHTML = typeof uiIcon === 'function' ? uiIcon('ground_stone', Math.round(0.8 * T), '') : '';
  world.appendChild(el);
  void el.offsetWidth;
  const t = Math.max(1, ms * SCENE_SPEED);
  el.style.transition = `left ${t}ms ease-in-out, top ${t}ms cubic-bezier(.3,-.6,.6,1), opacity ${t * 0.3}ms ease ${t * 0.85}ms`;
  el.style.left = `${(x1 - 0.4) * T}px`; el.style.top = `${(y1 - 0.4) * T}px`; el.style.opacity = '0';
  setTimeout(()=> el.remove(), t + 80);
}

/* ============================================================
   THE VISITS: who is where, on each day of the week
   ============================================================ */
/* [castle notable, its place, village notable, its host, the castle's people at, the two tribes about the market] —
   a notable 'a_<tribe>' (an ancestor) or 'g_<tribe>' (a guardian). Sunday first, as Date has it. */
const PEACE_WEEK = [
  { castle:'a_earth', place:'hall',   visit:'g_fire',  host:'water', folk:'grass', market:['water', 'fire'],  citizens:['knight', 'townBunny'] },
  { castle:'g_water', place:'market', visit:'a_grass', host:'earth', folk:'fire',  market:['grass', 'earth'], citizens:['duck', 'townCream'] },
  { castle:'a_fire',  place:'hall',   visit:'g_earth', host:'grass', folk:'water', market:['earth', 'water'], citizens:['bug', 'townChoux'] },
  { castle:'g_grass', place:'market', visit:'a_water', host:'fire',  folk:'earth', market:['fire', 'grass'],  citizens:['knight', 'townMelody'] },
  { castle:'a_grass', place:'hall',   visit:'g_water', host:'fire',  folk:'grass', market:['water', 'earth'], citizens:['duck', 'servant'] },
  { castle:'g_fire',  place:'market', visit:'a_earth', host:'water', folk:'fire',  market:['grass', 'fire'],  citizens:['bug', 'townBird'] },
  { castle:'a_water', place:'hall',   visit:'g_grass', host:'earth', folk:'water', market:['earth', 'fire'],  citizens:['knight', 'cream'] },
];
const PEACE_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function peaceDay(){ return ui.peaceDay != null ? ui.peaceDay : new Date().getDay(); }   // (a test may set the day)
function peaceToday(){ return PEACE_WEEK[((peaceDay() % 7) + 7) % 7]; }
/* each village's visitors today: another tribe's people, or (one village) the castle's */
function peaceGuestsAt(k){
  const D = peaceToday(), i = PEACE.order.indexOf(k), d = peaceDay();
  if(D.folk === k) return { citizens:D.citizens };
  let t = PEACE.order[(i + 1 + d % 3) % 4];
  if(t === k) t = PEACE.order[(i + 2) % 4];
  return { tribe:t };
}
/* a guardian or an ancestor away from home today */
function peaceAway(kind, k){
  if(!peaceDone()) return false;
  const D = peaceToday(), id = kind + '_' + k;
  return D.castle === id || D.visit === id;
}
if(typeof unGuardHome === 'function'){ const _peaceGuardHome = unGuardHome; unGuardHome = function(k){ return _peaceGuardHome.apply(this, arguments) && !peaceAway('g', k); }; }
if(typeof unAncHome === 'function'){ const _peaceAncHome = unAncHome; unAncHome = function(k){ return _peaceAncHome.apply(this, arguments) && !peaceAway('a', k); }; }
/* a picture by its file's own name (a guardian's has no _front), drawn as the castle's figures are (.ca-art) */
function peaceArt(file, px, flip){
  const w = Math.round(px);
  return `<img class="ca-art" src="assets/mon/${file}.png" alt="" style="width:${w}px;height:${w}px;${flip ? 'scale:-1 1;' : ''}" onload="spriteFeet(this)" onerror="this.style.display='none'">`;
}
/* who a notable is: its picture, its name, its size */
function peaceNotable(id){
  const kind = id.slice(0, 1), k = id.slice(2), sp = kind === 'a' ? `tribal_ancestor_${k}_front` : JG_TRIBES[k].guardian;
  return { kind, k, sprite:sp, name:kind === 'a' ? peaceTribe(k) + ' Ancestor' : peaceTribe(k) + ' Guardian', size:kind === 'a' ? 2.3 : 1.6 };
}

/* ---------- what the visitors say ---------- */
const PEACE_LINES = {
  /* the tribes' people about the market */
  market:{
    grass:[`<b>"Our first time inside the walls! Everything here is made of stone. Doesn't it miss the trees?"</b>`, `<b>"I'm trading a basket of seeds for one of those shiny pears. Fair's fair!"</b>`],
    water:[`<b>"The fountain! They keep a whole spring right in the middle of their town!"</b>`, `<b>"The Fairybunnies sold me a gold medal. I think. It might be a coin with a bunny on it."</b>`],
    earth:[`<b>"Whoever laid these cobbles knew stone. We approve."</b>`, `<b>"We came to see the King. Well — the market first. Then the King."</b>`],
    fire: [`<b>"Loud, busy, and nobody's fighting. I could get used to this."</b>`, `<b>"A Duck Knight challenged me to a race round the fountain. I let him win. Don't tell him."</b>`],
  },
  /* another tribe's people, visiting a village: [host] → what they say */
  visit:[
    host=> `<b>"We came to see how the ${host} Tribe lives. Their huts are so cosy!"</b>`,
    host=> `<b>"Two hundred years nobody could find this village. Now we just walk in, and they give us tea!"</b>`,
    host=> `<b>"The ${host} folk are teaching us their dances. I keep stepping on everyone's feet."</b>`,
  ],
  /* the castle's people, visiting a village */
  citizens:[
    host=> `<b>"His Majesty sent us with bread and blankets for the ${host} Tribe. They sent us back with flowers!"</b>`,
    host=> `<b>"My first time outside the castle walls. The jungle is so GREEN."</b>`,
    host=> `<b>"I'm learning to weave baskets from the ${host} Tribe. Mine is… mostly a hat."</b>`,
  ],
  /* a guardian or an ancestor, visiting */
  hall:{
    a:k=> ({ earth:`<b>"The King and I have two hundred years to talk about. We are taking it slowly."</b>`, fire:`<b>"I'm not here to be friendly. I'm here to see that he's eating properly. That's different."</b>`,
             water:`<b>"His throne is very hard. I have told him so. He says a king should not be too comfortable."</b>`, grass:`<b>"We're playing a game of stones! He's losing. I think he's letting me win. I don't mind!"</b>`, })[k],
  },
  market2:{
    g:k=> ({ earth:`<b>"…The market. …So many… square things."</b>`, fire:`<b>"I came to buy a present for my tribe. Everything here is so SMALL."</b>`,
             water:`<b>"I come to listen to the fountain. It sings a different song to our river."</b>`, grass:`<b>"I'm buying flowers for my fairies! …Don't tell them. It's a surprise!"</b>`, })[k],
  },
  guest:{
    g:(k, host)=> `<b>"The ${host} Guardian and I are talking about the old days. Only the good parts — there weren't many."</b>`,
    a:(k, host)=> `<b>"Two hundred years ago, the ${host} Tribe and mine were at war. Today I came for tea. Isn't that something?"</b>`,
  },
};

/* ---------- at the castle: the notable of the day, the tribes' people in the market ---------- */
const PEACE_CA = { hall:{ x:20, y:7 }, market:{ x:40, y:37 } };
const PEACE_WHO = {
  grass:['grass_fairy', 'grass_sprite'], water:['water_fairy', 'water_sprite'], earth:['earth_fairy', 'earth_sprite'], fire:['fire_sprite', 'bonedancer'],
};
if(typeof CA_WHO !== 'undefined'){
  PEACE.order.forEach(k=>{
    CA_WHO['vis' + k] = { sprite:PEACE_WHO[k][0], name:`A ${peaceTribe(k)} Tribe visitor`, icon:'' };
    CA_WHO['vis2' + k] = { sprite:PEACE_WHO[k][1], name:`A ${peaceTribe(k)} Tribe visitor`, icon:'' };
  });
  /* the four traders (PEACE_STALLS) */
  CA_WHO.vendgrass = { sprite:'grass_fairy1', name:'The Grass Tribe’s trader', icon:'' };
  CA_WHO.vendwater = { sprite:'water_fairy1', name:'The Water Tribe’s trader', icon:'' };
  CA_WHO.vendearth = { sprite:'earth_fairy', name:'The Earth Tribe’s trader', icon:'' };
  CA_WHO.vendfire  = { sprite:'fire_sprite', name:'The Fire Tribe’s trader', icon:'' };
}
if(typeof CA_LINES !== 'undefined') PEACE.order.forEach(k=>{ CA_LINES['vis' + k] = PEACE_LINES.market[k]; });
/* the tribes' people in the market today: shoppers from stall to stall, as the townsfolk are (21-castle.js, CA_MARKET) */
const _peaceWalkers = {};
function peaceMarketWalkers(){
  const d = peaceDay();
  if(_peaceWalkers[d]) return _peaceWalkers[d];
  const D = peaceToday(), spots = [[18, 44], [45, 37], [21, 33], [45, 44]];
  return (_peaceWalkers[d] = D.market.flatMap((k, i)=> [0, 1].map(j=>{
    const [x, y] = spots[i * 2 + j];
    return { id:'pv' + d + k + j, who:(j ? 'vis2' : 'vis') + k, line:'vis' + k, mode:'shop', x, y };
  })));
}
/* kept in the grounds' own list (CA_WALKERS: who stands where, for everyone's steps), today's and nobody else's */
if(typeof caWalkerDefs === 'function'){
  const _peaceWalkerDefs = caWalkerDefs;
  caWalkerDefs = function(key){
    const list = _peaceWalkerDefs.apply(this, arguments);
    if(key !== CA_KEY || typeof CA_WALKERS === 'undefined' || list !== CA_WALKERS[key]) return list;   // (not while the castle is invaded: nobody is out)
    const want = peaceDone() ? peaceMarketWalkers() : [];
    for(let i = list.length - 1; i >= 0; i--) if(/^pv/.test(list[i].id) && !want.includes(list[i])) list.splice(i, 1);
    want.forEach(wk=>{ if(!list.includes(wk)){ if(!wk.cells) wk.cells = caWalkerCells(wk); list.push(wk); } });
    return list;
  };
}

/* ============================================================
   THE STALLS: the market's fruit and flower stalls, the tribes' now
   ============================================================ */
const PEACE_STALLS = {
  west:{ stall:'fruit', tribes:['grass', 'water'] },
  east:{ stall:'flower', tribes:['fire', 'earth'] },
};
function peaceStallAt(side){ const s = caGrounds().tags.stalls[PEACE_STALLS[side].stall]; return s; }
if(typeof caThings === 'function'){
  const _peaceCaThings = caThings;
  caThings = function(key){
    const list = _peaceCaThings.apply(this, arguments);
    if(!list || list._peace) return list;
    list._peace = true;
    const T = o=> list.push(o);
    if(key === CA_KEY){
      /* the traders, behind their counters; the counters to buy across */
      Object.entries(PEACE_STALLS).forEach(([side, S])=>{
        const st = peaceStallAt(side);
        /* (their pictures are small fairies, the fruit and the flowers piled high: drawn larger than the bunnies, and
           standing a little higher, to be seen over them) */
        S.tribes.forEach((k, i)=> T(Object.assign(caNpc('vend' + k, st.x + 1 + i * 2, st.y - 1, { scale:1.9, dy:-0.3, faceR:i === 0, act:()=> peaceShopOpen(side, k) }), { when:()=> peaceDone() })));
        T({ x:st.x, y:st.y, w:st.w, icon:'', verb:'Shop', sub:`The ${peaceTribe(S.tribes[0])} and ${peaceTribe(S.tribes[1])} Tribes’ stall`, when:()=> peaceDone(), act:()=> peaceShopOpen(side) });
      });
      /* a guardian by the fountain, on its day */
      T({ x:PEACE_CA.market.x, y:PEACE_CA.market.y, cls:'ca-npc peace-guest', still:true,
          html:()=>{ const N = peaceNotable(peaceToday().castle); return peaceArt(N.sprite, WALK_T * N.size, false); },
          verb:'Talk', get sub(){ return peaceNotable(peaceToday().castle).name; },
          when:()=> peaceDone() && peaceToday().place === 'market',
          act:()=>{ const N = peaceNotable(peaceToday().castle); return caLines([[N.kind + '_' + N.k, PEACE_LINES.market2.g(N.k)]]); } });
    }
    if(key === 'r6_palace'){
      /* an ancestor before the throne, on its day */
      T({ x:PEACE_CA.hall.x, y:PEACE_CA.hall.y, cls:'ca-npc peace-guest', still:true,
          html:()=>{ const N = peaceNotable(peaceToday().castle); return peaceArt(N.sprite, WALK_T * N.size, false); },
          verb:'Talk', get sub(){ return peaceNotable(peaceToday().castle).name; },
          when:()=> peaceDone() && peaceToday().place === 'hall',
          act:()=>{ const N = peaceNotable(peaceToday().castle); return caLines([[N.kind + '_' + N.k, PEACE_LINES.hall.a(N.k)]]); } });
    }
    return list;
  };
}
/* the wares on the counters (drawn over the stall's goods, once the tribes have them) */
function peaceStallWares(world){
  if(!world || !peaceDone()) return;
  peaceCss();
  const T = WALK_T;
  Object.entries(PEACE_STALLS).forEach(([side, S])=>{
    const st = peaceStallAt(side);
    const el = document.createElement('div');
    el.className = 'peace-wares';
    el.style.cssText = `left:${(st.x + 0.15) * T}px;top:${(st.y + 0.18) * T}px;width:${(st.w - 0.3) * T}px;height:${0.62 * T}px;z-index:${Math.round(12 + st.y + 1)};`;
    el.innerHTML = S.tribes.map(k=> `<span>${boostIcon(BOOST_OF[k], Math.round(0.52 * T))}${boostIcon(BOOST_OF[k], Math.round(0.44 * T))}</span>`).join('');
    world.appendChild(el);
  });
}

/* ============================================================
   THE BOOSTS
   ============================================================ */
const BOOST = { max:10, perBattle:2, cost:1, cur:'silver', turns:5, atk:0.25, shields:5, heal:0.40 };
const BOOSTS = [
  { id:'fireMote',    tribe:'fire',  name:'Fire Mote',    say:`<b>"A spark from our oldest fire. Hold it high, and your team's blood burns hotter!"</b>` },
  { id:'springWater', tribe:'water', name:'Spring Water', say:`<b>"Water from the spring under our lodge. It washes away whatever clings to you."</b>` },
  { id:'slateShield', tribe:'earth', name:'Slate Shield', say:`<b>"…Slate. …From the mountain's heart. …Five shields. …They do not break easily."</b>` },
  { id:'fruitPunch',  tribe:'grass', name:'Fruit Punch',  say:`<b>"Fruit Punch! Every fruit in the jungle, squished! One sip and you feel like dancing!"</b>` },
];
const BOOST_OF = { fire:'fireMote', water:'springWater', earth:'slateShield', grass:'fruitPunch' };
function boostDef(id){ return BOOSTS.find(x=> x.id === id) || null; }
function boostBag(){
  const inv = state.inventory || (state.inventory = {});
  if(!inv.boosts || typeof inv.boosts !== 'object') inv.boosts = {};
  return inv.boosts;
}
function boostCount(id){ return Math.max(0, Math.min(BOOST.max, Math.floor(Number(boostBag()[id]) || 0))); }
function boostAdd(id, n){ const b = boostBag(); b[id] = Math.max(0, Math.min(BOOST.max, boostCount(id) + n)); return b[id]; }
function boostsKnown(){ return peaceDone() || BOOSTS.some(x=> boostCount(x.id) > 0); }
/* "an elite's monster HP … at the level of the highest levelled monster in the team": a grown elite (rate 11, both
   its evolutions: an Otter's or a Ninja's line), no Protein, at that level — health as any monster's (computeMaxHp) */
function boostTopLevel(){ return Math.max(1, ...(typeof battleParty === 'function' ? battleParty() : (state.party || [])).map(m=> m.level || 1)); }
function boostEliteHp(level){ const rate = 11, stat = Math.ceil(rate / 5 * level) + 2 * rate; return Math.ceil(stat * hpScale(level)); }
function boostHealAmount(){ return Math.round(BOOST.heal * boostEliteHp(boostTopLevel())); }
function boostDesc(id){
  if(id === 'fireMote') return `Your whole team's ATK +${Math.round(BOOST.atk * 100)}% for ${BOOST.turns} turns.`;
  if(id === 'springWater') return `Washes 1 debuff off your side at once, and 1 more each turn — ${BOOST.turns} in all.`;
  if(id === 'slateShield') return `${BOOST.shields} shields for your whole team.`;
  if(id === 'fruitPunch') return `${boostHealAmount()} HP at once and each turn after — ${BOOST.turns} in all (40% of an elite's health at Lv ${boostTopLevel()}): the monsters out front first, then the most hurt of the rest.`;
  return '';
}

/* ---------- their pictures (drawn: no emoji) — in a pill, a message, the shop, the bag ---------- */
const PEACE_SYM = { fireMote:'', springWater:'', slateShield:'', fruitPunch:'', pouch:'' };
const BOOST_SVG = {
  fireMote:'<defs><radialGradient id="pbFm" cx=".5" cy=".62" r=".55"><stop offset="0" stop-color="#fffbe0"/><stop offset=".3" stop-color="#ffd84a"/><stop offset=".68" stop-color="#ff7a1f"/><stop offset="1" stop-color="#d0341a"/></radialGradient></defs>' +
    '<path d="M32 4c3 9 13 13 13 24 0 3-1 5-2 7 4-2 6-6 6-10 5 6 7 12 7 17 0 12-10 19-24 19S8 54 8 42c0-6 3-11 7-15 0 4 2 7 5 9-2-3-3-5-3-8 0-11 12-15 15-24z" fill="url(#pbFm)" stroke="#8e2a12" stroke-width="3" stroke-linejoin="round"/>' +
    '<ellipse cx="32" cy="44" rx="8" ry="9" fill="#fffbe0" opacity=".9"/><path d="M23 38c1-4 3-6 6-7" fill="none" stroke="#fff6c8" stroke-width="3" stroke-linecap="round" opacity=".8"/>',
  springWater:'<path d="M25 9h14v11c9 4 15 12 15 22 0 11-9 18-22 18S10 53 10 42c0-10 6-18 15-22z" fill="#e8f6ff" stroke="#2a5d86" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M13.5 38c6 3 13 3 18.5 0s12.5-3 18.5 0c.3 1.3.5 2.6.5 4 0 9-8 14.5-19 14.5S13 51 13 42c0-1.4.2-2.7.5-4z" fill="#4aa8e8"/>' +
    '<rect x="23" y="3" width="18" height="8" rx="2.5" fill="#b07a48" stroke="#5e3e22" stroke-width="2.5"/>' +
    '<path d="M19 44c1 5 4 8 8 9" fill="none" stroke="#e8f6ff" stroke-width="3.5" stroke-linecap="round"/><circle cx="41" cy="45" r="2.6" fill="#d6efff"/>',
  slateShield:'<path d="M32 4 54 11v17c0 15-9 26-22 32C19 54 10 43 10 28V11z" fill="#6f7d8c" stroke="#323a44" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<path d="M14.5 22 49.5 16M13.5 33l37-5M17 45l30-4.5" stroke="#aab7c4" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>' +
    '<path d="M32 9.5 49.5 15v12" fill="none" stroke="#d5dee6" stroke-width="3" stroke-linecap="round" opacity=".75"/>',
  fruitPunch:'<path d="M13 19h34l-5 37c-.4 3-3 5-6 5H24c-3 0-5.6-2-6-5z" fill="#fff4f6" stroke="#7a2a3a" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M15.6 28h28.8l-3.6 27c-.3 2-2 3.4-4 3.4H23.2c-2 0-3.7-1.4-4-3.4z" fill="#e8436a"/>' +
    '<path d="M26 4.5 30.5 30" stroke="#2f9a9a" stroke-width="3.6" stroke-linecap="round"/>' +
    '<circle cx="46" cy="18" r="9" fill="#ffb238" stroke="#b86a10" stroke-width="2.5"/><path d="M46 10.5v15M38.5 18h15M40.7 12.7l10.6 10.6M40.7 23.3l10.6-10.6" stroke="#ffe6a8" stroke-width="1.6"/>' +
    '<path d="M21 34c0 6 1 11 3 15" fill="none" stroke="#ffc2d0" stroke-width="3" stroke-linecap="round"/>',
  pouch:'<path d="M23 15c3 3 15 3 18 0l-3 7c9 4 16 13 16 22 0 10-9 16-22 16S10 54 10 44c0-9 7-18 16-22z" fill="#c48a52" stroke="#5e3a1c" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M23 22c6 2.4 12 2.4 18 0" fill="none" stroke="#5e3a1c" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M27 12c-4-6 2-8.5 5-3 3-5.5 9-3 5 3" fill="none" stroke="#5e3a1c" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M19 39c0 5 3 9 7 11" fill="none" stroke="#e6b98a" stroke-width="3.5" stroke-linecap="round"/>',
};
/* (the gradient's id made the picture's own, so two of them on a page never borrow each other's) */
let _boostSvgN = 0;
function boostSvg(id, px, cls){
  const n = ++_boostSvgN, body = (BOOST_SVG[id] || '').replace(/pbFm/g, 'pbFm' + n);
  return `<svg class="boost-ic${cls ? ' ' + cls : ''}" viewBox="0 0 64 64" width="${px}" height="${px}" aria-hidden="true" focusable="false">${body}</svg>`;
}
function boostIcon(id, px){ return boostSvg(id, px || 20); }
if(typeof DRAWN_SYMBOLS !== 'undefined' && typeof drawnSvg === 'function'){
  Object.keys(PEACE_SYM).forEach(id=>{ DRAWN_SYMBOLS[PEACE_SYM[id]] = drawnSvg('boost-' + id, (BOOST_SVG[id] || '').replace(/pbFm/g, 'pbFmSym')); });
}
if(typeof STATUS_KIND !== 'undefined') ['fireMote', 'springWater', 'fruitPunch'].forEach(k=> STATUS_KIND[k] = 'buff');
if(typeof STATUS_LABELS !== 'undefined'){
  STATUS_LABELS.fireMote = PEACE_SYM.fireMote + ' Fire Mote';
  STATUS_LABELS.springWater = PEACE_SYM.springWater + ' Spring Water';
  STATUS_LABELS.fruitPunch = PEACE_SYM.fruitPunch + ' Fruit Punch';
}

/* ---------- in a fight ---------- */
/* the Item button stands where Flee was: in a fight that cannot be fled (as it began: not a Fiery Jaws's hold), once
   the tribes have their stalls (or you hold one) — never the Test Arena's */
function boostItemOn(b){
  if(!b || b.arena || b.arenaChallenge) return false;
  const shut = b.noFleeBase != null ? b.noFleeBase : b.noFlee;
  return !!shut && boostsKnown();
}
function boostItemBtnHtml(b, canAct){
  peaceCss();
  const left = Math.max(0, BOOST.perBattle - (b.boostsUsed || 0));
  return `<button class="side-btn item-btn" id="itemBtn" ${canAct ? '' : 'disabled'} title="Boosts: ${left} of ${BOOST.perBattle} left this fight">${boostSvg('pouch', 17, 'item-ic')} Item</button>`;
}
function boostSheetOpen(){
  const b = ui.battle;
  if(!b || (b.phase || 'player') !== 'player' || document.querySelector('.boost-sheet')) return;
  peaceCss();
  const used = b.boostsUsed || 0, full = used >= BOOST.perBattle;
  const scrim = document.createElement('div');
  scrim.className = 'boost-sheet';
  scrim.innerHTML = `<div class="boost-card" role="dialog" aria-label="Boosts">
      <div class="boost-head">${boostSvg('pouch', 26)} <b>Boosts</b><span>${full ? `Both used this fight` : `${BOOST.perBattle - used} of ${BOOST.perBattle} left this fight`}</span></div>
      ${BOOSTS.map(x=>{
        const n = boostCount(x.id), ok = n > 0 && !full;
        return `<button class="boost-opt${ok ? '' : ' off'}" data-b="${x.id}" ${ok ? '' : 'disabled'}>
          <span class="boost-opt-ic">${boostIcon(x.id, 36)}</span>
          <span class="boost-opt-tx"><b>${escapeHtml(x.name)} <i>×${n}</i></b><small>${escapeHtml(boostDesc(x.id))}</small></span></button>`; }).join('')}
      ${BOOSTS.every(x=> !boostCount(x.id)) ? `<div class="boost-none">None in your bag. The tribes sell them at two of the castle market's stalls, for a silver medal each.</div>` : ''}
      <button class="btn btn-ghost" id="boostCancel">Cancel</button></div>`;
  document.body.appendChild(scrim);
  const close = ()=> scrim.remove();
  scrim.addEventListener('click', e=>{ if(e.target === scrim) close(); });
  scrim.querySelector('#boostCancel').addEventListener('click', close);
  scrim.querySelectorAll('.boost-opt[data-b]:not([disabled])').forEach(el=> el.addEventListener('click', ()=>{ close(); boostUse(el.dataset.b); }));
}
/* used: at once, free (the turn is kept, as after a switch); never more than two a fight */
function boostUse(id){
  const b = ui.battle, def = boostDef(id);
  if(!b || !def || (b.phase || 'player') !== 'player') return false;
  if((b.boostsUsed || 0) >= BOOST.perBattle || boostCount(id) <= 0) return false;
  boostAdd(id, -1);
  b.boostsUsed = (b.boostsUsed || 0) + 1;
  const keep = { unsweepable:true, state:true, noDust:true, by:'player', boost:true };   // never swept, stolen or held open
  let say = '';
  if(id === 'fireMote'){
    setPStatus(0, Object.assign({ type:'fireMote', turnsLeft:BOOST.turns, atk:BOOST.atk }, keep));
    say = `${PEACE_SYM.fireMote} <b>Fire Mote!</b> Your whole team's ATK +${Math.round(BOOST.atk * 100)}% for ${BOOST.turns} turns.`;
  } else if(id === 'springWater'){
    setPStatus(0, Object.assign({ type:'springWater', turnsLeft:BOOST.turns }, keep));
    const burnt = typeof purgeMarks === 'function' ? purgeMarks('player', 1) : [];
    say = `${PEACE_SYM.springWater} <b>Spring Water!</b> ` + (burnt.length ? `It washes ${burnt.join(' and ')} off your side` : `Nothing clings to your side yet`) + ` — and will wash one more away each turn.`;
  } else if(id === 'slateShield'){
    const atk = Math.max(1, ...battleParty().filter(m=> m.currentHp > 0).map(m=> monAtk(m)));
    grantTeamBlock('player', BOOST.shields, atk);
    const tb = teamBlock('player'); tb.fixed = (tb.fixed || 0) + BOOST.shields;   // (04-battle.js: no sweep takes these)
    say = `${PEACE_SYM.slateShield} <b>Slate Shield!</b> ${BOOST.shields} shields for your whole team.`;
  } else if(id === 'fruitPunch'){
    const amount = boostHealAmount();
    setPStatus(0, Object.assign({ type:'fruitPunch', turnsLeft:BOOST.turns, amount }, keep));
    const poured = boostPour(amount);
    say = `${PEACE_SYM.fruitPunch} <b>Fruit Punch!</b> ` + (poured || `Everyone is well already — there will be more each turn.`);
  }
  if(typeof logBattle === 'function') logBattle(`🎒 Boost: ${def.name} (${b.boostsUsed}/${BOOST.perBattle} this fight)`);
  peacePowerUp();                                                           // (4.37) every boost's (until 4.37 'power_up' — the level-up's fanfare stood in — or a stone's)
  renderBattle();
  battleMsg(say);
  saveProfile();
  return true;
}
/* Fruit Punch's health: those out front first, the most hurt first; what is left to the most hurt of the rest; until
   it is all poured (a fainted one is not woken) */
function boostPour(amount){
  let left = Math.max(0, Math.round(amount || 0));
  if(!left || !ui.battle) return '';
  const hurt = list=> list.filter(m=> m && m.currentHp > 0 && m.currentHp < monMaxHp(m) && !(typeof isPassenger === 'function' && isPassenger(m)))
    .sort((a, c)=> a.currentHp / monMaxHp(a) - c.currentHp / monMaxHp(c));
  const field = livingField().filter(m=> !(typeof isAllyMon === 'function' && isAllyMon(m)));
  const rest = (typeof healableAllies === 'function' ? healableAllies() : battleParty()).filter(m=> !field.includes(m));
  const got = [];
  hurt(field).concat(hurt(rest)).forEach(m=>{
    if(left <= 0) return;
    const max = monMaxHp(m), before = m.currentHp, give = Math.min(left, max - before);
    if(give <= 0) return;
    m.currentHp = before + give; left -= give;
    if(playerField().includes(m)) drainHp(pid('playerHp', m), before, m.currentHp, max);
    got.push(`${escapeHtml(displayName(m))} <b>+${give}</b>`);
  });
  return got.length ? `${got.join(', ')}.` : '';
}
/* the start of every turn: Spring Water washes one more away, Fruit Punch pours again (04-battle.js asks, with the Ice
   Barrier's melt) — until their turns run out (tickStatuses) */
function boostPulse(){
  if(!ui.battle) return '';
  const out = [];
  const sw = getPStatus(0, 'springWater');
  if(sw){ const burnt = purgeMarks('player', 1); if(burnt.length) out.push(`${PEACE_SYM.springWater} Spring Water washes ${burnt.join(' and ')} off your side.`); }
  const fp = getPStatus(0, 'fruitPunch');
  if(fp){ const poured = boostPour(fp.amount); if(poured) out.push(`${PEACE_SYM.fruitPunch} Fruit Punch: ${poured}`); }
  if(out.length) renderStatusBadges();
  return out.join(' ');
}
/* Fire Mote's share of a monster's ATK (04-battle.js's monAtk: added, as Nourish is) */
function boostAtkBonus(m, base){
  if(!ui.battle || !m || !m.uid) return 0;
  const st = getPStatus(0, 'fireMote');
  return st ? Math.round(base * (st.atk || BOOST.atk)) : 0;
}
/* a boost's pill: its own picture */
if(typeof symbolizePills === 'function'){
  const _peaceSym = symbolizePills;
  symbolizePills = function(root){
    _peaceSym.apply(this, arguments);
    if(!root) return;
    peaceCss();
    ['fireMote', 'springWater', 'fruitPunch'].forEach(id=> root.querySelectorAll(`.status-pill.sym[data-st="${id}"]`).forEach(el=>{
      if(el.querySelector('.boost-ic')) return;
      const sub = el.querySelector('sub');
      el.innerHTML = boostSvg(id, 18);
      if(sub) el.appendChild(sub);
    }));
  };
}

/* ---------- the stall ---------- */
function peaceShopOpen(side, who){
  if(!peaceDone() || ui.caTalk || document.querySelector('.ca-shop')) return;
  releaseKeys();
  caCss(); peaceCss();
  const S = PEACE_STALLS[side], ov = document.createElement('div');
  ov.className = 'ca-shop peace-shop';
  const vendor = who || S.tribes[0];
  const draw = said=>{
    const m = state.medals || {};
    ov.innerHTML = `<div class="ca-shop-card">
      <div class="ca-shop-head"><div class="ca-shop-faces">${S.tribes.map(k=> caFace('vend' + k)).join('')}</div>
        <div class="ca-shop-say"><b>The ${peaceTribe(S.tribes[0])} and ${peaceTribe(S.tribes[1])} Tribes’ stall</b><br>${said || boostDef(BOOST_OF[vendor]).say}</div></div>
      <div class="ca-shop-purse"><span>${medalIcon('silver')} ${m.silver || 0}</span><span class="peace-bagline">${boostSvg('pouch', 18)} Ten of each at most</span></div>
      <div class="ca-wares">${S.tribes.map(k=>{
        const id = BOOST_OF[k], d = boostDef(id), n = boostCount(id), full = n >= BOOST.max, can = !full && medalCount(BOOST.cur) >= BOOST.cost;
        return `<button class="ca-ware${full ? ' gone' : (can ? '' : ' cant')}" data-b="${id}" ${full ? 'disabled' : ''}>
          <span class="ca-ware-ic">${boostIcon(id, 40)}</span>
          <span class="ca-ware-nm">${escapeHtml(d.name)}</span>
          <span class="ca-ware-pr">${full ? 'Your bag holds ten' : `${curIcon(BOOST.cur)} ${BOOST.cost}`}</span>
          <span class="ca-ware-ds">${escapeHtml(boostDesc(id))} <b>You have ${n} of ${BOOST.max}.</b></span>
        </button>`; }).join('')}</div>
      <div class="peace-shop-note">For the fights you cannot flee: the Item button stands where Flee was. Two boosts a fight; using one does not use up your turn, and no foe can sweep it away.</div>
      <button class="btn btn-ghost" id="caShopClose">Leave</button></div>`;
    ov.querySelector('#caShopClose').addEventListener('click', ()=> ov.remove());
    ov.querySelectorAll('.ca-ware[data-b]:not([disabled])').forEach(el=> el.addEventListener('click', ()=> peaceBuy(el.dataset.b, draw)));
  };
  document.body.appendChild(ov);
  draw();
}
async function peaceBuy(id, draw){
  const d = boostDef(id);
  if(!d || boostCount(id) >= BOOST.max) return;
  if(medalCount(BOOST.cur) < BOOST.cost){ draw(`<i>"Oh! That's a silver medal, friend — and your purse is empty."</i>`); return; }
  const snap = { medals:Object.assign({}, state.medals), boosts:Object.assign({}, boostBag()) };
  const undo = ()=>{ state.medals = snap.medals; state.inventory.boosts = snap.boosts; };
  await spend(BOOST.cur, BOOST.cost);
  boostAdd(id, 1);
  const sv = typeof showSyncingOverlay === 'function' ? showSyncingOverlay('Syncing…') : null;
  const ok = await saveProfile({ awaitCloud:true });
  if(sv) hideSyncingOverlay(sv);
  if(!ok){ undo(); if(typeof showSyncFailure === 'function') showSyncFailure(); draw(); return; }
  try { playSfx('stone_low'); } catch(e){}
  draw(`<i>"One ${d.name} — there you go! Use it well."</i>`);
}

/* ---------- in your bag (the Items page) ---------- */
function boostWalletHtml(){
  if(!boostsKnown()) return '';
  peaceCss();
  const chip = x=>{ const n = boostCount(x.id); return `<div class="wal-chip${n ? '' : ' none'}"><span class="wal-ic">${boostIcon(x.id, 22)}</span><b>${n}</b><small>${escapeHtml(x.name)}</small></div>`; };
  return `<div class="wal-head">Boosts <span>ten of each at most · two a fight, from the Item button in a fight you cannot flee</span></div>
    <div class="wal-row">${BOOSTS.map(chip).join('')}</div>`;
}

/* ============================================================
   THE JUNGLE: visitors in the villages, a guardian or an ancestor at another's lodge
   ============================================================ */
/* where a visiting notable stands: a guardian beside the host's (right of its two squares), an ancestor left of the
   lodge (its own ancestor stands to the right: warSpots) */
function peaceGuestSpot(k, kind){
  const V = jgGround().places.villages[k], L = V.lodge;
  return kind === 'a' ? { x:L.x - 2, y:L.y + 1 } : { x:L.x + 5, y:L.y + L.h };
}
function peaceJungleThings(list){
  PEACE.order.forEach(host=> ['g', 'a'].forEach(kind=>{
    const at = peaceGuestSpot(host, kind);
    const mine = ()=>{ const D = peaceToday(); return peaceDone() && D.host === host && D.visit.charAt(0) === kind ? D.visit : null; };
    list.push({ x:at.x, y:at.y, late:true, cls:'jg-npc peace-guest' + (kind === 'a' ? ' war-anc' : ''), still:true,
      html:()=>{ const id = mine(); if(!id) return ''; return jgMonImg(peaceNotable(id).sprite, WALK_T * (kind === 'a' ? 2.5 : 1.6), false); },
      verb:'Talk', get sub(){ const id = mine(); return id ? peaceNotable(id).name : ''; },
      when:()=> !!mine(),
      act:()=>{ const id = mine(); if(!id) return; const N = peaceNotable(id);
        return jgLines([jgFace(N.sprite)], N.name, [PEACE_LINES.guest[kind](N.k, peaceTribe(host))]); } });
  }));
}
if(typeof jgThings === 'function'){
  /* (20-jungle.js's jgThings asks for riftJungleThings; this rides on it, laid after the finds as they are) */
  if(typeof riftJungleThings === 'function'){
    const _peaceRiftThings = riftJungleThings;
    riftJungleThings = function(list, P){ _peaceRiftThings.apply(this, arguments); peaceJungleThings(list); };
  }
}
/* the visitors: two of another tribe, or two of the castle's people, walking about the village */
const _peaceFolk = { day:null, base:null, list:null };
function peaceVillageFolk(base){
  const out = [], finds = new Set(jgFinds().map(([x, y])=> x + ',' + y)), used = new Set(base.map(f=> f.x + ',' + f.y));
  const d = peaceDay(), P = jgGround().places;
  PEACE.order.forEach((k, ti)=>{
    const V = P.villages[k], R = jgRng((0x9e37 + d * 131 + ti * 977) >>> 0), keep = (typeof _jgFolkKeep !== 'undefined' && _jgFolkKeep[k]) || new Set();
    const g = peaceGuestsAt(k);
    const sprites = g.citizens ? g.citizens.map(c=> (CA_WHO[c] || {}).sprite) : PEACE_WHO[g.tribe];
    const open = (x, y)=> jgVillageAt(x, y) === k && jgTile(x, y) === JG_T.VILLAGE && !keep.has(x + ',' + y) && !used.has(x + ',' + y) && !finds.has(x + ',' + y)
      && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy])=> !used.has((x + dx) + ',' + (y + dy)));
    let n = 0;
    for(let t = 0; n < 2 && t < 400; t++){
      const a = R() * Math.PI * 2, rr = 0.2 + 0.6 * R();
      const x = Math.round(V.cx + Math.cos(a) * V.rx * rr), y = Math.round(V.cy + Math.sin(a) * V.ry * rr);
      if(!open(x, y)) continue;
      const f = { kind:'walk', sprite:sprites[n % sprites.length], x, y, faceR:R() < 0.5, id:'pv' + d + k + n, tribe:k, x0:x, y0:y,
                  visitor:g.citizens ? { citizen:g.citizens[n % g.citizens.length] } : { from:g.tribe } };
      used.add(x + ',' + y); out.push(f);
      if(typeof _jgFolkBy !== 'undefined') _jgFolkBy[f.id] = f;
      n++;
    }
  });
  return out;
}
if(typeof jgFolkAll === 'function'){
  const _peaceFolkAll = jgFolkAll;
  jgFolkAll = function(){
    const base = _peaceFolkAll.apply(this, arguments);
    if(!peaceDone()) return base;
    const d = peaceDay();
    if(_peaceFolk.day !== d || _peaceFolk.base !== base){ _peaceFolk.day = d; _peaceFolk.base = base; _peaceFolk.list = base.concat(peaceVillageFolk(base)); }
    return _peaceFolk.list;
  };
}
if(typeof jgFolkTalk === 'function'){
  const _peaceFolkTalk = jgFolkTalk;
  jgFolkTalk = function(f){
    if(!f || !f.visitor) return _peaceFolkTalk.apply(this, arguments);
    const w = walkState(), p = w.at && w.at[JG_KEY];
    if(p && p.x !== f.x){ f.faceR = p.x > f.x; if(typeof jgFolkPlace === 'function') jgFolkPlace(f); }
    const j = jgState(), key = 'pv_' + (f.visitor.citizen ? 'c' : f.visitor.from);
    j.talk[key] = (j.talk[key] || 0) + 1;
    const set = f.visitor.citizen ? PEACE_LINES.citizens : PEACE_LINES.visit, host = peaceTribe(f.tribe);
    const name = f.visitor.citizen ? ((CA_WHO[f.visitor.citizen] || {}).name || 'A visitor from the castle') : `A ${peaceTribe(f.visitor.from)} Tribe visitor`;
    return jgLines([jgFace(f.sprite + '_front')], name, [set[(j.talk[key] - 1) % set.length](host)]);
  };
}

/* ============================================================
   DRAWN WITH THE CASTLE AND THE JUNGLE
   ============================================================ */
if(typeof invRender === 'function'){
  const _peaceInvRender = invRender;
  invRender = function(key, world){
    const r = _peaceInvRender.apply(this, arguments);
    try { if(key === CA_KEY) peaceStallWares(world); } catch(e){ console.error('peace render:', e); }
    return r;
  };
}

let _peaceCss = false;
function peaceCss(){
  if(_peaceCss || typeof document === 'undefined') return;
  _peaceCss = true;
  const s = document.createElement('style');
  s.id = 'peaceCss';
  s.textContent = `
  /* the guardians' light into the King, and the King warmed by it */
  .peace-beam{ position:absolute; transform-origin:0 50%; pointer-events:none; z-index:72; border-radius:999px; overflow:hidden;
    background:linear-gradient(to bottom, transparent, var(--pc) 20%, #fff 50%, var(--pc) 80%, transparent);
    box-shadow:0 0 12px 4px color-mix(in srgb, var(--pc) 65%, transparent); animation:peaceBeamIn var(--in, .6s) ease-out both; transition:opacity .5s ease; }
  .peace-beam::after{ content:''; position:absolute; inset:0; mix-blend-mode:screen;
    background:repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 16px, rgba(255,255,255,.9) 22px, rgba(255,255,255,0) 28px); background-size:56px 100%;
    animation:peaceFlow .7s linear infinite; }
  .peace-beam.off{ opacity:0; }
  @keyframes peaceBeamIn{ from{ clip-path:inset(0 100% 0 0); opacity:0; } 30%{ opacity:1; } to{ clip-path:inset(0 0 0 0); opacity:1; } }
  @keyframes peaceFlow{ to{ background-position:56px 0; } }
  .walk-ent.peace-healed .ca-art{ filter:drop-shadow(0 0 6px rgba(255,236,150,.95)) drop-shadow(0 0 14px rgba(140,230,160,.6)) brightness(1.08); }
  .peace-spark{ position:absolute; width:7px; height:7px; margin:-3.5px 0 0 -3.5px; border-radius:50%; pointer-events:none; z-index:74;
    background:radial-gradient(circle, #fff 0 35%, var(--pc) 60%, transparent 72%); animation:peaceSpark .9s ease-out both; }
  @keyframes peaceSpark{ from{ transform:translate(0,0) scale(.4); opacity:1; } to{ transform:translate(var(--dx), var(--dy)) scale(1.2); opacity:0; } }
  .peace-stone{ position:absolute; pointer-events:none; z-index:75; filter:drop-shadow(0 0 8px rgba(255,214,120,.95)); }
  .peace-stone img, .peace-stone .ui-icon{ width:100% !important; height:100% !important; }
  /* the wares on the tribes' counters */
  .peace-wares{ position:absolute; pointer-events:none; display:flex; justify-content:space-around; align-items:flex-end; }
  .peace-wares span{ display:inline-flex; align-items:flex-end; gap:1px; filter:drop-shadow(0 2px 1px rgba(40,25,10,.4)); }
  /* the Item button and its sheet */
  .side-btn.item-btn{ display:inline-flex; align-items:center; justify-content:center; gap:6px; }
  .side-btn.item-btn .item-ic{ flex:0 0 auto; }
  .boost-sheet{ position:fixed; inset:0; background:rgba(35,32,25,.55); z-index:70; display:flex; align-items:flex-end; justify-content:center; }
  .boost-card{ background:var(--paper); border-radius:18px 18px 0 0; padding:18px 18px 16px; max-width:480px; width:100%; max-height:86vh; overflow-y:auto; }
  .boost-head{ display:flex; align-items:center; gap:8px; font-family:'Baloo 2',cursive; font-size:18px; margin-bottom:10px; }
  .boost-head span{ margin-left:auto; font-family:'Nunito',sans-serif; font-size:13px; font-weight:700; color:var(--ink-soft); }
  .boost-opt{ display:flex; align-items:center; gap:12px; width:100%; text-align:left; padding:10px 12px; margin-bottom:8px; border-radius:14px;
    border:1.5px solid rgba(35,32,25,.14); background:#fffaf0; color:var(--ink); cursor:pointer; font:inherit; }
  .boost-opt:active{ transform:translateY(1px); }
  .boost-opt.off{ opacity:.45; cursor:default; }
  .boost-opt-tx{ display:flex; flex-direction:column; gap:2px; }
  .boost-opt-tx b{ font-size:15px; } .boost-opt-tx b i{ font-style:normal; color:var(--ink-soft); font-weight:800; margin-left:4px; }
  .boost-opt-tx small{ font-size:12.5px; line-height:1.35; color:var(--ink-soft); }
  .boost-none{ font-size:13px; color:var(--ink-soft); margin:2px 2px 10px; line-height:1.4; }
  .peace-shop .peace-bagline{ display:inline-flex; align-items:center; gap:5px; font-weight:700; }
  .peace-shop-note{ font-size:12.5px; line-height:1.4; color:var(--ink-soft); margin:2px 4px 10px; }
  `;
  document.head.appendChild(s);
}
