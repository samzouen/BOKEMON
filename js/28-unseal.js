/* ============================================================
   28-unseal.js — THE UNSEALING (4.13)
   The designer, 2026-11-10: "Could we improve the summoning of 4 ancestors' scenes please? They feel trivial and too
   quick and flippant with gaps in the storytelling. In particular, the fairy king should convey the great cost of
   power it took to seal the ancestors, and therefore the great cost it will take to undo it. He will warn that the
   spells will leave him vulnerable."
     · A guardian, persuaded or beaten, walks you to its home (you follow; the words play by themselves), Lucesco
       seeing how worn down the tribe is and how cheerful; inside, its fairies have their say (the Earth and Fire
       guardians take the most persuading); and every tribe ends the same way: should the King unseal the weapon, he
       must come alone with you.
     · The King does not meet the guardians in the castle. You bring him to each village: from the south gate, his
       mounted figure following you as the whalelord did, without his army (over the Commander's and the Advisor's
       protests). He leaps where Lucesco leaps, one square behind; within 4 squares (3 until 4.29) of an alien, his own beam follows
       Lucesco's Pulsar Glare (15% more of its health, and confusion), or his Rift Ambush, once a band. A jump away
       leaves him behind (go back for him, or jump back to him).
     · At the village the tribe does not trust him easily. The unsealing: the blade on the ground, the guardian to its
       left, the King to its right; four chants, slow, the King glowing and tiring, a pillar of light rising from the
       blade and pulsing harder each time; then a last pulse, the blade white, the ancestor's white shape, its colours.
     · The ancestor beaten: everyone where they stood. The King: the spell must have lit up the sky for every alien
       for miles. The guardian and the ancestor call the tribe to arms, and an alien commander is on you at once. Then
       the village under attack: the ancestor against the commander, the guardian against the captain, back to back;
       twelve aliens, one of each kind, each held off by two fairies; the King in the middle, spent. The fairies first
       — then the captain and the commander, back to back. (Fire: 2 captains, 1 commander; Earth: 2 and 2.)
     · One unsealing a day: the King rests at the castle, to his attendants' worry, and is ready again the next day
       (to their protests).
     · (4.28) "commanders must have 6 waves. the ones invading the villages had 3": the vanguard is a commander's army of
       six waves (its four aliens, its captain, the commander — all six of them on the map), and in the finals each
       commander brings its six (a captain beyond theirs, its three): Grass and Water 6 waves, Fire 9, Earth 12 (unArmy).
     · (4.32) every village the same: the captain's band and the commander's army, nine waves in one fight; one captain on
       the guardian, one commander on the ancestor.
   The chant: the designer asked for Tolkien's "A Elbereth Gilthoniel"; that song is not ours to put in the game, so
   the King chants in an old fae tongue of our own, four parts, the sense of each in the words around it.
   ============================================================ */
const UN = { walkMs:520, near:2, beamNear:4, beamCut:0.15, siegeLv:175 };   // (4.29) his beam's reach: 4 squares (3 until 4.29)

/* ---------- the save: r6().war (22-war.js), what this adds ----------
   v (2: this flow), rite{ k:{ arrived, chant, opened, done } }, siege{ k:{ id:true } }, escort (null, or { k, x, y,
   faceR, gate }), rest (the day the King last unsealed: today() — he rests), ready{ day:true } (his "I am ready" said
   that morning), gate (the first send-off said). */
function unWar(){
  const w = warState();
  if(w.v !== 2){
    /* a save from before 4.13: an ancestor calmed then was calmed after its village was cleared — that tribe is done */
    w.rite = w.rite || {};
    JG_TRIBE_KEYS.forEach(k=>{ if(w.calmed[k]) w.rite[k] = Object.assign({ arrived:true, chant:true, opened:true, done:true }, w.rite[k] || {}); });
    w.v = 2;
  }
  if(!w.rite || !w.siege || !w.ready) ['rite', 'siege', 'ready'].forEach(k=>{ if(!w[k] || typeof w[k] !== 'object') w[k] = {}; });   // (asked often: jgBands)
  return w;
}
function unRite(k){ const w = unWar(); return w.rite[k] = w.rite[k] || {}; }
function unDone(k){ return !!unRite(k).done; }
function unResting(){ return unWar().rest === today(); }
function unEscort(){ const e = unWar().escort; return e && JG_TRIBES[e.k] ? e : null; }

/* ---------- who speaks ---------- */
function unMember(k, i){ const m = JG_TRIBES[k].members; return m[i % m.length]; }
/* the tribe's three in the guardian's house: two of its people, and an elder (a third kind, where the tribe has one) */
function unFolkOf(k, who){
  if(who === 'f3'){
    const a = unMember(k, 0), b = unMember(k, 1);
    return ((typeof JG_VILLAGE_FOLK !== 'undefined' && JG_VILLAGE_FOLK[k]) || []).find(s=> s !== a && s !== b) || a;
  }
  return unMember(k, who === 'f2' ? 1 : 0);
}
/* the guardian's own "!" over its door (drawn with the jungle) while it is out of it */
function unGuardMarkOff(k){
  const g = unV(k).guardian, T = WALK_T;
  document.querySelectorAll('#walkWorld .walk-mark').forEach(m=>{
    if(Math.abs(parseFloat(m.style.left) - (g.x + 1) * T) < 1 && Math.abs(parseFloat(m.style.top) - (g.y - 0.9) * T) < 1) m.remove();
  });
}
function unFace(who, k){
  switch(who){
    case 'king': return jgFace('fairy_king_mounted_c_front', 'fairy_king_c_front');
    case 'kingFoot': return jgFace('fairy_king_c_front');
    case 'commander': case 'advisor': return typeof caFace === 'function' ? caFace(who) : '';
    case 'knight': return jgFace('chestnut_knight2_front');            // (4.33) the castle's messenger
    case 'lion': return riftLucescoFace();
    case 'you': return facePlayer();
    case 'g': return jgFace(JG_TRIBES[k].guardian);
    case 'anc': return jgFace('tribal_ancestor_' + k + '_front');
    case 'f1': case 'f2': case 'f3': return jgFace(unFolkOf(k, who) + '_front');
    default: return '';
  }
}
function unName(who, k){
  const folk = s=> typeof jgFolkName === 'function' ? jgFolkName(s) : 'Fairy';
  switch(who){
    case 'king': case 'kingFoot': return 'The Fairy King';
    case 'commander': return 'Royal Commander';
    case 'knight': return 'Chestnut Knight';
    case 'advisor': return 'Royal Advisor';
    case 'lion': return 'Lucesco';
    case 'you': return 'You';
    case 'g': return `${JG_TRIBES[k].short} Guardian`;
    case 'anc': return (typeof ANC_FOLK !== 'undefined' && ANC_FOLK['tribal_ancestor_' + k] || {}).name || 'The ancestor';
    case 'f1': case 'f2': return folk(unFolkOf(k, who));
    case 'f3': return 'Elder ' + folk(unFolkOf(k, who));
    default: return '';
  }
}
/* one line, closed if you leave the screen it began on */
function unSay(faces, name, html, here){
  return new Promise(res=>{
    let done = false;
    const fin = ()=>{ if(done) return; done = true; clearInterval(t); res(); };
    const t = setInterval(()=>{ if(ui.screen !== here){ document.querySelectorAll('.scene-say').forEach(x=> x.remove()); fin(); } }, 250);
    sceneSay(faces, name, html).then(fin);
  });
}
/* lines in turn: each [who, html] (who: see unFace; 'n' or null for words with no face). opts.auto: they play by
   themselves (a pace: 1 as read, more is slower); opts.onLine(i, who): as each begins (a figure that speaks, say). */
async function unLines(seq, k, opts){
  opts = opts || {};
  const here = ui.screen, jungle = here === JG_KEY;
  const flag = jungle ? 'jgTalk' : 'caTalk';
  const mine = !ui[flag];
  ui[flag] = true;
  releaseKeys();
  const was = ui.sayAuto;
  if(opts.auto) ui.sayAuto = opts.auto;
  try {
    for(let i = 0; i < seq.length; i++){
      if(ui.screen !== here) break;
      const [who, html] = Array.isArray(seq[i]) ? seq[i] : ['n', seq[i]];
      if(opts.onLine) try { opts.onLine(i, who); } catch(e){}
      const face = who && who !== 'n' ? unFace(who, k) : '';
      await unSay(face ? [face] : [], who && who !== 'n' ? unName(who, k) : '', html, here);
    }
  } finally {
    ui.sayAuto = was;
    if(mine) ui[flag] = false;
    if(!opts.keep && ui.screen === here) refreshWalk();
  }
}

/* ============================================================
   THE WORDS
   ============================================================ */
/* the guardian, persuaded or beaten, before it lifts its wall (25-quest.js, questGuardAfterSay) */
/* (4.23) `why`: Lucesco, straight after a fight — the designer: "Immediately after a battle with the tribal guardians,
   Lucesco needs to come in with a word about why they're there, as there's a gap between what has been told them by
   the player and what they understand of the situation. Lucesco should explain that the king is offering them the
   opportunity to unseal their long lost ancestors so that through united strength the alien threat might be
   overcome." (A fight only comes of a wrong answer: the right one told it already.) */
