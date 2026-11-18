/* ============================================================
   41-the-stand.js — THE STAND AT THE PALACE DOORS (4.58)
   The designer, 2026-11-17: "After the princess has been rescued, and the player heads out, change the order of the
   storyline:
     1. Tribes don't arrive yet. Player comes out atop Lucesco. King and the commander are right outside the palace
        doors. King rallies commander, advisor and Dauphin: contingents of 5 — 4 chestnut knights and the commander on
        the left, 4 duck knights and the advisor on the right, 4 bug knights and the Dauphin to the south — soldier walls
        around the palace entrance with small corner gaps, fending off per side an alien commander, an alien captain
        and 2 aliens.
     2. The King calls the citizens into the palace; he guards the centre; 40 castle fairies (no collision) run in
        through the SW and SE corners into the castle doors. The player is immobile on Lucesco. The King tells the
        princess to go inside; she refuses — she stays with her Papa.
     3. A rallying speech; they close ranks, boxing the player and the King in a 5×5 grid outside the palace doors; the
        commander, the advisor and the Dauphin cry out.
     4. The camera from then on: an 11×11 field centred three tiles below the 5×5's middle.
     5. The King moves to the south wall (the Dauphin's) and fires lasers past them at aliens on the line: commanders
        and captains hit are stunned a few seconds (like a glare), then fight again; normal aliens fade, replaced two
        seconds later. Lucesco says he'll fight too, and tells the player to use glares — glare's cooldown 2 steps here.
        After 3 glares the alien forces thicken to two tiles outside each wall (fading in from outside the field). The
        Dauphin asks if there are more of them; the commander says keep your mind on the fight. Soldiers start falling
        (sprites fall sideways and remain); the advisor says close the gaps; a bug knight cries they're overwhelmed.
     6. The player moves freely in the 5×5 and glares. The King summons his last energies: a pink psychic dome around
        the 5×5, pushing the aliens out.
     7. The King huffs; the contingent begs him not to spend his life force; he stays protective. A screen-shaking
        voice mocks — how valiant, how touching, giving his life for his people: 'Shall I be the one… to finally break
        you?' A prismatic laser from the bottom, offscreen, hits the King with a black and red flash: wounded, off his
        horse, on the floor. The princess: 'Papa!' He weakly tells her to run. The camera pans to Wadjet, south of the
        grid, offscreen: 'Now then, how will you handle this without your king?'
     8. The contingent loses hope. The princess says Papa's will won't be broken; she evolves, rallies everyone, and
        casts a baby-pink glittering dome on the same area; the fallen knights rise and fight.
     9. Pan to Wadjet: 'Curse these stubborn fairies. Let's put an end to this.' He charges another pulsing prismatic
        laser; Lucesco: 'Watch out, Princess!' The camera on Wadjet; as it fires, the camera very rapidly pans back to
        the princess: the dome shatters, but Lucesco intercepts it with his own glare. The screen shakes; the lasers
        sparkle where they meet and pulse more and more violently, held 3 seconds, rising; a flash and a shake; the
        princess thrown back, unharmed. Without the dome the soldiers quickly fall. The Dauphin says she can't last
        much longer.
     10. The tribes arrive and fire beams at Wadjet: knocked down, he resets time and comes back — surprised and
        frustrated that the tribes rallied — then fades. The tribes attack the aliens after their words, and the aliens
        fight back (they don't run). The Dauphin tells Lucesco to go after Wadjet; the princess will take care of her
        father; Lucesco can't wait to get his paws on the one harming his friends."
   (11, the hunt for Wadjet after it, is 42-the-hunt.js.)

   Where: the palace's doors are at (31, 19) on the grounds; the 5×5 before them is x 29–33, y 20–24; the walls stand
   on the squares round it — the Commander's at x 28, the Advisor's at x 34, the Dauphin's at y 25 — their corners
   (28, 25) and (34, 25) the gaps. The aliens fight them from a square outside each wall (x 27, x 35, y 26), and, once
   they thicken, from two (x 26, x 36, y 27). The field the camera keeps from the closing of the ranks: x 26–36,
   y 20–30. Wadjet: on the market's first row, before the fountain, at (31, 32).
   It plays as one scene, on Lucesco's back, with free stretches inside it: in those you move about the 5×5 (and only
   there) and glare with his dial, its Glare quarter alone lit. Left part-way, it begins again from the palace's doors.

   (4.59) The designer, 2026-11-17: "1. Please make sure the Z positions of lower sprites are higher than the Z positions
   of sprites above them … 2. Lucesco should not mention his dial, as it breaks the fourth wall. 3. Please do not mention
   that the aliens do not run this time … 4. Can we have more layers of aliens coming in, please? … 6. After Wadjet's
   voice, pan to him already charging the eraser beam like a black hole over his head, red and purple glowing orbs being
   drawn into its centre. When he fires the laser, increase the shaking effect (make it milder before) and shatter the
   king's psychic dome, not fade it. 7. As the eraser beam hits the king, please prolong the moment and make it shake.
   Throw back the king rapidly against the palace wall as the laser follows his sprite and eventually stops where he
   does, and cause a localised black purple-red flash that leaves the king's dismounted sprite lying on the floor,
   darkened, and with smoke rising from him. 8.–9. [Lucesco's supercharged glare against the second eraser beam:
   43-the-duel.js] 10. Once wadjet gets back up, Lucesco remarks still panting heavily that they must try once more or
   the princess will be in danger. But whalelord warns Lucesco that Lucesco is severely exhausted. However, camera pans
   to Wadjet, and the offscreen voice of fire ancestor tells Wadjet to pick on someone his own size, then four beams fire
   and fry Wadjet like pulsar glare fries aliens. He restores him but cries, 'Argh… who?' Before the camera zooms out,
   revealing the tribal ancestors and forces. Then the usual dialogue you had continues. 11. This time, more tribal
   forces run in. We need at least 2 per tribal species and the guardians rushing into battle, surrounding the alien
   sprites on all sides, pincering them against the castle soldiers."
   So: every actor of the arc stands in front of what is further up the screen (26-invasion.js's invActor: its depth
   from its feet, kept as it moves); the field a square wider each way (13×13), the aliens coming in four layers — a
   square out at the start, two at three glares, three as the knights start to fall (the corners with them), a fourth
   to the south as his last strength is called on; you ride clear before his dome, so he can be flung back past you.
   ============================================================ */
const ST = {
  mid:{ x:31, y:22 }, box:{ x0:29, y0:20, x1:33, y1:24 },
  field:{ x:25, y:19, w:13, h:13 },                                       // (4.59) 13×13, the same middle
  door:{ x:31, y:20 },
  /* (4.59) where the camera goes: on him; the duel (you and him); his beam at the castle; the tribes; the whole battle */
  wadjetCam:{ x:27.5, y:27.5, w:8, h:6.5 }, kingCam:{ x:25.5, y:18.5, w:12, h:13.5 }, duelCam:{ x:24.5, y:20, w:14, h:15.5 },
  wideCam:{ x:23, y:15, w:17, h:20 }, tribesCam:{ x:20, y:27, w:23, h:14 }, battleCam:{ x:21, y:18.5, w:21, h:15 },
  youAside:{ x:33, y:22 }, youDuel:{ x:31, y:23 },                       // (4.59) you, clear of his fall; you, between her and Wadjet
  kingWall:{ x:31, y:20.3 },                                              // (4.59) where the beam throws him: the palace's wall, at the doors
  wadjet:{ x:31, y:32 },                   // (the market's first row, the fountain's crown below him)
  glareSteps:2, glareReach:2,
  stunMs:3000, replaceMs:2000,
  kingEvery:[2200, 3200], kingHold:1100, kingReach:5,
  waitGlares:3,                            // the glares that thicken them; as many again, and he raises his dome
  slowMs:26000,                            // a free stretch with no glare at all this long goes on without them
  fallEvery:2600, fallMax:4,               // their knights falling, once there are more of them: one so often, so many
};
/* the three walls: their leader, their knights, their squares (the leader's in the middle), which way they face */
const ST_WALLS = {
  w:{ who:'commander', lead:'chestnut_knight2_c', size:1.6, knight:'chestnut_knight2', name:'Chestnut Knight', sq:[[28, 20], [28, 21], [28, 22], [28, 23], [28, 24]], out:[-1, 0] },
  e:{ who:'advisor', lead:'fairybird1_c', size:1.35, knight:'duck_knight2', name:'Duck Knight', sq:[[34, 20], [34, 21], [34, 22], [34, 23], [34, 24]], out:[1, 0] },
  s:{ who:'dauphin', lead:'fairy_dauphin2', size:1.55, knight:'bug_knight1', name:'Bug Knight', sq:[[29, 25], [30, 25], [31, 25], [32, 25], [33, 25]], out:[0, 1] },
};
/* who comes at each wall first, at the square outside which of its squares: an alien commander at its leader, a
   captain, two aliens; once they thicken, a second rank two squares out */
const ST_FOES = {
  w:[['commander', 2], ['captain', 0], ['alien', 1], ['alien', 4]],
  e:[['commander', 2], ['captain', 4], ['alien', 0], ['alien', 3]],
  s:[['commander', 2], ['captain', 1], ['alien', 0], ['alien', 4]],
};
const ST_SECOND = { w:[0, 2, 4], e:[1, 2, 3], s:[0, 2, 4] };
/* (4.59) "more layers of aliens coming in": [side, rank (squares out), i (along the wall: 0–4 its five squares; 5 the
   corner row past its end; to the south, -2…6 past either end)] — layer 2 at three glares (the second rank, and the
   first rank's gaps filled), 3 as the knights start to fall (a third rank; the second's gaps; the corners), 4 as the
   King is about to spend himself (a fourth rank to the south; the corners filled out) */
const ST_LAYERS = {
  2:[['w', 2, 0], ['w', 2, 2], ['w', 2, 4], ['e', 2, 1], ['e', 2, 2], ['e', 2, 3], ['s', 2, 0], ['s', 2, 2], ['s', 2, 4], ['w', 1, 3], ['e', 1, 1], ['s', 1, 3]],
  3:[['w', 3, 0], ['w', 3, 1], ['w', 3, 2], ['w', 3, 3], ['w', 3, 4], ['e', 3, 0], ['e', 3, 1], ['e', 3, 2], ['e', 3, 3], ['e', 3, 4],
     ['s', 3, -1], ['s', 3, 0], ['s', 3, 1], ['s', 3, 2], ['s', 3, 3], ['s', 3, 4], ['s', 3, 5],
     ['w', 2, 1], ['w', 2, 3], ['e', 2, 0], ['e', 2, 4], ['s', 2, 1], ['s', 2, 3], ['w', 1, 5], ['e', 1, 5], ['s', 1, -1], ['s', 1, 5]],
  4:[['s', 4, -2], ['s', 4, -1], ['s', 4, 0], ['s', 4, 1], ['s', 4, 2], ['s', 4, 3], ['s', 4, 4], ['s', 4, 5], ['s', 4, 6],
     ['w', 2, 5], ['e', 2, 5], ['s', 2, -1], ['s', 2, 5], ['w', 3, 5], ['e', 3, 5], ['s', 3, -2], ['s', 3, 6]],
};
/* a slot's square: `rank` squares out from wall `side`, at `i` along it */
function stSlot(side, rank, i){
  if(side === 'w') return { x:28 - rank, y:20 + i };
  if(side === 'e') return { x:34 + rank, y:20 + i };
  return { x:29 + i, y:25 + rank };
}
const ST_KINDS = ['alien_insect_physical', 'alien_magnet_electric', 'alien_crocodilian_fire', 'alien_golem_ground', 'alien_gremlin_fairy',
                  'alien_toxic_gas_ghost', 'alien_dolphin_water', 'alien_flower_grass', 'alien_robot_steel', 'alien_grimgate_psychic'];
const ST_FOLK = ['choux_fairy', 'choux_fairy1', 'fairybunny', 'fairybunny1', 'fairybird', 'fairybird1', 'cream_fairy', 'cream_fairy1', 'melody_fairy'];

/* ---------- where the story stands ---------- */
/* (4.58) the stand is due: out of the palace with her, her sister and the Advisor, the new way — the tribes not come yet */
function invStanding(){ return typeof invOn === 'function' && invOn() && invNew() && invAt('escort') && invSaid('sisters') && !invSaid('tribes'); }
function stOn(){ return !!ui.stand; }