const UN_GUARD_AFTER = {
  water:{ fight:`The guardian lowers its staff, breathing hard.<br><br><b>"Enough. The tide has turned, and not my way. You are strong."</b>`,
    why:`<b>"Peace, guardian. The fight should never have come — those were the wrong words. The Fairy King sent us with your ancestor's blade for a reason: he is offering to unseal your ancestor, lost to your tribe for so long. Alone, each of us is losing to the aliens, one tide at a time. Together — every tribe, its ancestor and the castle — we might turn that tide."</b>`,
    help:`<b>"I will not pretend with you. The aliens take our people from the river every day, and our walls grow thinner with every tide. We need help."</b>`,
    wall:`It raises its staff. The thorns shiver, wither, and sink into the mud.`,
    come:`<b>"Come, then. Walk with me to the long house, and meet my people."</b>` },
  fire:{ fight:`The guardian drops to one knee, smoke curling from its mask.<br><br><b>"…Fine! FINE! You can fight. I'll give you that, and nothing else."</b>`,
    why:`<b>"Hold your fire, and hear why we really came. We did not come to take anything. The King sends your ancestor's blade as a promise: he will unseal your ancestor, lost to your tribe for so long. The aliens are beating every one of us, one by one. Stand together — the tribes, your ancestors and the castle — and we can beat them."</b>`,
    help:`<b>"You want the truth? We're starving. The aliens burn our woods and snatch our people, and we can't even keep the forges lit. …There. I said it."</b>`,
    wall:`It slams its torch into the ground. The thorns blacken, crumble to ash, and blow away.`,
    come:`<b>"Follow me to my hall. And keep your hands where I can see them."</b>` },
  earth:{ fight:`The guardian sways, then sits down with a thud that shakes the ground.<br><br><b>"…Strong. …Very… strong."</b>`,
    why:`<b>"Rest, guardian, and hear me. Take all the time you need. The King is offering to unseal your ancestor — lost to your tribe for so long — and that is why we carry its blade. Alone, the aliens wear each of us down. Together — every tribe, every ancestor and the castle — we might wear them down instead."</b>`,
    help:`<b>"…We… are tired. …The aliens… take… and take. …We… cannot… hold… for ever."</b>`,
    wall:`It lays a hand on the ground. With a long groan, the thorns sink back into the earth, one by one.`,
    come:`<b>"…Come. …My house. …We… talk… there."</b>` },
  grass:{ fight:`The guardian flops onto its back in the grass, giggling and panting.<br><br><b>"Ow! Ow! Okay, you win! Best game in AGES."</b>`,
    why:`<b>"Now the game is over — the truth, with no tricks. The King is offering to unseal your ancestor, lost to your tribe for so long. That's why we carry its blade. The aliens are winning because we're all hiding apart. Together — every tribe, every ancestor and the castle — we can send them packing."</b>`,
    help:`<b>"…Can I be serious for a second? Just one? The jungle's dying. The aliens are everywhere. We're hiding in our own houses. We need help."</b>`,
    wall:`It snaps its fingers. The thorns wriggle, giggle (you're sure of it), and burrow back into the ground.`,
    come:`<b>"Come on, come on! My house! You'll love it. It's mostly roots."</b>` },
};
/* the walk to the guardian's home: these play by themselves as you go */
const UN_HOME_WALK = {
  water:[
    ['g', `<b>"Slowly. The path is narrow, and my people will want to look at you."</b>`],
    ['lion', `<i>Quietly:</i> <b>"Look at the nets on the racks. Mended and mended again — there is more mending than net. And the cisterns are half empty."</b>`],
    ['g', `<b>"We have not fished the open river in a year. The aliens watch the water. We drink what the rain gives us."</b>`],
    ['lion', `<b>"And still the children race paper boats down the gutters, and someone is singing. They are thin, but they are laughing."</b>`],
    ['g', `<b>"The tide goes out, little lion. It always comes back. That is the first thing we teach them."</b>`],
  ],
  fire:[
    ['g', `<b>"Eyes front. My people don't like being stared at."</b>`],
    ['lion', `<i>Low:</i> <b>"The forges are cold. Every one. They are burning their own roof beams for warmth — see the gaps in the thatch."</b>`],
    ['g', `<b>"Fire needs fuel, and the forest is crawling with aliens. We burn what we have. Don't you dare pity us."</b>`],
    ['lion', `<b>"I do not pity them. Listen — the drums. Half of them are scorched pots and cracked shields, and they are still dancing."</b>`],
    ['g', `<b>"…We dance when we're hungry. We dance when we're angry. We'll dance on the day we win, too."</b>`],
  ],
  earth:[
    ['g', `<b>"…Slowly. …Stone… does not hurry."</b>`],
    ['lion', `<i>Under his breath:</i> <b>"The stores are cut into the rock, and they are nearly empty. The walls are cracked and stuffed with clay. They have been patching for a long time."</b>`],
    ['g', `<b>"…The aliens… dig. …We fill. …They dig. …We fill."</b>`],
    ['lion', `<b>"And the workers hum as they carry the clay. The same slow song, over and over. It sounds like a heartbeat."</b>`],
    ['g', `<b>"…The mountain's song. …It holds us… together."</b>`],
  ],
  grass:[
    ['g', `<b>"Mind the roots — they bite. Only joking. Mostly."</b>`],
    ['lion', `<i>Softly:</i> <b>"Their gardens are bare. They are eating the seed they should be planting. And the huts lean — nobody has had time to tend the living walls."</b>`],
    ['g', `<b>"Gardens need sun and peace, and the aliens leave us neither. So we hide, and we grow very, very small."</b>`],
    ['lion', `<b>"Yet every one of them has a flower in their hair. Even the little ones. Even now."</b>`],
    ['g', `<b>"Of course! You can take our food, but you'll never take our hats."</b> It giggles, and does not look back.`],
  ],
};
/* inside: the guardian and three of its fairies. Fire and Earth take some persuading. Each ends the same way. */
const UN_HOME_TALK = {
  water:[
    ['n', `The long house smells of river reeds. Three of the tribe wait by a basin of still water. They bow to the guardian, and stare at you.`],
    ['f1', `<b>"Is it true? The castle sent them? After two hundred years of silence?"</b>`],
    ['g', `<b>"The castle sent them. And they spoke true at the wall — I heard it, as I hear the tide."</b>`],
    ['f2', `<b>"The tide-keepers say our ancestor dreams in that blade. If the King can wake her… we could fish the river again."</b>`],
    ['f1', `<b>"Or she could drown us all for letting her sleep so long."</b>`],
    ['g', `<b>"That is the risk. But a slow death behind walls is still a death."</b>`],
    ['g', `<b>"So. Our answer is yes. Hear our terms, ambassador: only the King who sealed her can wake her, and he will do it here, among her people."</b>`],
    ['g', `<b>"And should the King unseal her, he must come alone — with you, and no one else. No army. No knights. We remember what the castle's knights did here."</b>`],
  ],
  fire:[
    ['n', `The hall is dark: the great hearth is out. Three of the tribe sit around its cold stones.`],
    ['g', `<b>"Well? Say it. The castle wants our ancestor back. So the castle can use him."</b>`],
    ['f1', `<b>"Guardian… they beat you, or talked you round — either way, they're HERE. Nobody from outside has got through our wall in two hundred years."</b>`],
    ['g', `<b>"The King CAGED him! My grandmother's grandmother watched him do it!"</b>`],
    ['f2', `<b>"And my children watched the aliens take their father last spring. I'll have the King in my village if it means I get him back."</b>`],
    ['g', `<b>"…"</b>`],
    ['f3', `The old one pokes the cold hearth.<br><br><b>"Look at this. When did it last burn? We are a FIRE tribe, and we are freezing. Pride is fine fuel, Guardian — but it has run out."</b>`],
    ['g', `<b>"…Fine. FINE. Let him come. But he unseals our ancestor himself, here, where we can see his hands."</b>`],
    ['g', `<b>"And should the King unseal him, he comes ALONE — with you. Not one knight. If I see a single royal banner, the deal burns."</b>`],
  ],
  earth:[
    ['n', `The guardian's house is carved into the hillside. Three of the tribe sit so still you take them for statues, until one of them blinks.`],
    ['g', `<b>"…The castle… wants… the ancestor."</b>`],
    ['f1', `<b>"…They came… through the maze, Guardian. …Through the wall. …That is… not nothing."</b>`],
    ['g', `<b>"…The King… broke us… once. …I remember… the sound."</b>`],
    ['f2', `<b>"…The stores… are empty. …The walls… crack faster… than we fill them. …Soon… there is… nothing… to defend."</b>`],
    ['g', `<b>"…Stone… waits. …Stone… endures."</b>`],
    ['f3', `The oldest one lays a cracked tablet at the guardian's feet.<br><br><b>"…Stone… also… breaks. …If no one… lifts it. …Let them… lift us."</b>`],
    ['g', `A long, long silence. Dust trickles from the ceiling.<br><br><b>"…Mm. …Then… the King… wakes… the Great One… himself. …Here."</b>`],
    ['g', `<b>"…And should he… unseal it… he comes… alone. …With you. …No soldiers. …Soldiers… broke… the mountain… before."</b>`],
  ],
  grass:[
    ['n', `The guardian's house is a hollow in a giant root, full of hanging pots and dried flowers. Three of the tribe tumble out of the rafters to look at you.`],
    ['f1', `<b>"Visitors! Real ones! Can we keep them?"</b>`],
    ['g', `<b>"No, we can't keep them. They're the King's."</b> It flops into a hammock. <b>"The King wants our ancestor back, and the aliens want everything else."</b>`],
    ['f2', `<b>"I vote yes! The Elder will scare the aliens out of the whole jungle. They'll run so fast their feelers fall off!"</b>`],
    ['f1', `<b>"The Elder will also try to play games with us. Hide-and-seek. With thorns."</b>`],
    ['g', `<b>"Better thorns than nothing. Fine, it's yes! I like yes. Yes is my favourite."</b>`],
    ['g', `<b>"But rules are rules, even for me. The King wakes the Elder himself, here in our village."</b>`],
    ['g', `<b>"And should he unseal it, he comes alone — just him and you. No shiny knights tramping on our seedlings. Promise?"</b>`],
  ],
};
/* the throne room, after all four: no guardians come; the Commander and the Advisor protest, the King goes */
const UN_COURT_ALL = [
  ['king', `<b>"All four tribes… found, and willing. My friends, I hardly dared to hope for this."</b>`],
  ['you', `<b>"They have conditions. You must wake each ancestor yourself, in its own village — and you must come alone. Just you, and us."</b>`],
  ['commander', `<b>"Alone? Absolutely not. Your Majesty, the jungle is crawling with invaders. I will not let you ride out without a single knight."</b>`],
  ['advisor', `<b>"Your Majesty, think. Two hundred years ago the sealing nearly killed you. You were abed for a season. Undoing it will cost as much — four times over."</b>`],
  ['king', `<b>"I know what it cost. I remember every moment of it."</b> He looks at his hands. <b>"To bind a spirit as old as the forest, I poured so much of myself into those blades that I have never been whole since."</b>`],
  ['king', `<b>"To unbind them, I must pour it out again. After each one I will be weak — for a day, perhaps more. Unable to fight. Unable to shield anyone, not even myself. I will not hide that from you."</b>`],
  ['advisor', `<b>"Then let the knights carry you, at least—"</b>`],
  ['king', `<b>"The tribes have seen my knights before. They asked for me, not my army. If I want their trust, I must come to them as they asked: with open hands, and nothing behind me."</b>`],
  ['commander', `<b>"…And if the aliens find you?"</b>`],
  ['king', `He smiles, and rests a hand on Lucesco's mane.<br><br><b>"Then I will be in the best company in the kingdom."</b>`],
  ['lion', `<b>"We will bring you there, and we will bring you home. You have my word, old friend."</b>`],
  ['king', `<b>"Then we ride whenever you are ready — the Grass Tribe first, in the north-west, and on round the jungle. Come and tell me when."</b>`],
];
/* the south gate, each time he sets out: the first time at length */
const UN_GATE_FIRST = [
  ['n', `The south gate. The King is mounted — no armour, no banner. Behind him, every knight of the castle stands in rows, silent.`],
  ['commander', `<b>"Your Majesty. One last time. Let me send a squad to follow at a distance. They would never know."</b>`],
  ['king', `<b>"They would know, Commander. And so would I."</b>`],
  ['advisor', `<b>"At least take the—"</b>`],
  ['king', `<b>"Keep the castle safe. That is your task now. Mine is out there."</b> He turns his mount towards the trees.<br><br><b>"Lead the way, my friends. I will follow you."</b>`],
];
const UN_GATE_AGAIN = {
  grass:[['king', `<b>"Lead the way, my friends."</b>`]],
  water:[['commander', `<b>"Again, Your Majesty? You can still barely sit your horse."</b>`], ['king', `<b>"Then I will hold on tighter. Lead on, my friends."</b>`]],
  fire:[['advisor', `<b>"The Fire Tribe hates you most of all, Your Majesty. Please—"</b>`], ['king', `<b>"Which is exactly why I must go to them myself. Lead on."</b>`]],
  earth:[['commander', `<b>"The last one, and the farthest. I beg you: take one knight."</b>`], ['king', `<b>"I made a promise four times over, Commander. I will not break it on the last."</b>`]],
};
/* arriving with the King: trust does not come easily */
const UN_ARRIVE = {
  grass:[
    ['g', `<b>"So it's really you. The Sealing King. You're smaller than in the stories."</b>`],
    ['f1', `<b>"That's him! That's the one who put the Elder in a stick!"</b>`],
    ['king', `<b>"I am. I will not pretend otherwise. I have come to undo what I did — as you asked, alone."</b>`],
    ['g', `<b>"Alone… mostly. You brought the lion."</b> It walks a slow circle round him. <b>"Your hands are shaking."</b>`],
    ['king', `<b>"They are. What I am about to do frightens me more than any army."</b>`],
    ['g', `<b>"Hm. Honest AND frightened. The stories never said that."</b> It points at the clearing. <b>"Put the blade there. And if this is a trick, the roots will know before you do."</b>`],
  ],
  water:[
    ['g', `<b>"Your Majesty."</b> It does not bow. <b>"The last time a king stood in a water village, our river ran red for a week."</b>`],
    ['king', `<b>"I know. I ended that war by sealing your ancestor, and I have regretted the manner of it every day since."</b>`],
    ['f2', `<b>"Words are cheap at the riverside, King."</b>`],
    ['king', `<b>"Then let me pay in something dearer."</b> He dismounts, lays the blade on the stones himself, and kneels beside it.`],
    ['g', `<b>"…A king on his knees in the mud. The tide-keepers will not believe it."</b> A long pause. <b>"Begin, then. We will be watching."</b>`],
  ],
  fire:[
    ['g', `<b>"STOP right there."</b> A ring of fire sprites closes around you. <b>"Give me one reason not to burn you where you sit, King."</b>`],
    ['king', `<b>"I can give you three. Your forges are cold, your children are hungry, and your ancestor would never forgive you for letting him sleep through this war."</b>`],
    ['f2', `<b>"He's got a mouth on him."</b>`],
    ['g', `<b>"…You're unarmed."</b>`],
    ['king', `<b>"As you asked. You could end me now, and the castle would never reach you in time."</b>`],
    ['g', `A long, hot silence. The torches crackle.<br><br><b>"…Get on with it. Before I change my mind."</b>`],
  ],
  earth:[
    ['g', `<b>"…King."</b> It does not move. Neither do the fairies, standing in a wall of stone around the clearing.`],
    ['king', `<b>"Guardian. I have come as you asked. Alone."</b>`],
    ['g', `<b>"…Last time… you came… with a thousand."</b>`],
    ['king', `<b>"Last time I came to win. This time I have come to give back."</b>`],
    ['f3', `<b>"…He… is tired. …Look. …He is… already… tired."</b>`],
    ['king', `<b>"Three ancestors, three spells. Yes, I am tired. But I promised four."</b>`],
    ['g', `The longest silence yet. Then, slowly, the wall of fairies parts.<br><br><b>"…Mm. …Then… keep… your promise."</b>`],
  ],
};
/* the unsealing: the words before and between the four chants, and the chants (an old fae tongue of our own) */
const UN_RITE_OPEN = [
  ['kingFoot', `The King dismounts and lays the sealed blade on the ground. He stands to its right; the guardian takes the left. You step back with Lucesco.<br><br><b>"Stand clear. Whatever you see, do not touch the light."</b>`],
  ['kingFoot', `<b>"Two hundred years ago I sang this song backwards, and it took half of everything I was. Now I must sing it forwards."</b>`],
];
const UN_CHANT = [
  { text:`Saelin, saelin, oravel ithrae,<br>lumaran sieth velorin —<br>ai, venna lumaran!`,
    after:`A violet glow gathers in the King's hands. The blade answers with a thin thread of light, rising straight up into the sky.<br><br><i>(Light of the first morning, light from before the trees: come.)</i>` },
  { text:`Torvae nel caradhin,<br>oru sannath veiliseth,<br>maerin, maerin, tolu varë!`,
    after:`The thread thickens into a pillar. The King's voice cracks on the last word, and a bead of sweat runs down his temple.<br><br><i>(By the oath that bound you, by the hand that bound you: I loosen what I tied.)</i>` },
  { text:`Saelin oravel, thiraen sohr,<br>caelu ennasir nethrovan —<br>ivra, ivra, venna rae!`,
    after:`The pillar roars, purple and pink and white, so bright the trees cast shadows behind them. The King sways. His glow gutters like a candle in the wind — but he does not stop.<br><br><i>(Morning light, burn the chain. The sleeper hears the song: wake, and come home.)</i>` },
  { text:`Ai, toluvé, saelin oravel!`,
    after:`The King sinks to one knee, his breath ragged. With the last of his strength he lifts his hand—<br><br><i>(Be free, by the first light!)</i>` },
];
/* the ancestor beaten: the King's fear, and the call to arms */
const UN_ALARM_KING = `The King tries to stand, and cannot.<br><br><b>"That spell… it lit up the whole sky. Every alien for miles will have seen it. Forgive me — I have shown them exactly where you are."</b>`;
const UN_ALARM = {
  grass:[['g', `<b>"Then let them come! Fairies, to your places! Thorns UP!"</b>`], ['anc', `<b>"Ooh, VISITORS! I'll greet them myself."</b>`]],
  water:[['g', `<b>"To the river walls! Every staff, every net!"</b>`], ['anc', `<b>"Let them come to the water. The water remembers how to drown."</b>`]],
  fire:[['g', `<b>"To arms! Light every torch we have left!"</b>`], ['anc', `<b>"FINALLY. Something worth burning."</b>`]],
  earth:[['g', `<b>"…To… the walls. …All… of you."</b>`], ['anc', `<b>"…The mountain… stands."</b>`]],
};
/* the village under attack */
const UN_SIEGE_HOLD = {
  grass:{ g:`<b>"Don't mind us — we're having FUN! Go and help my fairies, they're only little!"</b>`, anc:`<b>"This one's mine, small thing. Go play with the others."</b>` },
  water:{ g:`<b>"We can hold the captain. The fairies cannot hold much longer — go to them first!"</b>`, anc:`<b>"Leave me the commander. Save the little ones."</b>` },
  fire:{ g:`<b>"What are you looking at me for? MY FAIRIES are fighting out there! GO!"</b>`, anc:`<b>"BACK! These are MINE! Help the young ones!"</b>` },
  earth:{ g:`<b>"…We… hold. …Help… them… first."</b>`, anc:`<b>"…The mountain… does not… fall. …Go."</b>` },
};
const UN_SIEGE_READY = {
  grass:`<b>"You did it! Every single one! Now help US — both of us, one after the other. Ready?"</b>`,
  water:`<b>"The fairies are safe. Now, together — the captain, then the commander. Are you ready?"</b>`,
  fire:`<b>"About time! Now we finish this — all of them, one after the other! Ready?!"</b>`,
  earth:`<b>"…Now. …Together. …To the end. …Ready?"</b>`,
};
const UN_SIEGE_KING = [
  `He can barely stand, bent forward under a heavy dark haze.<br><br><b>"Forgive me, my friends… I have nothing left. I cannot even lift my hand. Go — the fairies need you more than I do."</b>`,
  `<b>"I am sorry. I am in no condition to fight. Just… do not let them reach the little ones."</b>`,
];
const UN_SIEGE_FAIRY = [`<b>"We've got this one pinned! Hit it now!"</b>`, `<b>"Hurry! We can't hold it for ever!"</b>`, `<b>"For the tribe!"</b>`];
const UN_SIEGE_WON = {
  grass:[['g', `<b>"WE WON! Everybody, dance! …Oh. The King's asleep. Shh. Dance quietly."</b>`], ['anc', `<b>"Hee hee. Good game. Again tomorrow?"</b>`]],
  water:[['g', `<b>"The river is ours again. My people will remember who stood with us today."</b>`], ['anc', `<b>"…Hm. You fight like the tide. I will allow it."</b>`]],
  fire:[['g', `<b>"…Hmph. You fought well. ALL of you."</b> It glances at the King. <b>"Even him. He gave everything to wake our ancestor."</b>`], ['anc', `<b>"MORE. Bring me MORE of them."</b>`]],
  earth:[['g', `<b>"…Won. …The mountain… stands. …Because… of you."</b>`], ['anc', `<b>"…Good. …Small ones… strong."</b>`]],
};
const UN_SIEGE_HOME = [
  ['king', `The King lifts his head, grey with exhaustion.<br><br><b>"It is done. I… must rest. Forgive me, my friends — I cannot ride another step today."</b>`],
  ['g', `<b>"Our fairies know the hidden paths. They will see you safely to your gate, King."</b>`],
  ['n', `The tribe's fairies lead the King's mount away into the trees. For the first time in two hundred years, the fairies of the tribes see the Fairy King home.`],
];
/* the castle, the day of an unsealing, and the next */
const UN_REST_TODAY = [
  ['n', `The King sits slumped on his throne, grey with exhaustion, his eyes closed.`],
  ['advisor', `<b>"Hoo. Let him be. He came back grey as ash — the fairies had to hold him in his saddle all the way to the gate."</b>`],
  ['commander', `<b>"He will not eat, and he will not let the healers near him. Whatever you need, it waits until tomorrow."</b>`],
];
const UN_READY_NEXT = [
  ['king', `<b>"My friends. I am ready."</b>`],
  ['advisor', `<b>"Your Majesty, you are not. You could barely lift your cup this morning."</b>`],
  ['king', `<b>"I lifted it, didn't I?"</b> He gets to his feet, slowly. <b>"The tribes kept their word. I will keep mine."</b>`],
  ['commander', `<b>"Then at least let me send—"</b>`],
  ['king', `<b>"Alone, Commander. As I promised."</b>`],
];
/* Lucesco, by where the story stands (Just talk) */
const UN_LION = {
  rest:[`<b>"The King gave everything he had. Let him sleep. Tomorrow, if he is ready, we go on."</b>`,
        `<b>"He will say he is fine tomorrow. He will not be. But he will go anyway — that is the kind of king he is."</b>`],
  escort:[`<b>"Steady. The King is right behind us. If an alien comes close, let me glare at it — I think he would like a word with it himself."</b>`,
          `<b>"Do not run too far ahead. He cannot leap the way I do: he follows where I land."</b>`,
          `<b>"Follow my pulse. It leads to the village — and the King follows us."</b>`],
  lost:`<b>"We left the King behind! He cannot find the way without us. Shall I take us straight back to him?"</b>`,
  village:[`<b>"Stay close to the King. Whatever happens here, he cannot defend himself."</b>`,
           `<b>"They are watching him. Every one of them. Two hundred years is a long time to be afraid of someone."</b>`],
  siege:[`<b>"The fairies are holding them, but not for long. Twelve aliens — we take them one by one."</b>`,
         `<b>"Help the fairies first. The guardian and the ancestor can hold their own a little longer."</b>`],
  ask:k=> `<b>"Are you ready to go on helping the King? ${questTribeCap(k)} is waiting for him — and he is waiting for us, in the throne room. I can take us there now."</b>`,
  done:`<b>"All four ancestors are awake. The King will want to see us in the throne room."</b>`,
};
/* the village, between the arrival and the siege */
const UN_READY_ASK = `<b>"Tell me when you are ready, my friends. Once I begin, I cannot stop — and the ancestor will wake angry, and alone."</b><br><br><i>The unsealing: four chants. Then the ancestor fights you: Lv ${ANC_LEVEL}, alone.</i>`;
const UN_KING_FIELD = [`<b>"Lead on, my friends. I am right behind you."</b>`, `<b>"I have not ridden these paths in two hundred years. They have grown wild… and so beautiful."</b>`,
                       `<b>"Do not worry about me. Worry about the aliens — and leave a few for me."</b>`];
const UN_KING_SPENT = [`He is on one knee, breathing hard.<br><br><b>"Forgive me… I have nothing left to give. The ancestor will not know us until it has been fought."</b>`,
                       `<b>"It is done. All of it, poured out. I will be no use to anyone until I have slept."</b>`];
const UN_GUARD_WAIT = {
  grass:`<b>"Well? Are we doing this or not? I'm getting fidgety."</b>`,
  water:`<b>"We are waiting, King. The tide does not wait for ever."</b>`,
  fire:`<b>"I'm watching your hands, King. Get on with it."</b>`,
  earth:`<b>"…We… wait. …Stone… is patient. …Mostly."</b>`,
};
const UN_GUARD_WILD = {
  grass:`<b>"Elder, it's us! …It's not listening. It never listens!"</b>`,
  water:`<b>"Grandmother does not know us yet. Beat the madness out of her — gently, if you can."</b>`,
  fire:`<b>"It won't hear me! Fight it — it's the only thing it understands!"</b>`,
  earth:`<b>"…The Great One… is lost. …Wake it… with your fists."</b>`,
};
const UN_ANC_AGAIN = {
  grass:`<b>"You came back! Round two! I LOVE round two!"</b>`,
  water:`<b>"You return to the tide? Then drown."</b>`,
  fire:`<b>"BACK FOR MORE? GOOD!"</b>`,
  earth:`<b>"…Again. …Stone… does not tire."</b>`,
};
const UN_WATCH = {
  grass:[`<b>"Is he really going to do it? Is he? Is he?"</b>`, `<b>"I don't trust him. He's too… shiny."</b>`],
  water:[`<b>"My grandmother told me about him. She never smiled when she did."</b>`, `<b>"If the Ancestor wakes angry, run for the river. It's what we always did."</b>`],
  fire:[`<b>"One wrong move, King. Just one."</b>`, `<b>"My torch is lit. Just in case."</b>`],
  earth:[`<b>"…Hm."</b>`, `<b>"…We… watch. …We… remember."</b>`],
};
const UN_VANGUARD = `Commander Octopus's vanguard bars the way, tentacles lashing, its captain and its aliens howling for the light.`;
const UN_SIEGE_START = [
  ['n', `The commander falls back to the ancestor, and its army pours into the village: twelve aliens, one of every kind. The tribe's fairies throw themselves in the way, two to each.`],
  ['lion', `<b>"The fairies are holding them, but not for long. Twelve aliens — we take them one by one. Then the guardian and the ancestor."</b>`],
];
const UN_CHEER = [`<b>"We did it! Thank you!"</b>`, `<b>"Go on — the others still need you!"</b>`, `<b>"Did you SEE that? We were amazing."</b>`];
const UN_HOME_END = (k, left)=> [
  ['g', left.length ? `<b>"One thing more. No tribe decides alone: we stand with the castle only if all four tribes agree. And I cannot tell you where the others hide — when the King sealed our ancestors, we hid from each other too. You found us. You must find them."</b>`
                    : `<b>"You found the others too? Then there is nothing left to wait for. Go — tell your King that ${questTribe(k)} agrees."</b>`],
  ['g', `<b>"And free our people from the aliens — ${JG.daily.need === 1 ? 'one' : JG.daily.need} each day — and ${questTribe(k)} will thank you with ${tokenIcon(18)} ${JG.daily.tokens} Skill Tokens."</b>`],
];

/* ============================================================
   CUAIN, IN REGION 6 (the Rift, and the past; he does not come into the jungle or the castle)
   ============================================================ */