/* ============================================================
   THE SCENE
   ============================================================ */
function standGo(){ return invScene(()=> standRun()); }
async function standRun(){
  const v = invState(), w = walkState();
  ui.invClimax = true;                                                  // (her followers and the King's own thing put away)
  const S = ui.stand = { foes:[], men:[], clock:0, last:performance.now(), glareIn:0, glares:0, kingOn:false, kingNext:0, phase:'open', n:0, timers:[], fallen:0, layered:{} };
  stCss();
  if(typeof duelCss === 'function') duelCss();
  if(typeof khStop === 'function') khStop();
  try {
    /* ---- you, out of the doors on his back; she, her sister and the Advisor after you ---- */
    ['invPrin', 'invDau', 'invAdv'].forEach(id=>{ const e = document.getElementById(id); if(e) e.remove(); });
    w.at[CA_KEY] = { x:ST.door.x, y:ST.door.y }; w.face = 'd'; w.faceX = 'l';
    refreshWalk();
    invActor('prin', 'fairy_princess', 30, 20, 1.25);
    invActor('dau', 'fairy_dauphin2', 32, 20, 1.55, { flip:true });
    invActor('adv', 'fairybird1_c', 29, 21, 1.35);
    /* the King on his horse and the Commander, right outside them */
    invActor('king', 'fairy_king_mounted_c', 32, 23, 2.3, { src:'assets/mon/fairy_king_mounted_c_front.png' });
    invActor('cmd', 'chestnut_knight2_c', 30, 23, 1.6, { flip:true });
    /* the square about them: aliens everywhere, closing in */
    stFoesIn(1, true);
    await sceneLook({ x:24.5, y:17.5, w:14, h:13 }, { ms:900 });
    await L([`You come out of the palace doors on Lucesco's back — into the middle of it. There are aliens everywhere, and more of them coming over the walls with every moment. The tribes are nowhere to be seen.`,
             ['king', `Right before the doors, the King wheels his horse round. His light is guttering, but his eyes blaze.<br><br><b>"My little one! Thank the stars—"</b>`],
             ['commander', `<b>"Your Majesty, they're coming from every side! We can't hold the whole square!"</b>`]]);
    /* ---- 1. the walls ---- */
    await L([['king', `<b>"Then we hold these doors. Commander — the left, with four of your Chestnut Knights! Advisor — the right, with the Duck Knights! Daughter — the south, with the Bug Knights!"</b>`],
             ['king', `<b>"Walls of shields, all round the doors. NOW!"</b>`]]);
    await stWallsUp(S);
    await L([`In moments there are three walls of shields round the palace doors, five to a wall — and the aliens hit them. On every side an alien commander, a captain and two more throw themselves at the shields.`]);
    /* ---- 2. his people in ---- */
    await invActorTo('king', ST.mid.x, ST.mid.y, 600);
    await L([['king', `He rides into the middle of the square of shields and lifts his voice over the din.<br><br><b>"My people! To the palace — all of you, NOW! Through the corners — RUN!"</b>`]]);
    await stCitizensIn(S);
    await invActorTo('prin', 30, 22, 400);
    await L([['king', `<b>"You too, little one. Inside, with them. Now."</b>`],
             ['princess', `She shakes her head and holds on to his stirrup with both hands.<br><br><b>"No! I'm staying with you, Papa!"</b>`],
             ['king', `For a moment the King looks as if he will argue. Then he lays his hand on her head.<br><br><b>"…Then stay close to me."</b>`]]);
    /* ---- 3. the ranks closed ---- */
    await L([['king', `<b>"Knights of the Fairy Kingdom! Behind these doors are your mothers and fathers, your sisters, your children. They are counting on you — as I am."</b>`],
             ['king', `<b>"Not one step back. Not one of them gets through. CLOSE RANKS!"</b>`]]);
    await stCloseRanks(S);
    await L([['commander', `<b>"SHIELDS! For the King!"</b>`],
             ['advisor', `<b>"Hoo! Not one feather out of place, Duck Knights — HOLD!"</b>`],
             ['dauphin', `<b>"For Father! For my sister! HAAAH!"</b>`]]);
    /* ---- 4. the field ---- */
    await sceneLook(ST.field, { ms:900, pad:0 });
    /* ---- 5. his lasers; Lucesco's glares ---- */
    await invActorTo('king', 31, 24, 700);
    { const k = document.getElementById('sa-king'); if(k){ k.querySelector('img').src = 'assets/mon/fairy_king_mounted_c_back.png'; } }
    await invActorTo('prin', 30, 24, 400);
    await L([['king', `The King rides up behind his daughter's wall, raises his hand over the Dauphin's shoulder — and violet light leaps from it.`]]);
    S.kingOn = true; S.kingNext = 0;
    await stKingFire(S, true);
    await L([['lion', `<b>"I'm not just going to stand here! I'll fight too — I'll glare at anything that comes at those walls. Get me close to them!"</b>`]]);   // (4.59) no dial: he does not know he has one
    S.phase = 'glare1';
    await stFree(S, ()=> S.glares >= ST.waitGlares);
    /* thicker */
    await stThicken(S);
    await L([['dauphin', `<b>"Are there… are there MORE of them?!"</b>`],
             ['commander', `<b>"Don't count them, Your Highness! Keep your mind on the fight!"</b>`]]);
    S.phase = 'falling'; S.fallNext = S.clock + 1200; S.fallFrom = S.clock;
    await stFree(S, ()=> S.fallen >= 2);
    await L([['advisor', `<b>"Hoo! Close the gaps! CLOSE THE GAPS!"</b>`],
             ['bug', `<b>"There are too many of them! We're being overwhelmed!"</b>`]]);
    /* ---- 6. free in the 5×5; his last strength ---- */
    S.phase = 'glare2'; S.glares2 = S.glares; S.layer4At = S.clock + 4000;
    await stFree(S, ()=> S.glares - S.glares2 >= ST.waitGlares);
    if(!S.layered[4]){ S.layered[4] = true; stLayerIn(S, 4); }
    S.kingOn = false; S.phase = 'dome';
    stClearBeams(S);
    await stRideTo(S, ST.youAside);                                       // (4.59) clear of the line he will be flung along
    await stKingDome(S);
    /* ---- 7. spent; the voice; the Eraser Beam ---- */
    await stKingSpent(S, true);
    await L([['king', `The shimmering pink dome holds. Under it the King sags in his saddle, every breath a heave. The light round him is almost gone.`],
             ['commander', `<b>"Your Majesty, no! You're pouring your life into it!"</b>`],
             ['advisor', `<b>"Hoo— Your Majesty, your life force! Please, you must stop!"</b>`],
             ['dauphin', `<b>"Father, PLEASE!"</b>`],
             ['king', `<b>"…As long as I draw breath… not one of them… touches my people."</b>`]]);
    await stVoice([`<b>"How valiant."</b>`, `<b>"How… touching. The great Fairy King, giving his life for his people, one breath at a time."</b>`, `<b>"Shall I be the one… to finally break you?"</b>`]);
    await stWadjetCharging(S);
    await stEraserKing(S);
    await L([['princess', `<b>"PAPA!"</b>`]]);
    await invActorTo('prin', 30, 20, 500);
    await L([['king', `Smoke curls up off the King where he lies against the palace wall. His eyes flicker open.<br><br><b>"…Run… little one… run…"</b>`]]);
    await sceneLook(ST.wadjetCam, { ms:900 });
    await L([['wadjet', `<b>"Now then… how will you handle this without your King?"</b>`],
             ['lion', `<b>"Wadjet! Nemesis's cobra!"</b>`]]);
    /* ---- 8. her courage ---- */
    await sceneLook(ST.field, { ms:600, pad:0 });
    await L([['knight', `<b>"The King… the King has fallen…"</b>`],
             ['commander', `The Commander's blade drops an inch.<br><br><b>"Your Majesty…"</b>`],
             ['duck', `<b>"It's over. Without the King, it's over…"</b>`]]);
    await L([['princess', `The little princess stands up beside her father. She is shaking from head to toe — and she does not run.<br><br><b>"No. It's NOT over."</b>`],
             ['princess', `<b>"Papa never gave up on any of you. Not once. His will won't be broken — not while I'm here!"</b>`],
             `A light begins to shine from the little princess — brighter, and brighter…`]);
    await stPrincessGrows(S);
    await L([['princess', `<b>"Everyone — get up! Stand with me! For Papa!"</b>`]]);
    await stPrincessDome(S);
    await L([`A dome of soft pink light rises over the doors, glittering. Where it touches the fallen knights, they stir — and one by one they climb back to their feet, and lift their shields.`,
             ['commander', `<b>"You heard her! FOR THE KING!"</b>`]]);
    /* ---- 9. his second beam: Lucesco's glare, supercharged (43-the-duel.js) ---- */
    await stDuel(S);
    await L([['lion', `Lucesco sags under you, his sides heaving.<br><br><b>"We… got him…! We GOT him!"</b>`],
             ['mk', `<b>"On your guard! That Nemesis is more crafty than a serpent."</b>`]]);
    await stWadjetBack(S);
    await L([`The smoke where Wadjet stood stops rising — and flows backwards. Into a shape, into scales, into a hood… and Wadjet is standing there again, not a mark on him.`,
             ['lion', `Lucesco is still panting, his legs shaking under you.<br><br><b>"Then… we hit him again… once more… or the princess…"</b>`],
             ['cuain', `<b>"Lucesco, stop. You have nothing left — I can feel it from here. One more blast like that and it will burn you out completely."</b>`]]);
    /* ---- 10. the tribes ---- */
    await stTribesCome(S);
    v.grown = true; v.nem = true;
    invSay('stood'); invSay('tribes'); invSay('fled');
    await L([['dauphin', `The Dauphin turns to you, blade still up.<br><br><b>"Lucesco! He's running — go after him! You've got his scent!"</b>`],
             ['princess', `<b>"Go! I'll take care of Papa. I won't let go of him — I promise."</b>`],
             ['lion', `Lucesco's lip curls back from his fangs.<br><br><b>"I can't wait to get my paws on the one who's been hurting my friends. Hold on tight!"</b>`]]);
    invSet('chase');
    saveProfile();
    stStop();
    return standAfter();
  } finally {
    stStop();
  }
}
/* the scene left part-way (the app closed, the page left): it begins again from the doors (invSceneDue433) */
function stStop(){
  const S = ui.stand;
  if(!S) return;
  clearInterval(S.iv);
  S.timers.forEach(t=> clearTimeout(t));
  if(S.tap && typeof stTapEnd === 'function') stTapEnd(S, 'abort');
  ui.stand = null;
  document.body.classList.remove('st-free', 'st-tapping');
  document.querySelectorAll('.st-dome, .st-shield, .kh-beam.st-kbeam, .jg-beam.st-lbeam, .st-clash, .st-pbeam, .kh-dustcloud.st-dust, ' +
    '.st-hole, .st-ebeam, .jg-beam.st-rbeam, .st-meet, .st-blast, .st-smoke, .st-bubble, .st-aura, .st-tbeam').forEach(el=> el.remove());
  if(typeof stChargeOff === 'function') stChargeOff();
}

/* ============================================================
   THE PIECES
   ============================================================ */