const R6_CUAIN = {
  rift:[
    `This room has no water in it at all. Not even a puddle. And yet it feels like the deep sea: dark, and full of lights.`,
    `The starlight pool is very small for a pool. I put one fin in. Only the tip. It tickled.`,
    `Selene and Vesper never sleep, they tell me. Like the ocean. I approve.`,
    `Time is a current here. I can feel it pulling at my tail — forwards, backwards. Hold on to something.`,
    `Lucesco walks like a king, and leaves footprints of light. Do not tell him. He would become vain.`,
  ],
  past:[
    `Sand. So much sand. It is as if the sea went out and forgot to come back.`,
    `Everything here is younger than it should be. Even the wind.`,
    `If we tread on a beetle here, will I still be born? Walk carefully, please.`,
  ],
  seek:[
    `Lucesco says the tribes hide behind walls of thorns. In the sea we hide behind each other. It works better: the shark gets confused.`,
    `You carry four swords that are not swords. In the sea, a thing that holds a sleeping giant is called a shell.`,
  ],
  unseal:[
    `The King spends himself like a lantern in a storm. Bring him home safe. Kings are rarer than whales.`,
    `When an old whale sings the great song, he is tired for days afterwards. The King's song sounds like that kind of song.`,
  ],
  rest:[`The King sleeps. Good. Even the tide rests, twice a day.`],
  war:[`The castle was attacked while its King could barely stand. Whoever sent those aliens knows when to strike. I do not like that kind of cleverness.`],
  after:[`Four ancestors awake, a King who kept his word, and a lion who purrs when he thinks nobody is listening. This is a good forest.`],
};
function r6CuainSet(id){
  const stage = typeof questOn === 'function' && questOn() ? questStage() : null;
  if(stage === 'end') return typeof invState === 'function' && invState().stage === 'done' ? 'after' : 'war';
  if(stage === 'unseal') return unResting() ? 'rest' : 'unseal';
  if(stage === 'seek') return 'seek';
  return id === 'r6_rift' ? 'rift' : 'past';
}
function r6GhostChat(id){
  const r = r6(), said = r.cuainSaid = r.cuainSaid || {};
  /* the story's set and the place's own, by turns */
  const set = r6CuainSet(id), place = id === 'r6_rift' ? 'rift' : 'past';
  const turn = said._turn = (said._turn || 0) + 1;
  const key = (set !== place && turn % 2) ? set : place;
  const list = R6_CUAIN[key] || R6_CUAIN.rift;
  const i = (said[key] || 0) % list.length;
  said[key] = i + 1;
  return sceneSay([faceMon('whalelord')], whaleName(), `<b>"${list[i]}"</b>`);
}
if(typeof RIFT_DECK !== 'undefined') RIFT_DECK.ghostChat = id=> r6GhostChat(id);
if(typeof PAST_DECK !== 'undefined') PAST_DECK.ghostChat = id=> r6GhostChat(id);

/* ============================================================
   WHERE EVERYONE STANDS — B, the blade's square: just before the guardian's door (between it and where you arrive)
   ============================================================ */
/* (4.32) the same at every village now: one captain on the guardian, one commander on the ancestor (Fire had two
   captains, Earth two of each) — and the finals one fight of nine waves (unFightFinals) */
const UN_FORCES = { grass:{ captains:1, commanders:1 }, water:{ captains:1, commanders:1 }, fire:{ captains:1, commanders:1 }, earth:{ captains:1, commanders:1 } };
function unV(k){ return jgGround().places.villages[k]; }
function unB(k){ const s = unV(k).stand; return { x:s.x, y:s.y - 1 }; }
const _unPlaces = {};
function unPlace(k){
  if(_unPlaces[k]) return _unPlaces[k];
  const B = unB(k), F = UN_FORCES[k];
  const at = (dx, dy, faceR)=> ({ x:B.x + dx, y:B.y + dy, faceR:!!faceR });
  const rows = n=> n === 1 ? [0] : n === 2 ? [-1, 1] : [-1, 0, 1];
  return (_unPlaces[k] = {
    B,
    /* the unsealing: the guardian to the blade's left, the King to its right, you before it; four of the tribe watching */
    g:at(-2, 0, true), king:at(2, 0, false), you:at(0, 3, false),
    watch:[at(-4, 1, true), at(-3, 3, true), at(4, 1, false), at(3, 3, false)],
    /* the commander's vanguard, come running at the light — (4.28) six, as its six waves: the commander at their head,
       two of its aliens behind it, its captain behind them between two more */
    van:[at(4, 2, false), at(5, 1, false), at(5, 3, false), at(6, 2, false), at(6, 0, false), at(6, 4, false)],
    /* the siege: back to back — the guardian facing the captains (left), the ancestor the commanders (right); the King,
       spent, below them */
    sg:at(-1, 0, false), sanc:at(0, 0, true), sking:at(1, 2, false),
    caps:rows(F.captains).map(dy=> at(-3, dy, true)), coms:rows(F.commanders).map(dy=> at(2, dy, false)),
  });
}
/* the twelve, one of each kind, on a ring round the middle of the village: each with a fairy on either side */
const _unRing = {};
function unSiegeSpots(k){
  if(_unRing[k]) return _unRing[k];
  const V = unV(k), L = V.lodge, P = unPlace(k), B = P.B, S = warSpots(k);
  const key = (x, y)=> x + ',' + y, held = new Set();
  const hold = (x0, y0, x1, y1)=>{ for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++) held.add(key(x, y)); };
  hold(L.x - 1, L.y - 2, L.x + L.w, L.y + L.h);                         // the lodge, and its guardian at the door
  hold(B.x - 6, B.y - 2, B.x + 6, B.y + 4);                              // the fight in the middle, the King, you
  hold(S.anc.x - 1, S.anc.y - 2, S.anc.x + 1, S.anc.y + 1);              // where the ancestor stays, after
  if(typeof questBars === 'function') (questBars()[k] || []).forEach(b=> b.sq.forEach(([x, y])=> hold(x - 2, y - 2, x + 2, y + 2)));   // the ways in
  jgFinds().forEach(f=> held.add(key(f[0], f[1])));
  const free = (x, y)=> !held.has(key(x, y)) && !jgSolidAt(x, y) && jgVillageAt(x, y) === k && jgTile(x, y) === JG_T.VILLAGE;
  /* (its square open above or below: a Rift Ambush leaves you on it, between its two fairies) */
  const fits = (x, y)=> free(x - 1, y) && free(x, y) && free(x + 1, y) && (!jgSolidAt(x, y - 1) || !jgSolidAt(x, y + 1));
  const R = jgRng((JG.seed ^ (0x3c1e + WAR_ORDER.indexOf(k) * 1031)) >>> 0);
  const kinds = JG_ALIEN_IDS.slice();
  for(let i = kinds.length - 1; i > 0; i--){ const j = Math.floor(R() * (i + 1)); const t = kinds[i]; kinds[i] = kinds[j]; kinds[j] = t; }
  const cands = [];
  for(let y = V.y + 1; y < V.y + V.h - 1; y++) for(let x = V.x + 1; x < V.x + V.w - 1; x++) cands.push({ x, y });
  const list = [], n = kinds.length;
  for(let i = 0; i < n; i++){
    const th = -Math.PI / 2 + (i + 0.5) * (Math.PI * 2 / n);
    const ix = V.cx + Math.cos(th) * V.rx * 0.64, iy = V.cy + Math.sin(th) * V.ry * 0.64;
    const best = cands.filter(c=> fits(c.x, c.y)).sort((a, c)=> Math.hypot(a.x - ix, a.y - iy) - Math.hypot(c.x - ix, c.y - iy))[0];
    if(!best) continue;
    hold(best.x - 3, best.y - 2, best.x + 3, best.y + 1);                // its ground, and room above for the pictures
    const folk = (typeof JG_VILLAGE_FOLK !== 'undefined' && JG_VILLAGE_FOLK[k]) || JG_TRIBES[k].members;
    list.push({ id:`un-${k}-${i}`, x:best.x, y:best.y, sp:kinds[i], face:i % 2 ? 'l' : 'r',
                fairies:[{ x:best.x - 1, y:best.y, faceR:true, sprite:folk[i % folk.length] }, { x:best.x + 1, y:best.y, faceR:false, sprite:folk[(i + 1) % folk.length] }] });
  }
  return (_unRing[k] = list);
}
/* the siege's aliens, as the jungle's bands (jgBands): fought, glared at, ambushed as any — but they never wander or
   look about (calm for ever), and once beaten stay beaten */
const _unSiegeBands = {};
function unSiegeBandsOf(k){
  if(_unSiegeBands[k]) return _unSiegeBands[k];
  return (_unSiegeBands[k] = unSiegeSpots(k).map(s=>{
    const b = { id:s.id, rank:'alien', x:s.x, y:s.y, hx:s.x, hy:s.y, face:s.face, tribe:k, war:k, siege:k, lv:UN.siegeLv, aliens:[s.sp], lead:s.sp };
    Object.defineProperty(b, 'calm', { get(){ return Infinity; }, set(){}, enumerable:true });
    return b;
  }));
}
function unSiegeLeft(k){ const won = unWar().siege[k] || {}; return unSiegeSpots(k).filter(s=> !won[s.id]); }
/* the commander's vanguard: four of its aliens (the village's own four, every time: until 4.28 the first two only), its
   captain and the commander */
function unVanAliens(k){
  const i = WAR_ORDER.indexOf(k) * 5 + 3, n = JG_ALIEN_IDS.length;
  return [JG_ALIEN_IDS[i % n], JG_ALIEN_IDS[(i + 7) % n], JG_ALIEN_IDS[(i + 3) % n], JG_ALIEN_IDS[(i + 10) % n]];
}
/* one of the vanguard's figures (P.van[i]): the commander (0), its captain (3), its aliens (the rest) */
function unVanFig(k, i){
  const al = unVanAliens(k), who = i === 0 ? JG_COMMANDER : i === 3 ? JG_CAPTAIN : al[i < 3 ? i - 1 : i - 2];
  return { cls:'jg-npc war-alien un-van' + (i === 0 ? ' war-commander' : i === 3 ? ' un-van-cap' : ''),
           html:`<div class="war-fig">${jgMonImg(who, WALK_T * (i === 0 ? 1.9 : i === 3 ? 1.6 : 1.35))}</div>` };
}

/* ---------- the story at a village ----------
   escort (he follows you there) → arrive (at the blade's place; met: their words said) → opened (the ancestor awake,
   wild) → beaten (calmed: its words, the alarm) → alarm (the vanguard on you) → siege (the twelve, then the captain and
   the commander) → won (their words, the King home) → done */
function unPhase(k){
  const r = unRite(k), e = unEscort();
  if(r.done) return 'done';
  if(!e || e.k !== k) return null;
  if(!r.arrived) return 'escort';
  if(!r.opened) return 'arrive';
  if(!r.beaten) return 'opened';
  if(!r.alarm) return 'beaten';
  if(!r.siege) return 'alarm';
  if(!r.won) return 'siege';
  return 'won';
}
/* the war's present village, while the King is there (arrived, not yet home) */
function unAt(){ const e = unEscort(); return e && unRite(e.k).arrived && !unRite(e.k).done ? e.k : null; }
function unSiegeOn(){ const k = unAt(); return k && unRite(k).siege && !unRite(k).won ? k : null; }
/* for the castle and the jungle (20, 21, 22-war.js): who is where */
function unKingHome(){ return !unEscort(); }                                        // in his throne room
function unGuardHome(k){ return !unRite(k).arrived || !!unRite(k).done ? ui.unGuardOut !== k : false; }   // at its door
function unFolkAway(k){ return unAt() === k || ui.unArriving === k; }              // the tribe's people: watching, or fighting
function unAncHome(k){ return !!warState().calmed[k] && unDone(k); }               // the ancestor, by the lodge, after
function unKingDue(){
  const st = warStage();
  return !!(st && JG_TRIBES[st] && !unEscort() && !unResting());
}
function unKingSpent(){ const k = unAt(); return !!(k && unRite(k).opened); }

/* ============================================================
   THE ACTORS: everyone this adds to the jungle, drawn afresh with it (jgRender)
   ============================================================ */
function unActs(){ return ui.unActs || (ui.unActs = {}); }
function unAct(id, o){
  const world = $('#walkWorld');
  if(!world) return null;
  const A = unActs();
  let a = A[id];
  if(!a || !a.el.isConnected){
    const el = document.createElement('div');
    el.id = 'unA-' + id;
    /* the King behind you where you stand on one row (his horse is wide): before your picture in the world */
    const me = id === 'king' && document.getElementById('walkYou');
    if(me && me.parentNode === world) world.insertBefore(el, me); else world.appendChild(el);
    a = A[id] = { id, el, dx:0 };
  }
  Object.assign(a, o);
  a.el.className = 'walk-ent un-act ' + (a.cls || 'jg-npc');
  if(o.html != null && o.html !== a.html0){ a.el.innerHTML = o.html; a.html0 = o.html; }
  unActPlace(a);
  return a;
}
function unActPlace(a){
  const T = WALK_T;
  a.el.style.transform = `translate3d(${((a.x + (a.dx || 0)) * T).toFixed(1)}px,${(a.y * T).toFixed(1)}px,0)`;
  a.el.style.zIndex = 10 + a.y + (a.dz || 0);
  faceRight(a.el, !!a.faceR);
}
function unActGone(id, ms){
  const a = unActs()[id];
  if(!a) return;
  delete unActs()[id];
  if(!ms){ a.el.remove(); return; }
  ms = Math.max(1, Math.round(ms * SCENE_SPEED));
  a.el.style.transition = `opacity ${ms}ms ease`;
  a.el.style.opacity = '0';
  setTimeout(()=> a.el.remove(), ms + 40);
}
function unSolidAt(x, y){
  const A = ui.unActs;
  if(!A) return false;
  for(const id in A){ const a = A[id]; if(a.solid && a.x === x && a.y === y && a.el.isConnected) return true; }
  return false;
}
/* a step (or a glide of `ms`) to (x, y), turned the way it goes */
function unActMove(id, x, y, ms){
  const a = unActs()[id];
  if(!a) return Promise.resolve();
  if(x !== a.x) a.faceR = x > a.x;
  a.x = x; a.y = y; a.dx = 0;
  const t = Math.max(1, Math.round((ms || 200) * SCENE_SPEED));
  a.el.style.transition = `transform ${t}ms linear`;
  unActPlace(a);
  return new Promise(r=> setTimeout(r, t));
}
/* a leap, in an arc (over the trees) */
function unActLeap(id, x, y, ms){
  const a = unActs()[id];
  if(!a) return Promise.resolve();
  ms = Math.max(1, Math.round(ms * SCENE_SPEED));
  const T = WALK_T, from = { x:a.x + (a.dx || 0), y:a.y }, el = a.el, art = el.querySelector('img');
  if(x !== a.x) a.faceR = x > a.x;
  a.x = x; a.y = y; a.dx = 0;
  faceRight(el, !!a.faceR);
  const at = (q)=> `translate3d(${(q.x * T).toFixed(1)}px,${(q.y * T).toFixed(1)}px,0)`;
  el.style.transition = 'none';
  el.style.zIndex = 12 + Math.max(from.y, y);
  el.style.transform = at({ x, y });
  if(typeof el.animate !== 'function' || jgReduced()){ unActPlace(a); return Promise.resolve(); }
  const run = el.animate([{ transform:at(from) }, { transform:at({ x, y }) }], { duration:ms, easing:'ease-in-out' });
  if(art) art.animate([{ transform:'translateY(0)' }, { transform:`translateY(${(-1.15 * T).toFixed(1)}px)`, offset:0.45 }, { transform:'translateY(0)' }], { duration:ms, easing:'ease-in-out' });
  return run.finished.catch(()=>{}).then(()=>{ if(el.isConnected){ el.style.transition = ''; unActPlace(a); } });
}
/* a path over open ground, (from) not in it; `stop(x, y)` squares it may not cross; null if there is none */
function unPath(from, to, stop){
  if(!from || !to) return null;
  if(from.x === to.x && from.y === to.y) return [];
  const W = JG.W, seen = new Map(), q = [[from.x, from.y]];
  seen.set(from.y * W + from.x, -1);
  while(q.length){
    const [x, y] = q.shift();
    for(const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const nx = x + dx, ny = y + dy, i = ny * W + nx;
      if(seen.has(i) || jgSolidAt(nx, ny) || (stop && stop(nx, ny) && !(nx === to.x && ny === to.y))) continue;
      seen.set(i, y * W + x);
      if(nx === to.x && ny === to.y){
        const out = [];
        for(let c = i; c !== from.y * W + from.x; c = seen.get(c)) out.unshift({ x:c % W, y:Math.floor(c / W) });
        return out;
      }
      if(Math.abs(nx - from.x) + Math.abs(ny - from.y) < 90) q.push([nx, ny]);
    }
  }
  return null;
}

/* ============================================================
   THE KING, AT YOUR HEELS (as the whalelord was): a step behind; where Lucesco leaps, he leaps after — onto the square
   you leapt from as you go, and over, as you step on from where you landed. Within 3 squares of an alien, his beam
   follows Lucesco's Pulsar Glare (or his Rift Ambush), once a band.
   ============================================================ */