function stId(S, p){ return p + (S.n++); }
/* a wall's men: its leader in the middle, its knights either side of him — running in from the market */
async function stWallsUp(S){
  const runs = [];
  Object.entries(ST_WALLS).forEach(([side, W])=>{
    W.sq.forEach(([x, y], i)=>{
      const lead = i === 2;
      const id = lead ? { commander:'cmd', advisor:'adv', dauphin:'dau' }[W.who] : stId(S, 'sk');
      const faceR = W.out[0] > 0;
      if(!lead){ invActor(id, W.knight, x + W.out[0] * 2 + (side === 's' ? 0 : 0), y + 6 + i * 0.3, 1.45, { flip:faceR }); const e = document.getElementById('sa-' + id); if(e) e.style.opacity = '0'; }
      const man = { id, side, i, x, y, lead, sp:lead ? W.lead : W.knight, size:lead ? W.size : 1.45, down:false };
      S.men.push(man);
      runs.push(sceneWait(i * 90 + (side === 'e' ? 120 : side === 's' ? 240 : 0)).then(async ()=>{
        if(!lead) invActorIn(id, 200);
        await invActorTo(id, x, y, 650);
        const e = document.getElementById('sa-' + id);
        if(e){ actorFace(e, faceR); e.classList.add('st-man'); }
      }));
    });
  });
  await Promise.all(runs);
  /* the aliens come at them */
  stFoesIn(1, false);
  stDuels(S);
  await sceneWait(400);
}
/* the aliens, at the square outside each wall's (rank 1: a square out; 2: two): `far`, waiting further off */
function stFoesIn(rank, far){
  const S = ui.stand;
  if(!S) return;
  Object.entries(ST_FOES).forEach(([side, list])=>{
    const W = ST_WALLS[side];
    const slots = rank === 1 ? list : ST_SECOND[side].map(i=> ['alien', i]);
    slots.forEach(([kind, i])=>{
      let f = S.foes.find(o=> o.side === side && o.i === i && o.rank === rank);
      const [wx, wy] = W.sq[i], x = wx + W.out[0] * rank, y = wy + W.out[1] * rank;
      const fx = far ? x + W.out[0] * 3 + (side === 's' ? (i - 2) * 0.6 : 0) : x, fy = far ? y + W.out[1] * 3 + (side !== 's' ? 1.5 : 0) : y;
      if(!f){
        const sp = kind === 'commander' ? JG_COMMANDER : kind === 'captain' ? JG_CAPTAIN : ST_KINDS[(S.n + i * 3 + rank) % ST_KINDS.length];
        f = { id:stId(S, 'sf'), side, i, rank, kind, sp, x, y, state:'in' };
        invActor(f.id, sp, fx, fy, kind === 'commander' ? 1.9 : kind === 'captain' ? 1.7 : 1.5, { flip:W.out[0] < 0 });
        const e = document.getElementById('sa-' + f.id); if(e) e.classList.add('inv-band-actor', 'st-foe');
        S.foes.push(f);
      }
      if(!far){ f.state = 'fight'; invActorTo(f.id, x, y, 700); }
    });
  });
}
/* everyone at the walls at it: each alien of the front rank at the man before it (the ranks behind wait their turn) —
   (4.59) one at a corner, at the wall's end man */
function stDuels(S){
  S.foes.forEach(f=>{
    if(f.rank !== 1 || f.state !== 'fight') return;
    const m = S.men.find(o=> o.side === f.side && o.i === Math.max(0, Math.min(4, f.i)));
    if(!m || m.down){ invUnduel([f.id]); return; }
    const e = document.getElementById('sa-' + f.id);
    if(e && !e.classList.contains('inv-lunge')) invDuel(f.id, m.id);
  });
}
/* "40 castle fairies (no collision) run through the SW and SE corners into the castle doors" */
async function stCitizensIn(S){
  const N = 40, all = [];
  for(let i = 0; i < N; i++){
    const west = i % 2 === 0, id = stId(S, 'sc'), sp = ST_FOLK[(i * 7) % ST_FOLK.length];
    const sx = west ? 22 + Math.random() * 5 : 36 + Math.random() * 5, sy = 30 + Math.random() * 3;
    const gap = west ? { x:28, y:25 } : { x:34, y:25 }, inner = west ? { x:29.4, y:24 } : { x:32.6, y:24 };
    all.push(sceneWait(i * 120).then(async ()=>{
      invActor(id, sp, sx, sy, 1.15, { flip:!west });                 // (4.59) in front of what is up the screen, behind what is down it
      const e = document.getElementById('sa-' + id);
      if(e){ e.classList.add('inv-fleeing-run', 'st-folk'); e.style.opacity = '0'; }
      invActorIn(id, 150);
      await stRun(id, [gap, inner, { x:31 + (Math.random() - 0.5) * 0.8, y:20.2 }, { x:31, y:19.4 }], 5.5);
      await invActorFade(id, 160);
    }));
  }
  await Promise.all(all);
}
/* an actor run through points (tiles: where its feet go), at `v` squares a second, straight, without slowing */
async function stRun(id, pts, v){
  const el = document.getElementById('sa-' + id);
  if(!el) return;
  for(const q of pts){
    const s = el._o.w, nx = q.x + 0.5 - s / 2, ny = q.y + 1 - s, d = Math.hypot(nx - el._o.x, ny - el._o.y), ms = Math.max(60, d / v * 1000) * SCENE_SPEED;
    if(Math.abs(nx - el._o.x) > 0.05) actorFace(el, nx > el._o.x);
    el.style.transition = `left ${ms}ms linear, top ${ms}ms linear, opacity .16s ease`;
    void el.offsetWidth;
    el._o.x = nx; el._o.y = ny;
    el.style.left = (nx * WALK_T) + 'px'; el.style.top = (ny * WALK_T) + 'px';   // (4.59) its depth kept by invZTick as it goes
    await new Promise(r=> setTimeout(r, ms));
  }
}
/* "close ranks": the walls lock their shields, the corners closed */
async function stCloseRanks(S){
  const world = $('#walkWorld'), T = WALK_T;
  /* each wall's end men lean into its corner */
  S.men.forEach(m=>{
    const e = document.getElementById('sa-' + m.id);
    if(!e) return;
    const corner = (m.side === 'w' || m.side === 'e') ? (m.i === 4 ? [0, 0.28] : null) : (m.i === 0 ? [-0.28, 0] : m.i === 4 ? [0.28, 0] : null);
    if(corner){ e.style.transition = `left ${400 * SCENE_SPEED}ms ease, top ${400 * SCENE_SPEED}ms ease`; e._o.x += corner[0]; e._o.y += corner[1]; e.style.left = (e._o.x * T) + 'px'; e.style.top = (e._o.y * T) + 'px'; }
  });
  /* a line of light along the shields, round the corners */
  const path = [[28, 19.7], [28, 25.2], [34, 25.2], [34, 19.7]];
  for(let k = 0; k < path.length - 1; k++){
    const [x0, y0] = path[k], [x1, y1] = path[k + 1];
    const el = document.createElement('div');
    el.className = 'st-shield';
    const len = Math.hypot(x1 - x0, y1 - y0) * T, ang = Math.atan2(y1 - y0, x1 - x0);
    el.style.cssText = `left:${(x0 + 0.5) * T}px;top:${(y0 + 0.62) * T}px;width:${len}px;transform:rotate(${ang}rad);z-index:66;--t:${T}px;`;
    world.appendChild(el);
  }
  try { playSfx('stone_high'); } catch(e){}
  sceneShake(300, ms=> 0.04 * (1 - ms / 300));
  await sceneWait(600);
}

/* ---------- the stand's own clock: running only while you are free to move ---------- */
function stTick(){
  const S = ui.stand;
  if(!S) return;
  const now = performance.now(), dt = Math.min(250, now - S.last);
  S.last = now;
  if(ui.screen !== CA_KEY){ return; }
  if(!S.free || ui.caTalk || document.querySelector('.scene-say') || (typeof eyeBreakActive === 'function' && eyeBreakActive())) return;
  S.clock += dt / Math.max(0.02, SCENE_SPEED);
  /* his lasers, every two or three seconds */
  if(S.kingOn && S.clock >= S.kingNext && !S.kingBusy) stKingFire(S, false);
  /* (4.59) more of them: a third layer as the knights start to fall, a fourth soon after his last stretch begins */
  if(S.phase === 'falling' && !S.layered[3] && S.clock >= (S.fallFrom || 0) + 2500){ S.layered[3] = true; stLayerIn(S, 3); }
  if(S.phase === 'glare2' && !S.layered[4] && (S.glares > S.glares2 || S.clock >= (S.layer4At || 0))){ S.layered[4] = true; stLayerIn(S, 4); }
  /* the knights going down, once there are more of them */
  if(S.phase === 'falling' && S.fallen < ST.fallMax && S.clock >= (S.fallNext || 0)){
    S.fallNext = S.clock + ST.fallEvery;
    const up = S.men.filter(m=> !m.down && !m.lead);
    stFall(S, up[Math.floor(Math.random() * up.length)]);
  }
  /* aliens back where theirs fell */
  S.foes.forEach(f=>{ if(f.state === 'gone' && f.back && S.clock >= f.back){ f.back = 0; stReplace(S, f); } });
}
/* a free stretch: you move about the 5×5 on his back and glare, till `done` holds (or a long while with no glare: the
   story goes on without you) */
async function stFree(S, done){
  const w = walkState();
  S.free = true; S.freeFrom = S.clock; S.freeGlares = S.glares;
  if(!S.iv) S.iv = setInterval(stTick, 100);
  document.body.classList.add('st-free');
  ui.sceneRunning = false; w.busy = false;
  w.actSig = null; refreshWalk();
  stHint(S);
  try {
    for(;;){
      if(ui.screen !== CA_KEY || !ui.stand) throw INV_ABORT;
      if(done()) break;
      if(S.glares === S.freeGlares && S.clock - S.freeFrom > ST.slowMs) break;   // (no glare at all: on without them)
      await new Promise(r=> setTimeout(r, 100));
    }
    /* (a glare or a beam of his still going: let it end) */
    for(let i = 0; i < 40 && (S.glaring || S.kingBusy); i++) await new Promise(r=> setTimeout(r, 50));
  } finally {
    S.free = false;
    document.body.classList.remove('st-free');
    ui.sceneRunning = true; w.busy = true; releaseKeys();
    w.actSig = null; refreshWalk();
  }
}
/* a word along the bottom of the map, as his moves say theirs in the jungle */
function stHint(S){
  if(typeof jgTell !== 'function') return;
  const p = caYou();
  const g = p && stGlareTarget(p);
  jgTell(g ? 'Tap <b>Glare</b>!' : 'Ride up to a wall — then tap <b>Glare</b>!', 'glare');
}

/* ---------- the King's lasers: past his daughter's wall, at the ones on the line ---------- */
function stKingAt(){ const e = document.getElementById('sa-king'); if(!e) return null; const o = e._o; return { x:o.x + o.w / 2, y:o.y + o.h, el:e }; }
async function stKingFire(S, first){
  const k = stKingAt();
  if(!k || S.kingBusy) return;
  const ky = k.y - 1;
  const live = S.foes.filter(f=> f.state === 'fight' && Math.hypot(f.x + 0.5 - k.x, f.y - ky) <= ST.kingReach);
  const line = live.filter(f=> f.side === 's');
  const pick = (line.length ? line : live).sort((a, b)=> (a.rank - b.rank) || (Math.abs(a.x + 0.5 - k.x) - Math.abs(b.x + 0.5 - k.x)))[Math.floor(Math.random() * Math.min(2, (line.length ? line : live).length))];
  S.kingNext = S.clock + ST.kingEvery[0] + Math.random() * (ST.kingEvery[1] - ST.kingEvery[0]);
  if(!pick) return;
  S.kingBusy = true;
  const beam = stBeam('kh-beam st-kbeam', k.x + (pick.x + 0.5 > k.x ? 0.18 : -0.18), k.y - 1.62, pick.x + 0.5, pick.y + 0.35, '<i></i><b></b><em></em>');
  k.el.classList.add('st-cast');
  stZap(pick, true);
  await new Promise(r=> setTimeout(r, ST.kingHold * SCENE_SPEED));
  if(beam){ beam.classList.add('out'); setTimeout(()=> beam.remove(), 300); }
  k.el.classList.remove('st-cast');
  stHit(S, pick);
  S.kingBusy = false;
  S.kingShots = (S.kingShots || 0) + 1;
  if(first) await sceneWait(300);
}
/* a beam on the world from (x0, y0) to (x1, y1) (squares) */
function stBeam(cls, x0, y0, x1, y1, inner){
  const world = $('#walkWorld');
  if(!world) return null;
  const T = WALK_T, len = Math.hypot(x1 - x0, y1 - y0) * T, ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
  const b = document.createElement('div');
  b.className = cls;
  b.style.cssText = `left:${(x0 * T).toFixed(1)}px;top:${(y0 * T).toFixed(1)}px;width:${len.toFixed(1)}px;transform:rotate(${ang.toFixed(2)}deg);z-index:${Math.round(14 + Math.max(y0, y1))};`;
  b.innerHTML = inner || '';
  world.appendChild(b);
  return b;
}
function stClearBeams(S){ document.querySelectorAll('.kh-beam.st-kbeam, .jg-beam.st-lbeam').forEach(b=> b.remove()); }
/* under a beam: shaking, crackling, going black; then (an alien) dust, (a captain, a commander) stunned */
function stZap(f, on){
  const e = document.getElementById('sa-' + f.id);
  if(!e) return;
  e.classList.toggle('st-zap', !!on);
  if(on){ f.state = 'zap'; invUnduel([f.id]); stBolts(f, e); }
}
function stBolts(f, e){
  let svg = e.querySelector('.kh-bolts');
  if(!svg){ svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'kh-bolts st-bolts'); svg.setAttribute('viewBox', '0 0 180 180'); svg.setAttribute('aria-hidden', 'true'); e.appendChild(svg); }
  clearTimeout(f._boltT);
  const tick = ()=>{
    if(!svg.isConnected || !(f.state === 'zap' || f.state === 'stun')){ svg.innerHTML = ''; return; }
    const hard = f.state === 'zap', n = hard ? 5 : 1 + Math.floor(Math.random() * 2.4);
    let h = '';
    for(let i = 0; i < n; i++){ const pts = typeof jgBoltPts === 'function' ? jgBoltPts(hard) : ''; h += `<polyline class="g" points="${pts}"></polyline><polyline class="c" points="${pts}"></polyline>`; }
    svg.innerHTML = h;
    f._boltT = setTimeout(tick, hard ? 50 : 80 + Math.random() * 90);
  };
  tick();
}
function stHit(S, f){
  const e = document.getElementById('sa-' + f.id);
  if(e) e.classList.remove('st-zap');
  if(f.kind === 'alien'){
    f.state = 'gone'; f.back = S.clock + ST.replaceMs;
    stDust(f, e);
    S.kills = (S.kills || 0) + 1;
    return;
  }
  /* a captain, a commander: stunned a few seconds, as by a glare — then at it again */
  f.state = 'stun';
  if(e){ e.classList.add('st-stun'); stBolts(f, e); }
  const t = setTimeout(()=>{
    if(!ui.stand || f.state !== 'stun') return;
    f.state = 'fight';
    const el = document.getElementById('sa-' + f.id); if(el) el.classList.remove('st-stun');
    stDuels(S);
  }, ST.stunMs * Math.max(0.05, SCENE_SPEED));
  S.timers.push(t);
  S.stuns = (S.stuns || 0) + 1;
}
/* black as soot, it comes apart: dust on the wind (as the King's hunt's) */
function stDust(f, e){
  const world = $('#walkWorld');
  if(!e || !world) return;
  clearTimeout(f._boltT);
  const svg = e.querySelector('.kh-bolts'); if(svg) svg.remove();
  invUnduel([f.id]);
  e.classList.add('st-dusting');
  const o = e._o, T = WALK_T, cx = o.x + o.w / 2, cy = o.y + o.h * 0.6;
  const box = document.createElement('div');
  box.className = 'kh-dustcloud st-dust';
  box.style.cssText = `left:${cx * T}px;top:${cy * T}px;z-index:${Math.round(12 + o.y + o.h)};`;
  let h = '';
  for(let i = 0; i < 34; i++){
    const dx = (-0.4 + Math.random() * 2.4) * T, dy = (-2 + Math.random() * 1.4) * T, r = 2.5 + Math.random() * 5;
    const sx = (Math.random() - 0.5) * 0.9 * T, sy = (Math.random() - 0.55) * 1.1 * T;
    h += `<i style="left:${sx.toFixed(1)}px;top:${sy.toFixed(1)}px;width:${r.toFixed(1)}px;height:${r.toFixed(1)}px;--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px;animation-delay:${Math.round(Math.random() * 300)}ms;animation-duration:${Math.round(1500 * (0.75 + Math.random() * 0.5))}ms"></i>`;
  }
  box.innerHTML = h;
  world.appendChild(box);
  setTimeout(()=> e.remove(), 1100);
  setTimeout(()=> box.remove(), 2400);
}
/* two seconds on: another of them in its place, out of the field's edge */
function stReplace(S, f){
  const W = ST_WALLS[f.side], { x, y } = stSlot(f.side, f.rank, f.i);
  f.id = stId(S, 'sf'); f.sp = ST_KINDS[(S.n * 3 + f.i + 20) % ST_KINDS.length]; f.state = 'in';
  const fx = x + W.out[0] * 3, fy = y + W.out[1] * 3;
  invActor(f.id, f.sp, fx, fy, 1.5, { flip:W.out[0] < 0 });
  const e = document.getElementById('sa-' + f.id); if(e){ e.classList.add('inv-band-actor', 'st-foe'); e.style.opacity = '0'; }
  invActorIn(f.id, 300);
  invActorTo(f.id, x, y, 650).then(()=>{ if(f.state === 'in'){ f.state = 'fight'; if(ui.stand) stDuels(ui.stand); } });
}
/* "after 3 glares, alien forces thicken to two tiles outside each wall (fade in from outside the field)" — (4.59) the
   second of their layers */
async function stThicken(S){
  S.layered[2] = true;
  stLayerIn(S, 2, true);
  await sceneWait(1300);
  S.thick = true;
}
/* (4.59) a layer of them in: each from four squares beyond its slot, fading in, walking up to it, there to fight */
function stLayerIn(S, n, quiet){
  (ST_LAYERS[n] || []).forEach(([side, rank, i], k)=>{
    if(S.foes.some(f=> f.side === side && f.rank === rank && f.i === i && f.state !== 'gone')) return;
    const at = stSlot(side, rank, i), out = ST_WALLS[side].out;
    const f = { id:stId(S, 'sf'), side, i, rank, kind:'alien', sp:ST_KINDS[(S.n + k * 3 + rank) % ST_KINDS.length], x:at.x, y:at.y, state:'in', layer:n };
    S.foes.push(f);
    invActor(f.id, f.sp, at.x + out[0] * 4, at.y + out[1] * 4, 1.5, { flip:out[0] < 0 });
    const e = document.getElementById('sa-' + f.id); if(e){ e.classList.add('inv-band-actor', 'st-foe'); e.style.opacity = '0'; }
    S.timers.push(setTimeout(()=>{
      if(ui.stand !== S) return;
      invActorIn(f.id, 300);
      invActorTo(f.id, at.x, at.y, 900).then(()=>{ if(ui.stand === S && f.state === 'in'){ f.state = 'fight'; stDuels(S); } });
    }, k * 55 * Math.max(0.05, SCENE_SPEED)));
  });
  if(!quiet && typeof jgTell === 'function') jgTell('More of them pour in!', 'glare');
}
/* (4.59) you, ridden to `to` inside the 5×5 (round the King and his daughter) */
async function stRideTo(S, to){
  const p = caYou();
  if(!p || (p.x === to.x && p.y === to.y)) return;
  const B = ST.box, free = (x, y)=> x >= B.x0 && x <= B.x1 && y >= B.y0 && y <= B.y1 && !caWalkerAt(CA_KEY, x, y);
  const prev = new Map([[p.y * 100 + p.x, null]]), q = [{ x:p.x, y:p.y }];
  let end = null;
  for(let h = 0; h < q.length && !end; h++){
    const c = q[h];
    if(c.x === to.x && c.y === to.y){ end = c; break; }
    for(const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const x = c.x + dx, y = c.y + dy, k = y * 100 + x; if(prev.has(k) || !free(x, y)) continue; prev.set(k, c); q.push({ x, y }); }
  }
  if(!end){ walkState().at[CA_KEY] = { x:to.x, y:to.y }; refreshWalk(); return; }
  const path = [];
  for(let c = end; c && !(c.x === p.x && c.y === p.y); c = prev.get(c.y * 100 + c.x)) path.unshift({ x:c.x, y:c.y });
  await invCaRun(CA_KEY, path, 160);
}
/* a knight goes down: falling over sideways, and staying there */
function stFall(S, m){
  if(!m) return;
  const e = document.getElementById('sa-' + m.id);
  m.down = true; S.fallen++;
  if(e){ e.classList.add('st-down'); sceneActor(m.id, { faint:m.side === 'e' ? -1 : 1 }); }
  const f = S.foes.find(o=> o.side === m.side && o.i === m.i && o.rank === 1);
  if(f) invUnduel([f.id, m.id]);
  try { playSfx('hit_dealt'); } catch(err){}
}
function stRise(S, m){
  const e = document.getElementById('sa-' + m.id);
  m.down = false;
  if(e){ e.classList.remove('st-down'); sceneActor(m.id, { faint:0 }); }
}

/* ---------- Lucesco's glare, on the castle's grounds: his dial, its Glare quarter ---------- */
/* the alien he can glare at from p: two squares any way, the nearest — (4.49) a direction held, that way first */
function stGlareTarget(p, dir){
  const S = ui.stand;
  if(!S || !p) return null;
  const all = S.foes.filter(f=> (f.state === 'fight') && Math.max(Math.abs(f.x - p.x), Math.abs(f.y - p.y)) <= ST.glareReach)
    .map(f=> ({ b:f, d:Math.hypot(f.x - p.x, f.y - p.y) })).sort((a, c)=> a.d - c.d).map(o=> o.b);
  if(typeof jgAim === 'function') return jgAim(p, all, dir, f=> f.kind === 'alien');
  return all[0] || null;
}
async function stGlare(f){
  const S = ui.stand, w = walkState(), p = caYou(), me = $('#walkYou');
  if(!S || !S.free || !p || !me || S.glaring || S.glareIn) return;
  S.glaring = true; w.busy = true;                                      // (still while he fires)
  jgTell(`Lucesco uses <b>Pulsar Glare</b> on ${escapeHtml((SPECIES[f.sp] || {}).name || 'the alien')}!`, 'glare');
  if(f.x !== p.x){ w.faceX = f.x > p.x ? 'r' : 'l'; faceRight(me, w.faceX === 'r'); }
  S.glareIn = ST.glareSteps; S.glares++;
  try { playSfx('timestop'); playSfx('pulsar'); } catch(e){}
  const eyes = me.querySelector('.jg-eyes');
  if(eyes){ eyes.classList.remove('on'); void eyes.offsetWidth; eyes.classList.add('on'); }
  const e = stEyes(), fe = document.getElementById('sa-' + f.id);
  const fo = fe && fe._o, tx = fo ? fo.x + fo.w / 2 : f.x + 0.5, ty = fo ? fo.y + fo.h * 0.58 : f.y + 0.4;
  const beam = e ? stBeam('jg-beam st-lbeam', e.x, e.y, tx, ty, '<i></i><b></b><em></em>') : null;
  stZap(f, true);
  try { await new Promise(r=> setTimeout(r, 700 * Math.max(0.2, SCENE_SPEED))); }
  finally {
    if(beam){ beam.classList.add('out'); setTimeout(()=> beam.remove(), 220); }
    if(eyes) eyes.classList.remove('on');
    if(ui.stand === S){ stHit(S, f); }
    S.glaring = false;
    if(S.free) w.busy = false;
    w.actSig = null; refreshWalk();
  }
}
/* where his eyes are drawn this instant (as 20-jungle.js's jgBeam has it), in squares */
function stEyes(){
  const me = $('#walkYou');
  if(!me || typeof JG_EYES === 'undefined') return null;
  const T = WALK_T, LS = 1.577 * T, lx = 0.5 * T - LS / 2, ly = 0.342 * T - LS / 2;
  const yo = (typeof jgDrawnAt === 'function' && jgDrawnAt(me)) || { x:0, y:0 };
  let ex = lx + JG_EYES.x * LS;
  const ey = ly + JG_EYES.y * LS;
  if(me.classList.contains('face-r')) ex = T - ex;
  return { x:(yo.x + ex) / T, y:(yo.y + ey) / T };
}
/* his dial while the stand goes on: Glare alone (2 steps to recharge, here), his face a word from him */
function stPadState(p){
  const S = ui.stand;
  /* (4.59) the tapping: his Glare alone, lit, every moment of it */
  if(S && S.tap){ const z = { ready:false, lit:false, sub:'', fill:0 }; return { J:false, jump:z, glare:{ ready:true, lit:true, sub:'', fill:0 }, ambush:z, track:Object.assign({ on:false, what:'', pic:'' }, z), talk:{ lit:false } }; }
  const free = !!(S && S.free && p && !S.glaring && !walkState().busy && !ui.caTalk && !document.querySelector('.scene-say'));
  const n = S ? S.glareIn : 0;
  return {
    J:false,
    jump:{ ready:false, lit:false, sub:'', fill:0 },
    glare:{ ready:!n, lit:free && !n && !!stGlareTarget(p), sub:n ? jgSteps(n) : '', fill:n ? 1 - n / ST.glareSteps : 0 },
    ambush:{ ready:false, lit:false, sub:'', fill:0 },
    track:{ ready:false, lit:false, on:false, what:'', pic:'', sub:'', fill:0 },
    talk:{ lit:free },
  };
}
function stPadPress(mv){
  const S = ui.stand, p = caYou();
  if(S && S.tap){ if(mv === 'glare'){ if(typeof jgDialFlash === 'function') jgDialFlash('glare'); stTapPress(S); } return; }   // (4.59) nothing else answers
  if(!S || !S.free || !p || S.glaring || walkState().busy) return;
  if(typeof jgDialFlash === 'function') jgDialFlash(mv);
  if(mv === 'talk') return jgTell(`<b>"Get close to the walls and glare at them!"</b>`);
  if(mv !== 'glare') return jgTell('Not now — use his <b>Glare</b>!');
  if(S.glareIn) return jgTell(`Lucesco's eyes are still dim. ${jgSteps(S.glareIn)} to go.`);
  const f = stGlareTarget(p, walkHeldDir());
  if(!f) return jgTell('No alien close enough — ride up to a wall!');
  return stGlare(f);
}
/* (on the castle's deck while it goes on: the dial; its presses and its looks are the stand's) */
const ST_PAD = { dial:true, html:()=>{ if(typeof jgCss === 'function') jgCss(); return jgPadHtml(); }, wire:(box)=> jgPadWire(box), refresh:(box, d, p)=> jgPadRefresh(box, p) };