const UN_KING_HTML = ()=> jgMonImg('fairy_king_mounted_c_front', WALK_T * 2.3, false, 'fairy_king_c_front');
const UN_KING_FOOT = ()=> jgMonImg('fairy_king_c_front', WALK_T * 1.75);
function unKingDraw(){
  const e = unEscort();
  if(!e) return null;
  return unAct('king', { x:e.x, y:e.y, faceR:!!e.faceR, solid:false, cls:'jg-npc war-king un-king', html:UN_KING_HTML() });
}
function unKingAt(){ const a = unActs().king, e = unEscort(); return a ? { x:a.x, y:a.y } : e ? { x:e.x, y:e.y } : null; }
function unKingNear(p, n){ const k = unKingAt(); return !!(k && p && ui.screen === JG_KEY && Math.max(Math.abs(k.x - p.x), Math.abs(k.y - p.y)) <= n); }
function unFollowing(){ const e = unEscort(); return !!(e && !unRite(e.k).arrived); }
function unKingTo(x, y, how, ms){
  const e = unEscort();
  if(!e) return;
  if(x !== e.x) e.faceR = x > e.x;
  e.x = x; e.y = y;
  const a = unActs().king;
  if(!a || !a.el.isConnected){ unKingDraw(); return; }
  if(how === 'leap') unActLeap('king', x, y, ms || 560);
  else unActMove('king', x, y, ms || (how === 'glide' ? 380 : 200));
  jgSeeThrough();
}
/* a step: he takes the square you left — if he is with you (within two of it) */
function unKingFollow(prev, cur){
  if(!unFollowing() || !prev) return;
  const k = unKingAt(), d = Math.max(Math.abs(k.x - prev.x), Math.abs(k.y - prev.y));
  if(!d || d > 2) return;                                                // left behind: he waits where he is
  const over = d === 2 && jgSolidAt((k.x + prev.x) >> 1, (k.y + prev.y) >> 1);
  unKingTo(prev.x, prev.y, over ? 'leap' : d === 2 ? 'glide' : 'walk');
}
/* back from a fight (or a pounce) a few squares off: he has caught up, beside you */
function unKingCatchUp(p){
  const e = unEscort();
  if(!e || !p || unRite(e.k).arrived) return;
  const d = Math.max(Math.abs(e.x - p.x), Math.abs(e.y - p.y));
  if(d <= 1 || d > 4) return;
  const back = { l:[1, 0], r:[-1, 0], u:[0, 1], d:[0, -1] }[walkState().face] || [0, 1];
  const opts = [back, [0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy])=> ({ x:p.x + dx, y:p.y + dy }));
  const s = opts.find(q=> !jgSolidAt(q.x, q.y) && !jgBandAt(q.x, q.y) && !jgFolkAt(q.x, q.y) && !wBlockedBy(JG_DECK, q.x, q.y));
  if(s){ e.faceR = s.x < p.x; e.x = s.x; e.y = s.y; }
}
function unKingTalkField(){
  return unLines([['king', caTurnJ('unKingField', UN_KING_FIELD)]], null);
}
/* his beam: from his raised hand to the alien; the fight it begins takes 15% more and starts confused (jgEdgeApply) */
function unKingCanBeam(b){
  if(!b || jgBandBeaten(b) || !unEscort() || unKingSpent()) return false;
  if(b._kingBeamUntil && b._kingBeamUntil > Date.now()) return false;    // he has already fired at it (Pulsar Glare): not again for its ambush
  return unKingNear(b, UN.beamNear);
}
function unKingBeamSoon(b, ready, delay, until){
  b._kingBeamUntil = until;
  const t0 = Date.now();
  const tick = ()=>{
    if(ui.screen !== JG_KEY) return;
    if(!ready() && Date.now() - t0 < 2500) return setTimeout(tick, 40);
    setTimeout(()=> unKingBeam(b), delay);
  };
  tick();
}
function unKingBeam(b){
  const world = $('#walkWorld'), a = unActs().king, el = ui.jgBandEls && ui.jgBandEls[b.id];
  if(!world || !a || !a.el.isConnected) return;
  const T = WALK_T;
  const kAt = jgDrawnAt(a.el) || { x:a.x * T, y:a.y * T }, bAt = (el && jgDrawnAt(el)) || { x:b.x * T, y:b.y * T };
  const fx = kAt.x + 0.5 * T, fy = kAt.y - 0.62 * T, tx = bAt.x + 0.5 * T, ty = bAt.y + 0.42 * T;
  const len = Math.hypot(tx - fx, ty - fy), ang = Math.atan2(ty - fy, tx - fx) * 180 / Math.PI;
  if(Math.abs(tx - fx) > 2){ a.faceR = tx > fx; faceRight(a.el, a.faceR); const e = unEscort(); if(e) e.faceR = a.faceR; }
  const beam = document.createElement('div');
  beam.className = 'un-kbeam';
  beam.style.cssText = `left:${fx.toFixed(1)}px;top:${fy.toFixed(1)}px;width:${len.toFixed(1)}px;transform:rotate(${ang.toFixed(2)}deg)`;
  beam.innerHTML = '<i></i><b></b>';
  world.appendChild(beam);
  a.el.classList.add('un-cast', 'jg-fx-on');
  playSfx('spark');
  setTimeout(()=>{ beam.classList.add('out'); a.el.classList.remove('un-cast', 'jg-fx-on'); setTimeout(()=> beam.remove(), 280); }, 820);
}
/* the fight it begins: 15% more of its first alien's health, and its mind clouded */
function unKingBeamApply(bt, b){
  const e = bt.enemies.find(x=> x && x.jg && x.jg.alien && x.hp > 0);
  if(!e) return;
  e.hp = Math.max(1, Math.round(e.hp - e.maxHp * UN.beamCut));
  markConfused(e, null, false, rollSelf());
  const conf = !!getEStatus(e, 'discombobulate');
  const said = `The Fairy King's beam! The ${SPECIES[e.species].name} loses ${Math.round(UN.beamCut * 100)}% more of its HP${conf ? ', and its mind is clouded: confused' : ''}.`;
  bt.jgEdgeSaid = (bt.jgEdgeSaid ? bt.jgEdgeSaid + ' ' : '') + said;
  setTimeout(()=>{
    if(ui.battle !== bt) return;
    renderBattle();
    if(typeof floatOver === 'function') floatOver(e, conf ? 'CONFUSED' : 'BEAM');
    battleMsg(said);
  }, 2900);
}
/* Where to?: back to him */
function unChooserOpt(pic){
  const e = unEscort();
  if(!e) return null;
  const k = unAt();
  return { k:'king', pic:pic('fairy_king_mounted_c_front', '👑'), name:'The Fairy King', sub:k ? `At ${questTribe(k)}'s village` : 'Where you left him' };
}
function unToKing(){
  const e = unEscort();
  if(!e || !jgPortalAwake()) return false;
  const at = unKingAt() || { x:e.x, y:e.y };
  const P = unAt() ? unPlace(unAt()).you : null;
  const ring = [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [0, 2], [-2, 0], [2, 0]];
  let s = P && !jgSolidAt(P.x, P.y) ? P : null;
  for(const [dx, dy] of ring){
    if(s) break;
    const q = { x:at.x + dx, y:at.y + dy };
    if(!jgSolidAt(q.x, q.y) && !jgBandAt(q.x, q.y) && !jgFolkAt(q.x, q.y) && !wBlockedBy(JG_DECK, q.x, q.y)) s = q;
  }
  s = s || at;
  const w = walkState();
  w.at = w.at || {};
  w.at[JG_KEY] = { x:s.x, y:s.y }; jgState().at = { x:s.x, y:s.y };
  w.face = 'u';
  ui.walkFresh = false; ui.jgLion = null;
  goDeck(JG_KEY);
  return true;
}

/* ============================================================
   THE VILLAGE, AS THE STORY HAS IT (drawn with the jungle; the scenes move them about)
   ============================================================ */
function unAncHtml(k, white){
  const img = jgMonImg(warAncId(k) + '_front', WALK_T * 2.5);
  /* (its white shape over it, and the two grown together from its feet: .un-morph) */
  return white ? `<div class="un-morph">${img}${img.replace('class="jg-art"', 'class="jg-art un-sil"')}</div>` : img;
}
function unBurstHtml(k, dx, dy, big){
  return `<i class="un-burst un-b-${k}${big ? ' un-big' : ''}" style="left:${50 + dx * 100}%;top:${36 + dy * 100}%"><b></b><b></b><b></b><b></b><b></b></i>`;
}
function unVillageDraw(k){
  const ph = unPhase(k);
  if(!ph || ph === 'escort' || ph === 'done') return;
  const P = unPlace(k), B = P.B, T = JG_TRIBES[k], pre = ph === 'arrive' || ph === 'opened' || ph === 'beaten' || ph === 'alarm';
  const gImg = jgMonImg(T.guardian, WALK_T * 1.6);
  /* the guardian; the King; the blade, or the ancestor */
  if(pre) unAct('g', { x:P.g.x, y:P.g.y, faceR:P.g.faceR, solid:true, cls:'jg-npc un-g', html:gImg });
  else {
    const caps = ph === 'siege' ? P.caps : [];
    unAct('g', { x:P.sg.x, y:P.sg.y, faceR:false, solid:true, cls:'jg-npc un-g' + (ph === 'siege' ? ' un-jab' : ' un-cheer'),
      html:gImg + caps.map(c=> unBurstHtml(k, c.x - P.sg.x, c.y - P.sg.y, false)).join('') });
  }
  if(ph === 'arrive') unAct('king', { x:P.king.x, y:P.king.y, faceR:false, solid:true, cls:'jg-npc war-king un-king', html:UN_KING_HTML() });
  else unAct('king', Object.assign({}, pre ? P.king : P.sking, { solid:true, cls:'jg-npc un-king un-spent', html:UN_KING_FOOT() }));
  if(ph === 'opened') unAct('anc', { x:B.x, y:B.y, faceR:false, solid:true, cls:'jg-npc war-anc un-anc un-wild anc-' + k, html:unAncHtml(k) });
  else if(pre && ph !== 'arrive') unAct('anc', { x:B.x, y:B.y, faceR:false, solid:true, cls:'jg-npc war-anc un-anc anc-' + k, html:unAncHtml(k) });
  else if(!pre){
    const coms = ph === 'siege' ? P.coms : [];
    unAct('anc', { x:P.sanc.x, y:P.sanc.y, faceR:true, solid:true, cls:'jg-npc war-anc un-anc anc-' + k + (ph === 'siege' ? ' un-jab' : ' un-cheer'),
      html:unAncHtml(k) + coms.map(c=> unBurstHtml(k, c.x - P.sanc.x, c.y - P.sanc.y, true)).join('') });
  }
  /* the tribe, watching (until the alarm) */
  if(ph === 'arrive' || ph === 'opened' || ph === 'beaten'){
    const folk = (typeof JG_VILLAGE_FOLK !== 'undefined' && JG_VILLAGE_FOLK[k]) || T.members;
    P.watch.forEach((s, i)=> unAct('w' + i, { x:s.x, y:s.y, faceR:s.faceR, solid:true, cls:'jg-folk un-watch', html:jgFolkImg(folk[i % folk.length]) }));
  }
  /* the commander's vanguard, waiting for you */
  if(ph === 'alarm') P.van.forEach((s, i)=> unAct('v' + i, Object.assign({ x:s.x, y:s.y, faceR:s.faceR, solid:true }, unVanFig(k, i))));
  /* the siege: the captains and the commanders on the guardian and the ancestor; the twelve, each between two fairies */
  if(ph === 'siege'){
    P.caps.forEach((c, i)=> unAct('cap' + i, { x:c.x, y:c.y, faceR:true, solid:true, cls:'jg-npc war-alien un-boss',
      html:`<div class="war-fig">${jgMonImg(JG_CAPTAIN, WALK_T * 1.6, true)}</div>` + warSlashHtml(P.sg.x - c.x, (P.sg.y - c.y) / 2) }));
    P.coms.forEach((c, i)=> unAct('com' + i, { x:c.x, y:c.y, faceR:false, solid:true, cls:'jg-npc war-alien war-commander un-boss',
      html:`<div class="war-fig">${jgMonImg(JG_COMMANDER, WALK_T * 1.9)}</div>` + warSlashHtml(-1.7, (P.sanc.y - c.y) / 2) }));
  }
  if(ph === 'siege' || ph === 'won'){
    const won = unWar().siege[k] || {};
    unSiegeSpots(k).forEach((s, i)=>{
      const beaten = !!won[s.id] || ph === 'won';
      s.fairies.forEach((f, j)=>{
        const toward = s.x - f.x;
        unAct('sf' + i + j, { x:f.x, y:f.y, faceR:f.faceR, solid:true, cls:'jg-folk un-sf ' + (beaten ? 'un-cheer' : 'un-jab'),
          html:jgFolkImg(f.sprite) + (beaten ? '' : unBurstHtml(k, toward, 0, false)) });
        const a = unActs()['sf' + i + j];
        if(a) a.el.style.setProperty('--sd', ((i * 0.37 + j * 1.1) % 2.2).toFixed(2) + 's');
      });
    });
  }
}

/* ============================================================
   THE FIGHTS
   ============================================================ */
function unAlienSpec(sp, lv){
  const a = JG_ALIENS[sp], rank = a.rank || 'alien', plus = JG.plus[rank];
  const vh = a.el || JG_ELEMENTS[Math.floor(Math.random() * JG_ELEMENTS.length)];
  return { species:sp, level:lv, ai:'best', nerfed:false, anyLevel:true, jg:{ alien:rank, el:a.el, plus, lastVh:vh }, veryHigh:{ type:vh, plus, cast:true } };
}
function unCaptive(k, boss){
  const m = JG_TRIBES[k].members;
  return { species:m[Math.floor(Math.random() * m.length)], level:JG.fairyLv[0], ai:'best', nerfed:false, anyLevel:true, jg:{ mind:true, tribe:k },
           veryHigh:boss ? { type:'Fairy', plus:0, cast:true } : undefined };
}
function unPick(){ return JG_ALIEN_IDS[Math.floor(Math.random() * JG_ALIEN_IDS.length)]; }
/* a fight of the war's own, as the jungle's (its waves' looks, the captives freed, the victory page, back where you were) */
function unBattle(k, id, waves, name, onWin, music){
  if(ui.jgFighting) return false;
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first. Rest by the tavern fire in the castle.'); return false; }
  ui.jgFighting = true;
  releaseKeys();
  jgSave(true);
  const mus = music || JG_FIGHT_MUSIC;
  const begin = ()=>{
    ui.jgFighting = false;
    ui.jgFight = { id, rank:'commander', tribe:k, waves:waves.length, war:true };
    beginBattle({ waves, isNpc:false, allowCatch:true, name, bgKey:'battle_jungle', foeRegion:6, encounter:true, encounterMusic:mus,
      onWaveStart:(i)=> jgWaveStart(i), onWin, onLose:()=>{ ui.jgFight = null; return unLost(k); } });
    if(ui.battle) ui.battle.jungle = id;
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin, mus); else begin();
  return true;
}
/* for jgWon: what it counts (a commander's band), its XP (one share a leader), its people freed */
function unPseudo(k, what, aliens){
  const B = unB(k);
  return { id:`un-${what}-${k}`, rank:'commander', tribe:k, war:k, aliens, lead:JG_COMMANDER, lv:UN.siegeLv, x:B.x, y:B.y };
}
function unFightAncestor(k){
  if(!battleParty().some(m=> m.currentHp > 0)){ toast('Your team needs healing first. Rest by the tavern fire in the castle.'); return false; }
  releaseKeys();
  jgSave(true);
  const mus = ['battle_legendary', 'battle_boss'];
  const begin = ()=>{
    ui.jgFight = null;
    beginBattle(ancBattle(warAncId(k), { encounter:true, encounterMusic:mus, onWin:()=> unAncestorWon(k), onLose:()=> unLost(k) }));
  };
  if(typeof walkEncounter === 'function') walkEncounter(begin, mus); else begin();
  return true;
}
function unAncestorWon(k){
  const r = unRite(k), w = warState();
  r.beaten = true;
  w.calmed[k] = true;
  saveProfile();
  jgBack();                                                              // where you stood: everyone where they were
}
/* (4.28) An army's waves — the designer: "commanders must have 6 waves. the ones invading the villages had 3 (at least
   the first commander did)". A commander's, six, as every commander's band in the jungle and the castle: four of its
   aliens, each between two of the tribe's people in its grip; its captain; the commander. A captain's own, three: two
   aliens, the captain. The captain and the commander come with two aliens beside them, as they always have here. */
function unArmy(k, lead, aliens){
  const lv = UN.siegeLv, boss = sp=> [unAlienSpec(unPick(), lv), unAlienSpec(sp, lv), unAlienSpec(unPick(), lv)];
  const waves = aliens.map(sp=> [unCaptive(k), unAlienSpec(sp, lv), unCaptive(k)]);
  if(lead === JG_COMMANDER) waves.push(boss(JG_CAPTAIN));
  waves.push(boss(lead));
  return waves;
}
const unLeads = waves=> waves.map(w=> w[1].species);                    // for jgWon: one share of XP a wave
function unFightVanguard(k){
  const waves = unArmy(k, JG_COMMANDER, unVanAliens(k));               // the four on the map, the captain, the commander
  return unBattle(k, 'un-van-' + k, waves, `Commander ${SPECIES[JG_COMMANDER].name}'s vanguard`, (levelUps)=>{
    unRite(k).siege = true;
    saveProfile();
    jgWon(unPseudo(k, 'van', unLeads(waves)), levelUps);
  }, ['battle_boss', 'battle_region6']);
}
/* the finals — (4.32) the designer: "the tribe final fight after ancestor unsealing should be 9 waves long: 1 Captain (3
   waves ending with him) and 1 commander (6 waves ending with Captain penultimate and commander final wave), back to
   back like one continuous fight 9 waves in one go." The captain's band, then the commander's army, every tribe
   (until 4.32: Grass and Water 6 waves, Fire 9, Earth 12) */
function unFightFinals(k){
  const waves = [], picks = n=> Array.from({ length:n }, ()=> unPick());
  waves.push(...unArmy(k, JG_CAPTAIN, picks(2)));
  waves.push(...unArmy(k, JG_COMMANDER, picks(4)));
  const nm = 'The captain and the commander';
  return unBattle(k, 'un-fin-' + k, waves, nm, (levelUps)=>{
    unRite(k).won = true;
    saveProfile();
    jgWon(unPseudo(k, 'fin', unLeads(waves)), levelUps);
  }, ['battle_boss', 'battle_region6']);
}
/* lost, at the village: the tribe's fairies carry you to the castle, by the tavern fire; the King waits */
function unLost(k){
  return new Promise(res=>{
    const T = JG_TRIBES[k];
    storyModal(jgMonImg(T.guardian, 140), 'Back at the castle',
      `<b>"Easy — we've got you."</b><br><br>The fairies of ${questTribe(k)} pulled you clear of the fighting and carried you all the way to the castle. You wake by the tavern fire.` +
      `<br><br><i>Rest here to heal your team. The King is still at their village: from Explore, choose the Fairy King to go straight back to him.</i>`,
      ()=>{ res(); const t = caGrounds().tags.tavern; caGo(CA_KEY, [t.door[0], 32]); }, { subtitle:T.name.replace(/^the /, 'The '), bg:'jungle' });
  });
}

/* ============================================================
   THE SCENES
   ============================================================ */
const unGone = ()=> ui.screen !== JG_KEY;
const unWaitMs = ms=> new Promise(r=> setTimeout(r, ms * SCENE_SPEED));
/* how long a line plays by itself (sceneSay's own reckoning) */
function unAutoMs(html, pace){
  const n = String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
  return Math.max(2400, Math.min(9500, 1500 + n * 42)) * (pace || 1) * SCENE_SPEED;
}
/* a scene: nobody moves but as it says (no steps, no bands, no taps on the map); resolves with what `fn` gives */
async function unScene(fn){
  if(ui.unBusy) return false;
  const w = walkState();
  ui.unBusy = true; ui.sceneRunning = true; w.busy = true;
  releaseKeys(); jgHold(true);
  try { return await fn(); }
  catch(e){ console.error('unseal scene:', e); return false; }
  finally {
    ui.unBusy = false; ui.sceneRunning = false; jgHold(false);
    if(ui.screen === JG_KEY){ walkState().busy = false; walkState().actSig = null; refreshWalk(); }
  }
}
function unActCls(id, cls, on){
  const a = unActs()[id];
  if(!a) return;
  const set = new Set((a.cls || '').split(' ').filter(Boolean));
  cls.split(' ').forEach(c=> on ? set.add(c) : set.delete(c));
  a.cls = [...set].join(' ');
  a.el.className = 'walk-ent un-act ' + a.cls;
  faceRight(a.el, !!a.faceR);
}
function unLook(k, ms){ const B = unB(k); return sceneLook({ x:B.x - 3, y:B.y - 3, w:7, h:7 }, { ms:ms || 800 }); }
async function unCurtainUp(){ if(!document.getElementById('sceneCurtain')) return; await sceneCurtainText('', 250); await sceneCurtain(false, 700); }
/* you walk `path` (slowly: ms a step), and `fol` takes each square you leave */
async function unLeadWalk(path, fol, ms){
  const w = walkState(), p = w.at && w.at[JG_KEY], me = $('#walkYou'), world = $('#walkWorld');
  if(!p || !me || !world || !path) return;
  const t = Math.max(1, Math.round(ms * SCENE_SPEED));
  me.style.transition = `transform ${t}ms linear`; world.style.transition = `transform ${t}ms linear`;
  try {
    for(const s of path){
      if(unGone()) return;
      const prev = { x:p.x, y:p.y }, dx = s.x - p.x, dy = s.y - p.y;
      w.face = dx > 0 ? 'r' : dx < 0 ? 'l' : dy > 0 ? 'd' : 'u';
      if(dx) w.faceX = dx > 0 ? 'r' : 'l';
      p.x = s.x; p.y = s.y;
      refreshWalk();
      if(fol === 'king') unKingTo(prev.x, prev.y, 'walk', ms);
      else if(fol) unActMove(fol, prev.x, prev.y, ms);
      jgSeeThrough(); jgShowBands(); jgShowFinds(); jgExplore(p.x, p.y);
      await unWaitMs(ms);
    }
  } finally {
    if(me.isConnected) me.style.transition = '';
    if(world.isConnected) world.style.transition = '';
    ui.unLastP = { x:p.x, y:p.y };
    jgSave(false);
  }
}
async function unActWalk(id, path, ms){ for(const s of path || []){ if(unGone()) return; await unActMove(id, s.x, s.y, ms); } }
function unTurn(id, faceR){ const a = unActs()[id]; if(a){ a.faceR = !!faceR; faceRight(a.el, a.faceR); } }

/* ---------- the south gate: the King sets out, alone ---------- */
async function unGateScene(k, first){
  const e = unEscort(), s = jgGround().places.castle.stand;
  if(!e){ await unCurtainUp(); return; }
  const court = ['gc', 'ga'].concat([0, 1, 2, 3, 4, 5, 6, 7].map(i=> 'gk' + i));
  await unScene(async ()=>{
    const W = (dx, dy, o)=> Object.assign({ x:s.x + dx, y:s.y + dy, solid:true }, o);
    unAct('gc', W(-2, -1, { faceR:true, cls:'jg-npc un-court', html:jgMonImg('chestnut_knight2_c_front', WALK_T * 1.6) }));
    unAct('ga', W(-1, -1, { faceR:true, cls:'jg-npc un-court', html:jgMonImg('fairybird1_c_front', WALK_T * 1.35) }));
    [-6, -5, -4, -3, 4, 5, 6, 7].forEach((dx, i)=> unAct('gk' + i, W(dx, -2, { faceR:dx < 0, cls:'jg-npc un-court un-still', html:jgMonImg('chestnut_knight2_front', WALK_T * 1.45) })));
    e.faceR = false;
    unKingDraw();
    await unCurtainUp();
    await unLines(first ? UN_GATE_FIRST : (UN_GATE_AGAIN[k] || UN_GATE_AGAIN.grass), k);
    unWar().gate = true;
    saveProfile();
    court.forEach(id=> unActGone(id, 900));                                // back in through the gate
    toast(`The King follows you. Lead him to ${questTribe(k)}'s village: Lucesco's pulse knows the way.`);
  });
}

/* ---------- at the village, with the King ---------- */
/* the siege: step up to the King and he says it himself (the designer: "If approached, he apologises that he can't
   fight") — playing by itself, at most once in 45 s */
function unKingApproach(p){
  const k = unAt();
  if(!k || unPhase(k) !== 'siege' || !p || ui.unBusy || ui.jgTalk || document.querySelector('.scene-say')) return;
  const a = unActs().king;
  if(!a || Math.max(Math.abs(a.x - p.x), Math.abs(a.y - p.y)) > 1 || Date.now() - (ui.unKingSaid || 0) < 45000) return;
  ui.unKingSaid = Date.now();
  unLines([['kingFoot', caTurnJ('unKingSiege', UN_SIEGE_KING)]], k, { auto:1 });
}
function unArriveCheck(p){
  const e = unEscort();
  if(!e || !p || unRite(e.k).arrived || ui.unBusy) return;
  const inside = jgVillageAt(p.x, p.y) === e.k;
  if(!inside){ ui.unSaidAlone = false; return; }
  if(unKingNear(p, 2)){ setTimeout(()=>{ if(!unGone()) unArrive(e.k); }, 120); return; }
  if(!ui.unSaidAlone){ ui.unSaidAlone = true; toast('The King is not with you. Go back for him: he cannot find the way alone.'); }
}
async function unArrive(k){
  const e = unEscort();
  if(!e || e.k !== k || unRite(k).arrived || ui.unBusy) return;
  const P = unPlace(k), V = unV(k), r = unRite(k);
  const ok = await unScene(async ()=>{
    const w = walkState(), p = w.at[JG_KEY];
    ui.unArriving = k; jgShowFolk();                                      // the tribe gathers to watch
    r.arrived = true;                                                     // (from here he stays: a scene cut short leaves him at his place)
    saveProfile();
    /* you lead him to the blade's place */
    const busy = (x, y)=> !!jgBandAt(x, y) || wBlockedBy(JG_DECK, x, y);
    const path = unPath(p, P.you, busy);
    if(path) await unLeadWalk(path, 'king', 300);
    else { p.x = P.you.x; p.y = P.you.y; refreshWalk(); }
    if(unGone()) return false;
    /* he to his place; the guardian out of its door to its own */
    ui.unGuardOut = k; questRefreshThings(); unGuardMarkOff(k);
    unAct('g', { x:V.guardian.x, y:V.guardian.y, dx:0.5, faceR:false, solid:true, cls:'jg-npc un-g', html:jgMonImg(JG_TRIBES[k].guardian, WALK_T * 1.6) });
    const mine = (x, y)=> x === P.you.x && y === P.you.y;
    const kp = unPath(unKingAt(), P.king, mine), gp = unPath({ x:V.guardian.x, y:V.guardian.y }, P.g, mine);
    await Promise.all([kp ? unActWalk('king', kp, 340) : unActMove('king', P.king.x, P.king.y, 300), gp ? unActWalk('g', gp, 360) : unActMove('g', P.g.x, P.g.y, 300)]);
    unTurn('king', false); unTurn('g', true);
    e.x = P.king.x; e.y = P.king.y; e.faceR = false;
    w.face = 'u'; refreshWalk();
    unVillageDraw(k);                                                     // the tribe, come out to watch
    await unLook(k, 700);
    await unLines(UN_ARRIVE[k], k);
    if(unGone()) return false;
    r.met = true;
    saveProfile();
    return true;
  });
  ui.unGuardOut = null; ui.unArriving = null;
  if(!unGone()) await sceneCamFree(500);
  if(ok && !unGone()) unReadyAsk(k);
}
/* (cut short before they were said) */
async function unArriveWords(k){
  const ok = await unScene(async ()=>{ await unLook(k, 600); await unLines(UN_ARRIVE[k], k); if(unGone()) return false; unRite(k).met = true; saveProfile(); return true; });
  if(!unGone()) await sceneCamFree(500);
  if(ok && !unGone()) unReadyAsk(k);
}
async function unReadyAsk(k){
  if(ui.jgTalk || ui.unBusy || unRite(k).opened) return;
  ui.jgTalk = true;
  releaseKeys();
  let yes = false;
  try { yes = await r5Ask([unFace('king', k)], 'The Fairy King', UN_READY_ASK, 'Begin the unsealing', 'Not yet'); }
  finally { ui.jgTalk = false; }
  if(yes && !unGone()) return unRitual(k);
  if(!unGone()) refreshWalk();
}

/* ---------- the unsealing ---------- */
function unBladeDown(k){
  const B = unB(k), img = jgMonImg('sealed_blade_' + k + '_front', WALK_T * 1.25);
  unAct('blade', { x:B.x, y:B.y, faceR:false, solid:true, cls:'jg-npc un-blade un-in', html:`<div class="un-morph">${img}${img.replace('class="jg-art"', 'class="jg-art un-sil"')}</div>` });
}
function unPillar(k, n){
  const world = $('#walkWorld');
  if(!world) return null;
  const B = unB(k), T = WALK_T, cx = (B.x + 0.5) * T, base = (B.y + 0.6) * T, H = 40 * T, Wd = 3 * T;
  let el = document.getElementById('unPillar'), pool = document.getElementById('unPool');
  if(!el){
    el = document.createElement('div');
    el.id = 'unPillar'; el.className = 'un-pillar';
    el.style.cssText = `left:${(cx - Wd / 2).toFixed(1)}px;top:${(base - H).toFixed(1)}px;width:${Wd.toFixed(1)}px;height:${H.toFixed(1)}px;`;
    el.innerHTML = '<i class="up-haze"></i><i class="up-glow"></i><i class="up-core"></i><i class="up-motes"></i>';
    world.appendChild(el);
    pool = document.createElement('div');
    pool.id = 'unPool'; pool.className = 'un-pool';
    pool.style.cssText = `left:${(cx - 1.7 * T).toFixed(1)}px;top:${(base - 0.5 * T).toFixed(1)}px;width:${(3.4 * T).toFixed(1)}px;height:${T.toFixed(1)}px;z-index:${10 + B.y}`;
    world.appendChild(pool);
    void el.offsetWidth;
  }
  [el, pool].forEach(x=>{ for(let j = 1; j <= 4; j++) x.classList.toggle('up' + j, j === n); });
  return el;
}
function unPillarPulse(){
  const el = document.getElementById('unPillar');
  if(!el) return;
  el.classList.remove('up-pulse'); void el.offsetWidth; el.classList.add('up-pulse');
  setTimeout(()=> el.classList.remove('up-pulse'), 950);
  unRing();
  unQuakeCrack(false);                                                   // (4.37) the ground cracks with it
}
function unRing(big){
  const pool = document.getElementById('unPool'), world = $('#walkWorld');
  if(!pool || !world) return;
  const r = document.createElement('i');
  r.className = 'un-ring' + (big ? ' un-big' : '');
  r.style.cssText = `left:${pool.style.left};top:${pool.style.top};width:${pool.style.width};height:${pool.style.height};z-index:${pool.style.zIndex}`;
  world.appendChild(r);
  setTimeout(()=> r.remove(), 1500);
}
/* (4.37) The designer: "when the king unseals (perfect poem in elvish by the way! :)) can it have some rumbling and
   vibrations please?" While he chants, the ground rumbles (33-catch.js's czSound.rumble, in the catch's hall), louder
   each chant; each chant's surge is the power-up (czSound.powerUp, stronger each time); the whole scene trembles with it
   (unQuake: smooth — three swings mixed, never quite the same twice — and stronger each chant); the ground cracks at each
   pulse of light (czSound.crack, and a jolt); and where the device can buzz (an Android phone: a page cannot make an iPhone
   buzz), a buzz each chant, longer each time. The seal giving way: all of it at its height, the ancestor rising out of
   it; then the ground stills as it stands. A device asking for less motion: the rumble and the buzz, no trembling. */
const UN_QUAKE = {
  chant:[0.03, 0.045, 0.065, 0.09],                                    // the tremor each chant (tiles, either way)
  rumble:[0.35, 0.5, 0.68, 0.85],                                      // the rumble each chant (and 1 as the seal gives way)
  power:[0.55, 0.7, 0.85, 1],                                          // the power-up each chant
  buzz:[[50, 60, 70], [70, 50, 90, 50, 110], [90, 40, 120, 40, 150], [110, 40, 140, 40, 170, 40, 220]],
  jolt:0.05, peak:0.16,                                                // a crack's jolt; the seal giving way
};
function unQuakeStill(){ return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; }
/* the tremor: towards `level` (tiles), smoothly; with any jolt on top, dying away */
function unQuake(level){
  const Q = ui.unQuake || (ui.unQuake = { cur:0, target:0, jolt:0, raf:0, ph:[0, 1, 2, 3].map(()=> Math.random() * 6.28) });
  Q.target = Math.max(0, level || 0);
  if(Q.raf || unQuakeStill() || (!Q.target && !Q.jolt)) return;
  let last = performance.now();
  const step = now=>{
    const el = $('#walkStage'), dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    Q.cur += (Q.target - Q.cur) * Math.min(1, dt * 2.5);
    Q.jolt = Math.max(0, Q.jolt - dt * Math.max(0.06, Q.jolt * 1.4));
    if(!el || (!Q.target && Q.cur < 0.0006 && Q.jolt < 0.0006)){ if(el) el.style.translate = ''; Q.raf = 0; Q.cur = Q.target ? Q.cur : 0; return; }
    const a = (Q.cur + Q.jolt) * WALK_T, s = now / 1000, P = Q.ph, w = f=> 2 * Math.PI * f * s;
    const x = a * (0.55 * Math.sin(w(9.1) + P[0]) + 0.3 * Math.sin(w(13.3) + P[1]) + 0.15 * Math.sin(w(4.7) + P[2]));
    const y = a * 0.7 * (0.6 * Math.sin(w(7.7) + P[3]) + 0.4 * Math.sin(w(11.9) + P[0]));
    el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    Q.raf = requestAnimationFrame(step);
  };
  Q.raf = requestAnimationFrame(step);
}
/* the n-th chant (1–4): its surge, the rumble and the tremor that much stronger, a buzz */
function unQuakeStage(n){
  const i = Math.max(0, Math.min(3, n - 1));
  if(!ui.unRumble && typeof czSound !== 'undefined' && czSound.rumble) ui.unRumble = czSound.rumble();
  if(ui.unRumble) ui.unRumble.set(UN_QUAKE.rumble[i], 1.2);
  if(typeof czSound !== 'undefined' && czSound.powerUp) czSound.powerUp({ level:UN_QUAKE.power[i] });
  unQuake(UN_QUAKE.chant[i]);
  if(typeof buzz === 'function') buzz(UN_QUAKE.buzz[i]);
}
/* a crack in the ground (`big`: the seal giving way): its sound, a jolt */
function unQuakeCrack(big){
  if(typeof czSound !== 'undefined' && czSound.crack) czSound.crack({ level:big ? 1 : 0.6 });
  unQuake(ui.unQuake ? ui.unQuake.target : 0);                            // (made, if it was not yet)
  const Q = ui.unQuake;
  Q.jolt = Math.max(Q.jolt, big ? UN_QUAKE.peak : UN_QUAKE.jolt);
  unQuake(Q.target);                                                     // (going, for the jolt)
}
/* the ground stills: the rumble fading over `secs`, the tremor with it (`now`: the tremor gone at once — the scene left) */
function unQuakeEnd(secs, now){
  if(ui.unRumble){ try { ui.unRumble.stop(secs == null ? 2.5 : secs); } catch(e){} ui.unRumble = null; }
  unQuake(0);
  const Q = ui.unQuake;
  if(now && Q){
    if(Q.raf) cancelAnimationFrame(Q.raf);
    Q.raf = 0; Q.cur = Q.jolt = 0;
    const el = $('#walkStage'); if(el) el.style.translate = '';
  }
}
function unRiteStage(k, i){
  const n = i + 1;
  ['king', 'blade'].forEach(id=>{ for(let j = 1; j <= 4; j++) unActCls(id, 'un-glow' + j, j === n); });
  unActCls('king', 'un-tremble', n >= 3);
  if(n === 1){ unActCls('blade', 'un-in', false); unActCls('blade', 'un-rise', true); setTimeout(()=> unActCls('blade', 'un-hover', true), 1300); }
  unPillar(k, n);
  unQuakeStage(n);                                                       // (4.37) the power-up, the ground rumbling and trembling (was 'power_up': the level-up's fanfare)
}
async function unRitual(k){
  const r = unRite(k);
  if(r.opened || ui.unBusy) return;
  const go = await unScene(async ()=>{
    await unLook(k, 900);
    /* he gets down, and lays the blade on the ground between them */
    await unLines([UN_RITE_OPEN[0]], k, { auto:1.15, onLine:()=>{ unAct('king', { html:UN_KING_FOOT(), cls:'jg-npc un-king' }); unBladeDown(k); } });
    if(unGone()) return false;
    if(typeof questBladeHandOver === 'function') questBladeHandOver(k);
    await unLines([UN_RITE_OPEN[1]], k, { auto:1.15 });
    /* four chants, slow: he glows, and tires; the blade answers; the light climbs higher and pulses harder each time */
    for(let i = 0; i < UN_CHANT.length; i++){
      if(unGone()) return false;
      unRiteStage(k, i);
      await unLines([['kingFoot', `<div class="un-chant">${UN_CHANT[i].text}</div>`]], k, { auto:1.7 });
      if(unGone()) return false;
      unPillarPulse();
      await unLines([['n', UN_CHANT[i].after]], k, { auto:1.3 });
    }
    if(unGone()) return false;
    /* the last pulse: the blade white, the ancestor's white shape, its colours */
    await unAncestorRise(k);
    r.opened = true;
    saveProfile();
    await unLines([['anc', WAR_WAKE[k]], ['lion', `<b>"It does not know friend from foe. Get ready!"</b>`]], k);
    return !unGone();
  });
  unQuakeEnd(0.6, unGone());                                             // (4.37) (left part-way: the ground stilled, at once)
  if(unGone()) return;
  await sceneCamFree(400);
  if(go) unFightAncestor(k);
}
async function unAncestorRise(k){
  const B = unB(k), pil = document.getElementById('unPillar');
  playSfx('timestop');
  if(typeof buzz === 'function') buzz('unseal');                         // (4.28) the seal gives way: felt too
  if(ui.unRumble) ui.unRumble.set(1, 0.4);                               // (4.37) the rumble and the tremor at their height
  unQuake(UN_QUAKE.chant[3] * 1.5); unQuakeCrack(true);
  if(pil){ pil.classList.remove('up-pulse'); pil.classList.add('up-end'); }
  const pool = document.getElementById('unPool'); if(pool) pool.classList.add('up-end');
  unRing(true);
  if(typeof sceneFlash === 'function') sceneFlash(140, 160, null, 900);
  await unWaitMs(450);
  unActCls('blade', 'un-white', true);
  ['un-glow1', 'un-glow2', 'un-glow3', 'un-glow4', 'un-tremble'].forEach(c=> unActCls('king', c, false));
  unActCls('king', 'un-spent', true);
  await unWaitMs(1000);
  unAct('anc', { x:B.x, y:B.y, faceR:false, solid:true, cls:'jg-npc war-anc un-anc un-white un-emerge anc-' + k, html:unAncHtml(k, true) });
  await unWaitMs(80);
  unActCls('anc', 'un-emerge', false);
  unActCls('blade', 'un-out', true);
  /* (4.39) The designer: "it's also weird that when the sealed weapon becomes the ancestor, the evolving soundtrack is used
     … please also remove the evolution soundtrack from the ancestor unsealing" ('evolution' played here until 4.38) */
  unQuakeEnd(2.6);                                                       // (4.37) …and the ground stills as it stands
  await unWaitMs(1300);
  unActGone('blade');
  ['unPillar', 'unPool'].forEach(id=>{ const x = document.getElementById(id); if(x) x.remove(); });
  unActCls('anc', 'un-white', false);                                    // its colours come back
  await unWaitMs(1800);
  unActCls('anc', 'un-wild', true);
}