/* ---------- 6. his last strength: a pink psychic dome over the 5×5 and its walls, the aliens thrown out of it ---------- */
async function stDomeEl(cls){
  const world = $('#walkWorld'), T = WALK_T;
  if(!world) return null;
  const d = document.createElement('div');
  d.className = 'st-dome ' + cls;
  /* round the box and its walls: x 28–34, y 19–25 (in squares, their middle at 31.5, 22.6) */
  d.style.cssText = `left:${27.1 * T}px;top:${18.4 * T}px;width:${8.8 * T}px;height:${8.4 * T}px;z-index:70;--t:${T}px;`;
  d.innerHTML = '<i class="sd-glass"></i><i class="sd-rim"></i><i class="sd-shine"></i>' + (cls === 'st-dome-pink' ? Array.from({ length:26 }, (_, i)=> `<b style="left:${(8 + Math.random() * 84).toFixed(1)}%;top:${(8 + Math.random() * 80).toFixed(1)}%;animation-delay:${(Math.random() * 2.4).toFixed(2)}s;--s:${(0.5 + Math.random() * 0.9).toFixed(2)}"></b>`).join('') : '');
  world.appendChild(d);
  void d.offsetWidth;
  d.classList.add('up');
  return d;
}
async function stKingDome(S){
  const k = stKingAt();
  await L([['king', `The King lifts both hands. The violet light round him flares — not from his hands this time, but from all of him at once, as if he were burning.<br><br><b>"ENOUGH!"</b>`]]);
  if(k){ k.el.classList.add('st-cast'); invShockwave(k.x, k.y - 1.2, 'violet'); }
  try { playSfx('core_blast'); } catch(e){}
  sceneShake(900, ms=> 0.09 * (1 - ms / 900));
  S.dome = await stDomeEl('st-dome-king');
  await sceneWait(350);
  stPushOut(S);
  await sceneWait(900);
  if(k) k.el.classList.remove('st-cast');
  await L([`A dome of pink psychic light springs up over the doors and all three walls — and every alien inside its edge is flung back out of it.`]);
}
/* every alien thrown back out of the dome: two squares further off, reeling */
function stPushOut(S){
  S.foes.forEach(f=>{
    if(f.state === 'gone') return;
    const W = ST_WALLS[f.side], e = document.getElementById('sa-' + f.id);
    if(!e) return;
    invUnduel([f.id]);
    f.state = 'pushed';
    const o = e._o, nx = o.x + W.out[0] * 2.2, ny = o.y + W.out[1] * 2.2;
    e.classList.add('st-reel');
    sceneHop(f.id, nx, ny, 0.5, 520);
  });
  S.men.forEach(m=>{ const e = document.getElementById('sa-' + m.id); if(e) invUnduel([m.id]); });
}
/* back at the walls (the dome gone): each to its square, at it again */
function stSurge(S){
  S.foes.forEach(f=>{
    if(f.state === 'gone') return;
    const e = document.getElementById('sa-' + f.id);
    if(e) e.classList.remove('st-reel', 'st-stun', 'st-zap');
    f.state = 'in';
    invActorTo(f.id, f.x, f.y, 500).then(()=>{ if(ui.stand && f.state === 'in'){ f.state = 'fight'; stDuels(S); } });
  });
}
/* spent: bowed in the saddle, a shadow over his head (the King's hunt's) */
async function stKingSpent(S, on){
  const k = stKingAt();
  if(k){ k.el.classList.toggle('st-spent', !!on); k.el.querySelector('img').src = 'assets/mon/fairy_king_mounted_c_front.png'; }
  await sceneWait(500);
}
/* "a screen-shaking voice": the lines, the screen shaking under each — (4.59) milder: the beam's is the big one */
async function stVoice(lines){
  for(const l of lines){
    let shaking = true;
    (async ()=>{ while(shaking && ui.stand){ await sceneShake(700, ms=> 0.018 + 0.01 * Math.sin(ms / 90)); } })();
    try { await L([['voice', l]]); } finally { shaking = false; }
  }
}
/* (4.59) "pan to him already charging the eraser beam like a black hole over his head, red and purple glowing orbs being
   drawn into its centre": he is there, south of it all, before the fountain — the dark already opening over him */
async function stWadjetCharging(S){
  if(!document.getElementById('sa-wadjet')) invActor('wadjet', WADJET, ST.wadjet.x, ST.wadjet.y, 2.4);
  const H = stHoleAt();
  stHole('stHole', H.x, H.y, 0.45);
  try { playSfx('timestop'); } catch(e){}
  await sceneLook(ST.wadjetCam, { ms:1000 });
  stHoleSize('stHole', 1.3);
  await sceneWait(1500);
}
/* (4.59) "When he fires the laser, increase the shaking effect … and shatter the king's psychic dome, not fade it. As the
   eraser beam hits the king, please prolong the moment and make it shake. Throw back the king rapidly against the palace
   wall as the laser follows his sprite and eventually stops where he does, and cause a localised black purple-red flash
   that leaves the king's dismounted sprite lying on the floor, darkened, and with smoke rising from him." */