/* ---------- the ancestor beaten: calmed; the sky lit up; the commander on you ---------- */
async function unAftermath(k){
  const go = await unScene(async ()=>{
    await unLook(k, 700);
    const calm = WAR_CALM[k].map(([who, html])=> [Array.isArray(who) ? (who[0] === 'guardian' ? 'g' : 'anc') : who, html]);
    await unLines(calm, k);
    if(unGone()) return false;
    playSfx('alert');
    await unLines([['kingFoot', UN_ALARM_KING]].concat(UN_ALARM[k]), k);
    if(unGone()) return false;
    unRite(k).alarm = true;
    saveProfile();
    await unVanCharge(k);
    await unLines([['lion', `<b>"Here they come — and the commander himself! Get ready!"</b>`]], k);
    return !unGone();
  });
  if(unGone()) return;
  await sceneCamFree(300);
  if(go) unFightVanguard(k);
}
async function unVanCharge(k){
  const P = unPlace(k);
  [0, 1, 2, 3].forEach(i=> unActGone('w' + i, 500));                   // the tribe, to arms
  playSfx('alert');
  await Promise.all(P.van.map((s, i)=>{
    unAct('v' + i, Object.assign({ x:s.x + 7, y:s.y, faceR:false, solid:true }, unVanFig(k, i)));
    return unWaitMs(60 + i * 140).then(()=> unActMove('v' + i, s.x, s.y, 900));
  }));
}
async function unVanTalk(k){
  if(ui.jgTalk) return;
  ui.jgTalk = true; releaseKeys();
  let yes = false;
  try { yes = await r5Ask([jgFace(JG_COMMANDER)], `Commander ${SPECIES[JG_COMMANDER].name}`, UN_VANGUARD, 'Fight the vanguard', 'Not yet'); }
  finally { ui.jgTalk = false; }
  if(yes && !unGone()) unFightVanguard(k); else if(!unGone()) refreshWalk();
}

/* ---------- the siege ---------- */
async function unSiegeIntro(k){
  await unScene(async ()=>{
    await unLines(UN_SIEGE_START, k);
    unRite(k).siegeSaid = true;
    saveProfile();
  });
  if(!unGone()) toast(`Beat all ${unSiegeSpots(k).length} aliens attacking the village, then help the guardian and the ancestor.`);
}
async function unSiegeTalk(k, who){
  if(unSiegeLeft(k).length) return unLines([[who, UN_SIEGE_HOLD[k][who]]], k);
  if(ui.jgTalk) return;
  ui.jgTalk = true; releaseKeys();
  let yes = false;
  try { yes = await r5Ask([unFace(who, k)], unName(who, k), UN_SIEGE_READY[k], 'Fight them, back to back', 'Not yet'); }
  finally { ui.jgTalk = false; }
  if(yes && !unGone()) unFightFinals(k); else if(!unGone()) refreshWalk();
}

/* ---------- won: everyone's thanks; the King home; the village its own again ---------- */
async function unEnding(k){
  const P = unPlace(k), V = unV(k), S = warSpots(k);
  /* (4.33) the last of the four: no ride home — word comes from the castle (36-the-return.js: invReturnStart). The
     designer: "The player will be asked to return swiftly after the last tribe's unsealing." */
  const last = JG_TRIBE_KEYS.every(t=> t === k || unDone(t)) && typeof invReturnStart === 'function';
  let back = false;
  await unScene(async ()=>{
    await unLook(k, 700);
    await unLines(UN_SIEGE_WON[k], k);
    if(unGone()) return;
    if(last){ back = await invReturnStart(k); return; }
    await unLines(UN_SIEGE_HOME.slice(0, 2), k);
    if(unGone()) return;
    unActGone('king', 1500);                                              // the tribe's fairies lead his mount away
    await unLines(UN_SIEGE_HOME.slice(2), k);
    if(unGone()) return;
    const w = unWar(), r = unRite(k);
    r.done = true; w.rest = today(); w.escort = null;
    questState().track = 'alien';
    saveProfile();
    /* home: the fairies to their village, the guardian to its door, the ancestor beside the lodge */
    Object.keys(unActs()).filter(id=> /^sf/.test(id)).forEach(id=> unActGone(id, 900));
    const gp = unPath(P.sg, V.guardian), ap = unPath(P.sanc, S.anc);
    await Promise.all([unActWalk('g', gp, 320), unActWalk('anc', ap, 320)]);
    const g = unActs().g; if(g){ g.dx = 0.5; g.faceR = false; unActPlace(g); unActCls('g', 'un-cheer', false); }
    const a = unActs().anc; if(a){ a.faceR = false; unActPlace(a); unActCls('anc', 'un-cheer', false); }
    jgShowFolk();
    jgHud();
    const next = warStage();
    const where = n=> ({ ne:'north-east', se:'south-east', sw:'south-west', nw:'north-west' })[JG_TRIBES[n].corner];
    await unLines([['lion', next === 'done' ? UN_LION.done
      : `<b>"He will sleep for a day at least. Tomorrow, if he is ready: ${questTribe(next)}, in the ${where(next)}."</b>`]], k);
  });
  if(back) return invReturnGo();                                       // (4.33) the hidden paths, to the castle
  if(!unGone()) await sceneCamFree(500);
}

/* ============================================================
   WHO YOU CAN TALK TO (the deck's buttons, jgNearActs)
   ============================================================ */
function unNearActs(p){
  const acts = [], A = unActs(), e = unEscort();
  if(!e || !p) return acts;
  const k = e.k, ph = unPhase(k);
  const by = a=> a && a.el.isConnected && Math.max(Math.abs(a.x - p.x), Math.abs(a.y - p.y)) <= 1;
  const add = (key, a, name, act, verb)=> acts.push({ key:'un' + key, at:{ x:a.x, y:a.y }, html:`${verb || '💬 Talk'}<small>${escapeHtml(name)}</small>`, act });
  if(ph === 'escort'){ if(by(A.king)) add('K', A.king, 'The Fairy King', ()=> unKingTalkField()); return acts; }
  if(!ph || ph === 'done') return acts;
  if(by(A.king)) add('K', A.king, 'The Fairy King', ()=> unKingTalk(k));
  if(by(A.g)) add('G', A.g, unName('g', k), ()=> unGuardTalk(k));
  if(by(A.anc)) add('A', A.anc, unName('anc', k), ()=> unAncTalk(k), ph === 'opened' ? '⚔️ Fight' : null);
  if(ph === 'alarm'){ const v = unPlace(k).van.map((s, i)=> A['v' + i]).find(by); if(v) add('V', v, `Commander ${SPECIES[JG_COMMANDER].name}`, ()=> unVanTalk(k), '⚔️ Fight'); }
  const folk = (typeof JG_VILLAGE_FOLK !== 'undefined' && JG_VILLAGE_FOLK[k]) || JG_TRIBES[k].members;
  const w = [0, 1, 2, 3].find(i=> by(A['w' + i]));
  if(w != null) add('W', A['w' + w], jgFolkName(folk[w % folk.length]), ()=> unSayAs(jgFace(folk[w % folk.length] + '_front'), jgFolkName(folk[w % folk.length]), UN_WATCH[k][w % 2]));
  if(ph === 'siege' || ph === 'won'){
    const won = unWar().siege[k] || {};
    const hit = unSiegeSpots(k).map((s, i)=> s.fairies.map((f, j)=> ({ s, f, a:A['sf' + i + j] }))).flat().find(o=> by(o.a));
    if(hit) add('F', hit.a, jgFolkName(hit.f.sprite), ()=> unSayAs(jgFace(hit.f.sprite + '_front'), jgFolkName(hit.f.sprite),
      won[hit.s.id] || ph === 'won' ? caTurnJ('unCheer', UN_CHEER) : UN_SIEGE_FAIRY[Math.floor(Math.random() * UN_SIEGE_FAIRY.length)]));
  }
  return acts;
}
function unSayAs(face, name, html){ return jgLines([face], name, [html]); }
function unKingTalk(k){
  const ph = unPhase(k);
  if(ph === 'arrive') return unRite(k).met ? unReadyAsk(k) : unArriveWords(k);
  if(ph === 'siege' || ph === 'won') return unLines([['kingFoot', caTurnJ('unKingSiege', UN_SIEGE_KING)]], k);
  return unLines([['kingFoot', caTurnJ('unKingSpent', UN_KING_SPENT)]], k);
}
function unGuardTalk(k){
  const ph = unPhase(k);
  if(ph === 'arrive') return unLines([['g', UN_GUARD_WAIT[k]]], k);
  if(ph === 'opened') return unLines([['g', UN_GUARD_WILD[k]]], k);
  if(ph === 'siege') return unSiegeTalk(k, 'g');
  if(ph === 'won') return unLines([UN_SIEGE_WON[k][0]], k);
  return unLines([UN_ALARM[k][0]], k);
}
async function unAncTalk(k){
  const ph = unPhase(k);
  if(ph === 'opened'){ await unLines([['anc', UN_ANC_AGAIN[k]]], k); if(!unGone()) unFightAncestor(k); return; }
  if(ph === 'siege') return unSiegeTalk(k, 'anc');
  if(ph === 'won') return unLines([UN_SIEGE_WON[k][1]], k);
  return unLines([['anc', caTurnJ('warAnc' + k, WAR_GRUFF[k])]], k);
}
/* what this visit has waiting (after the jungle is drawn) */
function unSceneDue(){
  if(unGone() || ui.unBusy || ui.jgTalk || ui.jgFighting || document.querySelector('.scene-say')) return;
  if(ui.unGate){ const g = ui.unGate; ui.unGate = null; return unGateScene(g.k, g.first); }
  const e = unEscort(), p = walkState().at && walkState().at[JG_KEY];
  if(!e || !p) return;
  const k = e.k, r = unRite(k);
  if(!r.arrived){ if(jgVillageAt(p.x, p.y) === k && unKingNear(p, 2)) unArrive(k); return; }
  if(jgVillageAt(p.x, p.y) !== k) return;
  if(!r.met) return unArriveWords(k);
  if(r.beaten && !r.alarm) return unAftermath(k);
  if(r.siege && !r.won && !r.siegeSaid) return unSiegeIntro(k);
  if(r.won && !r.done) return unEnding(k);
}

/* ============================================================
   THE THRONE ROOM (warKingCastle, 22-war.js): one unsealing a day
   ============================================================ */
function unCaLines(seq){ return caLines(seq.map(([who, html])=> [who === 'n' ? null : who === 'kingFoot' ? 'king' : who, html])); }
async function unKingCastle(k){
  if(unEscort()) return;                                                 // (he is out: not in his throne room)
  if(unResting()) return unCaLines(UN_REST_TODAY);
  const w = unWar();
  if(w.rest && !w.ready[today()]){
    w.ready = { [today()]:true };
    saveProfile();
    await unCaLines(UN_READY_NEXT);
    if(ui.screen !== 'r6_palace') return;
  }
  return unOffer(k);
}
async function unOffer(k){
  const first = !unWar().gate, A = ANC_FOLK[warAncId(k)];
  const html = `<b>"${first ? 'Then it begins. ' : ''}I ride for ${WAR_VILLAGE[k]}. Will you lead the way, my friends?"</b>` +
    `<br><br><i>From the south gate the King follows you; he cannot fight. At the village he unseals the ${A.name}, and it will fight you: Lv ${ANC_LEVEL}, alone. Then the aliens will come.</i>`;
  ui.caTalk = true;
  let yes = false;
  try { yes = await r5Ask([caFace('king')], 'The Fairy King', html, 'Ride out with the King', 'Not yet'); }
  finally { ui.caTalk = false; }
  if(yes && ui.screen === 'r6_palace') return unRideOut(k);
  refreshWalk();
}
async function unRideOut(k){
  const w = unWar(), s = jgGround().places.castle.stand;
  w.escort = { k, x:s.x + 2, y:s.y - 1, faceR:false };
  w.rite[k] = {};
  questState().track = k;
  jgState().found[k] = true;
  saveProfile();
  ui.unGate = { k, first:!w.gate };
  await sceneCurtain(true, 700);
  await sceneCurtainText('The King rides out to the south gate…', 1300);
  const W = walkState();
  W.at = W.at || {};
  W.at[JG_KEY] = { x:s.x, y:s.y }; jgState().at = { x:s.x, y:s.y };
  W.face = 'u'; W.faceX = 'r';
  ui.walkFresh = false; ui.jgLion = null;
  if(typeof caLion !== 'undefined') caLion.at = null;
  goDeck(JG_KEY);                                                        // (the gate scene lifts the curtain: unSceneDue)
  setTimeout(()=>{ if(ui.screen !== JG_KEY) unCurtainUp(); }, 2500);   // (never left black)
}
/* Lucesco's "Are you ready?": straight to the throne room, and the King's word */
async function unGoThrone(){
  await sceneCurtain(true, 600);
  caGo('r6_palace', [19, 7]);
  await unUntil(()=> ui.screen === 'r6_palace' && !!document.getElementById('walkYou'), 4000);   // (drawn before the curtain lifts)
  await unWaitMs(300);
  await sceneCurtain(false, 600);
  if(ui.screen === 'r6_palace') warKingCastle();
}
function unUntil(fn, ms){
  return new Promise(res=>{ const t0 = Date.now(); const t = ()=>{ if(fn() || Date.now() - t0 > ms) return res(); setTimeout(t, 60); }; t(); });
}
/* all four found (questThrone): the court, without the guardians — the cost of it, and he goes alone */
async function unCourtAll(){
  const q = questState();
  await caLines(UN_COURT_ALL);
  if(ui.screen !== 'r6_palace') return;
  const w = warState();
  w.council = true;
  q.stage = 'unseal';
  JG_TRIBE_KEYS.forEach(k=>{ if(w.calmed[k]) delete q.blades[k]; });
  q.track = 'alien';
  saveProfile();
  refreshWalk();
}

/* ============================================================
   LUCESCO, BY WHERE THE STORY STANDS (his Just talk, while the King unseals)
   ============================================================ */
async function unLionAsk(html, yes, then){
  if(ui.jgTalk) return;
  ui.jgTalk = true; releaseKeys();
  let ok = false;
  try { ok = await r5Ask([riftLucescoFace()], 'Lucesco', html, yes, 'Not yet'); }
  finally { ui.jgTalk = false; }
  if(ok && !unGone()) then(); else if(!unGone()) refreshWalk();
}
function unLionTalk(){
  const st = warStage(), e = unEscort(), say = html=> jgLines([riftLucescoFace()], 'Lucesco', [html]);
  if(!st) return jgLionChat();
  if(st === 'done' && typeof invLionJungle === 'function'){ const r = invLionJungle(); if(r) return r; }   // (4.33) the castle invaded, Wadjet's trail
  if(st === 'done') return warState().stone ? jgLionChat() : say(UN_LION.done);
  const p = walkState().at && walkState().at[JG_KEY];
  if(e){
    const r = unRite(e.k);
    if(!r.arrived) return unKingNear(p, 3) ? say(caTurnJ('unLionEscort', UN_LION.escort)) : unLionAsk(UN_LION.lost, 'Take me to him', ()=> unToKing());
    if(!p || jgVillageAt(p.x, p.y) !== e.k) return unLionAsk(`<b>"The King is waiting for us at ${questTribe(e.k)}'s village. Shall I take us back to him?"</b>`, 'Take me to him', ()=> unToKing());
    if(r.siege && !r.won) return say(caTurnJ('unLionSiege', UN_LION.siege));
    return say(caTurnJ('unLionVillage', UN_LION.village));
  }
  if(unResting()) return say(caTurnJ('unLionRest', UN_LION.rest));
  return unLionAsk(UN_LION.ask(st), 'Yes, to the castle', ()=> unGoThrone());
}

/* ============================================================
   A GUARDIAN WON OVER (questGuardAfterSay, 25-quest.js): its wall down; it walks you home; inside, its people
   ============================================================ */
async function unGuardAfter(k, how){
  const q = questState(), T = JG_TRIBES[k], L = UN_GUARD_AFTER[k];
  const left = QUEST.seek.filter(t=> t !== k && !q.found[t]);
  const auto = { auto:1.05, keep:true };
  await unLines((how === 'fight' ? [['g', L.fight], ['lion', L.why]] : []).concat([['g', L.help]]), k, auto);   // (4.23) Lucesco's word, after a fight
  if(unGone()) return;
  /* the wall comes down */
  q.found[k] = how; delete q.guardWon;
  const j = jgState();
  j.found[k] = true; j.met[k] = true;
  saveProfile();
  questBarSync();
  JG_P.layerKey = '';                                                   // the ground painted again, without its thorns
  questRefreshThings();
  playSfx('stone_high');
  toast(`${T.icon} The wall of thorns sinks into the ground!`);
  await unLines([['g', L.wall], ['g', L.come]], k, auto);
  if(unGone()) return;
  await unHomeWalk(k);
  if(unGone()) return;
  await unHomeInside(k, left);
  if(unGone()) return;
  jgHud(); refreshWalk(); questPulseSoon();
  const found = QUEST.seek.filter(t=> q.found[t]).length;
  if(found === 1 && k === 'water') return questThrone('water');
  if(found === QUEST.seek.length) return questThrone('all');
  q.track = questNextTribe() || 'alien';
  saveProfile(); jgHud(); questPulseSoon();
  if(q.track !== 'alien') jgLines([questFace.lion()], 'Lucesco', [`<b>"I have the next scent: ${questTribe(q.track)}, in the ${{ ne:'north-east', se:'south-east', sw:'south-west', nw:'north-west' }[JG_TRIBES[q.track].corner]}. Follow the pulse when you are ready."</b>`]);
}
/* it walks to its door, slowly; you follow a step behind; the words play by themselves as you go.
   (4.24) The designer: "The tribal guardians are not leading the way into their huts, only the water tribe when I
   fought it and defeated it did so." The walk was given up, without a word, whenever the guardian's figure was not
   on the ground as it began (the jungle drawn afresh after it was put before its wall: it was neither there nor
   walking), or no way round the bands could be found — and then the curtain fell straight on the inside of its
   house. Now its figure is put back where it stood if it has gone (at every step), a way is found without the
   bands if need be, and at the end it steps into its doorway and is gone inside, and you after it to the door. */
function unGuardFig(k, at){
  const el = ui.qGuardEl;
  if(el && el.isConnected) return el;
  const was = (el && el._at) || at;
  if(!was || !document.getElementById('walkWorld')) return null;
  const fig = questGuardEl(k, was);
  if(fig && el && el.style.transform) fig.style.transform = el.style.transform;   // (where it stood, to the pixel)
  return fig;
}
async function unHomeWalk(k){
  const w = walkState(), p = w.at && w.at[JG_KEY], V = unV(k), home = { x:V.guardian.x, y:V.guardian.y };
  if(!p) return;
  /* where it stands: its figure, or (gone from the ground) the front of its wall nearest you */
  const bars = (typeof questBars === 'function' ? questBars()[k] || [] : []).slice()
    .sort((a, b)=> Math.hypot(a.front[0] - p.x, a.front[1] - p.y) - Math.hypot(b.front[0] - p.x, b.front[1] - p.y));
  const near = bars[0] ? { x:bars[0].front[0], y:bars[0].front[1] } : { x:p.x, y:p.y };
  let el = unGuardFig(k, near);
  if(!el) return;
  const start = el._at || near;
  const path = unPath(start, home, (x, y)=> !!jgBandAt(x, y)) || unPath(start, home) || [];
  ui.unGuardOut = k; questRefreshThings(); unGuardMarkOff(k);            // (it is out here, walking you home)
  const lines = UN_HOME_WALK[k], pace = 1.1;
  const total = lines.reduce((t, l)=> t + unAutoMs(l[1], pace), 0);
  const ms = Math.round(Math.max(480, Math.min(1100, total / (path.length + 1))));
  const me = $('#walkYou'), world = $('#walkWorld'), T = WALK_T;
  jgHold(true);
  try {
    const talk = unLines(lines, k, { auto:pace, keep:true });
    const walk = (async ()=>{
      const t = Math.max(1, Math.round(ms * SCENE_SPEED));
      if(me) me.style.transition = `transform ${t}ms linear`;
      if(world) world.style.transition = `transform ${t}ms linear`;
      let prev = start;
      for(const s of path){
        if(unGone()) return;
        el = unGuardFig(k, prev);                                           // (4.24) put back, if the ground was drawn afresh
        if(!el) return;
        el.style.transition = `transform ${t}ms linear`;
        el.style.transform = `translate3d(${s.x * T}px,${s.y * T}px,0)`;
        el.style.zIndex = 10 + s.y;
        if(s.x !== prev.x) faceRight(el, s.x > prev.x);
        el._at = { x:s.x, y:s.y };
        const dx = prev.x - p.x, dy = prev.y - p.y;
        w.face = dx > 0 ? 'r' : dx < 0 ? 'l' : dy > 0 ? 'd' : 'u';
        if(dx) w.faceX = dx > 0 ? 'r' : 'l';
        p.x = prev.x; p.y = prev.y;
        refreshWalk();
        jgSeeThrough(); jgShowFinds(); jgShowFolk(); jgExplore(p.x, p.y);
        prev = s;
        await unWaitMs(ms);
      }
      el = unGuardFig(k, home);
      if(!el) return;
      el.style.transform = `translate3d(${(home.x + 0.5) * T}px,${home.y * T}px,0)`;   // (in the middle of its door, as it stands there)
      faceRight(el, false);
    })();
    await Promise.all([talk, walk]);
    /* (4.24) and in: it steps up into its doorway and is gone inside; you step up to the door after it */
    if(!unGone()){
      const fig = unGuardFig(k, home), t = Math.max(1, Math.round(700 * SCENE_SPEED)), me = $('#walkYou'), world = $('#walkWorld');
      if(fig){
        fig.style.transition = `transform ${t}ms ease-in, opacity ${t}ms ease-in`;
        fig.style.transform = `translate3d(${(home.x + 0.5) * T}px,${(home.y - 0.85) * T}px,0) scale(0.9)`;
        fig.style.opacity = '0';
        fig._in = true;
      }
      if(p.x !== home.x || p.y !== home.y){
        const dx = home.x - p.x;
        w.face = 'u'; if(dx) w.faceX = dx > 0 ? 'r' : 'l';
        if(me) me.style.transition = `transform ${t}ms linear`;
        if(world) world.style.transition = `transform ${t}ms linear`;
        p.x = home.x; p.y = home.y;
        refreshWalk();
      }
      await unWaitMs(760);
    }
  } finally {
    jgHold(false);
    [me, world, $('#walkYou'), $('#walkWorld')].forEach(e=>{ if(e && e.isConnected) e.style.transition = ''; });
    jgSave(false);
  }
}
/* inside its house: its people, the words playing by themselves; then out before its door again */
const UN_ROOM = {
  water:{ wall:'#24506d,#2f6688 55%,#3c7896', floor:'#5d8a86,#3f6762', prop:'basin', name:'The long house' },
  fire:{ wall:'#2a1712,#3c2219 60%,#4a2a1c', floor:'#5b3a2c,#3d261d', prop:'hearth', name:'The guardian’s hall' },
  earth:{ wall:'#5a4a3a,#6e5b47 60%,#7c6750', floor:'#8a7458,#665640', prop:'tablet', name:'The house in the hill' },
  grass:{ wall:'#3d2e1f,#57422b 60%,#6a5234', floor:'#6f8f4e,#4f6b37', prop:'pots', name:'The house in the root' },
};
function unRoomOpen(k){
  unCss();
  const T = JG_TRIBES[k], R = UN_ROOM[k];
  const fig = (who, src, cls, flip)=> `<div class="un-fig ${cls}" data-who="${who}"><img src="${src}" alt=""${flip ? ' style="scale:-1 1"' : ''} onerror="this.style.visibility='hidden'"></div>`;
  const el = document.createElement('div');
  el.className = 'un-room un-room-' + k;
  el.innerHTML = `<div class="un-room-stage" style="--wall:linear-gradient(180deg,${R.wall});--floor:linear-gradient(180deg,${R.floor})">
      <div class="un-room-wall"></div><div class="un-room-floor"></div><div class="un-prop un-prop-${R.prop}"><i></i><i></i><i></i></div>
      ${fig('you', 'assets/avatar/' + (state.avatar || 'm1') + '.png', 'un-you', true)}
      ${fig('lion', 'assets/mon/lucesco_front.png', 'un-lion', true)}
      ${fig('g', 'assets/mon/' + T.guardian + '.png', 'un-guard', false)}
      ${fig('f1', 'assets/mon/' + unFolkOf(k, 'f1') + '_front.png', 'un-f1', false)}
      ${fig('f2', 'assets/mon/' + unFolkOf(k, 'f2') + '_front.png', 'un-f2', false)}
      ${fig('f3', 'assets/mon/' + unFolkOf(k, 'f3') + '_front.png', 'un-f3', false)}
      <div class="un-room-name">${escapeHtml(R.name)}</div></div>`;
  document.body.appendChild(el);
  return el;
}
function unRoomSpeak(room, who){ room.querySelectorAll('.un-fig').forEach(f=> f.classList.toggle('speak', f.dataset.who === who)); }
async function unHomeInside(k, left){
  await sceneCurtain(true, 700);
  if(ui.qGuardEl){ ui.qGuardEl.remove(); ui.qGuardEl = null; }
  const room = unRoomOpen(k);
  await unWaitMs(150);
  await sceneCurtain(false, 700);
  try {
    await unLines(UN_HOME_TALK[k].concat(UN_HOME_END(k, left)), k, { auto:1.05, keep:true, onLine:(i, who)=> unRoomSpeak(room, who) });
  } finally {
    await sceneCurtain(true, 600);
    room.remove();
    ui.unGuardOut = null;
  }
  /* out again, before its door: the jungle drawn afresh (the guardian back at it) */
  const s = unV(k).stand, w = walkState();
  w.at = w.at || {};
  w.at[JG_KEY] = { x:s.x, y:s.y }; jgState().at = { x:s.x, y:s.y };
  w.face = 'd';
  if(ui.screen === JG_KEY){ ui.walkFresh = false; ui.jgLion = null; go(JG_KEY); }
  await unUntil(()=> ui.screen === JG_KEY && !!document.getElementById('walkYou'), 4000);
  await unWaitMs(250);
  await sceneCurtain(false, 700);
}

/* ============================================================
   THE LOOK
   ============================================================ */