async function stEraserKing(S){
  const k = stKingAt(), H = stHoleAt();
  if(!k) return;
  try { playSfx('core_blast'); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  stHoleGone('stHole', 900);
  sceneShake(1100, ms=> 0.24 * (1 - ms / 1100));
  /* the camera back up to him, very fast, the beam already on its way */
  const look = sceneLook(ST.kingCam, { ms:220 });
  const hit = ()=>{ const kk = stKingAt(); return kk ? { x:kk.x, y:kk.y - 1.25 } : { x:31.5, y:22.8 }; };
  let h = hit();
  const beam = stEBeam(H.x, H.y, h.x, h.y, {});
  await look;
  /* the dome in its way: shattered */
  if(S.dome){ stShatter(S.dome); S.dome = null; S.shattered = (S.shattered || 0) + 1; try { playSfx('stone_high'); } catch(e){} }
  /* held on him: he shakes in it — (4.61) harder, and longer, the eraser's aura pulsing on him */
  stKingSpent(S, false);
  k.el.classList.add('st-erased');
  const aura = stEraseAura(h.x, h.y, 2.4);
  await sceneShake(1800, ms=> ERASE_HIT.shake.base + 0.02 + ERASE_HIT.shake.pulse * Math.abs(Math.sin(ms / 55)));
  /* flung back against the palace wall, the beam and its aura after him all the way */
  await stThrowKing(beam, H, ST.kingWall, 360, aura);
  /* the wall: (4.61) the blasts, eight of them, the biggest first — the shadow-steed gone to smoke at it */
  const ke = document.getElementById('sa-king'), o = ke ? Object.assign({}, ke._o) : { x:30.35, y:18.0, w:2.3, h:2.3 };
  const at = { x:o.x + o.w / 2, y:o.y + o.h * 0.55 }, plan = stEraseBoomPlan(8), end = plan[plan.length - 1] + ERASE_HIT.after;
  stAuraAt(aura, at.x, at.y);
  const shaking = sceneShake(end, stEraseAmp(0, plan, end));
  const booms = stEraseBooms(at.x, at.y, 3, plan, null, sceneWait, 0.55);
  if(ke){ ke.classList.remove('st-erased', 'st-cast'); ke.classList.add('st-steed-gone'); setTimeout(()=> ke.remove(), 1000 * Math.max(0.2, SCENE_SPEED)); ke.id = 'sa-kingSteed'; }
  /* the King himself, down on the stones where he fell: dark, smoke rising off him */
  const fx = Math.round(o.x + o.w / 2 - 0.5), fy = Math.round(o.y + o.h - 1);
  invActor('king', 'fairy_king_c', fx, fy, 1.75, { faint:1 });
  const kd = document.getElementById('sa-king'); if(kd) kd.classList.add('inv-hurt', 'st-burnt');
  stSmoke('stKingSmoke', fx + 0.5, fy + 0.55, 12 + fy);
  S.kingDown = true;
  await booms;
  stAuraOut(aura);
  stBeamOut(beam);
  await shaking;
  /* the aliens: at it again */
  stSurge(S);
  await sceneWait(700);
}
/* the King in the beam's grip, thrown back to `to` (his feet) in ms: fast, then slammed to a stop — its end after him */
function stThrowKing(beam, H, to, ms, aura){
  const ke = document.getElementById('sa-king');
  if(!ke) return Promise.resolve();
  const o = ke._o, x0 = o.x, y0 = o.y, x1 = to.x + 0.5 - o.w / 2, y1 = to.y + 1 - o.h;
  const dur = Math.max(1, ms * SCENE_SPEED), t0 = performance.now();
  ke.style.transition = 'none';
  return new Promise(done=>{
    const frame = now=>{
      const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
      const x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e;
      ke.style.left = (x * WALK_T) + 'px'; ke.style.top = (y * WALK_T) + 'px';
      if(beam) stBeamSet(beam, H.x, H.y, x + o.w / 2, y + o.h * 0.45);
      if(aura) stAuraAt(aura, x + o.w / 2, y + o.h * 0.45);
      if(t < 1) requestAnimationFrame(frame);
      else { o.x = x1; o.y = y1; done(); }
    };
    requestAnimationFrame(frame);
  });
}
/* 8. her courage: she evolves */
async function stPrincessGrows(S){
  const pe = document.getElementById('sa-prin');
  if(pe){ const o = pe._o; sceneGlow('prinGlow', o.x + o.w / 2, o.y + o.h * 0.6, 3); }
  await sceneWait(600);
  await new Promise(done=> playEvolutions([{ species:'fairy_princess', name:'The Little Princess', stageFrom:0, stageTo:1, newMoves:[], from:99, to:INV.princessLv,
    headline:`<b>The Little Princess</b> found her courage!`, note:`Lv ${INV.princessLv}` }], done));
  invState().grown = true; saveProfile();
  await sceneGlowOut(['prinGlow'], 300);
  sceneActor('prin', { src:invSrc('fairy_princess1') });
  { const pe2 = document.getElementById('sa-prin'); if(pe2){ const s = 1.65, o = pe2._o; sceneActor('prin', { x:o.x + (o.w - s) / 2, y:o.y + (o.h - s), w:s, h:s }); pe2.classList.add('inv-princess-glow'); } }
}
/* her dome: baby pink, glittering — and her light through it lifts the fallen */
async function stPrincessDome(S){
  const burst = invGlitterBurst('sa-prin');
  await sceneWait(500);
  S.dome = await stDomeEl('st-dome-pink');
  await burst;
  S.men.filter(m=> m.down).forEach(m=> stRise(S, m));
  stDuels(S);
  S.risen = true;
}
/* (4.59) 9. "Curse these stubborn fairies" — his second beam; Lucesco's glare, supercharged with your monsters' cores
   (the tapping: 43-the-duel.js). Lost — out of time, or his beam home — the castle or Lucesco in a black blast, and it
   is all to do again from his charging */
async function stDuel(S){
  await sceneLook(ST.wadjetCam, { ms:900 });
  await L([['wadjet', `<b>"Curse these stubborn fairies. Let's put an end to this."</b>`]]);
  for(let tries = 0; ; tries++){
    if(tries) await sceneLook(ST.wadjetCam, { ms:500 });
    const H = stHoleAt();
    stHole('stHole', H.x, H.y, 0.4);
    try { playSfx('timestop'); } catch(e){}
    await sceneWait(250);
    stHoleSize('stHole', 1.05);
    await sceneWait(900);
    if(!tries) await stRideTo(S, ST.youDuel);
    walkState().faceX = 'l'; refreshWalk();
    await sceneLook(ST.duelCam, { ms:700, pad:0 });
    await L([['lion', tries ? `<b>"He's at it again! Lend me your strength — everything your monsters have got!"</b>`
                            : `<b>"He's charging another one — and the princess is right in its path! Lend me your strength — the power in your monsters' cores! I'll pour it all into my glare!"</b>`]]);
    /* the charge: thirty, before he fires */
    stTapHint(`Tap <b>Glare</b> as fast as you can!`);
    stChargeGlow(0.04);
    const charging = stTapGame(S, 'charge');
    stHand(true);                                                         // (the hand on his Glare, pressing it, till you do)
    const charged = await charging;
    if(charged === 'abort') throw INV_ABORT;
    if(!charged){ await stChargeLost(S); await stGameOver(S); continue; }
    /* fired: his glare at Wadjet — Wadjet's beam at him — and they meet halfway */
    await stDuelFire(S);
    stTapHint(`Keep tapping <b>Glare</b>!`);
    const won = await stTapGame(S, 'clash');
    if(won === 'abort') throw INV_ABORT;
    if(!won){ await stClashLost(S); await stGameOver(S); continue; }
    await stClashWon(S);
    return;
  }
}
/* the moment the charge is full: both beams out, a flash where they meet, its glow pulsing after */
async function stDuelFire(S){
  const E = stEyes() || { x:31.4, y:22.4 }, H = stHoleAt();
  const mx = (E.x + H.x) / 2, my = (E.y + H.y) / 2;
  try { playSfx('pulsar'); playSfx('core_blast'); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  const eyes = $('#walkYou .jg-eyes');
  if(eyes){ eyes.classList.remove('on'); void eyes.offsetWidth; eyes.classList.add('on', 'st-hold'); }
  const D = S.duel = { E, H, lb:stRBeam(E.x, E.y, mx, my), wb:stEBeam(H.x, H.y, mx, my, {}), cl:stClashEl(mx, my) };
  stHoleSize('stHole', 1.2);
  sceneShake(900, ms=> 0.12 * (1 - ms / 900));
  stChargeGlow(1, true);
  stBubble(`MORE POWER! Keep it coming!`, 1700, true);
  stClashDraw(S, { vd:DUEL.clash.start });
  void D;
  await sceneWait(120);
}
/* out of time: "Look out!" — at the castle, a black blast; then black */
async function stChargeLost(S){
  stChargeOff();
  stBubble(`Look out!`, 1400, true);
  await sceneWait(600);
  await sceneLook(ST.wadjetCam, { ms:450 });
  stHoleSize('stHole', 2.2);
  await sceneWait(500);
  const H = stHoleAt(), aim = { x:31.5, y:17.2 };
  try { playSfx('core_blast'); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  stHoleGone('stHole', 900);
  const look = sceneLook(ST.wideCam, { ms:320 });
  const b = stEBeam(H.x, H.y, aim.x, aim.y, { big:true });
  /* (4.61) it holds on the castle, its aura pulsing there, all of it shaking; then nine blasts across the palace front */
  const hit = stEraseHit(aim.x, aim.y, { r:4.8, boom:5.4, n:9, aura:1300, spread:0.8 });
  await look;
  await hit;
  stBeamOut(b);
}
/* the deadlock lost: his beam home, on Lucesco — a black blast */
async function stClashLost(S){
  const D = S.duel;
  if(D){
    stBeamSet(D.wb, D.H.x, D.H.y, D.E.x, D.E.y);
    stBeamOut(D.lb, 200);
    if(D.cl) D.cl.remove();
  }
  try { playSfx('core_blast'); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  stChargeOff();
  const eyes = $('#walkYou .jg-eyes'); if(eyes) eyes.classList.remove('on', 'st-hold');
  /* (4.61) its aura on him, shaking; then eight blasts round him */
  if(D) await stEraseHit(D.E.x, D.E.y + 0.3, { r:2.6, boom:3.4, n:8, aura:1000, spread:0.6 });
  else await sceneShake(1200, ms=> 0.32 * (1 - ms / 1200));
  if(D) stBeamOut(D.wb);
}
/* "fade to black which holds 3 seconds. Text appears, 'Game over. Try again.' Then, reset to wadjet charging his eraser
   beam and Lucesco asking the player to lend him energy" */
async function stGameOver(S){
  await sceneCurtain(true, 500);
  stDuelClear(S);
  await sceneWait(DUEL.blackMs);
  await sceneCurtainText('Game over. Try again.', 500);
  await sceneWait(DUEL.overMs);
  await sceneCurtainText('', 300);
  S.overs = (S.overs || 0) + 1;
  await sceneCurtain(false, 600);
}
function stDuelClear(S){
  const D = S.duel;
  if(D){ [D.lb, D.wb, D.cl].forEach(e=> e && e.remove()); S.duel = null; }
  document.querySelectorAll('.st-ebeam, .jg-beam.st-rbeam, .st-meet, .st-blast, .st-bubble, .st-hole').forEach(e=> e.remove());
  stChargeOff();
  const eyes = $('#walkYou .jg-eyes'); if(eyes) eyes.classList.remove('on', 'st-hold');
}
/* the deadlock won: his glare all the way home — Wadjet gone in a great blast, smoke where he stood */
async function stClashWon(S){
  const D = S.duel, we = document.getElementById('sa-wadjet'), wo = we && we._o;
  const at = wo ? { x:wo.x + wo.w / 2, y:wo.y + wo.h * 0.55 } : { x:31.5, y:31.5 };
  if(D){
    if(D.cl) D.cl.remove();
    stBeamOut(D.wb, 160);
    stBeamSet(D.lb, D.E.x, D.E.y, at.x, at.y);                           // his glare home
  }
  stHoleGone('stHole', 400);
  stBlast(at.x, at.y, 6.5, 'win');
  S.timers.push(setTimeout(()=> stBlast(at.x - 1.3, at.y + 0.5, 3.4, 'huge'), 160 * Math.max(0.2, SCENE_SPEED)));
  S.timers.push(setTimeout(()=> stBlast(at.x + 1.4, at.y - 0.4, 3.4, 'huge'), 320 * Math.max(0.2, SCENE_SPEED)));
  try { playSfx('core_blast'); playSfx('hit_dealt'); } catch(e){}
  if(typeof buzz === 'function') buzz('ultra');
  sceneShake(1600, ms=> 0.3 * (1 - ms / 1600));
  await sceneWait(260);
  if(we) we.classList.add('st-gone');
  stSmoke('stWadjetSmoke', at.x, at.y + 0.9, Math.round(13 + at.y));
  await sceneWait(1000);
  if(D) stBeamOut(D.lb);
  S.duel = null;
  const eyes = $('#walkYou .jg-eyes'); if(eyes) eyes.classList.remove('on', 'st-hold');
  stChargeOff();
  const me = $('#walkYou'); if(me) me.classList.add('st-pant');
  await sceneWait(500);
}
/* back through time: the smoke flows back into him */
async function stWadjetBack(S){
  await sceneLook(ST.wadjetCam, { ms:700 });
  const we = document.getElementById('sa-wadjet');
  try { playSfx('rewind'); } catch(e){ try { playSfx('timestop'); } catch(e2){} }
  const sm = document.getElementById('stWadjetSmoke'); if(sm) sm.classList.add('back');
  invShockwave(ST.wadjet.x + 0.5, ST.wadjet.y - 0.4, 'violet');
  await sceneWait(500);
  if(sm) sm.remove();
  if(we){ we.classList.remove('st-gone'); we.classList.add('st-rewind'); }
  await sceneWait(600);
  if(we) we.classList.remove('st-rewind');
}
function stShatter(d){
  d.classList.add('shatter', 'out');
  const world = $('#walkWorld'), T = WALK_T;
  if(world){
    for(let i = 0; i < 22; i++){
      const s = document.createElement('i');
      s.className = 'st-shard';
      const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 1.2;
      s.style.cssText = `left:${(31.5 + Math.cos(a) * r * 0.9) * T}px;top:${(22.6 + Math.sin(a) * r * 0.85) * T}px;--dx:${(Math.cos(a) * (1.5 + Math.random() * 2) * T).toFixed(0)}px;--dy:${(Math.sin(a) * (1.5 + Math.random() * 2) * T).toFixed(0)}px;--r:${Math.round(Math.random() * 360)}deg;`;
      world.appendChild(s);
      setTimeout(()=> s.remove(), 1300);
    }
  }
  setTimeout(()=> d.remove(), 700);
}
/* a flash over the whole screen: `cls` its colours */
function stFlash(cls, ms){
  const f = document.createElement('div');
  f.className = 'st-flash ' + cls;
  f.style.animationDuration = Math.round(ms * SCENE_SPEED) + 'ms';
  document.body.appendChild(f);
  setTimeout(()=> f.remove(), ms * SCENE_SPEED + 80);
}
/* 10. (4.59) the tribes: a voice from off the screen — four beams fry him, as a glare fries an alien; he turns time back
   ("Argh… who?") — and the camera out: the ancestors, their guardians and their people round the fountain. Then, as
   before: "The tribes? HERE?" — gone; and (11) every one of them into the battle, round the aliens on every side, pinning
   them against the walls of shields */
const ST_TRIBE_AT = {                                                     // where they stand, round the fountain (x, y): the ancestor, the guardian, the four
  grass:{ anc:[24.5, 35], gd:[23, 36.2], tm:[[21, 33.4], [22.6, 33.6], [21.4, 35.2], [21.8, 37]] },
  earth:{ anc:[26.5, 38.6], gd:[25, 39.6], tm:[[23.4, 38.6], [24.2, 40.4], [27.6, 40.6], [26, 41.2]] },
  water:{ anc:[38.5, 35], gd:[40, 36.2], tm:[[42, 33.4], [40.4, 33.6], [41.6, 35.2], [41.2, 37]] },
  fire: { anc:[36.5, 38.6], gd:[38, 39.6], tm:[[39.6, 38.6], [38.8, 40.4], [35.4, 40.6], [37, 41.2]] },
};
/* (11) where they go: round the aliens on every side — the grass and the water up the west and east, the earth and the
   fire along the south, their guardians at the corners; their ancestors at the back */
const ST_TRIBE_TO = {
  grass:{ anc:[23.5, 31.2], gd:[24, 26.2], tm:[[23.6, 20.6], [23.6, 22.2], [23.6, 23.8], [23.8, 25]] },
  water:{ anc:[39.5, 31.2], gd:[38.8, 26.2], tm:[[38.4, 20.6], [38.4, 22.2], [38.4, 23.8], [38.2, 25]] },
  earth:{ anc:[27, 32.4], gd:[25.4, 29.4], tm:[[26.2, 30.3], [27.6, 30.5], [29, 30.4], [30.4, 30.6]] },
  fire: { anc:[36, 32.4], gd:[37.4, 29.4], tm:[[32.6, 30.6], [34, 30.4], [35.4, 30.5], [36.8, 30.3]] },
};
async function stTribesCome(S){
  /* they are there, south of it all, out of sight: the ancestors, their guardians, two of each of their kinds */
  JG_TRIBE_KEYS.forEach(k=>{
    const A = ST_TRIBE_AT[k], T = JG_TRIBES[k], sp = k === 'earth' ? 'ground' : k, west = A.anc[0] < 31.5;
    invActor('anc' + k, `tribal_ancestor_${k}`, A.anc[0], A.anc[1], 2.4, { flip:west });
    invActor('gd' + k, `tribal_guardian_${sp}`, A.gd[0], A.gd[1], 1.9, { flip:west });
    A.tm.forEach(([x, y], j)=> invActor('tm' + k + j, T.members[j % 2], x, y, 1.3, { flip:west }));
  });
  await sceneLook(ST.wadjetCam, { ms:800 });
  const H = stHoleAt();
  stHole('stHole', H.x, H.y, 0.4);
  await sceneWait(200);
  stHoleSize('stHole', 1);
  await sceneWait(700);
  await L([['firevoice', `<b>"Hey, snake! Pick on someone your own size!"</b>`]]);
  /* four beams, from off the screen, all at him: fried, as a glare fries an alien */
  const col = { grass:'#5be06a', water:'#4db8ff', earth:'#c08a4a', fire:'#ff7a2a' };
  const tgt = { x:ST.wadjet.x + 0.5, y:ST.wadjet.y - 0.6 };
  const beams = JG_TRIBE_KEYS.map(k=>{ const e = document.getElementById('sa-anc' + k), o = e && e._o; if(!o) return null;
    const b = stBeam('st-tbeam', o.x + o.w / 2, o.y + o.h * 0.35, tgt.x, tgt.y, '<i></i>'); if(b){ b.style.setProperty('--c', col[k]); b.style.zIndex = 64; } return b; });
  stHoleGone('stHole', 500);
  try { playSfx('core_blast'); playSfx('pulsar'); } catch(e){}
  sceneShake(1100, ms=> 0.1 * (1 - ms / 1100));
  const we = document.getElementById('sa-wadjet');
  if(we){ we.classList.add('st-zap'); stBolts({ state:'zap' }, we); }
  await sceneWait(1300);
  beams.forEach(b=> b && b.classList.add('out'));
  setTimeout(()=> beams.forEach(b=> b && b.remove()), 400);
  /* and he turns it back: not a mark on him */
  try { playSfx('rewind'); } catch(e){ try { playSfx('timestop'); } catch(e2){} }
  if(we){ we.classList.remove('st-zap'); const bolts = we.querySelector('.kh-bolts'); if(bolts) bolts.remove(); we.classList.add('st-rewind'); }
  invShockwave(ST.wadjet.x + 0.5, ST.wadjet.y - 0.4, 'violet');
  await sceneWait(550);
  if(we) we.classList.remove('st-rewind');
  await L([['wadjet', `<b>"Argh…! Who…?"</b>`]]);
  /* the camera out: the tribes */
  await sceneLook(ST.tribesCam, { ms:1200 });
  await L([`Horns answer him — deep and wild, like nothing from the castle. Round the fountain stand the four tribes: their ancestors, their guardians, and their people, as many as the market will hold.`,
           ['wadjet', `<b>"Hsss… The tribes? HERE? Two hundred years they hated this castle — and they come running the moment it calls?"</b>`],
           ['wadjet', `<b>"…No matter. A king who cannot stand, and a kingdom that will not fall. How very tiresome. We'll finish this another time."</b>`]]);
  if(we){ we.style.transition = `opacity ${900 * SCENE_SPEED}ms ease, filter ${900 * SCENE_SPEED}ms ease`; we.classList.add('st-fade'); }
  await sceneWait(950);
  sceneActorGone('wadjet');
  await L([['g_water', `<b>"The tribes keep their word, Fairy King!"</b>`],
           ['a_earth', `<b>"…Stone… stands… with the castle."</b>`],
           ['a_grass', `<b>"Tag! You're ALL it!"</b>`]]);
  await stTribesCharge(S);
  await L([`The tribes crash into the aliens from every side at once, pinning them against the walls of shields. The aliens wheel round and fight back — claw against blade, all round the palace doors.`]);
}
/* (11) into the battle: each to its place round the aliens, and at the nearest of them */
async function stTribesCharge(S){
  await sceneLook(ST.battleCam, { ms:900, pad:0 });
  try { playSfx('stone_high'); } catch(e){}
  const runs = [], taken = new Set();
  const nearest = (x, y)=>{
    let best = null, bd = Infinity;
    S.foes.forEach(f=>{ if(f.state === 'gone' || taken.has(f.id) || !document.getElementById('sa-' + f.id)) return; const d = Math.hypot(f.x - x, f.y - y); if(d < bd){ bd = d; best = f; } });
    return best;
  };
  JG_TRIBE_KEYS.forEach((k, ti)=>{
    const A = ST_TRIBE_TO[k];
    const go = (id, [x, y], fight, delay)=> runs.push(sceneWait(delay).then(async ()=>{
      if(ui.stand !== S) return;
      await stRun(id, [{ x, y }], 5.5);
      if(!fight || ui.stand !== S) return;
      const f = nearest(x, y);
      if(f && Math.hypot(f.x - x, f.y - y) < 3.2){ taken.add(f.id); actorFaceToward(id, f.x + 0.5); invDuel(f.id, id); }
    }));
    go('anc' + k, A.anc, false, ti * 80);
    go('gd' + k, A.gd, true, 60 + ti * 80);
    A.tm.forEach((at, j)=> go('tm' + k + j, at, true, 120 + ti * 80 + j * 70));
  });
  await Promise.all(runs);
  await sceneWait(500);
}

/* ---------- after it: on his back, out of the castle after Wadjet (42-the-hunt.js; until then, the old way) ---------- */
function standAfter(){
  if(typeof huntStart === 'function') return huntStart();
  return typeof invChaseGoRun === 'function' ? invChaseGoRun() : null;
}

/* ============================================================
   INTO THE GAME
   ============================================================ */
(function standHooks(){
  /* the doors, out with her: the stand (in place of the tribes' march, the new way) */
  if(typeof invSceneDue433 === 'function'){
    const _due = invSceneDue433;
    invSceneDue433 = function(key, st, v){
      if(st === 'escort' && key === CA_KEY && v.said.sisters && !v.said.tribes) return standGo();
      return _due.apply(this, arguments);
    };
  }
  /* the King's hunt: over, once she is coming out (he is at the doors) */
  if(typeof khOn === 'function'){
    const _kh = khOn;
    khOn = function(){ return _kh.apply(this, arguments) && !(invAt('escort') && invSaid('sisters')); };
  }
  /* his dial, on the castle's grounds while the stand is due */
  const d = typeof DECKS !== 'undefined' && DECKS[CA_KEY];
  if(d){
    const base = Object.getOwnPropertyDescriptor(d, 'padMoves');
    Object.defineProperty(d, 'padMoves', { configurable:true, enumerable:true, get(){ return (invStanding() && caRideOn(CA_KEY)) ? ST_PAD : (base && base.get ? base.get.call(d) : (base ? base.value : undefined)); } });
  }
  if(typeof jgPadState === 'function'){
    const _st = jgPadState;
    jgPadState = function(p){ if(ui.screen === CA_KEY) return ui.stand ? stPadState(p) : stPadIdle(); return _st.apply(this, arguments); };
  }
  if(typeof jgPadPress === 'function'){
    const _pr = jgPadPress;
    jgPadPress = function(mv){ if(ui.screen === CA_KEY) return stPadPress(mv); return _pr.apply(this, arguments); };
  }
  /* a step of yours in it: his eyes a step nearer ready */
  if(typeof caStep === 'function'){
    const _step = caStep;
    caStep = function(key, p){ const S = ui.stand; if(S && key === CA_KEY && S.glareIn > 0){ S.glareIn--; walkState().actSig = null; } return _step.apply(this, arguments); };
  }
  /* only the 5×5, while it goes on: the walls round it, the King and his daughter in it */
  if(typeof caWalkerAt === 'function'){
    const _at = caWalkerAt;
    caWalkerAt = function(key, x, y){
      const S = ui.stand;
      if(S && key === CA_KEY){
        const B = ST.box;
        if(x < B.x0 || x > B.x1 || y < B.y0 || y > B.y1) return true;
        for(const id of ['king', 'prin']){ const e = document.getElementById('sa-' + id); if(e){ const o = e._o, fx = Math.round(o.x + o.w / 2 - 0.5), fy = Math.round(o.y + o.h - 1); if(fx === x && fy === y) return true; } }
      }
      return _at.apply(this, arguments);
    };
  }
  /* the grounds' own fighting put away while it goes on (its own walls and aliens are the scene's) */
  if(typeof invGroundsThings === 'function'){
    const _things = invGroundsThings;
    invGroundsThings = function(T){
      const r = _things.call(this, o=>{ const w = o.when; o.when = ()=> (!w || w()) && !invStanding(); return T(o); });
      stAfterThings(T);
      return r;
    };
  }
  /* the voice (no face), the Bug Knight's cry */
  if(typeof caFaceOf === 'function'){
    const _face = caFaceOf;
    caFaceOf = function(who){ if(who === 'voice' || who === 'firevoice') return ''; return _face.apply(this, arguments); };
  }
  if(typeof caNameOf === 'function'){
    const _name = caNameOf;
    caNameOf = function(who){ if(who === 'voice') return 'A cold voice'; if(who === 'firevoice') return 'A booming voice'; return _name.apply(this, arguments); };
  }
})();
/* (after it, while you hunt Wadjet) the grounds: the tribes at the aliens round the palace's doors, and the aliens
   fighting back */
const ST_AFTER = [['grass_fairy', 25, 27, 'alien_insect_physical', 26, 27], ['water_sprite', 38, 27, 'alien_robot_steel', 37, 27],
                  ['earth_fairy', 29, 29, 'alien_golem_ground', 30, 29], ['fire_sprite', 34, 30, 'alien_crocodilian_fire', 33, 30]];
function stAfterThings(T){
  const when = ()=> invNew() && invAt('chase') && invSaid('stood') && !ui.invClimax;
  ST_AFTER.forEach(([ts, tx, ty, al, ax, ay])=>{
    const dx = tx - ax, dy = ty - ay;
    T({ x:ax, y:ay, still:true, cls:'ca-npc war-alien inv-clash-alien', invAlien:true,
        html:()=> `<div class="war-fig">${jgMonImg(al, WALK_T * 1.5, dx > 0)}</div>` + warSlashHtml(dx, dy),
        verb:'Look', sub:(SPECIES[al] || {}).name || 'An alien', when, act:()=> caLines([`It has turned on the tribes, and fights them claw against blade.`]) });
    T({ x:tx, y:ty, still:true, cls:'ca-npc war-knight', who:null,
        html:()=> `<div class="war-fig">${caMonImg(ts, WALK_T * 1.3, dx < 0)}</div>`,
        verb:'Talk', sub:(SPECIES[ts] || {}).name || 'One of the tribes', when, act:()=> caLines([caTurn('stTribeFight', [`<b>"We've got these! Go — after the snake!"</b>`, `<b>"The tribes keep their word. Go on — catch him!"</b>`])]) });
  });
}
/* his dial when nothing is happening (before the scene has begun): all of it dim */
function stPadIdle(){ const z = { ready:false, lit:false, sub:'', fill:0 }; return { J:false, jump:z, glare:z, ambush:z, track:Object.assign({ on:false, what:'', pic:'' }, z), talk:{ lit:false } }; }

/* ============================================================
   HOW IT LOOKS
   ============================================================ */
let _stCss = false;
function stCss(){
  if(_stCss || typeof document === 'undefined') return;
  _stCss = true;
  if(typeof khCss === 'function') khCss();
  if(typeof jgCss === 'function') jgCss();
  invReturnCss();
  const s = document.createElement('style');
  s.id = 'stCss';
  s.textContent = `
  /* the walls' men: braced */
  .scene-actor.st-man img{ filter:drop-shadow(0 2px 2px rgba(0,0,0,.35)); }
  .scene-actor.st-down img{ transition:transform .45s cubic-bezier(.55,0,.8,.3); filter:grayscale(.35) brightness(.8) drop-shadow(0 2px 2px rgba(0,0,0,.35)); }
  .scene-actor.st-man:not(.st-down) img{ transition:transform .5s cubic-bezier(.2,.9,.3,1.2); }
  /* under a beam: shaking, crackling, going black */
  .scene-actor.st-zap .sa-in{ animation:khShake .09s steps(2) infinite; }
  .scene-actor.st-zap img{ transition:filter .6s cubic-bezier(.4,0,.75,1); filter:brightness(0) drop-shadow(0 0 3px #f3dcff) drop-shadow(0 0 10px rgba(255,60,60,.9)) !important; }
  .scene-actor.st-dusting .sa-in{ transition:opacity .9s ease-in, translate .9s ease-in; opacity:0; translate:0 -6px; }
  .scene-actor.st-dusting img{ filter:brightness(0) !important; }
  .scene-actor .kh-bolts{ position:absolute; left:-40%; top:-30%; width:180%; height:180%; overflow:visible; pointer-events:none; z-index:2; }
  /* stunned: tipped forward, shaking, sparking */
  .scene-actor.st-stun .sa-in{ animation:stStun .16s steps(2) infinite; }
  @keyframes stStun{ 0%{ rotate:-9deg; translate:-1px 0; } 100%{ rotate:-15deg; translate:1px 1px; } }
  .scene-actor.st-stun img{ filter:brightness(.55) saturate(.6) drop-shadow(0 0 6px rgba(255,60,60,.95)) !important; }
  /* thrown out by a dome */
  .scene-actor.st-reel .sa-in{ animation:stStun .2s steps(2) infinite; }
  /* the King: casting; spent (bowed, a shadow over his head); his steed gone to smoke */
  .scene-actor.st-cast img{ filter:brightness(1.08) drop-shadow(0 0 8px rgba(240,200,255,1)) drop-shadow(0 0 18px rgba(170,90,255,.95)); }
  .scene-actor.st-spent img{ filter:brightness(.7) saturate(.5) drop-shadow(0 0 6px rgba(20,0,35,.9)); transition:filter .6s ease; }
  .scene-actor.st-spent .sa-in{ rotate:-7deg; translate:0 3px; transition:rotate .6s ease, translate .6s ease; }
  .scene-actor.st-spent .sa-in::before{ content:''; position:absolute; left:42%; top:-14%; width:56%; height:40%; translate:-50% 0; border-radius:50%;
    background:radial-gradient(closest-side, rgba(8,4,14,.92), rgba(20,8,30,.7) 45%, rgba(20,8,30,0)); filter:blur(3px); animation:khGloom 2.4s ease-in-out infinite; z-index:2; }
  .scene-actor.st-steed-gone img{ transition:opacity 1s ease, filter 1s ease; opacity:0; filter:brightness(0) blur(3px) drop-shadow(0 0 12px rgba(60,0,80,.9)); }
  /* Wadjet: charging, his hood's light swelling; turned back in time; gone */
  .scene-actor.st-charge .inv-prism-glow{ animation:stCharge .45s ease-in-out infinite alternate !important; }
  @keyframes stCharge{ from{ scale:1; filter:brightness(1); } to{ scale:2.1; filter:brightness(1.6); } }
  .scene-actor.st-rewind img{ animation:stRewind .5s steps(6) both; }
  @keyframes stRewind{ 0%{ filter:hue-rotate(0) brightness(1.6) blur(1px); translate:2px 0; } 50%{ filter:hue-rotate(180deg) brightness(1.2); translate:-3px 0; } 100%{ filter:none; translate:0 0; } }
  .scene-actor.st-fade img{ opacity:0; filter:brightness(0) blur(4px); transition:opacity .9s ease, filter .9s ease; }
  /* (4.59) Wadjet gone in Lucesco's blast (for a moment); the smoke where he was, flowing back into him */
  .scene-actor.st-gone img{ opacity:0 !important; filter:brightness(0) blur(6px) !important; transition:opacity .3s ease, filter .3s ease; }
  .st-smoke.back i{ animation:smBack .5s ease-in forwards !important; }
  @keyframes smBack{ from{ opacity:.8; } to{ transform:translate(0, 0) scale(.2); opacity:0; } }
  /* the beam on the King: dark sparks where it bites */
  /* (where it bites him: a ring of dark sparks, him in it still to be seen) */
  .st-meet.dark .mt-flash{ display:none; } .st-meet.dark .mt-glow{ width:calc(var(--t) * 1.5); height:calc(var(--t) * 1.5); background:radial-gradient(circle, rgba(0,0,0,0) 0 30%, rgba(150,30,220,.55) 46%, rgba(255,40,90,.4) 60%, rgba(170,60,255,0) 72%); }
  .st-meet.dark .mt-core{ width:calc(var(--t) * .3); height:calc(var(--t) * .3); background:rgba(20,0,30,.85); box-shadow:0 0 10px 4px rgba(170,40,240,.85), 0 0 20px 8px rgba(255,40,90,.5); }
  /* close ranks: a line of light along the shields */
  .st-shield{ position:absolute; height:calc(var(--t) * .3); margin-top:calc(var(--t) * -.15); transform-origin:0 50%; pointer-events:none; border-radius:999px;
    background:linear-gradient(to bottom, rgba(255,232,150,0), rgba(255,232,150,.5) 35%, rgba(255,250,224,.95) 50%, rgba(255,232,150,.5) 65%, rgba(255,232,150,0));
    box-shadow:0 0 16px 2px rgba(255,214,110,.75); mix-blend-mode:screen; animation:stShield 1.6s ease-in-out infinite alternate; }
  @keyframes stShield{ from{ opacity:.45; } to{ opacity:.95; } }
  /* the domes: his psychic pink; hers baby pink, glittering */
  .st-dome{ position:absolute; pointer-events:none; border-radius:50%; opacity:0; scale:.2; transition:opacity .5s ease, scale .55s cubic-bezier(.2,1.3,.4,1); }
  .st-dome.up{ opacity:1; scale:1; }
  .st-dome.out{ opacity:0; scale:1.08; transition:opacity .8s ease, scale .8s ease; }
  .st-dome i{ position:absolute; inset:0; border-radius:50%; }
  .st-dome .sd-glass{ background:radial-gradient(ellipse at 50% 58%, rgba(255,80,210,.1) 0%, rgba(255,80,210,.2) 55%, rgba(255,90,215,.42) 82%, rgba(255,160,235,.68) 100%); }
  .st-dome .sd-rim{ border:3px solid rgba(255,150,235,.85); box-shadow:0 0 18px rgba(255,80,210,.75), inset 0 0 22px rgba(255,120,225,.6); animation:stDomeHum 1.3s ease-in-out infinite alternate; }
  .st-dome .sd-shine{ inset:8% 46% 58% 14%; border-radius:50%; background:radial-gradient(closest-side, rgba(255,255,255,.55), rgba(255,255,255,0)); rotate:-28deg; }
  @keyframes stDomeHum{ from{ opacity:.75; } to{ opacity:1; } }
  .st-dome-pink .sd-glass{ background:radial-gradient(ellipse at 50% 58%, rgba(255,214,234,.14) 0%, rgba(255,205,230,.24) 55%, rgba(255,196,226,.46) 82%, rgba(255,230,242,.75) 100%); }
  .st-dome-pink .sd-rim{ border-color:rgba(255,215,236,.95); box-shadow:0 0 18px rgba(255,180,220,.8), inset 0 0 22px rgba(255,200,230,.7); }
  .st-dome b{ position:absolute; width:calc(var(--t) * .16 * var(--s)); height:calc(var(--t) * .16 * var(--s)); translate:-50% -50%;
    background:radial-gradient(circle, #fff 0 25%, rgba(255,214,236,.9) 45%, rgba(255,214,236,0) 70%); clip-path:polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
    animation:stGlit 2.4s ease-in-out infinite; }
  @keyframes stGlit{ 0%,100%{ opacity:0; scale:.4; } 50%{ opacity:1; scale:1.2; } }
  .st-dome.shatter{ opacity:0; transition:opacity .35s ease; }
  .st-shard{ position:absolute; width:14px; height:22px; pointer-events:none; z-index:72; clip-path:polygon(50% 0, 100% 60%, 30% 100%, 0 40%);
    background:linear-gradient(135deg, rgba(255,240,248,.95), rgba(255,180,220,.7)); animation:stShard 1.2s cubic-bezier(.2,.7,.4,1) both; }
  @keyframes stShard{ from{ opacity:1; translate:0 0; rotate:0deg; } to{ opacity:0; translate:var(--dx) var(--dy); rotate:var(--r); } }
  /* Wadjet's laser held, and Lucesco's meeting it: brighter and more violent all the while */
  .st-pbeam{ position:absolute; height:calc(var(--wt, 44px) * .5); margin-top:calc(var(--wt, 44px) * -.25); transform-origin:0 50%; pointer-events:none; border-radius:999px; height:22px; margin-top:-11px;
    background:linear-gradient(to bottom, rgba(255,90,90,0), rgba(255,90,90,.85) 14%, #ffd84d 28%, #ffffff 44%, #ffffff 56%, #5be06a 70%, #4db8ff 82%, rgba(184,108,255,.85) 92%, rgba(184,108,255,0));
    box-shadow:0 0 22px 8px rgba(255,255,255,.75), 0 0 46px 18px rgba(200,170,255,.5); }
  .st-pbeam.on, .jg-beam.st-lbeam.st-hold.on{ animation:stBeamRise var(--hold, 3s) ease-in both; }
  @keyframes stBeamRise{ 0%{ scale:1 .8; } 50%{ scale:1 1.15; } 70%{ scale:1 .9; } 85%{ scale:1 1.4; } 92%{ scale:1 1; } 100%{ scale:1 1.7; } }
  .jg-beam.st-lbeam.st-hold i, .jg-beam.st-lbeam.st-hold em{ animation-iteration-count:infinite; }
  .jg-ride .jg-eyes.st-hold{ animation:none; opacity:1; }
  .st-clash{ position:absolute; width:0; height:0; pointer-events:none; z-index:80; }
  .st-clash i{ position:absolute; left:calc(var(--t) * -.7); top:calc(var(--t) * -.7); width:calc(var(--t) * 1.4); height:calc(var(--t) * 1.4); border-radius:50%;
    background:radial-gradient(circle, #fff 0 22%, rgba(255,240,200,.9) 38%, rgba(255,120,200,.55) 58%, rgba(255,80,80,0) 72%); }
  .st-clash.on i{ animation:stClash var(--hold, 3s) ease-in both; }
  .st-clash.on i:nth-child(2){ animation-name:stClash2; mix-blend-mode:screen; }
  .st-clash.on i:nth-child(3){ animation-name:stClash3; }
  @keyframes stClash{ 0%{ scale:.4; } 15%{ scale:.9; } 25%{ scale:.6; } 40%{ scale:1.3; } 50%{ scale:.8; } 62%{ scale:1.7; } 70%{ scale:1; } 80%{ scale:2.2; } 86%{ scale:1.3; } 93%{ scale:2.8; } 100%{ scale:3.4; } }
  @keyframes stClash2{ 0%{ scale:.2; rotate:0deg; } 100%{ scale:2.6; rotate:540deg; } }
  @keyframes stClash3{ 0%,100%{ opacity:.6; scale:1; } 50%{ opacity:1; scale:1.6; } }
  .st-clash b{ position:absolute; left:0; top:0; width:calc(var(--t) * .12); height:calc(var(--t) * .12); border-radius:50%; background:#fff;
    box-shadow:0 0 6px 2px rgba(255,220,240,.95); rotate:var(--a); animation:stSpark .55s ease-out infinite; }
  @keyframes stSpark{ from{ translate:0 0; opacity:1; } to{ translate:calc(var(--t) * 1.6) 0; opacity:0; } }
  /* the tribes' beams */
  .st-tbeam{ position:absolute; height:14px; margin-top:-7px; transform-origin:0 50%; pointer-events:none; border-radius:999px;
    background:linear-gradient(to bottom, transparent, var(--c) 25%, #fff 50%, var(--c) 75%, transparent); box-shadow:0 0 16px 4px var(--c); animation:khBeamIn .18s ease-out both; }
  .st-tbeam.out{ opacity:0; transition:opacity .35s ease; }
  /* the flashes */
  .st-flash{ position:fixed; inset:0; z-index:96; pointer-events:none; animation:stFlash 1s ease-out both; }
  .st-flash-br{ background:radial-gradient(circle at 50% 45%, #000 0 30%, #b00018 60%, #000 100%); }
  .st-flash-white{ background:#fff; }
  @keyframes stFlash{ 0%{ opacity:0; } 8%{ opacity:1; } 30%{ opacity:.85; } 100%{ opacity:0; } }
  /* the free stretches: the dial lit, nothing else to tap */
  body.st-free #walkMoves{ visibility:visible !important; }
  @media (prefers-reduced-motion: reduce){ .st-shield, .st-dome .sd-rim, .st-dome b, .scene-actor.st-stun .sa-in, .scene-actor.st-reel .sa-in, .st-clash b{ animation:none; } }
  `;
  document.head.appendChild(s);
}