let _unCss = false;
function unCss(){
  if(_unCss || typeof document === 'undefined') return;
  _unCss = true;
  if(typeof warCss === 'function') warCss();
  const s = document.createElement('style');
  s.id = 'unCss';
  s.textContent = `
  .walk-ent.un-act{ overflow:visible; pointer-events:none; }
  .walk-ent.un-act.un-in{ animation:unIn .7s ease both; }
  @keyframes unIn{ from{ opacity:0; } to{ opacity:1; } }
  /* the King: his psychic light as he chants (a glow a stage), trembling at the last; spent after — bent forward, a dark haze */
  .walk-ent.un-act.un-glow1 img.jg-art:not(.un-sil){ filter:drop-shadow(0 0 4px rgba(225,170,255,.85)) drop-shadow(0 3px 2px rgba(0,0,0,.35)); }
  .walk-ent.un-act.un-glow2 img.jg-art:not(.un-sil){ filter:drop-shadow(0 0 6px rgba(235,180,255,.95)) drop-shadow(0 0 12px rgba(180,100,255,.7)); }
  .walk-ent.un-act.un-glow3 img.jg-art:not(.un-sil){ filter:drop-shadow(0 0 7px #fff) drop-shadow(0 0 16px rgba(220,140,255,.95)) drop-shadow(0 0 24px rgba(160,80,255,.6)); }
  .walk-ent.un-act.un-glow4 img.jg-art:not(.un-sil){ filter:drop-shadow(0 0 9px #fff) drop-shadow(0 0 20px rgba(255,160,240,1)) drop-shadow(0 0 34px rgba(170,90,255,.85)); }
  .walk-ent.un-act.un-king > img.jg-art{ transition:filter .9s ease; transform-origin:50% 100%; }
  .walk-ent.un-act.un-tremble > img.jg-art{ animation:unTremble .14s linear infinite; }
  @keyframes unTremble{ 0%{ transform:rotate(-1.4deg); } 50%{ transform:rotate(1.4deg); } 100%{ transform:rotate(-1.4deg); } }
  .walk-ent.un-act.un-spent > img.jg-art{ transform:rotate(-11deg) translateY(4%); filter:brightness(.78) saturate(.65) drop-shadow(0 0 5px rgba(25,0,45,.95)) drop-shadow(0 3px 2px rgba(0,0,0,.4)); }
  .walk-ent.un-act.un-spent::before{ content:''; position:absolute; left:50%; bottom:0; width:200%; height:250%; translate:-50% 8%; border-radius:50%; pointer-events:none; z-index:-1;
    background:radial-gradient(ellipse at 50% 72%, rgba(36,6,58,.6), rgba(22,0,34,.32) 42%, rgba(0,0,0,0) 70%); animation:unHaze 3.4s ease-in-out infinite; }
  @keyframes unHaze{ 0%,100%{ opacity:.75; scale:1; } 50%{ opacity:1; scale:1.08; } }
  .walk-ent.un-act.un-cast > img.jg-art{ filter:drop-shadow(0 0 7px rgba(240,190,255,1)) drop-shadow(0 0 16px rgba(170,90,255,.95)) !important; }
  /* his beam */
  .un-kbeam{ position:absolute; height:0; z-index:1003; pointer-events:none; transform-origin:0 0; }
  .un-kbeam i{ position:absolute; left:0; right:0; top:-9px; height:18px; border-radius:9px; transform-origin:0 50%;
    background:linear-gradient(90deg, rgba(255,255,255,.1), rgba(225,165,255,.8) 14%, rgba(170,90,255,.9) 60%, rgba(255,175,235,.85)); filter:blur(2px);
    animation:unBeamIn .2s ease-out both, unBeamHum .15s ease-in-out .2s infinite alternate; }
  .un-kbeam b{ position:absolute; left:0; right:0; top:-2px; height:4px; border-radius:2px; background:#fff; box-shadow:0 0 6px #fff, 0 0 14px #c58cff; transform-origin:0 50%; animation:unBeamIn .2s ease-out both; }
  .un-kbeam::after{ content:''; position:absolute; right:-24px; top:-24px; width:48px; height:48px; border-radius:50%;
    background:radial-gradient(circle, #fff 0%, rgba(232,182,255,.9) 30%, rgba(160,80,255,0) 70%); animation:unBeamHit .3s ease-in-out infinite alternate; }
  .un-kbeam.out{ opacity:0; transition:opacity .25s ease-out; }
  @keyframes unBeamIn{ from{ transform:scaleX(0); } to{ transform:scaleX(1); } }
  @keyframes unBeamHum{ from{ opacity:.7; } to{ opacity:1; } }
  @keyframes unBeamHit{ from{ transform:scale(.8); } to{ transform:scale(1.18); } }
  /* the blade: on the ground, then rising, glowing; white at the last */
  .walk-ent.un-act .un-morph{ position:absolute; inset:0; transform-origin:50% 100%; transition:scale 1s cubic-bezier(.2,.8,.3,1.2), opacity 1s ease; }
  .walk-ent.un-blade img.jg-art{ transform:rotate(78deg) translateX(-12%); transform-origin:50% 62%; transition:transform 1.2s ease, filter .9s ease, opacity .6s ease; }
  .walk-ent.un-blade.un-rise img.jg-art{ transform:translateY(-34%); }
  .walk-ent.un-blade.un-hover img.jg-art{ animation:unHover 2.4s ease-in-out infinite; }
  @keyframes unHover{ 0%,100%{ transform:translateY(-34%); } 50%{ transform:translateY(-44%); } }
  .walk-ent.un-blade.un-out .un-morph{ opacity:0; scale:1.6; transition:opacity .9s ease, scale .9s ease; }
  .walk-ent.un-act img.un-sil{ filter:brightness(0) invert(1) drop-shadow(0 0 6px #fff) drop-shadow(0 0 16px rgba(255,222,255,.95)) !important; opacity:0; transition:opacity .6s ease; }
  .walk-ent.un-act.un-white img.un-sil{ opacity:1; }
  .walk-ent.un-anc img.un-sil{ transition:opacity 1.7s ease; }
  .walk-ent.un-anc.un-emerge .un-morph{ opacity:0; scale:.45; }
  .walk-ent.un-anc.un-wild img.jg-art:not(.un-sil){ animation:unWild 1.8s ease-in-out infinite; }
  @keyframes unWild{ 0%,100%{ filter:drop-shadow(0 0 6px rgba(255,60,60,.6)) drop-shadow(0 3px 2px rgba(0,0,0,.35)); } 50%{ filter:drop-shadow(0 0 14px rgba(255,40,40,.95)) drop-shadow(0 3px 2px rgba(0,0,0,.35)); } }
  /* the light from the blade: up off the top of the screen, purple, pink and white, pulsing */
  .un-pillar{ position:absolute; z-index:1002; pointer-events:none; --pw:.1; opacity:0; transition:opacity .9s ease; animation:unThrob 1.7s ease-in-out infinite; }
  .un-pillar.up1, .un-pillar.up2, .un-pillar.up3, .un-pillar.up4{ opacity:1; }
  .un-pillar.up1{ --pw:.14; } .un-pillar.up2{ --pw:.34; } .un-pillar.up3{ --pw:.64; } .un-pillar.up4{ --pw:1; }
  .un-pillar i{ position:absolute; left:50%; top:0; bottom:0; translate:-50% 0; border-radius:999px; transition:width 1s ease, opacity 1s ease; }
  .un-pillar .up-haze{ width:calc(var(--pw) * 100%); background:linear-gradient(0deg, rgba(186,104,255,.6), rgba(255,140,220,.38) 30%, rgba(170,90,255,.18) 75%, rgba(170,90,255,0)); filter:blur(6px); }
  .un-pillar .up-glow{ width:calc(var(--pw) * 55%); background:linear-gradient(0deg, rgba(255,175,238,.95), rgba(232,152,255,.72) 40%, rgba(220,170,255,.25) 88%, rgba(220,170,255,0)); filter:blur(2px); }
  .un-pillar .up-core{ width:calc(var(--pw) * 20% + 3px); background:linear-gradient(0deg, #fff, rgba(255,255,255,.95) 55%, rgba(255,240,255,.5) 92%, rgba(255,255,255,0)); box-shadow:0 0 10px #fff, 0 0 22px rgba(255,190,250,.9); }
  .un-pillar .up-motes{ width:calc(var(--pw) * 90% + 10px); background:radial-gradient(circle, rgba(255,255,255,.95) 0 1.4px, transparent 2px) 0 0/19px 31px repeat;
    animation:unMotes 2.2s linear infinite; -webkit-mask-image:linear-gradient(0deg, #000, #000 55%, transparent); mask-image:linear-gradient(0deg, #000, #000 55%, transparent); }
  @keyframes unMotes{ from{ background-position:0 0; } to{ background-position:0 -310px; } }
  @keyframes unThrob{ 0%,100%{ filter:brightness(1); } 50%{ filter:brightness(1.28); } }
  .un-pillar.up-pulse{ animation:unPulse .9s ease-out; }
  @keyframes unPulse{ 0%{ transform:scaleX(1); filter:brightness(1); } 25%{ transform:scaleX(1.5); filter:brightness(2); } 100%{ transform:scaleX(1); filter:brightness(1); } }
  .un-pillar.up-end{ animation:unPillarEnd 1.1s ease-in forwards; }
  @keyframes unPillarEnd{ 0%{ transform:scaleX(1); opacity:1; } 30%{ transform:scaleX(2.2); opacity:1; filter:brightness(2.4); } 100%{ transform:scaleX(0); opacity:0; } }
  .un-pool{ position:absolute; pointer-events:none; border-radius:50%; opacity:0; transform:scale(.5); transition:opacity .9s, transform .9s;
    background:radial-gradient(ellipse, rgba(255,232,255,.9), rgba(212,132,255,.5) 40%, rgba(160,80,255,0) 72%); }
  .un-pool.up1{ opacity:.45; transform:scale(.6); } .un-pool.up2{ opacity:.65; transform:scale(.8); } .un-pool.up3{ opacity:.85; transform:scale(1); } .un-pool.up4{ opacity:1; transform:scale(1.25); }
  .un-pool.up-end{ opacity:0 !important; transform:scale(1.6) !important; transition:opacity .8s ease, transform .8s ease; }
  .un-ring{ position:absolute; pointer-events:none; border-radius:50%; border:3px solid rgba(255,220,255,.95); box-shadow:0 0 12px rgba(220,150,255,.9), inset 0 0 10px rgba(255,200,255,.6);
    animation:unRing 1.1s ease-out forwards; }
  .un-ring.un-big{ border-width:5px; animation-duration:1.4s; }
  @keyframes unRing{ from{ transform:scale(.25); opacity:1; } to{ transform:scale(3.3); opacity:0; } }
  .un-ring.un-big{ animation-name:unRingBig; }
  @keyframes unRingBig{ from{ transform:scale(.25); opacity:1; } to{ transform:scale(6); opacity:0; } }
  .un-chant{ font-style:italic; font-size:16px; line-height:1.55; text-align:center; color:#5b2a86; text-shadow:0 0 8px rgba(214,150,255,.55); letter-spacing:.2px; }
  /* the fight in the village: a jab, back to back, the clash; the fairies' magic on the aliens they hold */
  .walk-ent.un-act.un-jab > img.jg-art, .walk-ent.un-sf.un-jab .jg-folk-art{ animation:unJab 2.2s ease-in-out var(--sd, 0s) infinite; }
  @keyframes unJab{ 0%,100%{ transform:translate(0, 0) rotate(0deg); } 14%{ transform:translate(-16%, -5%) rotate(-7deg); } 26%{ transform:translate(0, 0) rotate(0deg); } }
  .walk-ent.un-act.un-cheer > img.jg-art, .walk-ent.un-sf.un-cheer .jg-folk-art{ animation:unCheer 1.5s ease-in-out var(--sd, 0s) infinite; }
  @keyframes unCheer{ 0%,100%{ transform:translateY(0); } 30%{ transform:translateY(-14%); } 45%{ transform:translateY(0); } }
  .walk-ent.un-act.un-van .war-fig{ filter:drop-shadow(0 0 6px rgba(220,30,40,.85)); }
  .walk-ent.un-act.un-still > img.jg-art{ animation:none; }
  .jg-band.un-siege:not(.jg-zap):not(.jg-stun):not(.jg-pounced) .jg-alien-art{ animation:unLunge 1.1s ease-in-out infinite; }
  @keyframes unLunge{ 0%,100%{ translate:0 0; } 35%{ translate:calc(var(--ld, 1) * 5px) -2px; } 50%{ translate:calc(var(--ld, 1) * -1px) 1px; } }
  .jg-band.un-siege.jg-pounced .war-slash, .jg-band.un-siege.jg-zap .war-slash{ display:none; }
  .un-burst{ position:absolute; width:calc(var(--wt, 48px) * 1.1); height:calc(var(--wt, 48px) * 1.1); translate:-50% -50%; pointer-events:none; z-index:3; }
  .un-burst.un-big{ width:calc(var(--wt, 48px) * 1.6); height:calc(var(--wt, 48px) * 1.6); }
  .un-burst b{ position:absolute; left:50%; top:50%; opacity:0; animation:var(--bk, unDrop) 2.2s ease-out var(--sd, 0s) infinite; }
  .un-burst b:nth-child(1){ --tx:-34%; --ty:-46%; animation-delay:calc(var(--sd, 0s) + .02s); }
  .un-burst b:nth-child(2){ --tx:30%; --ty:-52%; animation-delay:calc(var(--sd, 0s) + .06s); }
  .un-burst b:nth-child(3){ --tx:-46%; --ty:-8%; animation-delay:calc(var(--sd, 0s) + .1s); }
  .un-burst b:nth-child(4){ --tx:42%; --ty:-14%; animation-delay:calc(var(--sd, 0s) + .04s); }
  .un-burst b:nth-child(5){ --tx:4%; --ty:-62%; animation-delay:calc(var(--sd, 0s) + .08s); }
  .un-b-water b{ width:22%; height:28%; margin:-14% 0 0 -11%; border-radius:50% 50% 50% 50% / 62% 62% 38% 38%;
    background:radial-gradient(circle at 35% 30%, #fff, #9fdcff 35%, #3b8fd1 75%); box-shadow:0 0 6px rgba(140,210,255,.9); --bk:unDrop; }
  .un-b-grass b{ width:26%; height:14%; margin:-7% 0 0 -13%; border-radius:0 100% 0 100%; background:linear-gradient(135deg, #c9f59a, #4f9a46 70%); box-shadow:0 0 5px rgba(150,240,120,.8); --bk:unLeaf; }
  .un-b-earth b{ width:20%; height:18%; margin:-9% 0 0 -10%; border-radius:30% 45% 35% 40%; background:linear-gradient(140deg, #d8b98a, #8a6a42 60%, #5a4328); box-shadow:0 1px 2px rgba(0,0,0,.4); --bk:unRock; }
  .un-b-fire b{ width:20%; height:30%; margin:-15% 0 0 -10%; border-radius:50% 50% 50% 50% / 70% 70% 30% 30%;
    background:radial-gradient(circle at 50% 70%, #fff6c0, #ffbf3a 40%, #f0581e 80%); box-shadow:0 0 8px rgba(255,150,40,.95); --bk:unFlame; }
  @keyframes unDrop{ 0%{ opacity:0; transform:translate(0,0) scale(.4); } 8%{ opacity:1; } 30%{ opacity:1; transform:translate(var(--tx), var(--ty)) scale(1); } 52%{ opacity:0; transform:translate(calc(var(--tx) * 1.4), calc(var(--ty) + 40%)) scale(.6); } 100%{ opacity:0; } }
  @keyframes unLeaf{ 0%{ opacity:0; transform:translate(0,0) rotate(0deg) scale(.5); } 8%{ opacity:1; } 40%{ opacity:1; transform:translate(calc(var(--tx) * 1.3), calc(var(--ty) * 1.1)) rotate(240deg) scale(1); } 56%{ opacity:0; transform:translate(calc(var(--tx) * 1.6), var(--ty)) rotate(330deg) scale(.7); } 100%{ opacity:0; } }
  @keyframes unRock{ 0%{ opacity:0; transform:translate(0, 20%) scale(.5); } 8%{ opacity:1; } 26%{ opacity:1; transform:translate(var(--tx), var(--ty)) rotate(90deg) scale(1); } 46%{ opacity:0; transform:translate(calc(var(--tx) * 1.3), 30%) rotate(200deg) scale(.8); } 100%{ opacity:0; } }
  @keyframes unFlame{ 0%{ opacity:0; transform:translate(0, 10%) scale(.4); } 8%{ opacity:1; } 34%{ opacity:.95; transform:translate(calc(var(--tx) * .7), calc(var(--ty) * 1.2)) scale(1.05); } 52%{ opacity:0; transform:translate(calc(var(--tx) * .8), calc(var(--ty) * 1.8)) scale(.5); } 100%{ opacity:0; } }
  @media (prefers-reduced-motion: reduce){
    .walk-ent.un-act img, .un-burst b, .un-pillar, .un-pillar i, .jg-band.un-siege .jg-alien-art, .un-ring{ animation:none !important; }
    .un-burst{ display:none; }
  }
  /* the throne room: the King, home and spent */
  .walk-ent.ca-npc.un-spent img{ transform:rotate(-9deg) translateY(4%); transform-origin:50% 100%; filter:brightness(.8) saturate(.7) drop-shadow(0 0 6px rgba(25,0,45,.9)); }
  /* inside a guardian's house */
  .un-room{ position:fixed; inset:0; z-index:80; background:#0b0a09; display:flex; justify-content:center; align-items:flex-start; padding-top:max(3vh, 14px); }
  .un-room-stage{ position:relative; width:min(94vw, 540px); height:min(54vh, 400px); border-radius:18px; overflow:hidden; box-shadow:0 14px 44px rgba(0,0,0,.55); }
  .un-room-wall{ position:absolute; inset:0 0 28% 0; background:var(--wall); }
  .un-room-wall::after{ content:''; position:absolute; inset:0; background:repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 7px, transparent 7px 26px); }
  .un-room-floor{ position:absolute; left:0; right:0; bottom:0; height:28%; background:var(--floor); box-shadow:inset 0 8px 12px rgba(0,0,0,.35); }
  .un-room-name{ position:absolute; left:12px; top:10px; color:rgba(255,248,232,.82); font:700 13px/1.2 'Baloo 2', system-ui, sans-serif; letter-spacing:.3px; text-shadow:0 1px 2px rgba(0,0,0,.6); }
  .un-fig{ position:absolute; bottom:11%; translate:-50% 0; transform-origin:50% 100%; transition:filter .3s; }
  .un-fig img{ display:block; width:100%; height:auto; image-rendering:pixelated; filter:drop-shadow(0 5px 3px rgba(0,0,0,.45)); }
  .un-fig.speak{ animation:unSpeak .45s ease-in-out infinite alternate; }
  .un-room:has(.un-fig.speak) .un-fig:not(.speak){ filter:brightness(.82); }
  @keyframes unSpeak{ from{ transform:translateY(0); } to{ transform:translateY(-4%); } }
  .un-you{ left:11%; width:17%; } .un-lion{ left:26%; width:24%; bottom:9%; }
  .un-guard{ left:52%; width:30%; bottom:13%; } .un-f1{ left:69%; width:20%; } .un-f2{ left:81%; width:19%; bottom:15%; } .un-f3{ left:92%; width:18%; bottom:9%; }
  .un-f3 img{ filter:saturate(.7) brightness(.92) drop-shadow(0 5px 3px rgba(0,0,0,.45)); }
  .un-prop{ position:absolute; pointer-events:none; }
  .un-prop i{ position:absolute; display:block; }
  .un-prop-basin{ left:30%; bottom:4%; width:26%; height:11%; border-radius:50%; background:#8a7a62; box-shadow:0 4px 6px rgba(0,0,0,.35); }
  .un-prop-basin i:nth-child(1){ inset:16% 7%; border-radius:50%; background:radial-gradient(ellipse at 50% 40%, #d6f2ff, #6db6dd 55%, #2b6d96); animation:unShimmer 3.2s ease-in-out infinite; }
  @keyframes unShimmer{ 0%,100%{ filter:brightness(1); } 50%{ filter:brightness(1.18); } }
  .un-prop-hearth{ left:50%; bottom:27%; width:34%; height:24%; translate:-50% 0; border-radius:46% 46% 0 0; background:#4a413b; box-shadow:inset 0 -6px 0 #3a332e; }
  .un-prop-hearth i:nth-child(1){ left:16%; right:16%; bottom:0; height:62%; border-radius:46% 46% 0 0; background:radial-gradient(ellipse at 50% 100%, #1d1917, #2b2522 70%); }
  .un-prop-hearth i:nth-child(2){ left:30%; right:30%; bottom:4%; height:14%; border-radius:50%; background:radial-gradient(ellipse, #8d8781, #5e5853 70%); opacity:.85; }
  .un-prop-tablet{ left:36%; bottom:5%; width:12%; height:16%; border-radius:12% 12% 6% 6%; background:linear-gradient(160deg, #a8977c, #776650); box-shadow:0 3px 4px rgba(0,0,0,.4); }
  .un-prop-tablet i:nth-child(1){ left:30%; top:8%; width:3px; height:80%; background:#4e4232; transform:rotate(18deg); }
  .un-prop-pots i{ top:0; width:2px; background:#3a2b1c; }
  .un-prop-pots{ inset:0 0 auto 0; height:40%; }
  .un-prop-pots i:nth-child(1){ left:20%; height:42%; } .un-prop-pots i:nth-child(2){ left:46%; height:28%; } .un-prop-pots i:nth-child(3){ left:78%; height:36%; }
  .un-prop-pots i::after{ content:''; position:absolute; left:50%; top:100%; width:22px; height:18px; translate:-50% 0; border-radius:30% 30% 50% 50%; background:linear-gradient(180deg, #b8724a, #7b4527); box-shadow:0 -6px 0 -2px #6f9e45; }
  `;
  document.head.appendChild(s);
}

/* ============================================================
   INTO THE JUNGLE'S OWN WORKINGS
   ============================================================ */
(function unHooks(){
  if(typeof jgRender !== 'function') return;
  /* drawn with the jungle: the King, the village as the story has it; then what this visit has waiting */
  const _render = jgRender;
  jgRender = function(world, d){
    const r = _render.apply(this, arguments);
    try {
      unCss();
      ui.unActs = {};
      ui.unGuardOut = null; ui.unArriving = null; ui.unBusy = false;
      const w = walkState(), p = w.at && w.at[JG_KEY];
      if(p) ui.unLastP = { x:p.x, y:p.y };
      const e = unEscort();
      if(e){
        if(!unRite(e.k).arrived){ unKingCatchUp(p); unKingDraw(); }
        else unVillageDraw(e.k);
        jgSeeThrough();
      }
      setTimeout(unSceneDue, 550);
    } catch(err){ console.error('unseal render:', err); }
    return r;
  };
  /* a step: he takes the square you left; into the village with him: the arrival */
  const _step = jgStep;
  jgStep = function(p, d){
    const prev = ui.unLastP;
    ui.unLastP = p ? { x:p.x, y:p.y } : null;
    try { unKingFollow(prev, p); } catch(err){ console.error('unseal step:', err); }
    const r = _step.apply(this, arguments);
    if(!r) try { unArriveCheck(p); unKingApproach(p); } catch(err){}
    return r;
  };
  if(typeof JG_DECK !== 'undefined') JG_DECK.onStep = (p, d)=> jgStep(p, d);
  /* a leap: he takes the square you leapt from as you go (and leaps after you on your next step) */
  if(typeof jgJump === 'function'){
    const _jump = jgJump;
    jgJump = async function(J){
      const w = walkState(), p = w.at && w.at[JG_KEY], from = p ? { x:p.x, y:p.y } : null;
      const pr = _jump.apply(this, arguments);
      if(from && p && (p.x !== from.x || p.y !== from.y) && unFollowing()){
        const k = unKingAt();
        if(k && Math.max(Math.abs(k.x - from.x), Math.abs(k.y - from.y)) <= 2) unKingTo(from.x, from.y, 'walk', 300);
      }
      try { return await pr; }
      finally { if(p) ui.unLastP = { x:p.x, y:p.y }; }
    };
  }
  /* his beam after Lucesco's Pulsar Glare, or as he pounces (Rift Ambush) */
  if(typeof jgGlare === 'function'){
    const _glare = jgGlare;
    jgGlare = function(b){
      const can = unKingCanBeam(b);
      const pr = _glare.apply(this, arguments);
      if(can && ui.jgFx === 'glare') unKingBeamSoon(b, ()=> !!document.querySelector('#walkWorld .jg-beam'), 240, Date.now() + JG_GLARE.ms + JG_GLARE.beam);
      return pr;
    };
  }
  if(typeof jgAmbush === 'function'){
    const _ambush = jgAmbush;
    jgAmbush = function(b){
      const can = unKingCanBeam(b);
      const pr = _ambush.apply(this, arguments);
      if(can && ui.jgFx === 'ambush') unKingBeamSoon(b, ()=>{ const me = $('#walkYou'); return !!(me && me.classList.contains('jg-starry')); }, 40, Infinity);
      return pr;
    };
  }
  /* the fight it begins (while its mark lasts) takes his beam's toll */
  const _fight = jgFight;
  jgFight = function(b, seen, opts){
    const beam = !!(b && b._kingBeamUntil && b._kingBeamUntil > Date.now());
    const r = _fight.apply(this, arguments);
    if(b && r !== false){ b._kingBeamGo = beam; b._kingBeamUntil = 0; }
    return r;
  };
  const _edge = jgEdgeApply;
  jgEdgeApply = function(bt){
    const r = _edge.apply(this, arguments);
    try {
      const edge = bt && bt.jgEdge, b = edge && jgBands().find(x=> x.id === edge.id);
      if(b && b._kingBeamGo){ b._kingBeamGo = false; unKingBeamApply(bt, b); }
    } catch(err){ console.error('unseal beam:', err); }
    return r;
  };
  /* the village's twelve, among the jungle's bands while it is under attack */
  const _bands = jgBands;
  jgBands = function(){
    const list = _bands.apply(this, arguments);
    const k = unSiegeOn() || '';
    if(list._unFor !== k){
      for(let i = list.length - 1; i >= 0; i--) if(list[i].siege) list.splice(i, 1);
      if(k) list.push(...unSiegeBandsOf(k));
      list._unFor = k;
    }
    return list;
  };
  const _beaten = jgBandBeaten;
  jgBandBeaten = function(b){ return b && b.siege ? !!(unWar().siege[b.siege] || {})[b.id] : _beaten.apply(this, arguments); };
  const _won = jgWon;
  jgWon = function(b, levelUps){
    if(b && b.siege){ const s = unWar().siege; (s[b.siege] = s[b.siege] || {})[b.id] = true; }
    return _won.apply(this, arguments);
  };
  const _place = jgBandPlace;
  jgBandPlace = function(b){
    const r = _place.apply(this, arguments);
    const el = b && b.siege && ui.jgBandEls && ui.jgBandEls[b.id];
    if(el){
      const cone = el.querySelector('.jg-cone');
      if(cone) cone.style.display = 'none';
      const ld = b.face === 'r' ? 1 : -1;
      el.style.setProperty('--ld', ld);
      if(el.dataset.unLd !== String(ld)){
        el.dataset.unLd = String(ld);
        el.classList.add('un-siege');
        const old = el.querySelector('.war-slash'); if(old) old.remove();
        el.insertAdjacentHTML('beforeend', warSlashHtml(ld, 0));
      }
    }
    return r;
  };
  /* the buttons; who stands where; the crowns over him see-through */
  const _near = jgNearActs;
  jgNearActs = function(p){ const acts = _near.apply(this, arguments); try { acts.push(...unNearActs(p)); } catch(err){ console.error('unseal acts:', err); } return acts; };
  if(typeof JG_DECK !== 'undefined'){
    const _occ = JG_DECK.occupied;
    JG_DECK.occupied = (x, y)=> _occ(x, y) || unSolidAt(x, y);
  }
  const _see = jgSeePoints;
  jgSeePoints = function(){
    const pts = _see.apply(this, arguments);
    const a = ui.unActs && ui.unActs.king;
    if(pts && a && a.el.isConnected){
      const p = walkState().at && walkState().at[JG_KEY];
      if(p && Math.abs(a.x - p.x) <= 9 && Math.abs(a.y - p.y) <= 9) pts.push([a.x + 0.5, a.y - 0.05, 0.85, 1.05]);
    }
    return pts;
  };
})();
/* the throne room: no King while he is out; slumped on his throne the day he comes home */
if(typeof caThings === 'function'){
  const _caThings = caThings;
  caThings = function(key){
    const list = _caThings.apply(this, arguments);
    if(key === 'r6_palace' && list && !list._un){
      list._un = true;
      const t = list.find(x=> x.who === 'king');
      if(t){
        const was = t.when, cls = t.cls || 'ca-npc';
        t.when = ()=> (!was || was()) && unKingHome();
        Object.defineProperty(t, 'cls', { configurable:true, enumerable:true, get(){ return cls + (unResting() ? ' un-spent' : ''); } });
      }
    }
    return list;
  };
}
