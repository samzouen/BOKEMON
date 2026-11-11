/* ============================================================
   31-huts.js — INSIDE THE TRIBES' HOUSES (4.25)
   The designer (2026-11-11): "Could we also have interiors for huts as rooms that can be explored in the tribes
   please? Could you design each hut to the level of meticulous detail that the castle's rooms are? … could we have
   hidden tickets in each room please?"
   Every house in the four villages can be gone into: the eight huts round each green and the guardian's lodge.
   Each hut is something of its own — a family's home, another, the kitchen, the workshop, the store, the healer's,
   the elder's, the weavers' — and each tribe furnishes it its own way: the Water tribe's woven reed walls hung with
   nets and shells over boards and rush mats; the Fire tribe's red clay painted with flames, its floor beaten earth;
   the Earth tribe's fitted stone carved with signs, its floor flagstones; the Grass tribe's living walls of woven
   boughs in leaf, its floor moss. What stands in them is the tribe's own: its beds, tables, seats, shelves, jars,
   hearths, looms, workbenches, stores, the elder's seat and its totems; in the lodge the guardian's seat, the
   ancestor's shrine, the long table. One or two of the tribe at home in each, with a word for you; and in each a
   hidden find, as the jungle's (13-walkmap.js: a deck's `prizes`): 10 Skill Tokens.
   They are castle rooms to walk in (21-castle.js: CA_MAPS, caMakeDeck; their squares painted by HUT_ART.paint,
   through CA_ROOM's `painter`; what stands in them by HUT_ART.furn, through caDrawFurniture), entered from the jungle
   at each door (hutJungleThings, asked by jgThings), and left by it.
   One name outside for the pictures: HUT_ART.
   ============================================================ */

/* ---------- the rooms: which, and what each is ---------- */
const HUT_PURPOSE = ['home', 'home2', 'cook', 'craft', 'store', 'heal', 'elder', 'weave'];
const HUT_NAME = {
  water:{ home:'A fisher’s home', home2:'A boatbuilder’s home', cook:'The fish kitchen', craft:'The net-menders’ hut', store:'The drying hut', heal:'The healer’s hut', elder:'The tide-keeper’s hut', weave:'The weavers’ hut', lodge:'The long house' },
  fire: { home:'A smith’s home', home2:'A drummer’s home', cook:'The oven house', craft:'The forge', store:'The woodstore', heal:'The healer’s hut', elder:'The flame-keeper’s hut', weave:'The mask-makers’ hut', lodge:'The guardian’s hall' },
  earth:{ home:'A quarrier’s home', home2:'A potter’s home', cook:'The kitchen in the rock', craft:'The potters’ workshop', store:'The grain store', heal:'The healer’s hut', elder:'The stone-reader’s hut', weave:'The carvers’ hut', lodge:'The house in the hill' },
  grass:{ home:'A gardener’s home', home2:'A beekeeper’s home', cook:'The herb kitchen', craft:'The remedy-makers’ hut', store:'The seed store', heal:'The healer’s hut', elder:'The root-singer’s hut', weave:'The weavers’ hut', lodge:'The house in the root' },
};
/* who is at home, and what each says (in turn, as you speak to them again) */
const HUT_LINES = {
  water:{
    home:[`<b>"Come in, come in — mind the nets. My husband mends them faster than the aliens can tear them. Almost."</b>`, `<b>"When the river is free again, I'll catch you the biggest fish you've ever seen. That's a promise."</b>`],
    home2:[`<b>"This is my boat. Well — it will be. Three more planks and a prayer to the tide."</b>`, `<b>"The little one sleeps best to the sound of rain on the reeds."</b>`],
    cook:[`<b>"Fish soup, fish cakes, fish pie. Ask me what's for supper tomorrow. Go on, guess."</b>`, `<b>"A pinch of river salt, a whisper of reed-ginger. That's the secret. Don't tell the Fire tribe."</b>`],
    craft:[`<b>"Over, under, knot. Over, under, knot. A net is only as strong as its smallest knot."</b>`, `<b>"The floats are cut from bark. They bob up to tell us where the net is, even in the dark."</b>`],
    store:[`<b>"Fish dry best in the wind off the river. It smells… strong. You get used to it. Mostly."</b>`, `<b>"This store would feed the whole village for a month. Before the aliens. Now, a week."</b>`],
    heal:[`<b>"Cool water for a fever, warm water for a bruise. And rest. Everyone forgets the rest."</b>`, `<b>"These shells hold river-moss salve. It stings, then it soothes. Like good advice."</b>`],
    elder:[`<b>"I keep the tide-count: every tide since the King sealed our ancestor. Two hundred years of knots in a rope."</b>`, `<b>"The tide goes out, child. It always comes back."</b>`],
    weave:[`<b>"The blue comes from river-snails. Thousands of them. They don't mind. We ask nicely."</b>`, `<b>"Every child gets a blanket woven with their own wave. Look — this one is yours, if you like."</b>`],
    lodge:[`<b>"The long house is where we decide things. Slowly. Like water wearing down a stone."</b>`, `<b>"That empty stand is where our ancestor's blade rested, before the King took it. Soon, perhaps, she will come home."</b>`],
  },
  fire:{
    home:[`<b>"Don't touch the anvil. It's never as cold as it looks."</b>`, `<b>"My grandmother forged that blade on the wall. It's never been used. That's how you know it's a good one."</b>`],
    home2:[`<b>"Boom-ba-ba-BOOM! Sorry. Do you want a go? Hit it like you mean it!"</b>`, `<b>"A drum is a heart you can share. When we dance, the whole village has one heartbeat."</b>`],
    cook:[`<b>"Flatbread, straight from the oven! Careful — HOT. Told you."</b>`, `<b>"We bake with the last of the good wood. Even hungry, we eat properly."</b>`],
    craft:[`<b>"The forge has been cold for weeks. We light it once a day, just to remember the colour."</b>`, `<b>"Iron is like a temper: hot, hammered, then cooled in water. Then it holds."</b>`],
    store:[`<b>"Every log counted. Every stick. We're burning our roof beams, and we don't complain."</b>`, `<b>"The aliens took the north woods. We'll take them back. Then we'll have firewood again."</b>`],
    heal:[`<b>"Burns, mostly. We are the Fire tribe. It comes with the job."</b>`, `<b>"Ember-root tea. It tastes terrible. It works. Drink it."</b>`],
    elder:[`<b>"I keep the flame. It has burned since before the King's grandfather. It does not go out on my watch."</b>`, `<b>"Fire is not anger, child. Fire is warmth that has decided to stand up."</b>`],
    weave:[`<b>"Every mask is a face of the fire: the spark, the blaze, the ember. Which are you?"</b>`, `<b>"We'll wear the blaze masks the day our ancestor wakes. I'm painting them already."</b>`],
    lodge:[`<b>"The guardian's hall. Speak up in here — the guardian likes people who speak up."</b>`, `<b>"That stand was for the blade of our ancestor. Empty for two hundred years. Not for long, I think."</b>`],
  },
  earth:{
    home:[`<b>"…Welcome. …Sit. …The stone… is warm, by the hearth."</b>`, `<b>"…My father… cut these walls. …His father… cut the hill."</b>`],
    home2:[`<b>"…Turn the wheel… slowly. …Clay hates to hurry."</b>`, `<b>"…This pot… took three days. …That one… three years. …I forgot it… in the kiln."</b>`],
    cook:[`<b>"…Root stew. …It cooks… all day. …We eat… all evening."</b>`, `<b>"…The rock… keeps the cold in. …The food… keeps."</b>`],
    craft:[`<b>"…A pot… is a hole… with clay around it. …The hole… is the useful part."</b>`, `<b>"…Feel this. …Smooth. …Forty years… of hands."</b>`],
    store:[`<b>"…Grain… for the winter. …Less… than last winter. …The aliens… dig into the stores."</b>`, `<b>"…We count… every sack. …Twice. …Then… once more."</b>`],
    heal:[`<b>"…Clay… for a sprain. …Patience… for everything else."</b>`, `<b>"…Lie still. …The mountain… does the healing. …I only… help."</b>`],
    elder:[`<b>"…The stones… remember. …I read them. …They say… the King… will keep his word."</b>`, `<b>"…Slowly, child. …The mountain… was not built… in a day."</b>`],
    weave:[`<b>"…We carve… the tribe's story… into every stone. …This one… is about you."</b>`, `<b>"…Hammer. …Chisel. …Listen. …The stone… tells you where… to cut."</b>`],
    lodge:[`<b>"…The house… in the hill. …Our guardian… sits there… and thinks. …For days."</b>`, `<b>"…The blade's stand… is empty. …We… are patient. …Patient… is what we are."</b>`],
  },
  grass:{
    home:[`<b>"Ooh, visitors! Wipe your feet. Actually, don't — the moss likes it."</b>`, `<b>"I grow my bed fresh every spring. This year's has daisies in it. Very comfy."</b>`],
    home2:[`<b>"Shh — the bees are sleeping. Well, three of them are. The rest are gossiping."</b>`, `<b>"Honey for you! Just a lick. The bees are counting."</b>`],
    cook:[`<b>"Mint, thyme, dandelion, and a secret one. The secret one is grass. Don't tell anyone."</b>`, `<b>"Soup's nearly ready! It's mostly hope, today. Hope is very filling."</b>`],
    craft:[`<b>"Crush it, steep it, strain it — and never, ever taste it to check."</b>`, `<b>"This one's for sneezes. This one's for sadness. This one's for… hmm. I forgot. Best not."</b>`],
    store:[`<b>"Every seed is a promise. We've eaten too many promises this year."</b>`, `<b>"When the aliens are gone, we'll plant every one of these. The whole jungle will bloom."</b>`],
    heal:[`<b>"Lie down on the moss. Breathe in. Good. Now breathe out. Even better!"</b>`, `<b>"Petal poultice for scrapes. It doesn't do much, but it smells lovely, and that helps."</b>`],
    elder:[`<b>"I sing to the roots, and the roots sing back. You can't hear them? Lean closer… closer…"</b>`, `<b>"Little ones grow, child. Even the slowest seed finds the sun in the end."</b>`],
    weave:[`<b>"Grass cloth! Light as a leaf, strong as a vine. And it rustles when you dance."</b>`, `<b>"I'm weaving a hat for Lucesco. It has a flower on it. He'll love it. He won't."</b>`],
    lodge:[`<b>"The house in the root! The guardian grew it from one seed. Took ages. Worth it."</b>`, `<b>"That empty stand is for our ancestor's blade. When it comes home, we'll have the biggest party!"</b>`],
  },
};
const HUT_LION = {
  home:`<i>Lucesco sniffs the air.</i> <b>"A home. It smells of supper, and of being careful."</b>`,
  lodge:`<i>Lucesco lowers his voice.</i> <b>"The heart of the village. Walk softly."</b>`,
};

/* every room: its key, its tribe, its house (0–7 a hut round the green, 'lodge' the guardian's) */
function hutKey(k, n){ return n === 'lodge' ? 'r6_lodge_' + k : 'r6_hut_' + k + '_' + n; }
function hutParse(key){
  let m = /^r6_hut_(\w+?)_(\d)$/.exec(key);
  if(m && JG_TRIBES[m[1]]) return { k:m[1], n:+m[2], purpose:HUT_PURPOSE[+m[2]] };
  m = /^r6_lodge_(\w+)$/.exec(key);
  if(m && JG_TRIBES[m[1]]) return { k:m[1], n:'lodge', purpose:'lodge' };
  return null;
}
function hutTitle(k, n){ return HUT_NAME[k][n === 'lodge' ? 'lodge' : HUT_PURPOSE[n]]; }
/* open to you once its village is: found (its wall down), and not while the King is there for the unsealing */
function hutOpen(k){
  if(typeof questState !== 'function') return true;
  const q = questState();
  return !!(q.found && q.found[k]);
}
function hutBusy(k){ return (typeof unAt === 'function' && unAt() === k) || ui.unArriving === k || !!ui.sceneRunning; }

/* ---------- the maps ----------
   A hut, 12 × 9: its back wall two squares high (rows 0 and 1, hung with what the house keeps), its floor ten by
   six, its door in the middle of its front wall (the squares before it, 5 and 6 of row 7). The lodge, 16 × 11: its
   floor fourteen by eight, its door at 7 and 8 of row 9. What stands in each: [kind, x, y, w, h, extra] — its
   squares nobody walks on, its picture over them (HUT_RECT: how far it reaches past them, and up). */
const HUT_RECT = {
  hbed:[-0.1, -0.6, 0.2, 0.62], htable:[-0.12, -0.5, 0.24, 0.56], hseat:[0.08, -0.25, -0.16, 0.3], hshelf:[-0.04, -1.55, 0.08, 1.58],
  hjars:[-0.12, -0.62, 0.24, 0.66], hcook:[-0.1, -1.05, 0.2, 1.08], hloom:[-0.06, -1.5, 0.12, 1.52], hcraft:[-0.1, -0.85, 0.2, 0.9],
  hstore:[-0.1, -1.15, 0.2, 1.18], helder:[-0.16, -1.25, 0.32, 1.28], hcrib:[0, -0.42, 0, 0.45], htotem:[0.08, -1.95, -0.16, 1.98],
  hthrone:[-0.22, -1.6, 0.44, 1.64], hshrine:[-0.12, -1.45, 0.24, 1.48], hlong:[-0.1, -0.52, 0.2, 0.58], hplant:[-0.12, -0.95, 0.24, 0.98],
  hdrum:[0, -0.5, 0, 0.52], hbasin:[-0.06, -0.38, 0.12, 0.42], hprop:[-0.12, -1.2, 0.24, 1.22],
};
const HUT_RECIPES = {
  home:{ wall:{ 1:'window', 3:'deco:0', 4:'lamp', 7:'deco:1', 10:'window' },
    put:[['hbed', 1, 2, 2, 1], ['hbed', 1, 4, 2, 1, { n:1 }], ['hshelf', 4, 2, 2, 1], ['hcook', 8, 2, 2, 1], ['htable', 6, 4, 2, 1], ['hseat', 5, 4, 1, 1], ['hseat', 8, 4, 1, 1, { n:1 }],
         ['hjars', 10, 4, 1, 1], ['hplant', 10, 7, 1, 1], ['hjars', 1, 7, 1, 1, { n:1 }]],
    floor:[{ kind:'rug', x:4.2, y:3.25, w:5.6, h:2.6 }], prize:[10, 2], folk:[[7, 6], [3, 5]], props:[['hprop', 1, 6, { n:0 }], ['hprop', 10, 6, { n:1 }]] },
  home2:{ wall:{ 2:'deco:1', 5:'window', 6:'lamp', 9:'deco:0' },
    put:[['hbed', 9, 2, 2, 1], ['hcrib', 9, 4, 1, 1], ['hshelf', 1, 2, 2, 1], ['hcook', 4, 2, 2, 1], ['htable', 3, 5, 2, 1], ['hseat', 2, 5, 1, 1], ['hseat', 5, 5, 1, 1, { n:1 }],
         ['hjars', 1, 5, 1, 1], ['hplant', 10, 7, 1, 1], ['hdrum', 7, 2, 1, 1]],
    floor:[{ kind:'rug', x:6.4, y:3.6, w:3.8, h:2.4 }], prize:[1, 7], folk:[[7, 5]], props:[['hprop', 10, 5, { n:1 }], ['hprop', 3, 2, { n:3 }]] },
  cook:{ wall:{ 1:'deco:0', 3:'lamp', 4:'deco:1', 8:'window', 10:'deco:0' },
    put:[['hcook', 4, 2, 3, 1], ['hstore', 1, 2, 2, 1], ['hshelf', 8, 2, 2, 1], ['htable', 4, 4, 3, 1], ['hseat', 3, 4, 1, 1], ['hseat', 7, 4, 1, 1, { n:1 }],
         ['hjars', 10, 4, 1, 1], ['hjars', 10, 5, 1, 1, { n:1 }], ['hjars', 1, 6, 1, 1, { n:2 }], ['hbasin', 1, 4, 1, 1]],
    floor:[{ kind:'rug', x:3.5, y:3.55, w:5, h:1.9 }], prize:[10, 2], folk:[[5, 3], [8, 5]], props:[['hprop', 10, 7, { n:2 }], ['hprop', 7, 2, { n:1 }]] },
  craft:{ wall:{ 1:'window', 3:'deco:1', 5:'lamp', 6:'deco:0', 8:'deco:1', 10:'window' },
    put:[['hcraft', 1, 2, 2, 1], ['hcraft', 6, 2, 2, 1, { n:1 }], ['hshelf', 9, 2, 2, 1], ['hstore', 1, 5, 2, 1], ['hjars', 4, 2, 1, 1], ['hseat', 2, 3, 1, 1], ['hseat', 7, 3, 1, 1, { n:1 }],
         ['htable', 8, 5, 2, 1], ['hjars', 10, 7, 1, 1, { n:1 }]],
    floor:[{ kind:'rug', x:3.4, y:4.2, w:4.2, h:2.3 }], prize:[1, 7], folk:[[4, 3], [6, 5]], props:[['hprop', 10, 4, { n:0 }], ['hprop', 5, 2, { n:2 }]] },
  store:{ wall:{ 2:'deco:0', 4:'lamp', 6:'deco:1', 9:'deco:0' },
    put:[['hstore', 1, 2, 2, 1], ['hstore', 4, 2, 2, 1, { n:1 }], ['hstore', 8, 2, 2, 1, { n:2 }], ['hjars', 1, 4, 1, 1], ['hjars', 1, 5, 1, 1, { n:1 }], ['hjars', 10, 4, 1, 1, { n:2 }],
         ['hjars', 10, 5, 1, 1], ['hshelf', 3, 5, 2, 1], ['hjars', 8, 5, 1, 1, { n:1 }]],
    floor:[], prize:[6, 2], folk:[[7, 4]], props:[['hprop', 10, 7, { n:3 }], ['hprop', 1, 7, { n:2 }], ['hprop', 7, 2, { n:1 }]] },
  heal:{ wall:{ 1:'deco:1', 3:'window', 5:'lamp', 7:'deco:0', 10:'deco:1' },
    put:[['hbed', 1, 2, 2, 1], ['hbed', 1, 5, 2, 1, { n:1 }], ['hshelf', 4, 2, 2, 1], ['hbasin', 7, 2, 1, 1], ['htable', 6, 4, 2, 1, { heal:true }], ['hseat', 8, 4, 1, 1],
         ['hplant', 10, 2, 1, 1], ['hplant', 10, 7, 1, 1, { n:1 }], ['hjars', 9, 2, 1, 1]],
    floor:[{ kind:'rug', x:3.3, y:5.3, w:2.6, h:1.6 }], prize:[10, 3], folk:[[5, 4], [3, 2]], props:[['hprop', 10, 5, { n:1 }]] },
  elder:{ wall:{ 1:'deco:0', 2:'lamp', 4:'deco:1', 7:'deco:1', 9:'lamp', 10:'deco:0' },
    put:[['helder', 5, 2, 2, 1], ['htotem', 3, 2, 1, 1], ['htotem', 8, 2, 1, 1, { n:1 }], ['hseat', 3, 5, 1, 1], ['hseat', 8, 5, 1, 1, { n:1 }], ['hseat', 4, 6, 1, 1, { n:2 }], ['hseat', 7, 6, 1, 1],
         ['hdrum', 1, 4, 1, 1], ['hshelf', 9, 4, 2, 1], ['hplant', 1, 2, 1, 1]],
    floor:[{ kind:'rug', x:3.6, y:3.7, w:4.8, h:2.4, round:true }], prize:[10, 2], folk:[[5, 3]], props:[['hprop', 1, 7, { n:0 }], ['hprop', 10, 7, { n:3 }]] },
  weave:{ wall:{ 1:'deco:1', 3:'window', 6:'lamp', 7:'deco:0', 10:'deco:1' },
    put:[['hloom', 1, 2, 2, 1], ['hloom', 4, 2, 2, 1, { n:1 }], ['hshelf', 8, 2, 2, 1], ['htable', 5, 5, 2, 1], ['hseat', 4, 5, 1, 1], ['hseat', 7, 5, 1, 1, { n:1 }],
         ['hjars', 10, 4, 1, 1], ['hjars', 1, 6, 1, 1, { n:1 }], ['hstore', 9, 6, 2, 1]],
    floor:[{ kind:'rug', x:3.4, y:4.3, w:5.2, h:2.4, round:true }], prize:[10, 2], folk:[[1, 3], [5, 3]], props:[['hprop', 1, 4, { n:2 }], ['hprop', 7, 2, { n:0 }]] },
  lodge:{ W:16, H:11, wall:{ 1:'deco:0', 3:'lamp', 5:'banner', 6:'deco:1', 9:'deco:1', 10:'banner', 12:'lamp', 14:'deco:0' },
    put:[['hthrone', 7, 2, 2, 1], ['hshrine', 3, 2, 2, 1], ['hcook', 11, 2, 2, 1], ['htotem', 1, 2, 1, 1], ['htotem', 14, 2, 1, 1, { n:1 }], ['hlong', 5, 5, 6, 1],
         ['hseat', 4, 5, 1, 1], ['hseat', 11, 5, 1, 1, { n:1 }], ['hseat', 6, 4, 1, 1, { n:2 }], ['hseat', 9, 4, 1, 1], ['hseat', 6, 6, 1, 1, { n:1 }], ['hseat', 9, 6, 1, 1, { n:2 }],
         ['hjars', 1, 8, 1, 1], ['hjars', 14, 8, 1, 1, { n:1 }], ['hplant', 14, 5, 1, 1], ['hplant', 1, 5, 1, 1, { n:1 }], ['hdrum', 13, 2, 1, 1]],
    floor:[{ kind:'rug', x:3.5, y:3.5, w:9, h:4, big:true }], prize:[2, 2], folk:[[4, 3], [12, 7]], props:[['hprop', 14, 6, { n:0 }], ['hprop', 3, 8, { n:1 }], ['hprop', 12, 8, { n:3 }]] },
};
const _hutMaps = {};
function hutMap(k, n){
  const key = hutKey(k, n);
  if(_hutMaps[key]) return _hutMaps[key];
  const R0 = HUT_RECIPES[n === 'lodge' ? 'lodge' : HUT_PURPOSE[n]], T = CA_T, W = R0.W || 12, H = R0.H || 9;
  const R = Object.assign({}, R0, { put:R0.put.concat((R0.props || []).map(([kind, x, y, o])=> [kind, x, y, 1, 1, o])), wall:Object.assign({}, R0.wall) });
  const m = caGrid(W, H, T.WOODWALL);
  caFill(m, 0, 0, W, H, T.WOODWALL, 'hw:top');
  caFill(m, 1, 2, W - 2, H - 3, T.PLANK, 'hf');
  for(let x = 1; x < W - 1; x++) caPut(m, x, 1, T.WOODWALL, 'hw:' + (R.wall[x] || 'plain'));
  const doorX = (W >> 1) - 1;
  m.tags.door = { x:doorX, y:H - 2, w:2, stand:{ x:doorX, y:H - 2 } };
  m.tags.tribe = k; m.tags.n = n;
  m.tags.floor = (R.floor || []).slice().concat([{ kind:'mat', x:doorX + 0.2, y:H - 2 + 0.3, w:1.6, h:0.56 }]);
  m.tags.glows = [];
  R.put.forEach(([kind, x, y, w, h, o])=>{
    caFill(m, x, y, w, h, kind === 'hlong' || kind === 'htable' ? T.TABLE : kind === 'hseat' ? T.STOOL : T.CRATE, 'hf');
    const r = HUT_RECT[kind] || [0, -0.5, 0, 0.5];
    caDeco(m, kind, x + r[0], y + r[1], w + r[2], h + r[3], Object.assign({ z:y + h - 0.1, tribe:k, room:key, fw:w, fh:h }, o || {}));
  });
  /* what hangs on the wall where something tall stands before it goes to the nearest free stretch of wall */
  const TALL = new Set(['hshelf', 'hloom', 'hstore', 'hcook', 'htotem', 'hthrone', 'hshrine', 'helder', 'hprop']);
  const hidden = new Set(), wall = Object.assign({}, R.wall);
  R.put.forEach(([kind, x, y, w])=>{ if(y === 2 && TALL.has(kind)) for(let i = x; i < x + w; i++) hidden.add(i); });
  Object.keys(wall).map(Number).forEach(x=>{
    if(!hidden.has(x)) return;
    const part = wall[x]; delete wall[x];
    for(let d = 1; d < W; d++) for(const nx of [x - d, x + d]){ if(nx >= 1 && nx < W - 1 && !hidden.has(nx) && !wall[nx]){ wall[nx] = part; return; } }
  });
  for(let x = 1; x < W - 1; x++) caPut(m, x, 1, T.WOODWALL, 'hw:' + (wall[x] || 'plain'));
  R.wall = wall;
  /* flat things lying about (HUT_ART.paint): by the walls and the furniture, never where the find, the folk or the
     door are */
  const RR = jgRng(((k.charCodeAt(0) * 977) ^ (typeof n === 'number' ? n * 131 : 7919)) >>> 0), props = [];
  const busy = new Set([R.prize.join(','), (doorX) + ',' + (H - 2), (doorX + 1) + ',' + (H - 2)].concat((R.folk || []).map(f=> f.join(','))));
  const cand = [];
  for(let y = 2; y < H - 1; y++) for(let x = 1; x < W - 1; x++){
    if(caSolidCode(caAt(m, x, y)) || busy.has(x + ',' + y)) continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy])=> caSolidCode(caAt(m, x + dx, y + dy)));
    if(near) cand.push({ x, y });
  }
  for(let i = 0; i < 4 && cand.length; i++){ const c = cand.splice(Math.floor(RR() * cand.length), 1)[0]; props.push({ x:c.x + 0.15 + RR() * 0.3, y:c.y + 0.2 + RR() * 0.35, n:i, a:RR() }); }
  m.tags.props = props;
  /* the light: a pool round each lamp on the wall, round the hearth, at each window */
  for(let x = 1; x < W - 1; x++){
    const p = R.wall[x] || '';
    if(p === 'lamp'){ m.tags.glows.push({ x:x + 0.5, y:2.3, r:2.1, c:HUT_PAL[k].glow }); caDeco(m, 'hlight', x + 0.25, 0.75, 0.5, 0.5, { z:1.95, tribe:k, room:key }); }
  }
  m.deco.forEach(d=>{ if(d.kind === 'hcook') m.tags.glows.push({ x:d.x + d.w / 2, y:d.y + d.h + 0.4, r:2.5, c:'rgba(255,160,70,.22)' }); });
  m.tags.prize = R.prize; m.tags.folk = R.folk || [];
  m.painter = HUT_ART.paint;
  m.room = 'hut:' + key;
  m.deco.sort((a, b)=> a.z - b.z);
  _hutMaps[key] = m;
  return m;
}
/* (it has its squares' pictures only for CA_ROOM's own needs: every square is painted by HUT_ART.paint) */

/* ---------- the places: a deck for each room ---------- */
const HUT_KEYS = [];
JG_TRIBE_KEYS.forEach(k=> HUT_PURPOSE.map((_, n)=> n).concat(['lodge']).forEach(n=>{
  const key = hutKey(k, n), R = HUT_RECIPES[n === 'lodge' ? 'lodge' : HUT_PURPOSE[n]], W = R.W || 12, H = R.H || 9;
  HUT_KEYS.push(key);
  CA_MAPS[key] = ()=> hutMap(k, n);
  CA_PLACES[key] = { title:hutTitle(k, n), backLabel:'Village', backTo:JG_KEY, music:'zone_jungle', spawn:()=> [(W >> 1) - 1, H - 2] };
  caMakeDeck(key, CA_PLACES[key]);
  const d = DECKS[key];
  if(d){
    d.prizes = [R.prize.slice()];
    d.opens = ()=> hutOpen(k);
    d.bg = 'jungle';
    d.prizeLines = [`Tucked away where only a curious visitor would look…`, `Something glints in a corner.`, `Hidden in plain sight!`, `Lucesco noses at something shiny.`, `Somebody hid this well. Not well enough.`];
  }
}));

/* ---------- in the jungle: a door to each house ---------- */
function hutJungleThings(list, P){
  JG_TRIBE_KEYS.forEach(k=>{
    const V = P.villages[k];
    V.huts.forEach((h, n)=>{
      list.push({ x:h.x + 1, y:h.y + h.h, w:2, icon:'', verb:'Enter', where:hutTitle(k, n), arrow:'up', walk:true, hut:true,
        when:()=> hutOpen(k) && !hutBusy(k), act:()=> hutEnter(k, n) });
    });
    const L = V.lodge;
    list.push({ x:L.x + 2, y:L.y + L.h, w:2, icon:'', verb:'Enter', where:hutTitle(k, 'lodge'), arrow:'up', hut:true,
      when:()=> hutOpen(k) && !hutBusy(k), act:()=> hutEnter(k, 'lodge') });
  });
}
function hutEnter(k, n){
  if(ui.jgTalk || ui.caTalk || hutBusy(k)) return;
  const key = hutKey(k, n), sp = CA_PLACES[key].spawn();
  const w = walkState();
  w.at = w.at || {};
  w.at[key] = { x:sp[0], y:sp[1] };
  w.face = 'u';
  ui.walkFresh = false;
  if(typeof caLion !== 'undefined') caLion.at = null;
  playSfx && playSfx('door');
  goDeck(key);
}
/* out: back before its door, in the jungle (where you stood to go in) */
function hutLeave(k, n){
  if(ui.caTalk) return;
  const V = jgGround().places.villages[k], h = n === 'lodge' ? V.lodge : V.huts[n];
  const at = n === 'lodge' ? { x:V.stand.x, y:V.stand.y - 1 } : { x:h.x + 1, y:h.y + h.h };
  const w = walkState();
  w.at = w.at || {};
  w.at[JG_KEY] = { x:at.x, y:at.y }; jgState().at = { x:at.x, y:at.y };
  w.face = 'd';
  ui.walkFresh = false; ui.jgLion = null;
  goDeck(JG_KEY);
}

/* ---------- inside: its door, its people, what can be looked at ---------- */
function hutThings(key, list, T){
  const H = hutParse(key);
  if(!H) return;
  const m = hutMap(H.k, H.n), tg = m.tags;
  T({ x:tg.door.x, y:tg.door.y, w:2, walk:true, icon:'', verb:'Out', where:'Into the village', arrow:'down', act:()=> hutLeave(H.k, H.n) });
  const folk = (JG_VILLAGE_FOLK[H.k] || JG_TRIBES[H.k].members);
  tg.folk.forEach(([x, y], i)=>{
    const sp = folk[(i + (H.n === 'lodge' ? 0 : H.n)) % folk.length];
    T({ x, y, cls:'ca-npc hut-folk', html:()=> jgFolkImg(sp), faceR:i % 2 === 1, verb:'Talk', sub:jgFolkName(sp), act:()=> hutTalk(H, i, sp) });
  });
  m.deco.forEach(d=>{
    const look = HUT_LOOK[d.kind];
    if(!look || d.n) return;                                           // (one of each to look at)
    T({ x:Math.round(d.x - HUT_RECT[d.kind][0]), y:Math.round(d.y - HUT_RECT[d.kind][1]), w:d.fw, h:d.fh, icon:'', verb:'Look', sub:look.sub, act:()=> hutLook(H, d.kind) });
  });
}
/* the tribe's people at home: their pictures as the jungle's folk are, stood on their squares (20-jungle.js: jgFolkImg's
   own size and centring, not a person's 1.314) — and turned on the spot */
(function hutCss(){
  if(typeof document === 'undefined' || document.getElementById('hutCss')) return;
  const s = document.createElement('style');
  s.id = 'hutCss';
  s.textContent = `.walk-ent.hut-folk{ overflow:visible; }
  .walk-ent.hut-folk .jg-folk-art{ position:absolute; left:50%; image-rendering:pixelated; pointer-events:none; filter:drop-shadow(0 2px 1px rgba(0,0,0,.28));
    transform:none; animation:jgHover 2.4s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce){ .walk-ent.hut-folk .jg-folk-art{ animation:none; } }`;
  document.head.appendChild(s);
})();
function hutTalk(H, i, sp){
  const lines = HUT_LINES[H.k][H.purpose] || [], key = 'hut_' + H.k + '_' + H.n + '_' + i;
  const c = caState();
  c.talk[key] = (c.talk[key] || 0) + 1;
  const line = lines[(c.talk[key] - 1 + i) % Math.max(1, lines.length)] || `<b>"Hello!"</b>`;
  return hutSay(jgFace(sp + '_front'), jgFolkName(sp), line);
}
/* one line, from one of the tribe (castle rooms' talk: caSay, and the flag every castle place keeps) */
async function hutSay(face, name, html){
  if(ui.caTalk) return;
  ui.caTalk = true;
  releaseKeys();
  try { await caSay(face ? [face] : [], name || '', html); }
  finally { ui.caTalk = false; refreshWalk(); }
}
const HUT_LOOK = {
  hcook:{ sub:'The hearth' }, hloom:{ sub:'The loom' }, hcraft:{ sub:'The workbench' }, hstore:{ sub:'The store' }, helder:{ sub:'The elder’s seat' },
  hthrone:{ sub:'The guardian’s seat' }, hshrine:{ sub:'The shrine' }, htotem:{ sub:'The totem' }, hdrum:{ sub:'The drum' }, hbasin:{ sub:'The basin' },
};
const HUT_LOOK_LINES = {
  water:{ hcook:`A clay stove, a pot of fish soup simmering on it. It smells of river and reed-ginger.`, hloom:`A loom strung with blue thread. Waves are woven into the cloth, one after another.`,
    hcraft:`A frame with a half-mended net on it, a wooden needle still threaded, bark floats in a heap.`, hstore:`Fish hang drying on the racks, rows and rows of them, turning slowly in the draught.`,
    helder:`A seat of driftwood worn smooth, a rope beside it tied with thousands of knots — a knot for every tide.`, hthrone:`The guardian's seat: driftwood and blue-glazed tiles, a great shell rising behind it like a wave.`,
    hshrine:`The ancestor's shrine. Offerings of shells and river pearls, a lamp kept burning, and an empty stand where a blade once rested.`,
    htotem:`A carved post of the tribe's spirits: a fish, a heron, a turtle, the river at the top.`, hdrum:`A water drum: a bowl of water with a gourd floating in it. It makes a deep, rolling sound.`,
    hbasin:`A basin of still water. Your reflection looks back, and so does Lucesco's, curious.` },
  fire:{ hcook:`A domed clay oven, glowing at its mouth. Flatbreads blister on the hot stone inside.`, hloom:`A rack of masks drying, half-painted: sparks, blazes, embers, each with its own fierce face.`,
    hcraft:`An anvil black with use, a forge of fire-brick, tongs and hammers in a row. The coals are banked low.`, hstore:`Logs stacked to the roof, every one counted. A sack of charcoal, carefully tied.`,
    helder:`A seat carved with flames, a bowl beside it where an ember glows and never goes out.`, hthrone:`The guardian's seat, carved from one great log, its back a fan of wooden flames painted red and gold.`,
    hshrine:`The ancestor's shrine: embers in a stone bowl, the tribe's masks round it, and an empty stand for a blade.`,
    htotem:`A totem of the fire spirits: a salamander, a phoenix, a dancer, flames on top, painted fresh.`, hdrum:`A great drum of red hide. You tap it. The whole hut answers, BOOM.`,
    hbasin:`A basin of water for cooling hot iron. It hisses faintly, remembering the last blade.` },
  earth:{ hcook:`A hearth cut into the rock, a heavy pot of root stew over it. It has been cooking since morning.`, hloom:`A block of stone half-carved: the tribe's story, line by line. Chisels lie beside it, in order of size.`,
    hcraft:`A potter's wheel of stone, a lump of wet clay on it, and pots drying in a row: some round, some… less round.`, hstore:`Sacks of grain and baskets of ore, stacked against the rock, each one counted twice.`,
    helder:`A seat of stone worn into the shape of whoever sits in it, and a stack of carved tablets beside it.`, hthrone:`The guardian's seat, hewn from the hill itself, a slab of amber set in its back like a sunrise.`,
    hshrine:`The ancestor's shrine: a crystal glowing amber in a cradle of stone, and an empty stand for a blade.`,
    htotem:`A standing stone carved with the tribe's spirits: a mole, a tortoise, a ram, and the mountain on top.`, hdrum:`A stone drum: a hollow rock with a hide stretched over it. It sounds like distant thunder.`,
    hbasin:`A basin carved from one stone, the water in it cold and clear, from deep in the hill.` },
  grass:{ hcook:`A little hearth of river stones, a kettle of herb tea on it. Bundles of thyme and mint hang over it.`, hloom:`A loom strung with grass threads, a green cloth growing on it, rustling softly.`,
    hcraft:`A bench of mortars and pestles, bowls of crushed petals, and little bottles, each with a flower on its label.`, hstore:`Sacks of seeds and baskets of nuts and dried berries, tied with grass string.`,
    helder:`A seat grown from living roots, still putting out leaves, a little bird's nest in its arm.`, hthrone:`The guardian's seat: a great root curled into a chair, flowering, with a canopy of leaves.`,
    hshrine:`The ancestor's shrine: a ring of flowers round a seedling in a bowl, and an empty stand for a blade, twined with ivy.`,
    htotem:`A living post carved with the tribe's spirits: a rabbit, a bee, a deer, and a great flower at the top.`, hdrum:`A drum made from a hollow log, painted with flowers. It goes tok-tok, cheerfully.`,
    hbasin:`A wooden basin of rainwater, petals floating on it.` },
};
function hutLook(H, kind){ return caLines([HUT_LOOK_LINES[H.k][kind] || '']); }

/* ============================================================
   THE PICTURES: HUT_ART
   Painted as the castle's rooms are (24-room-art.js): the floor square by square, what lies on it, the light, the
   walls' faces and tops and what hangs on them — cut into pieces of 4 × 4 squares (CA_ROOM.slice, which asks
   `m.painter`); what stands in a room drawn once at a size and kept (CA_ART.util.pic), what moves drawn each time.
   ============================================================ */
const HUT_PAL = {
  water:{ wall:'#5d8aa3', wallL:'#86b2c6', wallD:'#3c6479', tie:'#e2d6a8', board:'#a79c86', boardL:'#c9bfa8', boardD:'#7a705c',
          floor:'#9c8a68', floorL:'#bba98a', floorD:'#6e5f46', mat:'#cdbf8c', matD:'#a0905a', matEdge:'#3f86c0',
          wood:'#a48e6e', woodL:'#cbb894', woodD:'#6d5c44', cloth:'#3f8fd0', clothL:'#8fd0f2', clothD:'#24609a',
          pot:'#5d9fbf', potL:'#a2d6e8', potD:'#356a84', accent:'#f4ebde', accent2:'#f2b6aa', thatch:'#b9a46a', thatchD:'#8a7546',
          glow:'rgba(150,215,255,.24)', fire:'#ffd36a', sky:['#9fd4ef', '#d8f0fa'], far:'#5f9a6a' },
  fire: { wall:'#b5643c', wallL:'#d88c5c', wallD:'#7d3c1f', tie:'#f2a23a', board:'#6a3a20', boardL:'#8a5432', boardD:'#45230f',
          floor:'#8e5c3c', floorL:'#ac7a56', floorD:'#653e26', mat:'#c0503a', matD:'#8a2e1c', matEdge:'#f2a23a',
          wood:'#74452a', woodL:'#9a6640', woodD:'#4a2a14', cloth:'#d2452a', clothL:'#f7a03c', clothD:'#8a2a16',
          pot:'#b8613b', potL:'#e09060', potD:'#7e3a1e', accent:'#efe0c4', accent2:'#e8b04a', thatch:'#a8864a', thatchD:'#7a5c2c',
          glow:'rgba(255,165,80,.26)', fire:'#ffb340', sky:['#f6c27a', '#fde6b8'], far:'#7a6a3a' },
  earth:{ wall:'#9b8d73', wallL:'#c2b494', wallD:'#695d49', tie:'#5f533f', board:'#7a6a50', boardL:'#9a886a', boardD:'#544632',
          floor:'#a69a80', floorL:'#c4b89c', floorD:'#7a6e56', mat:'#c48e46', matD:'#8a5e2a', matEdge:'#e8c070',
          wood:'#7d5c3c', woodL:'#a37e58', woodD:'#523a22', cloth:'#c98a3a', clothL:'#eac072', clothD:'#8a5a1e',
          pot:'#a8704a', potL:'#d09a70', potD:'#6e4428', accent:'#ffd36b', accent2:'#e39a2c', thatch:'#8e826a', thatchD:'#655a46',
          glow:'rgba(255,205,120,.24)', fire:'#ffcc66', sky:['#c8d8e8', '#eef2f6'], far:'#8a8a9a' },
  grass:{ wall:'#7c5c38', wallL:'#a3804e', wallD:'#53391f', tie:'#5fa64a', board:'#6b4a2a', boardL:'#8f6a40', boardD:'#46301a',
          floor:'#6e9848', floorL:'#94be62', floorD:'#4c7030', mat:'#c8b070', matD:'#9a8448', matEdge:'#5fb04a',
          wood:'#6e4c2c', woodL:'#946a42', woodD:'#48301a', cloth:'#5fb04a', clothL:'#b6e07e', clothD:'#3a7a2a',
          pot:'#c49a5a', potL:'#e2c088', potD:'#8a6a38', accent:'#f4a9c8', accent2:'#f6d76a', thatch:'#6f9a44', thatchD:'#4a7030',
          glow:'rgba(210,255,150,.22)', fire:'#f6e27a', sky:['#bfe8a8', '#effae0'], far:'#5a9a4a' },
};
const HUT_ART = (function(){
const TAU = Math.PI * 2;
const U = CA_ART.util, rng = U.rng, sh = U.sh, Lw = U.L, pic = U.pic, PIC_MAX_S = U.PIC_MAX_S;
const rr = (g, x, y, w, h, r)=>{ g.beginPath(); if(g.roundRect) g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); else g.rect(x, y, w, h); };
const ell = (g, x, y, rx, ry, c)=>{ g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); g.fill(); };
const circ = (g, x, y, r, c)=>{ g.fillStyle = c; g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); g.fill(); };
const lin = (g, x0, y0, x1, y1, st)=>{ const gr = g.createLinearGradient(x0, y0, x1, y1); st.forEach(([o, c])=> gr.addColorStop(o, c)); return gr; };
const rad = (g, x, y, r0, r1, st)=>{ const gr = g.createRadialGradient(x, y, Math.max(0, r0), x, y, Math.max(0.1, r1)); st.forEach(([o, c])=> gr.addColorStop(o, c)); return gr; };
const shadow = (g, cx, cy, rx, ry, a)=> ell(g, cx, cy, rx, ry, `rgba(20,12,6,${a == null ? 0.24 : a})`);
const line = (g, x0, y0, x1, y1, c, w)=>{ g.strokeStyle = c; g.lineWidth = Math.max(0.6, w); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
const WALLS = new Set([CA_T.IWALL, CA_T.WOODWALL, CA_T.VOID]);
const wallAt = (m, x, y)=> WALLS.has(caAt(m, x, y));
const partAt = (m, x, y)=>{ const k = (x < 0 || y < 0 || x >= m.W || y >= m.H) ? '' : (m.spr[y * m.W + x] || ''), i = k.indexOf(':'); return i < 0 ? '' : k.slice(i + 1); };

/* ---------- FLOORS ---------- */
function floorSq(g, m, P, k, x, y, s){
  const X = x * s, Y = y * s, R = rng(9100 + x * 131 + y * 977 + k.length * 7);
  if(k === 'castle'){                                                  // oak boards, waxed, three to a square, their joints staggered
    for(let i = 0; i < 3; i++){
      const by = Y + i * s / 3, tone = (R() - 0.5) * 0.1, j = (x * 2 + i * 5 + y * 3) % 7 / 7;
      g.fillStyle = lin(g, 0, by, 0, by + s / 3, [[0, sh(P.floorL, tone)], [0.6, sh(P.floor, tone)], [1, sh(P.floorD, tone)]]); g.fillRect(X, by, s, s / 3);
      g.strokeStyle = 'rgba(70,40,20,.16)'; g.lineWidth = 1; for(let q = 0; q < 2; q++){ const yy = by + s / 3 * (0.3 + R() * 0.4); g.beginPath(); g.moveTo(X, yy); g.bezierCurveTo(X + s * 0.3, yy + 1, X + s * 0.6, yy - 1, X + s, yy); g.stroke(); }
      g.fillStyle = 'rgba(40,22,10,.4)'; g.fillRect(X, by + s / 3 - Lw(s, 0.014), s, Lw(s, 0.014)); g.fillRect(X + j * s, by, Lw(s, 0.014), s / 3);
      g.fillStyle = 'rgba(255,240,210,.12)'; g.fillRect(X, by, s, Lw(s, 0.012));
    }
    return;
  }
  if(k === 'water'){                                                   // boards of driftwood, three to a square
    for(let i = 0; i < 3; i++){
      const by = Y + i * s / 3, tone = (R() - 0.5) * 0.12;
      g.fillStyle = lin(g, 0, by, 0, by + s / 3, [[0, sh(P.floorL, tone)], [0.5, sh(P.floor, tone)], [1, sh(P.floorD, tone)]]); g.fillRect(X, by, s, s / 3);
      g.strokeStyle = 'rgba(70,60,40,.18)'; g.lineWidth = 1;
      for(let j = 0; j < 3; j++){ const yy = by + s / 3 * (0.25 + R() * 0.5); g.beginPath(); g.moveTo(X + R() * s * 0.3, yy); g.lineTo(X + s * (0.5 + R() * 0.5), yy + (R() - 0.5) * 2); g.stroke(); }
      g.fillStyle = 'rgba(40,32,20,.35)'; g.fillRect(X, by + s / 3 - Lw(s, 0.015), s, Lw(s, 0.015));
      if(((x * 3 + i) * 7 + y) % 5 === 0){ g.fillRect(X + s * (0.2 + R() * 0.6), by, Lw(s, 0.015), s / 3); }
      if(R() < 0.3){ circ(g, X + s * (0.15 + R() * 0.7), by + s / 6, s * 0.012, 'rgba(60,50,30,.5)'); }
    }
  } else if(k === 'fire'){                                             // beaten red earth, a flat stone here and there, ash
    g.fillStyle = P.floor; g.fillRect(X, Y, s, s);
    for(let i = 0; i < 9; i++) ell(g, X + R() * s, Y + R() * s, s * (0.08 + R() * 0.18), s * (0.05 + R() * 0.1), R() < 0.5 ? 'rgba(170,110,70,.25)' : 'rgba(80,40,20,.18)');
    if(R() < 0.16){ const sx = X + s * (0.2 + R() * 0.5), sy = Y + s * (0.25 + R() * 0.5), sw = s * (0.22 + R() * 0.14);
      ell(g, sx + 1, sy + 1.5, sw, sw * 0.62, 'rgba(40,20,10,.3)'); ell(g, sx, sy, sw, sw * 0.62, '#9a7a62'); ell(g, sx - sw * 0.2, sy - sw * 0.15, sw * 0.55, sw * 0.3, 'rgba(255,230,200,.18)'); }
    for(let i = 0; i < 6; i++) g.fillStyle = 'rgba(230,220,200,.18)', g.fillRect(X + R() * s, Y + R() * s, Lw(s, 0.02), Lw(s, 0.015));
    for(let i = 0; i < 2; i++) if(R() < 0.25) circ(g, X + R() * s, Y + R() * s, s * 0.012, '#e06a2a');
  } else if(k === 'earth'){                                            // flagstones, two to a square, grouted
    g.fillStyle = '#6e6450'; g.fillRect(X, Y, s, s);
    const half = (x + y) & 1;
    const flags = half ? [[0, 0, 0.55, 1], [0.55, 0, 0.45, 0.48], [0.55, 0.48, 0.45, 0.52]] : [[0, 0, 1, 0.42], [0, 0.42, 0.4, 0.58], [0.4, 0.42, 0.6, 0.58]];
    flags.forEach(([fx, fy, fw, fh])=>{ const tone = (R() - 0.5) * 0.14, gp = Lw(s, 0.025);
      g.fillStyle = lin(g, X + fx * s, Y + fy * s, X + (fx + fw) * s, Y + (fy + fh) * s, [[0, sh(P.floorL, tone)], [1, sh(P.floorD, tone)]]);
      rr(g, X + fx * s + gp, Y + fy * s + gp, fw * s - 2 * gp, fh * s - 2 * gp, s * 0.04); g.fill();
      if(R() < 0.4){ g.strokeStyle = 'rgba(60,50,36,.35)'; g.lineWidth = 1; g.beginPath(); const cx0 = X + (fx + fw * R()) * s, cy0 = Y + (fy + fh * R()) * s; g.moveTo(cx0, cy0); g.lineTo(cx0 + (R() - 0.5) * s * 0.3, cy0 + (R() - 0.5) * s * 0.3); g.stroke(); }
    });
    if(R() < 0.3) ell(g, X + R() * s, Y + R() * s, s * 0.05, s * 0.025, 'rgba(110,140,70,.5)');
  } else {                                                             // moss, leaves, a flower or two
    g.fillStyle = P.floor; g.fillRect(X, Y, s, s);
    for(let i = 0; i < 14; i++) ell(g, X + R() * s, Y + R() * s, s * (0.05 + R() * 0.12), s * (0.04 + R() * 0.08), ['rgba(150,200,100,.35)', 'rgba(60,100,40,.3)', 'rgba(120,170,80,.3)'][i % 3]);
    for(let i = 0; i < 2; i++){ const lx = X + R() * s, ly = Y + R() * s, a = R() * TAU; g.fillStyle = ['#8a6a2a', '#a07a30', '#6a8a30'][i % 3]; g.beginPath(); g.ellipse(lx, ly, s * 0.07, s * 0.03, a, 0, TAU); g.fill(); }
    if(R() < 0.3){ const fx = X + R() * s, fy = Y + R() * s; for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; circ(g, fx + Math.cos(a) * s * 0.025, fy + Math.sin(a) * s * 0.025, s * 0.022, ['#fff4dc', '#f4a9c8', '#f6d76a'][(x + y) % 3]); } circ(g, fx, fy, s * 0.016, '#f2c043'); }
  }
}
/* a rug (or a mat, a hide) of the tribe's: rect r in squares; `round` an oval */
function rug(g, P, k, f, s){
  const X = f.x * s, Y = f.y * s, W = f.w * s, H = f.h * s, R = rng(7700 + Math.round(f.x * 10) + Math.round(f.y * 7));
  if(f.kind === 'mat'){                                                // a doormat of the tribe's
    g.fillStyle = 'rgba(0,0,0,.22)'; rr(g, X + 2, Y + 2, W, H, s * 0.08); g.fill();
    g.fillStyle = k === 'water' ? '#9a8a5a' : k === 'fire' ? '#7e2e1c' : k === 'earth' ? '#7a5a34' : '#8a7838'; rr(g, X, Y, W, H, s * 0.08); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = Lw(s, 0.012);
    for(let i = 1; i < 8; i++){ g.beginPath(); g.moveTo(X + i * W / 8, Y + H * 0.12); g.lineTo(X + i * W / 8, Y + H * 0.88); g.stroke(); }
    g.strokeStyle = P.matEdge; g.lineWidth = Lw(s, 0.025); rr(g, X + s * 0.05, Y + s * 0.05, W - s * 0.1, H - s * 0.1, s * 0.05); g.stroke();
    return;
  }
  if(k === 'castle'){
    g.save(); g.fillStyle = 'rgba(0,0,0,.22)'; rr(g, X + 2, Y + 3, W, H, s * 0.06); g.fill();
    g.fillStyle = lin(g, X, Y, X, Y + H, [[0, sh(P.cloth, 0.05)], [1, sh(P.cloth, -0.15)]]); rr(g, X, Y, W, H, s * 0.06); g.fill();
    g.strokeStyle = '#e8c86a'; g.lineWidth = s * 0.05; rr(g, X + s * 0.12, Y + s * 0.12, W - s * 0.24, H - s * 0.24, s * 0.04); g.stroke();
    g.strokeStyle = P.clothD; g.lineWidth = s * 0.08; rr(g, X + s * 0.26, Y + s * 0.26, W - s * 0.52, H - s * 0.52, s * 0.04); g.stroke();
    const cx = X + W / 2, cy = Y + H / 2, rw = Math.min(W, H * 1.6) * 0.22, rh = Math.min(H, W / 1.6) * 0.22;
    g.fillStyle = '#e8c86a'; g.beginPath(); g.moveTo(cx, cy - rh); g.lineTo(cx + rw, cy); g.lineTo(cx, cy + rh); g.lineTo(cx - rw, cy); g.closePath(); g.fill();
    g.fillStyle = P.clothD; g.beginPath(); g.moveTo(cx, cy - rh * 0.6); g.lineTo(cx + rw * 0.6, cy); g.lineTo(cx, cy + rh * 0.6); g.lineTo(cx - rw * 0.6, cy); g.closePath(); g.fill();
    circ(g, cx, cy, Math.min(rw, rh) * 0.2, '#f4dc84');
    g.fillStyle = '#f4ead0'; for(let xx = X + s * 0.1; xx < X + W - s * 0.05; xx += s * 0.1){ g.fillRect(xx, Y - s * 0.06, Lw(s, 0.012), s * 0.06); g.fillRect(xx, Y + H, Lw(s, 0.012), s * 0.06); }
    g.restore(); return;
  }
  g.save();
  const path = ()=>{ if(f.round){ g.beginPath(); g.ellipse(X + W / 2, Y + H / 2, W / 2, H / 2, 0, 0, TAU); } else rr(g, X, Y, W, H, s * 0.12); };
  g.fillStyle = 'rgba(0,0,0,.22)'; g.translate(2, 3); path(); g.fill(); g.translate(-2, -3);
  path(); g.fillStyle = P.mat; g.fill(); g.clip();
  if(k === 'water'){                                                   // rushes, woven over and under
    const c = s * 0.18;
    for(let yy = Y; yy < Y + H; yy += c) for(let xx = X; xx < X + W; xx += c){
      const o = (Math.round((xx - X) / c) + Math.round((yy - Y) / c)) & 1;
      g.fillStyle = o ? '#d8cb98' : '#b8a874'; g.fillRect(xx, yy, c, c);
      g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(xx, yy + (o ? c * 0.8 : 0), c, c * 0.2);
    }
    g.strokeStyle = P.matEdge; g.lineWidth = s * 0.1; path(); g.stroke();
    g.strokeStyle = '#8fd0f2'; g.lineWidth = s * 0.03; g.beginPath(); if(f.round) g.ellipse(X + W / 2, Y + H / 2, W / 2 - s * 0.14, H / 2 - s * 0.14, 0, 0, TAU); else rr(g, X + s * 0.14, Y + s * 0.14, W - s * 0.28, H - s * 0.28, s * 0.08); g.stroke();
    for(let i = 0; i < Math.floor(W / s); i++){ const wx = X + s * 0.5 + i * s, wy = Y + H / 2; g.strokeStyle = '#3f86c0'; g.lineWidth = s * 0.04; g.beginPath(); g.moveTo(wx - s * 0.25, wy); g.quadraticCurveTo(wx - s * 0.12, wy - s * 0.15, wx, wy); g.quadraticCurveTo(wx + s * 0.12, wy + s * 0.15, wx + s * 0.25, wy); g.stroke(); }
  } else if(k === 'fire'){                                             // red wool, flames along its edges
    g.fillStyle = lin(g, X, Y, X, Y + H, [[0, '#c4503a'], [1, '#9a3624']]); g.fillRect(X, Y, W, H);
    g.fillStyle = '#5a1e10'; g.fillRect(X, Y + s * 0.1, W, s * 0.06); g.fillRect(X, Y + H - s * 0.16, W, s * 0.06);
    for(let xx = X + s * 0.1; xx < X + W; xx += s * 0.32){ g.fillStyle = '#f2a23a'; g.beginPath(); g.moveTo(xx, Y + s * 0.3); g.quadraticCurveTo(xx + s * 0.08, Y + s * 0.16, xx + s * 0.04, Y + s * 0.05); g.quadraticCurveTo(xx + s * 0.18, Y + s * 0.18, xx + s * 0.16, Y + s * 0.3); g.fill();
      g.beginPath(); g.moveTo(xx, Y + H - s * 0.3); g.quadraticCurveTo(xx + s * 0.08, Y + H - s * 0.16, xx + s * 0.04, Y + H - s * 0.05); g.quadraticCurveTo(xx + s * 0.18, Y + H - s * 0.18, xx + s * 0.16, Y + H - s * 0.3); g.fill(); }
    const cx = X + W / 2, cy = Y + H / 2;                              // a sun in the middle
    for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; line(g, cx + Math.cos(a) * s * 0.28, cy + Math.sin(a) * s * 0.2, cx + Math.cos(a) * s * 0.5, cy + Math.sin(a) * s * 0.36, '#f7c060', s * 0.05); }
    ell(g, cx, cy, s * 0.26, s * 0.2, '#f2a23a'); ell(g, cx, cy, s * 0.15, s * 0.11, '#ffd36a');
  } else if(k === 'earth'){                                            // ochre and brown, diamonds
    g.fillStyle = lin(g, X, Y, X + W, Y + H, [[0, '#c8924a'], [1, '#a8763a']]); g.fillRect(X, Y, W, H);
    g.strokeStyle = '#6a4420'; g.lineWidth = s * 0.05; rr(g, X + s * 0.12, Y + s * 0.12, W - s * 0.24, H - s * 0.24, s * 0.06); g.stroke();
    const n = Math.max(2, Math.round(W / s)), dw = (W - s * 0.5) / n;
    for(let i = 0; i < n; i++){ const dx = X + s * 0.25 + dw * (i + 0.5), dy = Y + H / 2, hw = dw * 0.36, hh = H * 0.28;
      g.fillStyle = i % 2 ? '#e8c070' : '#7a4a22'; g.beginPath(); g.moveTo(dx, dy - hh); g.lineTo(dx + hw, dy); g.lineTo(dx, dy + hh); g.lineTo(dx - hw, dy); g.closePath(); g.fill();
      g.fillStyle = i % 2 ? '#7a4a22' : '#e8c070'; g.beginPath(); g.moveTo(dx, dy - hh * 0.4); g.lineTo(dx + hw * 0.4, dy); g.lineTo(dx, dy + hh * 0.4); g.lineTo(dx - hw * 0.4, dy); g.closePath(); g.fill(); }
  } else {                                                             // grass cloth, flowers round it
    const c = s * 0.12;
    for(let yy = Y; yy < Y + H; yy += c){ g.fillStyle = ((yy - Y) / c | 0) % 2 ? '#c8b070' : '#b8a060'; g.fillRect(X, yy, W, c); }
    g.strokeStyle = 'rgba(120,90,30,.35)'; g.lineWidth = 1; for(let xx = X; xx < X + W; xx += c * 1.5){ g.beginPath(); g.moveTo(xx, Y); g.lineTo(xx, Y + H); g.stroke(); }
    g.strokeStyle = P.matEdge; g.lineWidth = s * 0.08; path(); g.stroke();
    const per = 2 * (W + H) / (s * 0.4);
    for(let i = 0; i < per; i++){ const t = i / per; let px, py; const L4 = 2 * (W + H), d0 = t * L4;
      if(d0 < W){ px = X + d0; py = Y + s * 0.06; } else if(d0 < W + H){ px = X + W - s * 0.06; py = Y + d0 - W; } else if(d0 < 2 * W + H){ px = X + W - (d0 - W - H); py = Y + H - s * 0.06; } else { px = X + s * 0.06; py = Y + H - (d0 - 2 * W - H); }
      if(f.round) continue;
      for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; circ(g, px + Math.cos(a) * s * 0.03, py + Math.sin(a) * s * 0.03, s * 0.026, ['#f4a9c8', '#fff4dc', '#f6d76a'][i % 3]); } circ(g, px, py, s * 0.018, '#f2c043'); }
  }
  g.restore();
}

/* ---------- WALLS ---------- */
/* a wall's top, seen from above: thatch (stone, the Earth tribe's) */
function wallTop(g, m, P, k, x, y, s){
  const X = x * s, Y = y * s, R = rng(5300 + x * 71 + y * 313);
  if(k === 'castle'){ g.fillStyle = '#d9c8a6'; g.fillRect(X, Y, s, s); for(let i = 0; i < 3; i++){ g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(X + R() * s, Y + R() * s, s * (0.2 + R() * 0.3), s * 0.06); } }
  else if(k === 'earth'){
    g.fillStyle = P.thatch; g.fillRect(X, Y, s, s);
    for(let i = 0; i < 4; i++){ g.fillStyle = sh(P.thatch, (R() - 0.5) * 0.2); rr(g, X + R() * s * 0.6, Y + R() * s * 0.6, s * (0.3 + R() * 0.3), s * (0.25 + R() * 0.25), s * 0.06); g.fill(); }
  } else {
    g.fillStyle = P.thatchD; g.fillRect(X, Y, s, s);
    g.lineCap = 'round';
    for(let i = 0; i < 22; i++){ const sx = X + R() * s, sy = Y + R() * s, len = s * (0.25 + R() * 0.3), a = (x === 0 || x === m.W - 1 ? Math.PI / 2 : 0) + (R() - 0.5) * 0.5;
      g.strokeStyle = R() < 0.5 ? P.thatch : sh(P.thatch, 0.15); g.lineWidth = Lw(s, 0.025); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len); g.stroke(); }
    if(k === 'grass') for(let i = 0; i < 3; i++) ell(g, X + R() * s, Y + R() * s, s * 0.08, s * 0.04, R() < 0.5 ? '#5fa64a' : '#8cc860');
  }
  const e = s * 0.08;
  if(!wallAt(m, x - 1, y)){ g.fillStyle = 'rgba(255,240,200,.18)'; g.fillRect(X, Y, e, s); }
  if(!wallAt(m, x + 1, y)){ g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X + s - e, Y, e, s); }
  if(!wallAt(m, x, y - 1) && y > 0){ g.fillStyle = 'rgba(255,240,200,.18)'; g.fillRect(X, Y, s, e); }
  if(!wallAt(m, x, y + 1)){ g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(X, Y + s - e, s, e); }
}
/* a wall's face: `lvl` 2 the upper square of it, 1 the lower, standing on the floor */
function wallFace(g, m, P, k, x, y, s, lvl){
  const X = x * s, Y = y * s, R = rng(6300 + x * 53 + y * 17 + lvl * 7);
  if(k === 'castle'){                                                  // papered plaster over panelling, a rail between, a cornice up top
    const papered = lvl === 2 ? 1 : 0.56;
    g.fillStyle = P.wall; g.fillRect(X, Y, s, s * papered);
    g.fillStyle = P.motif;
    for(let i = 0; i < 2; i++) for(let j = 0; j < 2; j++){ const mx = X + (i + 0.5) * s / 2, my = Y + (j + 0.5) * s / 2; if(my > Y + s * papered) continue;
      if(P.kind === 'stripes'){ g.fillRect(X + i * s / 2 + s * 0.2, Y, s * 0.06, s * papered); }
      else { for(let q = 0; q < 4; q++){ const a = q / 4 * TAU + 0.4; circ(g, mx + Math.cos(a) * s * 0.035, my + Math.sin(a) * s * 0.035, s * 0.028, P.motif); } circ(g, mx, my, s * 0.018, P.motif); } }
    if(lvl === 2){ g.fillStyle = lin(g, 0, Y, 0, Y + s * 0.16, [[0, '#f4ead6'], [1, '#c8b48e']]); g.fillRect(X, Y, s, s * 0.14); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X, Y + s * 0.14, s, Lw(s, 0.012)); return; }
    const ry = Y + s * 0.56; g.fillStyle = P.rail; g.fillRect(X, ry, s, s * 0.05); g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(X, ry, s, Lw(s, 0.012));
    g.fillStyle = lin(g, 0, ry + s * 0.05, 0, Y + s, [[0, P.wainsL], [1, P.wainsD]]); g.fillRect(X, ry + s * 0.05, s, Y + s - ry - s * 0.05);
    g.strokeStyle = 'rgba(30,15,5,.35)'; g.lineWidth = Lw(s, 0.014); rr(g, X + s * 0.1, ry + s * 0.12, s * 0.8, s * 0.22, s * 0.02); g.stroke();
    g.strokeStyle = 'rgba(255,230,190,.2)'; rr(g, X + s * 0.11, ry + s * 0.13, s * 0.8, s * 0.22, s * 0.02); g.stroke();
    g.fillStyle = P.wainsD; g.fillRect(X, Y + s * 0.92, s, s * 0.08);
    return;
  }
  if(k === 'water'){
    const bot = lvl === 1 ? 0.64 : 1;
    const n = 6;                                                       // reeds, standing side by side, tied across
    for(let i = 0; i < n; i++){ const rx = X + i * s / n, tone = (R() - 0.5) * 0.12;
      g.fillStyle = lin(g, rx, 0, rx + s / n, 0, [[0, sh(P.wallL, tone)], [0.5, sh(P.wall, tone)], [1, sh(P.wallD, tone)]]); g.fillRect(rx, Y, s / n, s * bot);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(rx + s / n - 1, Y, 1, s * bot); }
    for(let t = 0.18; t < bot; t += 0.33){ const ty = Y + t * s; g.fillStyle = P.tie; g.fillRect(X, ty, s, Lw(s, 0.035)); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(X, ty + Lw(s, 0.035), s, Lw(s, 0.012));
      for(let i = 0; i < n; i++) if((i + Math.round(t * 10)) % 2 === 0) g.fillStyle = 'rgba(255,255,255,.25)', g.fillRect(X + i * s / n + 1, ty, s / n * 0.5, Lw(s, 0.015)); }
    if(lvl === 2){ g.fillStyle = lin(g, 0, Y, 0, Y + s * 0.2, [[0, P.boardL], [1, P.boardD]]); g.fillRect(X, Y, s, s * 0.2);   // the ridge pole
      g.strokeStyle = P.tie; g.lineWidth = Lw(s, 0.02); for(let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(X + s * (0.2 + i * 0.3), Y); g.lineTo(X + s * (0.28 + i * 0.3), Y + s * 0.2); g.stroke(); } return; }
    const by = Y + s * 0.64;                                           // driftwood boards below
    for(let i = 0; i < 3; i++){ const yy = by + i * s * 0.12; g.fillStyle = lin(g, 0, yy, 0, yy + s * 0.12, [[0, P.boardL], [1, P.boardD]]); g.fillRect(X, yy, s, s * 0.12); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X, yy + s * 0.12 - 1, s, 1); }
  } else if(k === 'fire'){
    g.fillStyle = lin(g, 0, Y, 0, Y + s, lvl === 2 ? [[0, sh(P.wallD, -0.25)], [0.5, P.wallD], [1, P.wall]] : [[0, P.wall], [1, sh(P.wall, -0.06)]]); g.fillRect(X, Y, s, s);
    for(let i = 0; i < 10; i++) ell(g, X + R() * s, Y + R() * s, s * (0.06 + R() * 0.1), s * (0.04 + R() * 0.06), R() < 0.5 ? 'rgba(255,200,150,.12)' : 'rgba(90,30,10,.12)');
    if(lvl === 2){ g.fillStyle = lin(g, 0, Y, 0, Y + s * 0.18, [[0, '#5a3018'], [1, '#2e170a']]); g.fillRect(X, Y, s, s * 0.18);   // the beam, sooty above it
      if(x % 2 === 0){ g.fillStyle = '#3a1e0c'; g.fillRect(X + s * 0.4, Y + s * 0.18, s * 0.2, s * 0.1); } return; }
    const band = Y + s * 0.42;                                         // the painted band of flames
    g.fillStyle = '#5a2412'; g.fillRect(X, band - s * 0.03, s, s * 0.03); g.fillRect(X, band + s * 0.17, s, s * 0.03);
    for(let i = 0; i < 3; i++){ const fx = X + (i + 0.5) * s / 3; g.fillStyle = P.tie; g.beginPath(); g.moveTo(fx - s * 0.12, band + s * 0.16); g.quadraticCurveTo(fx - s * 0.1, band + s * 0.02, fx, band - s * 0.01); g.quadraticCurveTo(fx + s * 0.02, band + s * 0.09, fx + s * 0.08, band + s * 0.03); g.quadraticCurveTo(fx + s * 0.14, band + s * 0.12, fx + s * 0.12, band + s * 0.16); g.closePath(); g.fill();
      g.fillStyle = '#ffd36a'; g.beginPath(); g.ellipse(fx, band + s * 0.12, s * 0.04, s * 0.04, 0, 0, TAU); g.fill(); }
    g.fillStyle = lin(g, 0, Y + s * 0.78, 0, Y + s, [[0, '#6e2e16'], [1, '#4a1c0a']]); g.fillRect(X, Y + s * 0.78, s, s * 0.22);   // the dado
  } else if(k === 'earth'){
    const rows = 4, rh = s / rows;                                     // courses of stone
    g.fillStyle = '#6a5e48'; g.fillRect(X, Y, s, s);
    for(let r = 0; r < rows; r++){ const yy = Y + r * rh, off = ((y * rows + r) % 2) * 0.5;
      for(let c = -1; c < 2; c++){ const bx = X + (c + off) * s * 0.6, bw = s * 0.6; const tone = (rng(x * 31 + r * 7 + c * 13 + y * 101)() - 0.5) * 0.16;
        g.fillStyle = lin(g, 0, yy, 0, yy + rh, [[0, sh(P.wallL, tone)], [1, sh(P.wall, tone)]]); rr(g, bx + 1, yy + 1, bw - 2, rh - 2, s * 0.03); g.fill(); } }
    g.fillStyle = 'rgba(255,248,225,.12)'; for(let r = 0; r < rows; r++) g.fillRect(X, Y + r * rh + 1, s, 1);
    if(lvl === 1){                                                     // the carved band
      const by = Y + s * 0.3; g.fillStyle = sh(P.wall, -0.12); g.fillRect(X, by, s, s * 0.16);
      g.strokeStyle = P.tie; g.lineWidth = Lw(s, 0.022); const gx = X + s * 0.5, gy = by + s * 0.08, gl = (x * 7 + y) % 3;
      g.beginPath(); if(gl === 0){ g.moveTo(gx - s * 0.12, gy + s * 0.05); g.lineTo(gx, gy - s * 0.05); g.lineTo(gx + s * 0.12, gy + s * 0.05); } else if(gl === 1){ g.arc(gx, gy, s * 0.05, 0, TAU); } else { g.moveTo(gx - s * 0.12, gy); g.lineTo(gx + s * 0.12, gy); g.moveTo(gx, gy - s * 0.05); g.lineTo(gx, gy + s * 0.05); } g.stroke(); }
    if(R() < 0.4) U.moss(g, X, Y + s * 0.5, s, s * 0.5, s, R, 2);
  } else {
    g.fillStyle = P.wallD; g.fillRect(X, Y, s, s);                     // boughs woven: over, under
    const rows = 5, rh = s / rows;
    for(let r = 0; r < rows; r++){ const yy = Y + r * rh;
      for(let c = 0; c < 4; c++){ const bx = X + c * s / 4, up = (c + r + x) % 2;
        g.fillStyle = lin(g, 0, yy, 0, yy + rh, [[0, up ? P.wallL : P.wall], [1, up ? P.wall : P.wallD]]);
        g.beginPath(); g.ellipse(bx + s / 8, yy + rh / 2, s / 8 + 1, rh * 0.46, 0, 0, TAU); g.fill(); } }
    for(let i = 0; i < 3; i++){ const lx = X + R() * s, ly = Y + R() * s, a = R() * TAU;   // leaves sprouting
      g.fillStyle = R() < 0.5 ? '#5fa64a' : '#8cc860'; g.beginPath(); g.ellipse(lx, ly, s * 0.08, s * 0.035, a, 0, TAU); g.fill(); }
    if(R() < 0.35){ const fx = X + R() * s, fy = Y + R() * s * 0.8; for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; circ(g, fx + Math.cos(a) * s * 0.03, fy + Math.sin(a) * s * 0.03, s * 0.025, ['#f4a9c8', '#fff4dc', '#f6d76a'][(x + y) % 3]); } circ(g, fx, fy, s * 0.018, '#f2c043'); }
    if(lvl === 2){ g.fillStyle = lin(g, 0, Y, 0, Y + s * 0.2, [[0, P.wood], [1, P.woodD]]); g.fillRect(X, Y, s, s * 0.18);   // a living beam, vines off it
      g.strokeStyle = '#3e7a2c'; g.lineWidth = Lw(s, 0.02); g.beginPath(); g.moveTo(X + s * 0.3, Y + s * 0.16); g.quadraticCurveTo(X + s * 0.38, Y + s * 0.45, X + s * 0.28, Y + s * 0.7); g.stroke();
      ell(g, X + s * 0.28, Y + s * 0.72, s * 0.04, s * 0.025, '#5fa64a'); }
  }
}
/* what hangs on a wall: (x, y) its lower face square; it spans the face from (y − 1) to the floor */
function hangs(g, m, P, k, x, y, s, part){
  const X = x * s, top = (y - 1) * s, cx = X + s / 2, kind = part.split(':')[0], n = +(part.split(':')[1] || 0);
  if(kind === 'window') return windowOf(g, P, k, cx, top + s * 0.86, s * 1.12);
  if(kind === 'lamp') return lampOf(g, P, k, cx, top + s * 1.0, s * 1.15);
  if(kind === 'banner') return bannerOf(g, P, k, cx, top + s * 0.18, s * 1.18);
  if(kind === 'deco') return decoOf(g, P, k, cx, top + s * 0.98, s * 1.3, n);
}
function windowOf(g, P, k, cx, cy, s){
  const r = s * 0.34;
  if(k === 'castle'){                                                  // a cottage window, four panes, curtains, a box of flowers
    const w = s * 0.56, h = s * 0.62, x0 = cx - w / 2, y0 = cy - h / 2;
    g.fillStyle = '#f4efe2'; g.fillRect(x0 - s * 0.05, y0 - s * 0.05, w + s * 0.1, h + s * 0.1);
    g.fillStyle = lin(g, 0, y0, 0, y0 + h, [[0, '#a8d8f0'], [1, '#e0f2fa']]); g.fillRect(x0, y0, w, h);
    ell(g, cx - w * 0.2, y0 + h * 0.85, w * 0.5, h * 0.25, '#7aa858'); ell(g, cx + w * 0.3, y0 + h * 0.9, w * 0.4, h * 0.2, '#5a8a48');
    g.fillStyle = '#f4efe2'; g.fillRect(cx - s * 0.02, y0, s * 0.04, h); g.fillRect(x0, cy - s * 0.02, w, s * 0.04);
    [[x0 - s * 0.08, 1], [x0 + w + s * 0.08, -1]].forEach(([ex, d])=>{ g.fillStyle = lin(g, ex, 0, ex + d * s * 0.16, 0, [[0, P.cloth], [1, P.clothD]]); g.beginPath(); g.moveTo(ex, y0 - s * 0.08); g.lineTo(ex + d * s * 0.16, y0 - s * 0.08); g.quadraticCurveTo(ex + d * s * 0.04, cy, ex + d * s * 0.14, y0 + h + s * 0.05); g.lineTo(ex, y0 + h + s * 0.05); g.closePath(); g.fill(); });
    g.fillStyle = P.wainsD; g.fillRect(x0 - s * 0.1, y0 - s * 0.12, w + s * 0.2, s * 0.05);
    g.fillStyle = '#8a5a32'; g.fillRect(x0 - s * 0.02, y0 + h + s * 0.04, w + s * 0.04, s * 0.09);
    for(let i = 0; i < 5; i++){ const fx = x0 + w * (0.1 + i * 0.2), fy = y0 + h + s * 0.03; for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; circ(g, fx + Math.cos(a) * s * 0.022, fy + Math.sin(a) * s * 0.022, s * 0.02, ['#e04a5a', '#f6d76a', '#f4a9c8'][i % 3]); } }
    return;
  }
  const view = ()=>{ g.fillStyle = lin(g, 0, cy - r, 0, cy + r, [[0, P.sky[0]], [1, P.sky[1]]]); g.fill();
    g.save(); g.clip(); ell(g, cx - r * 0.3, cy + r * 0.85, r * 1.1, r * 0.6, P.far); ell(g, cx + r * 0.6, cy + r * 0.95, r * 0.9, r * 0.5, sh(P.far, -0.15));
    if(k === 'water'){ g.fillStyle = '#4f9bc8'; g.fillRect(cx - r, cy + r * 0.45, r * 2, r); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(cx - r * 0.5, cy + r * 0.55, r * 0.5, 1.5); }
    circ(g, cx + r * 0.45, cy - r * 0.45, r * 0.14, k === 'fire' ? '#fff0b0' : '#fffbe0'); g.restore(); };
  if(k === 'earth'){                                                   // a square window in thick stone, a lintel over it
    g.fillStyle = '#4a4034'; g.fillRect(cx - r - s * 0.06, cy - r - s * 0.06, 2 * r + s * 0.12, 2 * r + s * 0.12);
    g.beginPath(); g.rect(cx - r, cy - r, 2 * r, 2 * r); view();
    g.fillStyle = lin(g, 0, cy - r - s * 0.16, 0, cy - r, [[0, P.woodL], [1, P.woodD]]); g.fillRect(cx - r - s * 0.12, cy - r - s * 0.16, 2 * r + s * 0.24, s * 0.12);
    g.fillStyle = sh(P.wall, -0.1); g.fillRect(cx - r - s * 0.08, cy + r, 2 * r + s * 0.16, s * 0.07);
    return;
  }
  g.beginPath(); g.arc(cx, cy, r, 0, TAU); view();
  if(k === 'water'){ g.strokeStyle = P.tie; g.lineWidth = s * 0.07; g.beginPath(); g.arc(cx, cy, r + s * 0.03, 0, TAU); g.stroke();   // rope round it
    g.strokeStyle = 'rgba(120,100,60,.6)'; g.lineWidth = Lw(s, 0.015); for(let i = 0; i < 14; i++){ const a = i / 14 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * (r - s * 0.005), cy + Math.sin(a) * (r - s * 0.005)); g.lineTo(cx + Math.cos(a + 0.2) * (r + s * 0.065), cy + Math.sin(a + 0.2) * (r + s * 0.065)); g.stroke(); } }
  else if(k === 'fire'){ g.strokeStyle = '#6e2e16'; g.lineWidth = s * 0.08; g.beginPath(); g.arc(cx, cy, r + s * 0.03, 0, TAU); g.stroke();
    for(let i = 0; i < 8; i++){ const a = i / 8 * TAU; circ(g, cx + Math.cos(a) * (r + s * 0.03), cy + Math.sin(a) * (r + s * 0.03), s * 0.028, P.tie); } }
  else { g.strokeStyle = P.wood; g.lineWidth = s * 0.07; g.beginPath(); g.arc(cx, cy, r + s * 0.03, 0, TAU); g.stroke();
    for(let i = 0; i < 10; i++){ const a = i / 10 * TAU; g.fillStyle = i % 2 ? '#5fa64a' : '#8cc860'; g.beginPath(); g.ellipse(cx + Math.cos(a) * (r + s * 0.06), cy + Math.sin(a) * (r + s * 0.06), s * 0.07, s * 0.03, a + 1.2, 0, TAU); g.fill(); } }
  g.strokeStyle = 'rgba(40,30,20,.55)'; g.lineWidth = Lw(s, 0.025); g.beginPath(); g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.moveTo(cx, cy - r); g.lineTo(cx, cy + r); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(cx - r * 0.35, cy - r * 0.35, r * 0.25, r * 0.12, -0.7, 0, TAU); g.fill();
}
/* a lamp on the wall (its light, which moves: HUT_ART.furn 'hlight') */
function lampOf(g, P, k, cx, cy, s){
  if(k === 'castle'){ g.fillStyle = '#c9a24a'; g.beginPath(); g.ellipse(cx, cy + s * 0.08, s * 0.08, s * 0.03, 0, 0, TAU); g.fill(); g.fillRect(cx - s * 0.015, cy - s * 0.02, s * 0.03, s * 0.12);   // a brass sconce, a candle in it
    g.fillStyle = '#f4efe2'; g.fillRect(cx - s * 0.025, cy - s * 0.14, s * 0.05, s * 0.13); return; }
  if(k === 'water'){                                                   // a scallop shell, a wick in it
    g.fillStyle = P.board; g.fillRect(cx - s * 0.03, cy - s * 0.05, s * 0.06, s * 0.2);
    g.fillStyle = '#f4e6d6'; g.beginPath(); g.moveTo(cx, cy + s * 0.18); for(let i = 0; i <= 8; i++){ const a = Math.PI + i / 8 * Math.PI; g.lineTo(cx + Math.cos(a) * s * 0.16, cy + s * 0.1 + Math.sin(a) * s * 0.12); } g.closePath(); g.fill();
    g.strokeStyle = 'rgba(180,140,120,.6)'; g.lineWidth = Lw(s, 0.012); for(let i = 1; i < 8; i++){ const a = Math.PI + i / 8 * Math.PI; g.beginPath(); g.moveTo(cx, cy + s * 0.18); g.lineTo(cx + Math.cos(a) * s * 0.15, cy + s * 0.1 + Math.sin(a) * s * 0.11); g.stroke(); }
  } else if(k === 'fire'){                                             // a torch in an iron bracket
    g.fillStyle = '#2c2420'; g.fillRect(cx - s * 0.12, cy + s * 0.08, s * 0.24, s * 0.04); g.fillRect(cx - s * 0.02, cy + s * 0.08, s * 0.04, s * 0.14);
    g.fillStyle = lin(g, cx - s * 0.04, 0, cx + s * 0.04, 0, [[0, '#8a5a32'], [1, '#4a2a14']]); g.fillRect(cx - s * 0.035, cy - s * 0.12, s * 0.07, s * 0.24);
    g.fillStyle = '#2a1408'; g.fillRect(cx - s * 0.05, cy - s * 0.14, s * 0.1, s * 0.06);
  } else if(k === 'earth'){                                            // a crystal in an iron cage
    g.fillStyle = '#2c2a33'; g.fillRect(cx - s * 0.02, cy - s * 0.2, s * 0.04, s * 0.08);
    g.fillStyle = '#e39a2c'; g.beginPath(); g.moveTo(cx, cy - s * 0.14); g.lineTo(cx + s * 0.07, cy - s * 0.04); g.lineTo(cx + s * 0.05, cy + s * 0.1); g.lineTo(cx - s * 0.05, cy + s * 0.1); g.lineTo(cx - s * 0.07, cy - s * 0.04); g.closePath(); g.fill();
    g.fillStyle = '#ffd36b'; g.beginPath(); g.moveTo(cx, cy - s * 0.14); g.lineTo(cx - s * 0.07, cy - s * 0.04); g.lineTo(cx - s * 0.05, cy + s * 0.1); g.lineTo(cx, cy + s * 0.1); g.closePath(); g.fill();
    g.strokeStyle = '#2c2a33'; g.lineWidth = Lw(s, 0.018); g.beginPath(); g.moveTo(cx - s * 0.09, cy - s * 0.06); g.lineTo(cx, cy - s * 0.18); g.lineTo(cx + s * 0.09, cy - s * 0.06); g.lineTo(cx + s * 0.07, cy + s * 0.12); g.lineTo(cx - s * 0.07, cy + s * 0.12); g.closePath(); g.stroke();
  } else {                                                             // a jar of fireflies, hung from a vine
    g.strokeStyle = '#3e7a2c'; g.lineWidth = Lw(s, 0.02); g.beginPath(); g.moveTo(cx, cy - s * 0.3); g.lineTo(cx, cy - s * 0.1); g.stroke();
    g.fillStyle = 'rgba(220,250,210,.35)'; rr(g, cx - s * 0.08, cy - s * 0.1, s * 0.16, s * 0.2, s * 0.05); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = Lw(s, 0.012); rr(g, cx - s * 0.08, cy - s * 0.1, s * 0.16, s * 0.2, s * 0.05); g.stroke();
    g.fillStyle = P.wood; g.fillRect(cx - s * 0.09, cy - s * 0.12, s * 0.18, s * 0.035);
  }
}
function bannerOf(g, P, k, cx, top, s){
  const w = s * 0.62, h = s * 1.05;
  g.fillStyle = P.woodD; g.fillRect(cx - w / 2 - s * 0.06, top, w + s * 0.12, s * 0.05);
  g.fillStyle = lin(g, cx - w / 2, 0, cx + w / 2, 0, [[0, sh(P.cloth, 0.08)], [0.6, P.cloth], [1, sh(P.cloth, -0.18)]]);
  g.beginPath(); g.moveTo(cx - w / 2, top + s * 0.04); g.lineTo(cx + w / 2, top + s * 0.04); g.lineTo(cx + w / 2, top + h); g.lineTo(cx, top + h - s * 0.14); g.lineTo(cx - w / 2, top + h); g.closePath(); g.fill();
  g.strokeStyle = P.clothL; g.lineWidth = Lw(s, 0.03); g.beginPath(); g.moveTo(cx - w / 2 + s * 0.05, top + s * 0.1); g.lineTo(cx - w / 2 + s * 0.05, top + h - s * 0.06); g.moveTo(cx + w / 2 - s * 0.05, top + s * 0.1); g.lineTo(cx + w / 2 - s * 0.05, top + h - s * 0.06); g.stroke();
  emblem(g, P, k, cx, top + h * 0.42, s * 0.2);
}
/* the tribe's sign: a wave, a flame, a mountain, a leaf */
function emblem(g, P, k, cx, cy, r){
  g.lineCap = 'round'; g.lineJoin = 'round';
  if(k === 'water'){ g.strokeStyle = P.clothL; g.lineWidth = r * 0.3; g.beginPath(); g.moveTo(cx - r, cy + r * 0.3); g.quadraticCurveTo(cx - r * 0.5, cy - r * 0.8, cx, cy); g.quadraticCurveTo(cx + r * 0.3, cy + r * 0.4, cx + r * 0.1, cy - r * 0.3); g.stroke();
    g.beginPath(); g.moveTo(cx - r, cy + r * 0.8); g.quadraticCurveTo(cx, cy + r * 0.4, cx + r, cy + r * 0.8); g.stroke(); }
  else if(k === 'fire'){ g.fillStyle = P.clothL; g.beginPath(); g.moveTo(cx, cy - r * 1.1); g.quadraticCurveTo(cx + r * 0.9, cy - r * 0.1, cx + r * 0.6, cy + r * 0.8); g.quadraticCurveTo(cx, cy + r * 1.1, cx - r * 0.6, cy + r * 0.8); g.quadraticCurveTo(cx - r * 0.9, cy, cx - r * 0.2, cy - r * 0.5); g.quadraticCurveTo(cx - r * 0.1, cy - r * 0.1, cx, cy - r * 1.1); g.fill();
    g.fillStyle = '#ffe08a'; g.beginPath(); g.ellipse(cx, cy + r * 0.45, r * 0.3, r * 0.4, 0, 0, TAU); g.fill(); }
  else if(k === 'earth'){ g.fillStyle = P.clothL; g.beginPath(); g.moveTo(cx - r, cy + r * 0.8); g.lineTo(cx - r * 0.2, cy - r * 0.9); g.lineTo(cx + r * 0.25, cy - r * 0.1); g.lineTo(cx + r * 0.5, cy - r * 0.5); g.lineTo(cx + r, cy + r * 0.8); g.closePath(); g.fill();
    g.fillStyle = '#fff4d8'; g.beginPath(); g.moveTo(cx - r * 0.42, cy - r * 0.42); g.lineTo(cx - r * 0.2, cy - r * 0.9); g.lineTo(cx + r * 0.02, cy - r * 0.42); g.closePath(); g.fill(); }
  else { g.fillStyle = P.clothL; g.beginPath(); g.moveTo(cx, cy + r); g.quadraticCurveTo(cx - r * 1.1, cy, cx, cy - r); g.quadraticCurveTo(cx + r * 1.1, cy, cx, cy + r); g.fill();
    g.strokeStyle = sh(P.cloth, -0.3); g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(cx, cy + r); g.lineTo(cx, cy - r * 0.8); g.stroke(); }
}
/* the tribe's things on a wall: 0 and 1 */
function decoOf(g, P, k, cx, cy, s, n){
  if(k === 'castle'){
    if(n === 0){ const w = s * 0.62, h = s * 0.46;                    // a painting of the hills, in a gilt frame
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(cx - w / 2 + 3, cy - h / 2 + 3, w, h);
      g.fillStyle = '#c9a24a'; g.fillRect(cx - w / 2 - s * 0.04, cy - h / 2 - s * 0.04, w + s * 0.08, h + s * 0.08);
      g.fillStyle = lin(g, 0, cy - h / 2, 0, cy + h / 2, [[0, '#9fd0ef'], [1, '#e8f4f8']]); g.fillRect(cx - w / 2, cy - h / 2, w, h);
      ell(g, cx - w * 0.15, cy + h * 0.4, w * 0.45, h * 0.32, '#6a9a58'); ell(g, cx + w * 0.25, cy + h * 0.45, w * 0.4, h * 0.26, '#4a7a48');
      g.fillStyle = '#f4f1ea'; g.fillRect(cx + w * 0.12, cy - h * 0.05, w * 0.1, h * 0.25); g.fillStyle = '#3f5aa0'; g.beginPath(); g.moveTo(cx + w * 0.1, cy - h * 0.05); g.lineTo(cx + w * 0.17, cy - h * 0.2); g.lineTo(cx + w * 0.24, cy - h * 0.05); g.closePath(); g.fill();
      circ(g, cx - w * 0.3, cy - h * 0.25, h * 0.08, '#fff3b0'); return; }
    if(n === 2){                                                       // a cadet's shield, two swords crossed behind it
      [-1, 1].forEach(a=>{ const tx = cx + a * s * 0.3, ty = cy - s * 0.34, px = cx - a * s * 0.3, py = cy + s * 0.34, qx = tx + (px - tx) * 0.74, qy = ty + (py - ty) * 0.74;
        line(g, tx, ty, qx, qy, '#d8d4dc', s * 0.045); line(g, tx, ty, qx, qy, 'rgba(255,255,255,.55)', s * 0.012);
        line(g, qx, qy, px, py, '#6a4024', s * 0.04); line(g, qx - a * s * 0.07, qy - s * 0.07, qx + a * s * 0.07, qy + s * 0.07, '#c9a24a', s * 0.035); circ(g, px, py, s * 0.035, '#c9a24a'); });
      const sy = cy + s * 0.02;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(cx - s * 0.19 + 3, sy - s * 0.2 + 3); g.lineTo(cx + s * 0.19 + 3, sy - s * 0.2 + 3); g.lineTo(cx + s * 0.19 + 3, sy + s * 0.02 + 3); g.quadraticCurveTo(cx + s * 0.17 + 3, sy + s * 0.2 + 3, cx + 3, sy + s * 0.27 + 3); g.quadraticCurveTo(cx - s * 0.17 + 3, sy + s * 0.2 + 3, cx - s * 0.19 + 3, sy + s * 0.02 + 3); g.closePath(); g.fill();
      g.fillStyle = lin(g, cx - s * 0.19, 0, cx + s * 0.19, 0, [[0, P.clothL], [0.45, P.cloth], [1, P.clothD]]);
      g.beginPath(); g.moveTo(cx - s * 0.19, sy - s * 0.2); g.lineTo(cx + s * 0.19, sy - s * 0.2); g.lineTo(cx + s * 0.19, sy + s * 0.02); g.quadraticCurveTo(cx + s * 0.17, sy + s * 0.2, cx, sy + s * 0.27); g.quadraticCurveTo(cx - s * 0.17, sy + s * 0.2, cx - s * 0.19, sy + s * 0.02); g.closePath(); g.fill();
      g.strokeStyle = '#c9a24a'; g.lineWidth = Lw(s, 0.025); g.stroke();
      circ(g, cx, sy - s * 0.01, s * 0.055, '#f2c94a'); g.strokeStyle = '#f2c94a'; g.lineWidth = Lw(s, 0.014); for(let i = 0; i < 8; i++){ const a = i / 8 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * s * 0.075, sy - s * 0.01 + Math.sin(a) * s * 0.075); g.lineTo(cx + Math.cos(a) * s * 0.11, sy - s * 0.01 + Math.sin(a) * s * 0.11); g.stroke(); }
      return; }
    if(n === 3){                                                       // a sampler, cross-stitched: a house, a heart, a tree
      const w = s * 0.6, h = s * 0.48, st = s * 0.03;
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(cx - w / 2 + 3, cy - h / 2 + 3, w, h);
      g.fillStyle = P.wainsD; g.fillRect(cx - w / 2 - s * 0.035, cy - h / 2 - s * 0.035, w + s * 0.07, h + s * 0.07);
      g.fillStyle = '#f4ecd8'; g.fillRect(cx - w / 2, cy - h / 2, w, h);
      const X = (u, v, c)=>{ g.fillStyle = c; g.fillRect(cx + u * st - st * 0.42, cy + v * st - st * 0.42, st * 0.84, st * 0.84); };
      for(let u = -9; u <= 9; u += 2){ X(u, -7, P.cloth); X(u, 7, P.cloth); }
      for(let v = -5; v <= 5; v += 2){ X(-9, v, P.cloth); X(9, v, P.cloth); }
      [[-1, -4], [0, -4], [1, -4], [-2, -3], [-1, -3], [0, -3], [1, -3], [2, -3]].forEach(([u, v])=> X(u, v, '#c0392b'));
      for(let u = -2; u <= 2; u++) for(let v = -2; v <= 1; v++) X(u, v, u === 0 && v >= 0 ? '#6a4024' : (u === -2 || u === 2) && v === -1 ? '#7ab8e0' : '#d8b878');
      [[-6, -2], [-4, -2], [-7, -1], [-6, -1], [-5, -1], [-4, -1], [-3, -1], [-6, 0], [-5, 0], [-4, 0], [-5, 1]].forEach(([u, v])=> X(u, v, '#d84a6a'));
      [[5, -4], [4, -3], [5, -3], [6, -3], [3, -2], [4, -2], [5, -2], [6, -2], [7, -2], [5, -1], [5, 0], [5, 1]].forEach(([u, v], i)=> X(u, v, i < 9 ? '#4a8a4a' : '#6a4024'));
      for(let u = -7; u <= 7; u++) X(u, 3, '#7aa858');
      for(let u = -6; u <= 6; u += 3) X(u, 5, P.clothD);
      return; }
    const w = s * 0.78;                                                // a rack of plates and cups
    g.fillStyle = P.wainsD; g.fillRect(cx - w / 2, cy - s * 0.3, w, s * 0.05); g.fillRect(cx - w / 2, cy + s * 0.12, w, s * 0.05);
    for(let i = 0; i < 3; i++){ const px = cx - w / 3 + i * w / 3; ell(g, px, cy - s * 0.1, s * 0.1, s * 0.12, '#f4efe2'); ell(g, px, cy - s * 0.1, s * 0.07, s * 0.085, P.clothL); ell(g, px, cy - s * 0.1, s * 0.035, s * 0.04, '#f4efe2'); }
    for(let i = 0; i < 4; i++){ const px = cx - w * 0.38 + i * w * 0.25; g.fillStyle = i % 2 ? P.cloth : '#f4efe2'; rr(g, px - s * 0.04, cy + s * 0.04, s * 0.08, s * 0.08, s * 0.02); g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = Lw(s, 0.012); g.beginPath(); g.arc(px + s * 0.05, cy + s * 0.08, s * 0.025, -1.2, 1.2); g.stroke(); }
    return;
  }
  if(k === 'water'){
    if(n === 0){                                                       // a net, hung by its corners, floats along it
      const w = s * 0.82, h = s * 0.62, x0 = cx - w / 2, y0 = cy - h / 2;
      g.strokeStyle = 'rgba(70,60,40,.75)'; g.lineWidth = Lw(s, 0.014);
      for(let i = 0; i <= 6; i++){ g.beginPath(); g.moveTo(x0 + i * w / 6, y0); g.quadraticCurveTo(x0 + i * w / 6 + s * 0.02, y0 + h * 0.6, x0 + w / 2 + (i - 3) * w / 9, y0 + h); g.stroke(); }
      for(let j = 1; j <= 4; j++){ const yy = y0 + j * h / 5, sp = 1 - j * 0.08; g.beginPath(); g.moveTo(cx - w / 2 * sp, yy); g.quadraticCurveTo(cx, yy + s * 0.05, cx + w / 2 * sp, yy); g.stroke(); }
      [0.1, 0.5, 0.9].forEach(f=>{ ell(g, x0 + f * w, y0, s * 0.05, s * 0.035, '#c8743a'); ell(g, x0 + f * w - s * 0.015, y0 - s * 0.01, s * 0.02, s * 0.012, 'rgba(255,255,255,.4)'); });
      circ(g, x0, y0, s * 0.02, '#3a2a1a'); circ(g, x0 + w, y0, s * 0.02, '#3a2a1a');
    } else {                                                           // a string of shells, a carved fish under it
      g.strokeStyle = P.tie; g.lineWidth = Lw(s, 0.015); g.beginPath(); g.moveTo(cx - s * 0.36, cy - s * 0.24); g.quadraticCurveTo(cx, cy - s * 0.06, cx + s * 0.36, cy - s * 0.24); g.stroke();
      for(let i = 0; i < 5; i++){ const t = (i + 0.5) / 5, sx = cx - s * 0.36 + t * s * 0.72, sy = cy - s * 0.24 + Math.sin(t * Math.PI) * s * 0.09; ell(g, sx, sy + s * 0.04, s * 0.045, s * 0.04, i % 2 ? P.accent : P.accent2); }
      const fy = cy + s * 0.16;
      g.fillStyle = lin(g, cx - s * 0.3, 0, cx + s * 0.3, 0, [[0, P.woodL], [1, P.woodD]]); g.beginPath(); g.ellipse(cx - s * 0.04, fy, s * 0.24, s * 0.08, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(cx + s * 0.16, fy); g.lineTo(cx + s * 0.32, fy - s * 0.08); g.lineTo(cx + s * 0.32, fy + s * 0.08); g.closePath(); g.fill();
      circ(g, cx - s * 0.18, fy - s * 0.01, s * 0.018, '#2a2018');
    }
  } else if(k === 'fire'){
    if(n === 0){                                                       // a mask, carved and painted
      ell(g, cx + s * 0.03, cy + s * 0.04, s * 0.22, s * 0.3, 'rgba(0,0,0,.25)');
      g.fillStyle = '#c8402a'; g.beginPath(); g.ellipse(cx, cy, s * 0.21, s * 0.29, 0, 0, TAU); g.fill();
      for(let i = 0; i < 5; i++){ const a = -Math.PI / 2 + (i - 2) * 0.42; g.fillStyle = i % 2 ? '#f2a23a' : '#ffd36a'; g.beginPath(); g.moveTo(cx + Math.cos(a) * s * 0.18, cy + Math.sin(a) * s * 0.24); g.lineTo(cx + Math.cos(a) * s * 0.36, cy + Math.sin(a) * s * 0.42); g.lineTo(cx + Math.cos(a + 0.2) * s * 0.2, cy + Math.sin(a + 0.2) * s * 0.26); g.fill(); }
      g.fillStyle = '#f7d070'; [[-1], [1]].forEach(([d])=>{ g.beginPath(); g.moveTo(cx + d * s * 0.03, cy - s * 0.05); g.lineTo(cx + d * s * 0.16, cy - s * 0.1); g.lineTo(cx + d * s * 0.15, cy); g.closePath(); g.fill(); });
      ell(g, cx - s * 0.09, cy - s * 0.04, s * 0.035, s * 0.025, '#1c0d06'); ell(g, cx + s * 0.09, cy - s * 0.04, s * 0.035, s * 0.025, '#1c0d06');
      g.fillStyle = '#1c0d06'; rr(g, cx - s * 0.08, cy + s * 0.1, s * 0.16, s * 0.05, s * 0.02); g.fill();
      g.fillStyle = '#efe0c4'; for(let i = 0; i < 4; i++) g.fillRect(cx - s * 0.07 + i * s * 0.04, cy + s * 0.1, s * 0.02, s * 0.025);
    } else {                                                           // crossed spears, a hide shield over them
      line(g, cx - s * 0.36, cy + s * 0.36, cx + s * 0.34, cy - s * 0.38, '#6e4224', s * 0.035); line(g, cx + s * 0.36, cy + s * 0.36, cx - s * 0.34, cy - s * 0.38, '#6e4224', s * 0.035);
      [[cx + s * 0.34, cy - s * 0.38, 1], [cx - s * 0.34, cy - s * 0.38, -1]].forEach(([x, y, d])=>{ g.fillStyle = '#c8c0b0'; g.beginPath(); g.moveTo(x + d * s * 0.06, y - s * 0.06); g.lineTo(x - d * s * 0.03, y + s * 0.03); g.lineTo(x + d * s * 0.03, y + s * 0.05); g.closePath(); g.fill(); });
      ell(g, cx + s * 0.02, cy + s * 0.04, s * 0.2, s * 0.24, 'rgba(0,0,0,.25)'); ell(g, cx, cy, s * 0.19, s * 0.23, '#d8b88a');
      g.strokeStyle = '#7a3a1c'; g.lineWidth = Lw(s, 0.03); g.beginPath(); g.ellipse(cx, cy, s * 0.16, s * 0.2, 0, 0, TAU); g.stroke();
      emblem(g, Object.assign({}, P, { clothL:'#c8402a' }), 'fire', cx, cy, s * 0.1);
    }
  } else if(k === 'earth'){
    if(n === 0){                                                       // a stone tablet, its signs cut deep
      g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, cx - s * 0.25 + 3, cy - s * 0.32 + 3, s * 0.5, s * 0.64, s * 0.06); g.fill();
      g.fillStyle = lin(g, cx - s * 0.25, 0, cx + s * 0.25, 0, [[0, '#cfc2a4'], [1, '#8f8268']]); rr(g, cx - s * 0.25, cy - s * 0.32, s * 0.5, s * 0.64, s * 0.06); g.fill();
      g.strokeStyle = '#5e523e'; g.lineWidth = Lw(s, 0.022);
      for(let r2 = 0; r2 < 4; r2++){ const yy = cy - s * 0.22 + r2 * s * 0.14; for(let c = 0; c < 3; c++){ const gx = cx - s * 0.13 + c * s * 0.13, t2 = (r2 * 3 + c) % 4;
        g.beginPath(); if(t2 === 0){ g.moveTo(gx - s * 0.04, yy + s * 0.04); g.lineTo(gx, yy - s * 0.04); g.lineTo(gx + s * 0.04, yy + s * 0.04); } else if(t2 === 1){ g.arc(gx, yy, s * 0.03, 0, TAU); } else if(t2 === 2){ g.moveTo(gx - s * 0.04, yy); g.lineTo(gx + s * 0.04, yy); g.moveTo(gx, yy - s * 0.04); g.lineTo(gx, yy + s * 0.04); } else { g.moveTo(gx - s * 0.04, yy - s * 0.03); g.lineTo(gx + s * 0.04, yy + s * 0.03); } g.stroke(); } }
    } else {                                                           // a pick and a hammer, crossed
      line(g, cx - s * 0.3, cy + s * 0.32, cx + s * 0.26, cy - s * 0.28, P.wood, s * 0.04); line(g, cx + s * 0.3, cy + s * 0.32, cx - s * 0.26, cy - s * 0.28, P.wood, s * 0.04);
      g.fillStyle = '#7a7884'; g.beginPath(); g.moveTo(cx + s * 0.1, cy - s * 0.42); g.quadraticCurveTo(cx + s * 0.3, cy - s * 0.36, cx + s * 0.42, cy - s * 0.18); g.lineTo(cx + s * 0.38, cy - s * 0.16); g.quadraticCurveTo(cx + s * 0.28, cy - s * 0.3, cx + s * 0.1, cy - s * 0.36); g.closePath(); g.fill();
      g.fillStyle = '#5a5866'; rr(g, cx - s * 0.36, cy - s * 0.38, s * 0.18, s * 0.12, s * 0.02); g.fill();
    }
  } else {
    if(n === 0){                                                       // a wreath of leaves and flowers
      for(let i = 0; i < 16; i++){ const a = i / 16 * TAU; g.fillStyle = i % 2 ? '#5fa64a' : '#3e7a2c'; g.beginPath(); g.ellipse(cx + Math.cos(a) * s * 0.24, cy + Math.sin(a) * s * 0.24, s * 0.09, s * 0.04, a + 1.4, 0, TAU); g.fill(); }
      for(let i = 0; i < 6; i++){ const a = i / 6 * TAU + 0.3, fx = cx + Math.cos(a) * s * 0.24, fy = cy + Math.sin(a) * s * 0.24;
        for(let j = 0; j < 5; j++){ const b = j / 5 * TAU; circ(g, fx + Math.cos(b) * s * 0.03, fy + Math.sin(b) * s * 0.03, s * 0.026, ['#f4a9c8', '#fff4dc', '#f6d76a'][i % 3]); } circ(g, fx, fy, s * 0.016, '#f2c043'); }
      g.fillStyle = '#e2508e'; g.beginPath(); g.moveTo(cx, cy + s * 0.22); g.lineTo(cx - s * 0.06, cy + s * 0.38); g.lineTo(cx, cy + s * 0.33); g.lineTo(cx + s * 0.06, cy + s * 0.38); g.closePath(); g.fill();
    } else {                                                           // herbs hung to dry from a peg
      g.fillStyle = P.wood; g.fillRect(cx - s * 0.38, cy - s * 0.3, s * 0.76, s * 0.05);
      for(let i = 0; i < 4; i++){ const hx = cx - s * 0.28 + i * s * 0.19, hy = cy - s * 0.25, c = ['#6f9a45', '#9a7ac8', '#c9a24a', '#5fa64a'][i];
        line(g, hx, hy, hx, hy + s * 0.08, '#3a2a1a', s * 0.012);
        for(let j = 0; j < 7; j++) ell(g, hx + (j - 3) * s * 0.014, hy + s * (0.16 + (j % 2) * 0.05), s * 0.018, s * 0.08, c);
        g.fillStyle = '#c8343a'; g.fillRect(hx - s * 0.02, hy + s * 0.07, s * 0.04, s * 0.02); }
    }
  }
}
/* a flat thing lying on the floor: (p.x, p.y) its middle, in squares */
function litter(g, P, k, p, s){
  const x = p.x * s, y = p.y * s, R = rng(8800 + Math.round(p.x * 100) + Math.round(p.y * 37)), a = p.a * TAU, v = p.n % 4;
  g.save(); g.translate(x, y); g.rotate(a * 0.3);
  if(k === 'castle'){
    if(v === 0){ circ(g, 0, 0, s * 0.09, P.cloth); g.strokeStyle = sh(P.cloth, 0.3); g.lineWidth = 1; for(let i = 0; i < 4; i++){ g.beginPath(); g.ellipse(0, 0, s * 0.08, s * (0.03 + i * 0.012), i * 0.8, 0, TAU); g.stroke(); }   // a ball of wool, its needles through it, a thread run off
      line(g, -s * 0.16, -s * 0.12, s * 0.1, s * 0.08, '#c9a24a', s * 0.016); line(g, -s * 0.12, s * 0.1, s * 0.14, -s * 0.06, '#c9a24a', s * 0.016);
      g.strokeStyle = P.cloth; g.lineWidth = Lw(s, 0.012); g.beginPath(); g.moveTo(s * 0.08, s * 0.03); g.bezierCurveTo(s * 0.2, s * 0.12, s * 0.25, -s * 0.05, s * 0.36, s * 0.04); g.stroke(); }
    else if(v === 1){ g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-s * 0.15, -s * 0.08, s * 0.33, s * 0.21);   // a book left open
      g.fillStyle = sh(P.cloth, -0.2); g.fillRect(-s * 0.17, -s * 0.11, s * 0.34, s * 0.21);
      g.fillStyle = '#f8f2e2'; g.fillRect(-s * 0.155, -s * 0.1, s * 0.15, s * 0.19); g.fillRect(s * 0.005, -s * 0.1, s * 0.15, s * 0.19);
      g.fillStyle = 'rgba(80,70,60,.4)'; for(let i = 0; i < 5; i++){ g.fillRect(-s * 0.14, -s * 0.07 + i * s * 0.032, s * 0.12, 1); g.fillRect(s * 0.02, -s * 0.07 + i * s * 0.032, s * 0.12, 1); } }
    else if(v === 2){ [[-0.07, 0.15], [0.07, -0.1]].forEach(([u, a2])=>{ g.save(); g.translate(u * s, 0); g.rotate(a2);   // slippers, kicked off
        g.fillStyle = P.clothD; g.beginPath(); g.ellipse(0, 0, s * 0.055, s * 0.11, 0, 0, TAU); g.fill();
        g.fillStyle = '#f8f2e2'; g.beginPath(); g.ellipse(0, -s * 0.04, s * 0.05, s * 0.05, 0, 0, TAU); g.fill(); g.fillStyle = sh(P.clothD, -0.3); g.beginPath(); g.ellipse(0, s * 0.03, s * 0.035, s * 0.055, 0, 0, TAU); g.fill(); g.restore(); }); }
    else { [['#d84a3a', -0.12, 0], ['#3f6aa8', 0.02, -0.05], ['#e8b830', 0.08, 0.08]].forEach(([c, u, w2])=>{ g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(u * s + 2, w2 * s + 2, s * 0.09, s * 0.09); g.fillStyle = c; g.fillRect(u * s, w2 * s, s * 0.09, s * 0.09); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(u * s + s * 0.02, w2 * s + s * 0.02, s * 0.05, s * 0.05); });   // toy blocks, a ball
      circ(g, s * 0.24, -s * 0.06, s * 0.045, '#5fb04a'); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(s * 0.2, -s * 0.07, s * 0.08, s * 0.012); }
  } else if(k === 'water'){
    if(v === 0){ g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = s * 0.06; g.beginPath(); for(let t = 0; t < 14; t++){ const r2 = s * (0.04 + t * 0.012), b = t * 0.9; t ? g.lineTo(Math.cos(b) * r2 + 2, Math.sin(b) * r2 * 0.6 + 2) : g.moveTo(2, 2); } g.stroke();
      g.strokeStyle = '#c8a464'; g.lineWidth = s * 0.05; g.beginPath(); for(let t = 0; t < 14; t++){ const r2 = s * (0.04 + t * 0.012), b = t * 0.9; t ? g.lineTo(Math.cos(b) * r2, Math.sin(b) * r2 * 0.6) : g.moveTo(0, 0); } g.stroke(); }
    else if(v === 1){ for(let i = 0; i < 3; i++){ const sx = (R() - 0.5) * s * 0.4, sy = (R() - 0.5) * s * 0.25; ell(g, sx, sy, s * 0.05, s * 0.04, i % 2 ? P.accent : P.accent2); g.strokeStyle = 'rgba(150,110,90,.5)'; g.lineWidth = 1; for(let j = -1; j <= 1; j++){ g.beginPath(); g.moveTo(sx, sy + s * 0.035); g.lineTo(sx + j * s * 0.03, sy - s * 0.03); g.stroke(); } } }
    else if(v === 2){ g.strokeStyle = 'rgba(70,60,40,.6)'; g.lineWidth = 1; for(let i = 0; i < 9; i++){ g.beginPath(); g.ellipse((R() - 0.5) * s * 0.2, (R() - 0.5) * s * 0.1, s * (0.1 + R() * 0.12), s * (0.04 + R() * 0.05), R() * 3, 0, TAU); g.stroke(); } ell(g, s * 0.12, -s * 0.02, s * 0.05, s * 0.035, '#c8743a'); }
    else { ell(g, 0, 0, s * 0.05, s * 0.035, '#c8743a'); g.strokeStyle = '#e8e0d0'; g.lineWidth = Lw(s, 0.012); g.beginPath(); g.moveTo(s * 0.08, s * 0.05); g.lineTo(s * 0.28, s * 0.05); for(let i = 0; i < 5; i++){ g.moveTo(s * (0.11 + i * 0.035), s * 0.02); g.lineTo(s * (0.11 + i * 0.035), s * 0.08); } g.stroke(); }
  } else if(k === 'fire'){
    if(v === 0){ g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(2, 3, s * 0.34, s * 0.2, 0, 0, TAU); g.fill(); g.fillStyle = '#c8a070'; g.beginPath(); g.moveTo(-s * 0.34, 0); g.quadraticCurveTo(-s * 0.3, -s * 0.2, -s * 0.12, -s * 0.16); g.lineTo(-s * 0.06, -s * 0.24); g.lineTo(s * 0.06, -s * 0.16); g.quadraticCurveTo(s * 0.3, -s * 0.2, s * 0.34, 0); g.quadraticCurveTo(s * 0.3, s * 0.18, s * 0.08, s * 0.16); g.lineTo(0, s * 0.24); g.lineTo(-s * 0.08, s * 0.16); g.quadraticCurveTo(-s * 0.3, s * 0.18, -s * 0.34, 0); g.fill();
      for(let i = 0; i < 6; i++) ell(g, (R() - 0.5) * s * 0.4, (R() - 0.5) * s * 0.2, s * 0.03, s * 0.02, '#7a4a28'); }
    else if(v === 1){ for(let i = 0; i < 5; i++){ const b = (R() - 0.5) * 1.2; line(g, -Math.cos(b) * s * 0.2, -Math.sin(b) * s * 0.1, Math.cos(b) * s * 0.2, Math.sin(b) * s * 0.1, i % 2 ? '#8a5a32' : '#6a4022', s * 0.03); } }
    else if(v === 2){ g.fillStyle = 'rgba(60,50,45,.35)'; g.beginPath(); g.ellipse(0, 0, s * 0.3, s * 0.16, 0, 0, TAU); g.fill(); for(let i = 0; i < 6; i++) ell(g, (R() - 0.5) * s * 0.4, (R() - 0.5) * s * 0.2, s * 0.03, s * 0.02, '#1a1410'); }
    else { g.fillStyle = P.pot; g.beginPath(); g.moveTo(-s * 0.1, 0); g.quadraticCurveTo(0, -s * 0.1, s * 0.12, -s * 0.02); g.lineTo(s * 0.08, s * 0.05); g.closePath(); g.fill(); g.strokeStyle = '#f2a23a'; g.lineWidth = Lw(s, 0.02); g.beginPath(); g.moveTo(s * 0.18, s * 0.08); g.quadraticCurveTo(s * 0.26, 0, s * 0.34, -s * 0.06); g.stroke(); }
  } else if(k === 'earth'){
    if(v === 0){ for(let i = 0; i < 6; i++) ell(g, (R() - 0.5) * s * 0.4, (R() - 0.5) * s * 0.22, s * (0.03 + R() * 0.03), s * (0.025 + R() * 0.02), ['#8f8268', '#a8a088', '#6e6450'][i % 3]); }
    else if(v === 1){ for(let i = 0; i < 4; i++){ g.fillStyle = P.pot; g.beginPath(); const sx = (R() - 0.5) * s * 0.4, sy = (R() - 0.5) * s * 0.2; g.moveTo(sx, sy); g.lineTo(sx + s * 0.08, sy - s * 0.03); g.lineTo(sx + s * 0.06, sy + s * 0.04); g.closePath(); g.fill(); } }
    else if(v === 2){ g.fillStyle = '#7a7884'; g.fillRect(-s * 0.2, -s * 0.02, s * 0.16, s * 0.04); g.fillStyle = P.wood; g.fillRect(-s * 0.04, -s * 0.025, s * 0.12, s * 0.05); g.fillStyle = '#5a5866'; g.fillRect(s * 0.1, -s * 0.08, s * 0.1, s * 0.07); line(g, s * 0.15, -s * 0.01, s * 0.15, s * 0.14, P.wood, s * 0.03); }
    else { g.strokeStyle = '#a08a5a'; g.lineWidth = s * 0.04; g.beginPath(); for(let t = 0; t < 12; t++){ const r2 = s * (0.03 + t * 0.012), b = t * 0.9; t ? g.lineTo(Math.cos(b) * r2, Math.sin(b) * r2 * 0.6) : g.moveTo(0, 0); } g.stroke(); }
  } else {
    if(v === 0){ for(let i = 0; i < 7; i++){ g.fillStyle = ['#f4a9c8', '#fff4dc', '#f6d76a'][i % 3]; g.beginPath(); g.ellipse((R() - 0.5) * s * 0.5, (R() - 0.5) * s * 0.3, s * 0.04, s * 0.022, R() * 3, 0, TAU); g.fill(); } }
    else if(v === 1){ for(let i = 0; i < 6; i++){ g.fillStyle = ['#8a6a2a', '#a07a30', '#6a8a30', '#c8a040'][i % 4]; g.beginPath(); g.ellipse((R() - 0.5) * s * 0.4, (R() - 0.5) * s * 0.22, s * 0.08, s * 0.035, R() * 3, 0, TAU); g.fill(); } }
    else if(v === 2){ for(let i = 0; i < 4; i++){ const ax = (R() - 0.5) * s * 0.3, ay = (R() - 0.5) * s * 0.15; ell(g, ax, ay, s * 0.04, s * 0.05, '#a8703a'); ell(g, ax, ay - s * 0.04, s * 0.045, s * 0.025, '#6a4a22'); } }
    else { ell(g, 0, 0, s * 0.06, s * 0.05, '#d83a2a'); g.fillStyle = '#1a1410'; g.fillRect(-Lw(s, 0.006), -s * 0.05, Lw(s, 0.012), s * 0.1); [[-0.03, -0.015], [0.025, 0.01], [-0.02, 0.025]].forEach(([u, w2])=> circ(g, u * s, w2 * s, s * 0.01, '#1a1410')); ell(g, 0, -s * 0.06, s * 0.03, s * 0.02, '#1a1410'); }
  }
  g.restore();
}
/* the garland along the beam at the top of the back wall: floats and shells; peppers and bells; charms and knots;
   flowers and leaves */
function garland(g, m, P, k, s, R0){
  if(k === 'castle') return;
  const y0 = s * 0.14;
  for(let x = Math.max(1, R0.x0); x <= Math.min(m.W - 2, R0.x1); x++){
    const X = x * s, sag = s * 0.1;
    g.strokeStyle = k === 'grass' ? '#3e7a2c' : k === 'fire' ? '#5a3018' : P.tie; g.lineWidth = Lw(s, 0.018);
    g.beginPath(); g.moveTo(X, y0); g.quadraticCurveTo(X + s / 2, y0 + sag * 2, X + s, y0); g.stroke();
    const cx = X + s / 2, cy = y0 + sag, v = x % 3;
    if(k === 'water'){ line(g, cx, cy, cx, cy + s * 0.08, P.tie, s * 0.01); if(v === 0){ ell(g, cx, cy + s * 0.12, s * 0.05, s * 0.04, '#c8743a'); } else if(v === 1){ g.fillStyle = '#a8b8b0'; g.beginPath(); g.ellipse(cx, cy + s * 0.18, s * 0.035, s * 0.1, 0, 0, TAU); g.fill(); } else { ell(g, cx, cy + s * 0.12, s * 0.045, s * 0.04, P.accent2); } }
    else if(k === 'fire'){ if(v === 2){ line(g, cx, cy, cx, cy + s * 0.06, '#5a3018', s * 0.01); g.fillStyle = '#d8a038'; g.beginPath(); g.moveTo(cx - s * 0.05, cy + s * 0.15); g.quadraticCurveTo(cx, cy + s * 0.02, cx + s * 0.05, cy + s * 0.15); g.closePath(); g.fill(); circ(g, cx, cy + s * 0.16, s * 0.015, '#7a5a18'); }
      else for(let i = 0; i < 4; i++){ g.fillStyle = i % 2 ? '#c8261a' : '#e0402a'; g.beginPath(); g.ellipse(cx + (i - 1.5) * s * 0.035, cy + s * (0.12 + (i % 2) * 0.03), s * 0.018, s * 0.07, (i - 1.5) * 0.2, 0, TAU); g.fill(); } }
    else if(k === 'earth'){ line(g, cx, cy, cx, cy + s * 0.1, P.tie, s * 0.012); if(v === 1){ circ(g, cx, cy + s * 0.14, s * 0.04, P.accent2); } else { for(let i = 0; i < 3; i++) circ(g, cx, cy + s * (0.1 + i * 0.05), s * 0.022, ['#a8704a', '#c8b494', '#6e4428'][i]); } }
    else { for(let i = 0; i < 2; i++) ell(g, cx + (i ? 1 : -1) * s * 0.12, cy - s * 0.01, s * 0.07, s * 0.03, i ? '#5fa64a' : '#8cc860');
      for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; circ(g, cx + Math.cos(a) * s * 0.03, cy + s * 0.04 + Math.sin(a) * s * 0.03, s * 0.026, ['#f4a9c8', '#fff4dc', '#f6d76a'][x % 3]); } circ(g, cx, cy + s * 0.04, s * 0.018, '#f2c043'); }
  }
}
/* the doorway in the front wall: the green beyond, the light coming in */
function doorway(g, m, P, k, d, s){
  const X = d.x * s, Y = (d.y + 1) * s, W = d.w * s;
  g.fillStyle = '#1a140c'; g.fillRect(X + s * 0.1, Y, W - s * 0.2, s * 0.8);
  g.fillStyle = lin(g, 0, Y, 0, Y + s * 0.8, [[0, '#c8e0a0'], [1, '#7aa858']]); g.fillRect(X + s * 0.18, Y + s * 0.05, W - s * 0.36, s * 0.75);
  g.fillStyle = 'rgba(255,250,220,.35)'; g.beginPath(); g.moveTo(X + s * 0.18, Y); g.lineTo(X + W - s * 0.18, Y); g.lineTo(X + W + s * 0.1, Y - s * 0.9); g.lineTo(X - s * 0.1, Y - s * 0.9); g.closePath(); g.fill();
  g.fillStyle = k === 'earth' ? P.woodD : P.wood; g.fillRect(X + s * 0.06, Y, s * 0.12, s * 0.8); g.fillRect(X + W - s * 0.18, Y, s * 0.12, s * 0.8);
}

/* the whole room, the squares of R0 */
function paint(g, m, s, R0){
  const k = m.tags.tribe, P = m.tags.pal || HUT_PAL[k], I = CA_ROOM.info(m);
  const xa = Math.max(0, R0.x0), xb = Math.min(m.W - 1, R0.x1), ya = Math.max(0, R0.y0), yb = Math.min(m.H - 1, R0.y1);
  const inR = (r)=> r.x + r.w >= R0.x0 && r.x <= R0.x1 && r.y + r.h >= R0.y0 && r.y <= R0.y1;
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++) if(!wallAt(m, x, y)) floorSq(g, m, P, k, x, y, s);
  (m.tags.floor || []).forEach(f=>{ if(inR({ x:f.x - 1, y:f.y - 1, w:f.w + 2, h:f.h + 2 })) rug(g, P, k, f, s); });
  (m.tags.props || []).forEach(p=>{ if(p.x + 1 >= R0.x0 && p.x - 1 <= R0.x1 + 1 && p.y + 1 >= R0.y0 && p.y - 1 <= R0.y1 + 1) litter(g, P, k, p, s); });
  /* the light: from the windows, the lamps, the hearths; the shade under the walls */
  g.save();
  g.beginPath();
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++) if(!wallAt(m, x, y)) g.rect(x * s, y * s, s, s);
  g.clip();
  for(let x = 1; x < m.W - 1; x++){
    if(partAt(m, x, 1) !== 'window' || x + 4 < R0.x0 || x - 1 > R0.x1) continue;
    const x0 = (x + 0.25) * s, x1 = (x + 0.75) * s, y0 = 2 * s, len = 2.8 * s, dx = len * 0.38;
    g.fillStyle = lin(g, 0, y0, 0, y0 + len, [[0, 'rgba(255,248,214,.3)'], [0.6, 'rgba(255,248,214,.12)'], [1, 'rgba(255,248,214,0)']]);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 + dx, y0 + len); g.lineTo(x0 + dx, y0 + len); g.closePath(); g.fill();
  }
  (m.tags.glows || []).forEach(gl=>{
    if(gl.x + 3 < R0.x0 || gl.x - 3 > R0.x1 || gl.y + 3 < R0.y0 || gl.y - 3 > R0.y1) return;
    g.fillStyle = rad(g, gl.x * s, gl.y * s, 0, (gl.r || 2) * s, [[0, gl.c], [1, 'rgba(255,200,120,0)']]); g.fillRect((gl.x - 3) * s, (gl.y - 3) * s, 6 * s, 6 * s);
  });
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++){
    if(wallAt(m, x, y)) continue;
    const X = x * s, Y = y * s;
    if(wallAt(m, x, y - 1)){ g.fillStyle = lin(g, 0, Y, 0, Y + s * 0.5, [[0, 'rgba(30,18,10,.36)'], [1, 'rgba(30,18,10,0)']]); g.fillRect(X, Y, s, s * 0.5); }
    if(wallAt(m, x - 1, y)){ g.fillStyle = lin(g, X, 0, X + s * 0.3, 0, [[0, 'rgba(30,18,10,.26)'], [1, 'rgba(30,18,10,0)']]); g.fillRect(X, Y, s * 0.3, s); }
    if(wallAt(m, x + 1, y)){ g.fillStyle = lin(g, X + s, 0, X + s * 0.82, 0, [[0, 'rgba(30,18,10,.16)'], [1, 'rgba(30,18,10,0)']]); g.fillRect(X + s * 0.82, Y, s * 0.18, s); }
    if(wallAt(m, x, y + 1)){ g.fillStyle = 'rgba(30,18,10,.12)'; g.fillRect(X, Y + s * 0.9, s, s * 0.1); }
  }
  /* the corners are dim: a hut has few windows */
  g.fillStyle = rad(g, m.W / 2 * s, (m.H / 2 + 0.5) * s, Math.min(m.W, m.H) * 0.25 * s, Math.max(m.W, m.H) * 0.62 * s, [[0, 'rgba(10,6,2,0)'], [1, 'rgba(10,6,2,.32)']]);
  g.fillRect(xa * s, ya * s, (xb - xa + 1) * s, (yb - ya + 1) * s);
  g.restore();
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++){
    if(!wallAt(m, x, y)) continue;
    const lvl = I.lv[y * m.W + x];
    if(lvl) wallFace(g, m, P, k, x, y, s, lvl); else wallTop(g, m, P, k, x, y, s);
  }
  for(let y = ya; y <= yb; y++) for(let x = xa; x <= xb; x++){
    if(I.lv[y * m.W + x] !== 1) continue;
    const pt = partAt(m, x, y);
    if(pt && pt !== 'plain') hangs(g, m, P, k, x, y, s, pt);
  }
  if(R0.y0 <= 1) garland(g, m, P, k, s, R0);
  const d = m.tags.door;
  if(d && inR({ x:d.x - 1, y:d.y, w:d.w + 2, h:3 })) doorway(g, m, P, k, d, s);
}

/* ============================================================
   WHAT STANDS IN THE HOUSES
   Each drawn into (x, y, w, h), k the size of a square, its foot at its rect's bottom; d.tribe whose.
   ============================================================ */
const PAL = d=> d.pal || HUT_PAL[d.tribe] || HUT_PAL.grass;   // (a castle home's things: its own colours)
/* materials */
function plank(g, x, y, w, h, P, R, horiz){
  g.fillStyle = horiz ? lin(g, 0, y, 0, y + h, [[0, P.woodL], [0.5, P.wood], [1, P.woodD]]) : lin(g, x, 0, x + w, 0, [[0, P.woodL], [0.5, P.wood], [1, P.woodD]]);
  g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(30,15,5,.18)'; g.lineWidth = 1;
  for(let i = 0; i < 3; i++){ g.beginPath(); if(horiz){ const yy = y + h * (0.25 + i * 0.25); g.moveTo(x + w * R() * 0.3, yy); g.lineTo(x + w * (0.6 + R() * 0.4), yy); } else { const xx = x + w * (0.25 + i * 0.25); g.moveTo(xx, y + h * R() * 0.3); g.lineTo(xx, y + h * (0.6 + R() * 0.4)); } g.stroke(); }
}
function stoneBox(g, x, y, w, h, P, top){
  g.fillStyle = lin(g, x, 0, x + w, 0, [[0, sh(P.wallL, 0.05)], [0.5, P.wall], [1, P.wallD]]); rr(g, x, y, w, h, Math.min(w, h) * 0.12); g.fill();
  if(top){ g.fillStyle = sh(P.wallL, 0.12); rr(g, x + 1, y, w - 2, h * 0.28, Math.min(w, h) * 0.1); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + w * 0.7, y + h * 0.2, w * 0.3, h * 0.8);
}
/* a pot: foot at (cx, by), its widest r, its height hh */
function pot(g, cx, by, r, hh, col, colL, colD, o){
  o = o || {};
  shadow(g, cx + r * 0.15, by, r * 1.05, r * 0.28, 0.25);
  g.fillStyle = lin(g, cx - r, 0, cx + r, 0, [[0, colL], [0.45, col], [1, colD]]);
  g.beginPath(); g.moveTo(cx - r * 0.55, by); g.bezierCurveTo(cx - r * 1.15, by - hh * 0.3, cx - r * 1.05, by - hh * 0.8, cx - r * 0.42, by - hh * 0.88);
  g.lineTo(cx - r * 0.42, by - hh); g.lineTo(cx + r * 0.42, by - hh); g.lineTo(cx + r * 0.42, by - hh * 0.88);
  g.bezierCurveTo(cx + r * 1.05, by - hh * 0.8, cx + r * 1.15, by - hh * 0.3, cx + r * 0.55, by); g.closePath(); g.fill();
  ell(g, cx, by - hh, r * 0.48, r * 0.14, colD); ell(g, cx, by - hh, r * 0.34, r * 0.09, 'rgba(0,0,0,.45)');
  if(o.band){ g.strokeStyle = o.band; g.lineWidth = Math.max(1, r * 0.12); g.beginPath(); g.ellipse(cx, by - hh * 0.5, r * 0.98, r * 0.22, 0, 0.1, Math.PI - 0.1); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(cx - r * 0.45, by - hh * 0.55, r * 0.14, hh * 0.22, 0.15, 0, TAU); g.fill();
}
/* a basket: foot at (cx, by) */
function basket(g, cx, by, r, hh, P, fill){
  shadow(g, cx + r * 0.1, by, r * 1.05, r * 0.25, 0.22);
  g.fillStyle = lin(g, cx - r, 0, cx + r, 0, [[0, '#d8b878'], [0.5, '#b8924e'], [1, '#86642c']]);
  g.beginPath(); g.moveTo(cx - r, by - hh); g.lineTo(cx - r * 0.78, by); g.lineTo(cx + r * 0.78, by); g.lineTo(cx + r, by - hh); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(90,60,20,.45)'; g.lineWidth = Math.max(1, hh * 0.05);
  for(let i = 1; i < 4; i++){ const yy = by - hh * i / 4; g.beginPath(); g.moveTo(cx - r * (0.78 + 0.22 * i / 4), yy); g.lineTo(cx + r * (0.78 + 0.22 * i / 4), yy); g.stroke(); }
  for(let i = -3; i <= 3; i++){ g.beginPath(); g.moveTo(cx + i * r * 0.26, by - hh); g.lineTo(cx + i * r * 0.2, by); g.stroke(); }
  ell(g, cx, by - hh, r, r * 0.22, '#c8a464');
  if(fill){ for(let i = 0; i < 7; i++) circ(g, cx + (i - 3) * r * 0.25, by - hh - r * 0.08 - (i % 2) * r * 0.1, r * 0.17, fill[i % fill.length]); }
}
function cloth(g, x, y, w, h, P, pattern){
  g.fillStyle = lin(g, x, y, x, y + h, [[0, P.clothL], [0.3, P.cloth], [1, P.clothD]]); g.fillRect(x, y, w, h);
  if(pattern){ g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = Math.max(1, h * 0.06); for(let i = 0; i < 3; i++){ const yy = y + h * (0.25 + i * 0.25); g.beginPath(); g.moveTo(x, yy); for(let xx = x; xx <= x + w; xx += w / 8) g.lineTo(xx, yy + Math.sin((xx - x) / w * TAU * 2) * h * 0.04); g.stroke(); } }
}

/* ---------- a bed ---------- */
function drawBed(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(300 + d.x * 7 + d.y * 13), by = y + h, top = y + h * 0.42;
  shadow(g, x + w / 2, by - k * 0.04, w * 0.52, k * 0.14, 0.3);
  if(t === 'earth'){ stoneBox(g, x + k * 0.04, top + k * 0.18, w - k * 0.08, by - top - k * 0.2, P, true); }
  else {
    const legs = t === 'grass' ? '#5a3c20' : P.woodD;
    [x + k * 0.1, x + w - k * 0.2].forEach(lx=>{ g.fillStyle = legs; g.fillRect(lx, top + k * 0.3, k * 0.1, by - top - k * 0.32); });
    g.fillStyle = lin(g, 0, top + k * 0.18, 0, top + k * 0.42, [[0, P.woodL], [1, P.woodD]]); rr(g, x + k * 0.04, top + k * 0.18, w - k * 0.08, k * 0.26, k * 0.05); g.fill();
  }
  /* the headboard, at its left */
  const hx = x + k * 0.02, hy = y + h * 0.08;
  if(t === 'water'){ g.fillStyle = lin(g, hx, 0, hx + k * 0.22, 0, [[0, P.woodL], [1, P.woodD]]); rr(g, hx, hy, k * 0.2, top - hy + k * 0.4, k * 0.05); g.fill();
    g.strokeStyle = P.tie; g.lineWidth = Lw(k, 0.02); for(let i = 0; i < 3; i++){ const yy = hy + k * (0.12 + i * 0.12); g.beginPath(); g.moveTo(hx, yy); g.lineTo(hx + k * 0.2, yy + k * 0.04); g.stroke(); } }
  else if(t === 'fire'){ g.fillStyle = P.woodD; g.beginPath(); g.moveTo(hx, top + k * 0.4); g.lineTo(hx, hy + k * 0.2); g.quadraticCurveTo(hx + k * 0.05, hy - k * 0.05, hx + k * 0.14, hy); g.quadraticCurveTo(hx + k * 0.1, hy + k * 0.12, hx + k * 0.24, hy + k * 0.1); g.lineTo(hx + k * 0.24, top + k * 0.4); g.closePath(); g.fill();
    g.fillStyle = '#f2a23a'; g.beginPath(); g.ellipse(hx + k * 0.12, hy + k * 0.3, k * 0.05, k * 0.08, 0, 0, TAU); g.fill(); }
  else if(t === 'earth'){ g.fillStyle = lin(g, hx, 0, hx + k * 0.24, 0, [[0, P.wallL], [1, P.wallD]]); rr(g, hx, hy + k * 0.1, k * 0.24, top - hy + k * 0.3, k * 0.08); g.fill(); }
  else { g.strokeStyle = '#5a3c20'; g.lineWidth = k * 0.07; g.lineCap = 'round'; g.beginPath(); g.moveTo(hx + k * 0.08, top + k * 0.4); g.quadraticCurveTo(hx - k * 0.02, hy + k * 0.2, hx + k * 0.16, hy); g.stroke();
    for(let i = 0; i < 4; i++) ell(g, hx + k * (0.06 + R() * 0.15), hy + k * (0.05 + i * 0.1), k * 0.08, k * 0.035, i % 2 ? '#5fa64a' : '#8cc860'); }
  /* the mattress, the blanket, the pillow */
  const mx = x + k * 0.22, mw = w - k * 0.3, my = top - k * 0.02;
  g.fillStyle = t === 'grass' ? '#6fa845' : t === 'earth' ? '#8a7458' : t === 'fire' ? '#c9a070' : '#d8cb98';
  rr(g, mx, my, mw, k * 0.24, k * 0.08); g.fill();
  if(t === 'water'){ g.strokeStyle = 'rgba(120,100,50,.3)'; g.lineWidth = 1; for(let i = 0; i < 8; i++){ g.beginPath(); g.moveTo(mx + i * mw / 8, my); g.lineTo(mx + i * mw / 8, my + k * 0.24); g.stroke(); } }
  const bx = mx + mw * 0.3, bw = mw * 0.72;
  if(t === 'fire'){                                                    // red wool, striped, a fur folded at its foot
    g.fillStyle = lin(g, 0, my - k * 0.04, 0, my + k * 0.36, [[0, '#e0583a'], [1, '#9a2a16']]); rr(g, bx, my - k * 0.04, bw, k * 0.4, k * 0.06); g.fill();
    for(let i = 0; i < 4; i++){ g.fillStyle = i % 2 ? '#f2a23a' : '#3a1a0a'; g.fillRect(bx + bw * (0.12 + i * 0.22), my - k * 0.04, bw * 0.05, k * 0.4); }
    g.fillStyle = '#d8b88a'; rr(g, bx + bw * 0.78, my - k * 0.06, bw * 0.2, k * 0.44, k * 0.06); g.fill(); for(let i = 0; i < 4; i++) ell(g, bx + bw * 0.88, my + k * (0.02 + i * 0.1), k * 0.025, k * 0.02, '#7a4a28');
  } else if(t === 'earth'){                                            // a fur
    g.fillStyle = t === 'fire' ? '#b8703a' : '#8a6a4a'; g.beginPath(); g.moveTo(bx, my - k * 0.04);
    for(let i = 0; i <= 10; i++) g.lineTo(bx + i * bw / 10, my - k * 0.04 + (i % 2 ? k * 0.03 : 0)); g.lineTo(bx + bw, my + k * 0.36); for(let i = 10; i >= 0; i--) g.lineTo(bx + i * bw / 10, my + k * 0.36 + (i % 2 ? k * 0.04 : 0)); g.closePath(); g.fill();
    g.strokeStyle = t === 'fire' ? '#7a3a14' : '#5a4430'; g.lineWidth = Lw(k, 0.03); for(let i = 0; i < 4; i++){ const sx = bx + bw * (0.15 + i * 0.22); g.beginPath(); g.moveTo(sx, my); g.quadraticCurveTo(sx + k * 0.05, my + k * 0.15, sx - k * 0.02, my + k * 0.3); g.stroke(); }
  } else {
    g.fillStyle = lin(g, 0, my - k * 0.04, 0, my + k * 0.36, [[0, t === 'grass' ? '#f9c8dc' : P.clothL], [1, t === 'grass' ? '#e2508e' : P.clothD]]);
    rr(g, bx, my - k * 0.04, bw, k * 0.4, k * 0.06); g.fill();
    if(t === 'water'){ g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Lw(k, 0.02); for(let i = 0; i < 2; i++){ const yy = my + k * (0.06 + i * 0.12); g.beginPath(); g.moveTo(bx + k * 0.05, yy); for(let xx = 0; xx <= 8; xx++) g.lineTo(bx + k * 0.05 + xx * (bw - k * 0.1) / 8, yy + (xx % 2 ? -k * 0.03 : k * 0.03)); g.stroke(); } }
    else { for(let i = 0; i < 6; i++){ const fx = bx + bw * (0.1 + R() * 0.8), fy = my + k * (0.02 + R() * 0.28); for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; circ(g, fx + Math.cos(a) * k * 0.025, fy + Math.sin(a) * k * 0.025, k * 0.022, '#fff4dc'); } circ(g, fx, fy, k * 0.014, '#f2c043'); } }
  }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(bx, my + k * 0.32, bw, k * 0.04);
  ell(g, mx + mw * 0.16, my + k * 0.06, mw * 0.13, k * 0.1, t === 'water' ? '#f4ebde' : t === 'fire' ? '#c8402a' : t === 'earth' ? '#c8b494' : '#f6d76a');
  ell(g, mx + mw * 0.12, my + k * 0.03, mw * 0.06, k * 0.04, 'rgba(255,255,255,.35)');
}
/* ---------- a table (d.heal: the healer's, its bowls of salve and herbs) ---------- */
function drawTable(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(400 + d.x * 7 + d.y * 13), by = y + h, ty = y + h * 0.3, th = k * 0.3;
  shadow(g, x + w / 2, by - k * 0.05, w * 0.5, k * 0.13, 0.3);
  if(t === 'earth'){ [[x + k * 0.15], [x + w - k * 0.45]].forEach(([lx])=> stoneBox(g, lx, ty + th - k * 0.05, k * 0.3, by - ty - th, P, false)); }
  else if(t === 'grass' && d.fw <= 2){ g.fillStyle = lin(g, x + k * 0.2, 0, x + w - k * 0.2, 0, [[0, '#8a6038'], [1, '#4a301a']]); rr(g, x + w * 0.22, ty + th - k * 0.05, w * 0.56, by - ty - th, k * 0.06); g.fill();
    g.strokeStyle = '#3a2410'; g.lineWidth = Lw(k, 0.03); for(let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(x + w * (0.3 + i * 0.18), ty + th); g.lineTo(x + w * (0.28 + i * 0.19), by - k * 0.04); g.stroke(); } }
  else { const lc = t === 'fire' ? P.woodD : P.wood; [x + k * 0.12, x + w - k * 0.22].forEach(lx=>{ g.fillStyle = lc; g.fillRect(lx, ty + th - k * 0.05, k * 0.1, by - ty - th); }); }
  /* its top: a face and a front edge */
  if(t === 'grass' && d.fw <= 2){ ell(g, x + w / 2, ty + th * 0.5, w * 0.5, th * 0.75, '#c49a62'); for(let i = 1; i < 5; i++){ g.strokeStyle = 'rgba(110,70,30,.35)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x + w / 2, ty + th * 0.5, w * 0.5 * i / 5, th * 0.75 * i / 5, 0, 0, TAU); g.stroke(); } }
  else if(t === 'earth'){ g.fillStyle = lin(g, 0, ty, 0, ty + th, [[0, P.wallL], [1, P.wall]]); rr(g, x, ty, w, th, k * 0.06); g.fill(); g.fillStyle = P.wallD; g.fillRect(x + k * 0.03, ty + th * 0.75, w - k * 0.06, th * 0.25); }
  else { g.fillStyle = t === 'fire' ? lin(g, 0, ty, 0, ty + th, [[0, '#c8784a'], [1, '#8a4a28']]) : lin(g, 0, ty, 0, ty + th, [[0, P.woodL], [1, P.wood]]); rr(g, x, ty, w, th, k * 0.05); g.fill();
    g.fillStyle = P.woodD; g.fillRect(x + k * 0.02, ty + th * 0.72, w - k * 0.04, th * 0.28);
    if(t === 'water'){ g.strokeStyle = 'rgba(60,50,30,.3)'; g.lineWidth = 1; for(let i = 1; i < 4; i++){ g.beginPath(); g.moveTo(x, ty + th * 0.18 * i); g.lineTo(x + w, ty + th * 0.18 * i); g.stroke(); } } }
  /* what is on it */
  const n = Math.max(2, Math.round(w / k * 1.4)), sy = ty + th * 0.42;
  for(let i = 0; i < n; i++){
    const cx = x + w * (i + 0.5) / n + (R() - 0.5) * k * 0.08, r = k * 0.11, kind = (i + (d.n || 0)) % 3;
    if(d.heal){ if(kind === 0){ ell(g, cx, sy, r, r * 0.4, '#e8dcc8'); ell(g, cx, sy - r * 0.05, r * 0.75, r * 0.25, '#7aa858'); } else if(kind === 1){ g.fillStyle = '#f4efe2'; rr(g, cx - r, sy - r * 0.35, r * 2, r * 0.5, r * 0.2); g.fill(); g.fillStyle = 'rgba(200,60,60,.6)'; g.fillRect(cx - r * 0.1, sy - r * 0.3, r * 0.2, r * 0.4); } else { pot(g, cx, sy + r * 0.2, r * 0.55, r * 1.2, P.pot, P.potL, P.potD); } continue; }
    if(t === 'water'){ if(kind === 0){ ell(g, cx, sy, r * 1.1, r * 0.4, '#d8cfc0'); ell(g, cx, sy - r * 0.08, r * 0.7, r * 0.2, '#8fb8c8'); g.fillStyle = '#a8c0c8'; g.beginPath(); g.ellipse(cx, sy - r * 0.12, r * 0.55, r * 0.14, 0, 0, TAU); g.fill(); } else if(kind === 1) pot(g, cx, sy + r * 0.25, r * 0.6, r * 1.6, P.pot, P.potL, P.potD); else { ell(g, cx, sy, r * 0.5, r * 0.22, '#f4ebde'); ell(g, cx, sy - r * 0.1, r * 0.4, r * 0.15, P.pot); } }
    else if(t === 'fire'){ if(kind === 0){ ell(g, cx, sy, r * 1.2, r * 0.45, '#d8a060'); ell(g, cx - r * 0.2, sy - r * 0.08, r * 0.5, r * 0.15, 'rgba(120,60,20,.35)'); } else if(kind === 1) pot(g, cx, sy + r * 0.2, r * 0.55, r * 1.3, P.pot, P.potL, P.potD, { band:'#f2a23a' }); else { g.fillStyle = '#f4efe2'; g.fillRect(cx - r * 0.12, sy - r * 0.9, r * 0.24, r * 0.9); circ(g, cx, sy - r * 1.05, r * 0.12, '#ffd36a'); } }
    else if(t === 'earth'){ if(kind === 0) pot(g, cx, sy + r * 0.25, r * 0.7, r * 1.4, P.pot, P.potL, P.potD); else if(kind === 1){ ell(g, cx, sy, r, r * 0.4, '#b8a888'); ell(g, cx, sy - r * 0.1, r * 0.7, r * 0.2, '#8a5a3a'); } else { g.fillStyle = '#e39a2c'; g.beginPath(); g.moveTo(cx, sy - r * 1.2); g.lineTo(cx + r * 0.35, sy - r * 0.2); g.lineTo(cx - r * 0.35, sy - r * 0.2); g.closePath(); g.fill(); g.fillStyle = '#ffd36b'; g.beginPath(); g.moveTo(cx, sy - r * 1.2); g.lineTo(cx - r * 0.35, sy - r * 0.2); g.lineTo(cx, sy - r * 0.2); g.closePath(); g.fill(); } }
    else { if(kind === 0){ g.fillStyle = '#5fa64a'; g.beginPath(); g.ellipse(cx, sy, r * 1.1, r * 0.4, 0, 0, TAU); g.fill(); for(let j = 0; j < 5; j++) circ(g, cx + (j - 2) * r * 0.35, sy - r * 0.12, r * 0.18, j % 2 ? '#c8304a' : '#5a3aa8'); } else if(kind === 1){ pot(g, cx, sy + r * 0.2, r * 0.5, r * 1.1, '#f2c043', '#fae49a', '#c08a1e'); } else { pot(g, cx, sy + r * 0.2, r * 0.4, r * 0.9, P.pot, P.potL, P.potD); g.strokeStyle = '#3e7a2c'; g.lineWidth = Lw(k, 0.015); g.beginPath(); g.moveTo(cx, sy - r * 0.7); g.lineTo(cx, sy - r * 1.5); g.stroke(); for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; circ(g, cx + Math.cos(a) * r * 0.22, sy - r * 1.6 + Math.sin(a) * r * 0.22, r * 0.18, '#f4a9c8'); } circ(g, cx, sy - r * 1.6, r * 0.12, '#f2c043'); } }
  }
}
/* ---------- a seat ---------- */
function drawSeat(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, cx = x + w / 2, by = y + h, top = y + h * 0.45;
  shadow(g, cx, by - k * 0.04, w * 0.42, k * 0.1, 0.28);
  if(t === 'water'){ g.fillStyle = lin(g, x, 0, x + w, 0, [[0, '#e0d0a0'], [0.5, '#c0aa70'], [1, '#8a7444']]); rr(g, x + w * 0.12, top, w * 0.76, by - top - k * 0.03, k * 0.08); g.fill();
    g.strokeStyle = 'rgba(100,80,40,.45)'; g.lineWidth = Lw(k, 0.015); for(let i = 1; i < 4; i++){ g.beginPath(); g.moveTo(x + w * 0.12, top + (by - top) * i / 4); g.lineTo(x + w * 0.88, top + (by - top) * i / 4); g.stroke(); }
    ell(g, cx, top, w * 0.38, k * 0.1, '#e8dab0'); ell(g, cx, top, w * 0.28, k * 0.06, '#3f86c0'); }
  else if(t === 'fire'){ g.fillStyle = P.woodD; g.fillRect(x + w * 0.22, top + k * 0.08, k * 0.07, by - top - k * 0.1); g.fillRect(x + w * 0.7, top + k * 0.08, k * 0.07, by - top - k * 0.1);
    g.fillStyle = lin(g, 0, top, 0, top + k * 0.14, [[0, P.woodL], [1, P.wood]]); rr(g, x + w * 0.12, top, w * 0.76, k * 0.12, k * 0.04); g.fill();
    ell(g, cx, top - k * 0.02, w * 0.36, k * 0.08, P.cloth); ell(g, cx - w * 0.1, top - k * 0.05, w * 0.12, k * 0.03, 'rgba(255,255,255,.3)'); }
  else if(t === 'earth'){ stoneBox(g, x + w * 0.14, top, w * 0.72, by - top - k * 0.03, P, true); ell(g, cx, top + k * 0.03, w * 0.3, k * 0.07, P.cloth); }
  else { g.fillStyle = lin(g, cx - k * 0.1, 0, cx + k * 0.1, 0, [[0, '#f4ead0'], [1, '#c8b890']]); rr(g, cx - k * 0.1, top + k * 0.05, k * 0.2, by - top - k * 0.08, k * 0.05); g.fill();   // a toadstool
    g.fillStyle = lin(g, 0, top - k * 0.12, 0, top + k * 0.12, [[0, '#e04a3a'], [1, '#9a2a1a']]); g.beginPath(); g.ellipse(cx, top + k * 0.06, w * 0.42, k * 0.17, 0, Math.PI, 0); g.lineTo(cx + w * 0.42, top + k * 0.08); g.lineTo(cx - w * 0.42, top + k * 0.08); g.fill();
    [[-0.2, -0.02], [0.12, -0.06], [0.26, 0.02], [-0.04, 0.03]].forEach(([u, v])=> ell(g, cx + u * w, top + v * k, k * 0.04, k * 0.025, '#fff4dc')); }
}
/* ---------- shelves ---------- */
function drawShelf(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(500 + d.x * 7 + d.y * 13 + (d.n || 0) * 3), by = y + h;
  const sx = x + k * 0.06, sw = w - k * 0.12, rows = [by - k * 0.12, by - k * 0.82, by - k * 1.5, by - k * 2.18];
  if(t === 'earth'){ g.fillStyle = sh(P.wallD, -0.15); rr(g, sx, y + k * 0.1, sw, by - y - k * 0.1, k * 0.08); g.fill(); g.fillStyle = sh(P.wallD, -0.3); rr(g, sx + k * 0.08, y + k * 0.18, sw - k * 0.16, by - y - k * 0.32, k * 0.06); g.fill(); }
  else { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(sx, y + k * 0.15, sw, by - y - k * 0.2);
    const post = t === 'grass' ? '#5a3c20' : P.woodD; g.fillStyle = post; g.fillRect(sx, y + k * 0.05, k * 0.08, by - y - k * 0.05); g.fillRect(sx + sw - k * 0.08, y + k * 0.05, k * 0.08, by - y - k * 0.05);
    if(t === 'grass') for(let i = 0; i < 6; i++) ell(g, sx + (i % 2 ? sw - k * 0.04 : k * 0.04), y + k * (0.3 + i * 0.35), k * 0.07, k * 0.03, i % 3 ? '#5fa64a' : '#8cc860'); }
  rows.forEach((ry, i)=>{
    if(i === 0) return;
    if(t === 'earth'){ g.fillStyle = P.wall; g.fillRect(sx + k * 0.06, ry, sw - k * 0.12, k * 0.08); }
    else { g.fillStyle = lin(g, 0, ry, 0, ry + k * 0.08, [[0, P.woodL], [1, P.woodD]]); g.fillRect(sx, ry, sw, k * 0.08); if(t === 'water'){ g.strokeStyle = P.tie; g.lineWidth = Lw(k, 0.02); g.beginPath(); g.moveTo(sx + k * 0.02, ry - k * 0.03); g.lineTo(sx + k * 0.1, ry + k * 0.1); g.moveTo(sx + sw - k * 0.02, ry - k * 0.03); g.lineTo(sx + sw - k * 0.1, ry + k * 0.1); g.stroke(); } }
    /* what is on it */
    let cx = sx + k * 0.18;
    while(cx < sx + sw - k * 0.18){
      const kind = Math.floor(R() * 4), r = k * (0.09 + R() * 0.05);
      if(t === 'water'){ if(kind === 0) pot(g, cx, ry, r, r * 2.2, P.pot, P.potL, P.potD); else if(kind === 1){ ell(g, cx, ry - r * 0.4, r * 0.9, r * 0.6, R() < 0.5 ? P.accent : P.accent2); g.strokeStyle = 'rgba(150,110,90,.5)'; g.lineWidth = 1; for(let j = -2; j <= 2; j++){ g.beginPath(); g.moveTo(cx, ry); g.lineTo(cx + j * r * 0.35, ry - r * 0.9); g.stroke(); } } else if(kind === 2){ ell(g, cx, ry - r * 0.35, r * 1.1, r * 0.4, '#c8a464'); g.strokeStyle = '#8a6a34'; g.lineWidth = 1; for(let j = 0; j < 3; j++){ g.beginPath(); g.ellipse(cx, ry - r * 0.35, r * (1.1 - j * 0.3), r * (0.4 - j * 0.1), 0, 0, TAU); g.stroke(); } } else { g.fillStyle = P.woodL; g.beginPath(); g.moveTo(cx - r * 1.3, ry - r * 0.5); g.quadraticCurveTo(cx, ry + r * 0.3, cx + r * 1.3, ry - r * 0.5); g.lineTo(cx + r, ry - r * 0.2); g.lineTo(cx - r, ry - r * 0.2); g.closePath(); g.fill(); line(g, cx, ry - r * 0.4, cx, ry - r * 1.6, P.woodD, k * 0.015); } }
      else if(t === 'fire'){ if(kind <= 1) pot(g, cx, ry, r, r * (1.6 + R()), P.pot, P.potL, P.potD, { band:R() < 0.5 ? '#f2a23a' : '#3a1a0a' }); else if(kind === 2){ ell(g, cx, ry - r * 0.9, r * 0.8, r * 1.0, '#c8402a'); ell(g, cx - r * 0.3, ry - r, r * 0.12, r * 0.09, '#1c0d06'); ell(g, cx + r * 0.3, ry - r, r * 0.12, r * 0.09, '#1c0d06'); } else { g.fillStyle = '#efe0c4'; g.fillRect(cx - r * 1.2, ry - r * 0.3, r * 2.4, r * 0.25); circ(g, cx - r * 1.2, ry - r * 0.18, r * 0.2, '#efe0c4'); circ(g, cx + r * 1.2, ry - r * 0.18, r * 0.2, '#efe0c4'); } }
      else if(t === 'earth'){ if(kind <= 1) pot(g, cx, ry, r, r * (1.5 + R() * 0.8), P.pot, P.potL, P.potD); else if(kind === 2){ g.fillStyle = '#e39a2c'; g.beginPath(); g.moveTo(cx - r * 0.5, ry); g.lineTo(cx - r * 0.3, ry - r * 1.5); g.lineTo(cx + r * 0.1, ry - r * 1.8); g.lineTo(cx + r * 0.5, ry); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,240,180,.6)'; g.fillRect(cx - r * 0.25, ry - r * 1.3, r * 0.1, r); } else { g.fillStyle = '#b8a888'; rr(g, cx - r * 0.9, ry - r * 1.6, r * 1.8, r * 1.6, r * 0.2); g.fill(); g.strokeStyle = '#5e523e'; g.lineWidth = 1; for(let j = 0; j < 3; j++){ g.beginPath(); g.moveTo(cx - r * 0.5, ry - r * (1.3 - j * 0.4)); g.lineTo(cx + r * 0.5, ry - r * (1.3 - j * 0.4)); g.stroke(); } } }
      else { if(kind === 0){ pot(g, cx, ry, r * 0.8, r * 1.4, '#a8d0c0', '#e0f4ec', '#6a9a88'); for(let j = 0; j < 6; j++) circ(g, cx + (R() - 0.5) * r, ry - r * (0.3 + R() * 0.8), r * 0.12, ['#8a5a2a', '#e8c070', '#4a3a1a'][j % 3]); } else if(kind === 1){ pot(g, cx, ry, r * 0.8, r * 1.0, '#a8703a', '#d09a60', '#6e4420'); for(let j = 0; j < 4; j++){ g.fillStyle = j % 2 ? '#5fa64a' : '#8cc860'; g.beginPath(); g.ellipse(cx + (j - 1.5) * r * 0.3, ry - r * 1.3, r * 0.2, r * 0.45, (j - 1.5) * 0.4, 0, TAU); g.fill(); } } else if(kind === 2) basket(g, cx, ry, r * 1.1, r * 1.1, P, ['#c8304a', '#e8a030', '#5a3aa8']); else { g.fillStyle = '#f4efe2'; rr(g, cx - r * 0.5, ry - r * 1.4, r, r * 1.4, r * 0.3); g.fill(); circ(g, cx, ry - r * 0.8, r * 0.3, '#f4a9c8'); } }
      cx += r * 2.3 + k * 0.04;
    }
  });
}
/* ---------- jars, pots, baskets (n: which) ---------- */
function drawJars(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, by = y + h - k * 0.06, cx = x + w / 2, v = (d.n || 0) % 3;
  if(t === 'grass'){ basket(g, cx - k * 0.14, by, k * 0.24, k * 0.36, P, v === 1 ? ['#f2c043', '#e8a030'] : ['#c8304a', '#5a3aa8', '#e2508e']); if(v !== 2) basket(g, cx + k * 0.22, by + k * 0.02, k * 0.17, k * 0.26, P, ['#8a5a2a', '#c8a050']); else pot(g, cx + k * 0.24, by, k * 0.14, k * 0.3, '#f2c043', '#fae49a', '#c08a1e'); return; }
  const band = t === 'fire' ? '#f2a23a' : t === 'water' ? '#f4ebde' : null;
  if(v === 0){ pot(g, cx - k * 0.12, by, k * 0.22, k * 0.62, P.pot, P.potL, P.potD, { band }); pot(g, cx + k * 0.24, by + k * 0.02, k * 0.15, k * 0.4, sh(P.pot, -0.1), P.potL, P.potD); }
  else if(v === 1){ pot(g, cx, by, k * 0.28, k * 0.5, P.pot, P.potL, P.potD, { band }); if(t === 'water'){ ell(g, cx, by - k * 0.5, k * 0.1, k * 0.04, '#3a2a1a'); } }
  else { pot(g, cx - k * 0.2, by, k * 0.16, k * 0.42, P.pot, P.potL, P.potD); pot(g, cx + k * 0.08, by + k * 0.01, k * 0.2, k * 0.55, sh(P.pot, 0.08), P.potL, P.potD, { band }); pot(g, cx + k * 0.3, by + k * 0.03, k * 0.11, k * 0.26, sh(P.pot, -0.12), P.potL, P.potD); }
}
/* ---------- a hearth (the moving fire: cookLive) ---------- */
function drawCook(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(600 + d.x * 7 + d.y), by = y + h, cx = x + w / 2;
  shadow(g, cx, by - k * 0.05, w * 0.5, k * 0.14, 0.32);
  if(t === 'fire'){                                                    // a beehive oven of clay, its mouth glowing
    const ow = Math.min(w * 0.82, k * 1.8), oh = h * 0.78, ox = cx - ow / 2, oy = by - oh;
    g.fillStyle = lin(g, ox, 0, ox + ow, 0, [[0, '#d88a5a'], [0.5, '#b5643c'], [1, '#7d3c1f']]);
    g.beginPath(); g.moveTo(ox, by - k * 0.05); g.bezierCurveTo(ox - ow * 0.02, oy + oh * 0.1, ox + ow * 0.2, oy, cx, oy); g.bezierCurveTo(ox + ow * 0.8, oy, ox + ow * 1.02, oy + oh * 0.1, ox + ow, by - k * 0.05); g.closePath(); g.fill();
    for(let i = 0; i < 8; i++) ell(g, ox + ow * (0.15 + R() * 0.7), oy + oh * (0.2 + R() * 0.6), k * 0.06, k * 0.03, 'rgba(90,30,10,.18)');
    g.fillStyle = '#1a0a04'; g.beginPath(); g.moveTo(cx - ow * 0.2, by - k * 0.05); g.lineTo(cx - ow * 0.2, by - oh * 0.42); g.quadraticCurveTo(cx, by - oh * 0.62, cx + ow * 0.2, by - oh * 0.42); g.lineTo(cx + ow * 0.2, by - k * 0.05); g.closePath(); g.fill();
    g.fillStyle = '#5a2a12'; rr(g, cx - ow * 0.06, oy - k * 0.12, ow * 0.12, k * 0.18, k * 0.03); g.fill();
    if(d.fw > 2){ plank(g, ox + ow + k * 0.02, by - k * 0.9, k * 0.08, k * 0.85, P, R, false); ell(g, ox + ow + k * 0.06, by - k * 0.9, k * 0.16, k * 0.08, '#8a5a32'); }
  } else if(t === 'earth'){                                            // a hearth cut in stone, a cauldron over it
    stoneBox(g, x + k * 0.05, by - h * 0.55, w - k * 0.1, h * 0.55 - k * 0.04, P, true);
    g.fillStyle = '#1a120a'; rr(g, cx - w * 0.28, by - h * 0.42, w * 0.56, h * 0.36, k * 0.08); g.fill();
    line(g, cx - w * 0.36, by - h * 0.55, cx - w * 0.36, by - h * 0.95, '#2c2a33', k * 0.05); line(g, cx + w * 0.36, by - h * 0.55, cx + w * 0.36, by - h * 0.95, '#2c2a33', k * 0.05); line(g, cx - w * 0.38, by - h * 0.92, cx + w * 0.38, by - h * 0.92, '#2c2a33', k * 0.05);
    g.fillStyle = lin(g, cx - k * 0.3, 0, cx + k * 0.3, 0, [[0, '#4a4650'], [1, '#1c1a22']]); g.beginPath(); g.ellipse(cx, by - h * 0.62, k * 0.32, k * 0.26, 0, 0, Math.PI); g.fill();
    ell(g, cx, by - h * 0.62, k * 0.32, k * 0.08, '#2c2a33'); ell(g, cx, by - h * 0.62, k * 0.26, k * 0.05, '#8a5a3a');
    line(g, cx, by - h * 0.92, cx, by - h * 0.68, '#2c2a33', k * 0.02);
  } else if(t === 'water'){                                            // a clay stove, a pot of soup on it
    const sw = Math.min(w * 0.7, k * 1.3);
    g.fillStyle = lin(g, cx - sw / 2, 0, cx + sw / 2, 0, [[0, '#c8a888'], [1, '#8a6a4e']]); rr(g, cx - sw / 2, by - h * 0.5, sw, h * 0.5 - k * 0.04, k * 0.12); g.fill();
    g.fillStyle = '#1a0e06'; rr(g, cx - sw * 0.22, by - h * 0.32, sw * 0.44, h * 0.24, k * 0.06); g.fill();
    pot(g, cx, by - h * 0.5, k * 0.3, k * 0.36, P.pot, P.potL, P.potD);
    if(d.fw > 2){ g.fillStyle = P.woodD; g.fillRect(x + w - k * 0.5, by - h * 0.85, k * 0.05, h * 0.8);   // fish on a line, smoking
      for(let i = 0; i < 3; i++){ const fy = by - h * 0.75 + i * k * 0.18; g.fillStyle = '#a8b8b0'; g.beginPath(); g.ellipse(x + w - k * 0.3, fy, k * 0.14, k * 0.05, 0.1, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x + w - k * 0.18, fy); g.lineTo(x + w - k * 0.1, fy - k * 0.05); g.lineTo(x + w - k * 0.1, fy + k * 0.05); g.fill(); } }
  } else {                                                             // a ring of river stones, a kettle on a tripod
    for(let i = 0; i < 10; i++){ const a = i / 10 * TAU; ell(g, cx + Math.cos(a) * w * 0.32, by - k * 0.28 + Math.sin(a) * k * 0.14, k * 0.1, k * 0.07, ['#9aa39a', '#b0a898', '#8a9488'][i % 3]); }
    g.fillStyle = '#2a1a0a'; g.beginPath(); g.ellipse(cx, by - k * 0.28, w * 0.24, k * 0.09, 0, 0, TAU); g.fill();
    line(g, cx - w * 0.32, by - k * 0.2, cx, by - h * 0.95, '#5a3c20', k * 0.04); line(g, cx + w * 0.32, by - k * 0.2, cx, by - h * 0.95, '#5a3c20', k * 0.04);
    line(g, cx, by - h * 0.95, cx, by - h * 0.62, '#2c2a33', k * 0.015);
    g.fillStyle = lin(g, cx - k * 0.2, 0, cx + k * 0.2, 0, [[0, '#7a8a6a'], [1, '#3a4a30']]); g.beginPath(); g.ellipse(cx, by - h * 0.48, k * 0.2, k * 0.16, 0, 0, TAU); g.fill();
    g.fillStyle = '#3a4a30'; g.fillRect(cx - k * 0.08, by - h * 0.64, k * 0.16, k * 0.05); line(g, cx + k * 0.18, by - h * 0.5, cx + k * 0.32, by - h * 0.6, '#3a4a30', k * 0.04);
    for(let i = 0; i < 3; i++){ const hx = x + k * 0.2 + i * k * 0.18; line(g, hx, by - h * 0.98, hx, by - h * 0.86, '#3a2a1a', k * 0.01); for(let j = 0; j < 5; j++) ell(g, hx + (j - 2) * k * 0.012, by - h * 0.8 + (j % 2) * k * 0.03, k * 0.014, k * 0.05, ['#6f9a45', '#9a7ac8', '#5fa64a'][i]); }
  }
}
function cookLive(g, d, x, y, w, h, k, t){
  const by = y + h, cx = x + w / 2, tr = d.tribe;
  if(tr === 'fire'){ const ow = Math.min(w * 0.82, k * 1.8), oh = h * 0.78;
    g.fillStyle = rad(g, cx, by - k * 0.1, 0, ow * 0.3, [[0, 'rgba(255,220,120,.95)'], [0.5, 'rgba(255,120,40,.6)'], [1, 'rgba(255,80,20,0)']]); g.fillRect(cx - ow * 0.3, by - oh * 0.6, ow * 0.6, oh * 0.6);
    for(let i = 0; i < 3; i++) flame(g, cx + (i - 1) * ow * 0.08, by - k * 0.08, k * 0.07, t, d.x + i); return; }
  if(tr === 'earth'){ for(let i = 0; i < 3; i++) flame(g, cx + (i - 1) * w * 0.12, by - h * 0.1, k * 0.08, t, d.x + i); steam(g, cx, by - h * 0.66, k, t); return; }
  if(tr === 'water'){ const sw = Math.min(w * 0.7, k * 1.3); for(let i = 0; i < 2; i++) flame(g, cx + (i - 0.5) * sw * 0.18, by - h * 0.1, k * 0.06, t, d.x + i); steam(g, cx, by - h * 0.5 - k * 0.38, k, t); return; }
  for(let i = 0; i < 3; i++) flame(g, cx + (i - 1) * w * 0.1, by - k * 0.28, k * 0.07, t, d.x + i);
  steam(g, cx + k * 0.3, by - h * 0.62, k, t);
}
function flame(g, cx, by, r, t, seed){
  const f = 1 + 0.15 * Math.sin(t * 9 + seed * 5.3) + 0.08 * Math.sin(t * 23 + seed * 2.1), lean = Math.sin(t * 5 + seed) * r * 0.2, hh = r * 2.4 * f;
  g.fillStyle = 'rgba(255,120,30,.85)'; g.beginPath(); g.moveTo(cx - r, by); g.quadraticCurveTo(cx - r, by - hh * 0.5, cx + lean, by - hh); g.quadraticCurveTo(cx + r, by - hh * 0.5, cx + r, by); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,220,120,.95)'; g.beginPath(); g.moveTo(cx - r * 0.5, by); g.quadraticCurveTo(cx - r * 0.5, by - hh * 0.35, cx + lean * 0.6, by - hh * 0.65); g.quadraticCurveTo(cx + r * 0.5, by - hh * 0.35, cx + r * 0.5, by); g.closePath(); g.fill();
}
function steam(g, cx, by, k, t){
  for(let i = 0; i < 3; i++){ const p = ((t * 0.5 + i / 3) % 1), yy = by - p * k * 0.7, a = (1 - p) * 0.35;
    ell(g, cx + Math.sin(t * 2 + i * 2) * k * 0.08, yy, k * (0.06 + p * 0.1), k * (0.04 + p * 0.06), `rgba(255,255,255,${a.toFixed(3)})`); }
}
/* ---------- a loom (the Fire tribe's: a rack of masks; the Earth tribe's: a stone being carved) ---------- */
function drawLoom(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(700 + d.x * 7 + d.y * 13), by = y + h, fx0 = x + k * 0.1, fx1 = x + w - k * 0.1, ft = y + k * 0.15;
  shadow(g, x + w / 2, by - k * 0.04, w * 0.48, k * 0.12, 0.28);
  if(t === 'earth'){                                                   // a block on a bench, half carved
    plank(g, x + k * 0.1, by - k * 0.5, w - k * 0.2, k * 0.12, P, R, true);
    g.fillStyle = P.woodD; g.fillRect(x + k * 0.18, by - k * 0.4, k * 0.08, k * 0.36); g.fillRect(x + w - k * 0.26, by - k * 0.4, k * 0.08, k * 0.36);
    const bx = x + w * 0.2, bw = w * 0.6, bt = y + h * 0.2;
    g.fillStyle = lin(g, bx, 0, bx + bw, 0, [[0, '#d4c8aa'], [1, '#8f8268']]); rr(g, bx, bt, bw, by - k * 0.5 - bt, k * 0.06); g.fill();
    g.strokeStyle = '#5e523e'; g.lineWidth = Lw(k, 0.025);
    g.beginPath(); g.moveTo(bx + bw * 0.2, bt + k * 0.3); g.lineTo(bx + bw * 0.5, bt + k * 0.12); g.lineTo(bx + bw * 0.8, bt + k * 0.3); g.moveTo(bx + bw * 0.35, bt + k * 0.55); g.arc(bx + bw * 0.5, bt + k * 0.55, bw * 0.15, Math.PI, 0); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.25)'; for(let i = 0; i < 8; i++) g.fillRect(bx + bw * R(), by - k * 0.52 - R() * k * 0.05, 1.5, 1.5);   // its dust
    [[0.1, 0.35], [0.85, 0.3]].forEach(([u, a])=>{ const tx = x + w * u, ty = by - k * 0.55; g.save(); g.translate(tx, ty); g.rotate(a); g.fillStyle = '#7a7884'; g.fillRect(-k * 0.02, -k * 0.2, k * 0.04, k * 0.14); g.fillStyle = P.wood; g.fillRect(-k * 0.03, -k * 0.06, k * 0.06, k * 0.12); g.restore(); });
    return;
  }
  g.fillStyle = t === 'grass' ? '#5a3c20' : P.woodD;
  g.fillRect(fx0, ft, k * 0.08, by - ft); g.fillRect(fx1 - k * 0.08, ft, k * 0.08, by - ft);
  g.fillStyle = lin(g, 0, ft, 0, ft + k * 0.1, [[0, P.woodL], [1, P.woodD]]); g.fillRect(fx0 - k * 0.04, ft, fx1 - fx0 + k * 0.08, k * 0.1);
  if(t === 'fire'){                                                    // masks hung to dry
    g.fillRect(fx0, ft + h * 0.42, fx1 - fx0, k * 0.06);
    [[0.25, 0.18], [0.75, 0.18], [0.5, 0.6]].forEach(([u, v], i)=>{ const mx = fx0 + (fx1 - fx0) * u, my = ft + h * v + k * 0.22, col = ['#c8402a', '#f2a23a', '#e8e0c8'][i];
      line(g, mx, my - k * 0.22, mx, my - k * 0.14, '#3a2a1a', k * 0.01);
      g.fillStyle = col; g.beginPath(); g.ellipse(mx, my, k * 0.14, k * 0.19, 0, 0, TAU); g.fill();
      ell(g, mx - k * 0.05, my - k * 0.03, k * 0.025, k * 0.018, '#1c0d06'); ell(g, mx + k * 0.05, my - k * 0.03, k * 0.025, k * 0.018, '#1c0d06');
      g.strokeStyle = i === 2 ? '#c8402a' : '#1c0d06'; g.lineWidth = Lw(k, 0.015); g.beginPath(); g.moveTo(mx - k * 0.06, my + k * 0.08); g.quadraticCurveTo(mx, my + k * 0.12, mx + k * 0.06, my + k * 0.08); g.stroke(); });
    return;
  }
  /* the warp, the cloth growing up it, the shuttle */
  const cw = fx1 - fx0 - k * 0.16, cxx = fx0 + k * 0.08, ct = ft + k * 0.12, cb = by - k * 0.35;
  g.strokeStyle = 'rgba(240,235,220,.55)'; g.lineWidth = 1; for(let i = 0; i <= 14; i++){ g.beginPath(); g.moveTo(cxx + i * cw / 14, ct); g.lineTo(cxx + i * cw / 14, cb); g.stroke(); }
  const clothTop = ct + (cb - ct) * 0.45;
  cloth(g, cxx, clothTop, cw, cb - clothTop, t === 'grass' ? P : P, true);
  if(t === 'water'){ g.strokeStyle = '#f4ebde'; g.lineWidth = Lw(k, 0.02); for(let i = 0; i < 3; i++){ const wy = clothTop + (cb - clothTop) * (0.25 + i * 0.25); g.beginPath(); for(let j = 0; j <= 6; j++){ const wx = cxx + j * cw / 6; j ? g.quadraticCurveTo(wx - cw / 12, wy - k * 0.06, wx, wy) : g.moveTo(wx, wy); } g.stroke(); } }
  else { for(let i = 0; i < 6; i++){ const fx = cxx + cw * (0.1 + R() * 0.8), fy = clothTop + (cb - clothTop) * (0.2 + R() * 0.6); for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; circ(g, fx + Math.cos(a) * k * 0.025, fy + Math.sin(a) * k * 0.025, k * 0.022, i % 2 ? '#f4a9c8' : '#fff4dc'); } } }
  g.fillStyle = P.woodD; g.fillRect(cxx - k * 0.02, cb, cw + k * 0.04, k * 0.06);
  g.fillStyle = P.woodL; rr(g, cxx + cw * 0.55, clothTop - k * 0.06, cw * 0.3, k * 0.05, k * 0.02); g.fill();
  line(g, fx0 + k * 0.04, by - k * 0.2, fx1 - k * 0.04, by - k * 0.2, P.woodD, k * 0.05);
}
/* ---------- a workbench ---------- */
function drawCraft(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(800 + d.x * 7 + d.y * 13), by = y + h, cx = x + w / 2, v = d.n || 0;
  shadow(g, cx, by - k * 0.04, w * 0.5, k * 0.13, 0.3);
  if(t === 'fire'){                                                    // the anvil on its stump; the forge
    if(v === 0){
      g.fillStyle = lin(g, x + k * 0.3, 0, x + k * 0.7, 0, [[0, '#8a5a32'], [1, '#4a2a14']]); rr(g, x + k * 0.32, by - k * 0.48, k * 0.42, k * 0.44, k * 0.05); g.fill();
      g.fillStyle = lin(g, 0, by - k * 0.72, 0, by - k * 0.48, [[0, '#4a4650'], [1, '#18161c']]);
      g.beginPath(); g.moveTo(x + k * 0.12, by - k * 0.7); g.lineTo(x + k * 0.86, by - k * 0.7); g.quadraticCurveTo(x + k * 0.96, by - k * 0.66, x + k * 0.86, by - k * 0.6); g.lineTo(x + k * 0.66, by - k * 0.58); g.lineTo(x + k * 0.62, by - k * 0.48); g.lineTo(x + k * 0.42, by - k * 0.48); g.lineTo(x + k * 0.38, by - k * 0.58); g.lineTo(x + k * 0.22, by - k * 0.6); g.quadraticCurveTo(x + k * 0.04, by - k * 0.62, x + k * 0.12, by - k * 0.7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + k * 0.2, by - k * 0.7, k * 0.6, Lw(k, 0.015));
      line(g, x + k * 0.5, by - k * 0.74, x + k * 0.86, by - k * 0.9, P.woodD, k * 0.03); g.fillStyle = '#4a4650'; rr(g, x + k * 0.78, by - k * 0.98, k * 0.16, k * 0.1, k * 0.02); g.fill();
    }
    const fx = v === 0 ? x + k * 1.05 : x + k * 0.1, fw = w - (v === 0 ? k * 1.15 : k * 0.2);
    if(fw > k * 0.4){ g.fillStyle = lin(g, fx, 0, fx + fw, 0, [[0, '#9a4a2a'], [1, '#5a2410']]); rr(g, fx, by - k * 0.72, fw, k * 0.68, k * 0.05); g.fill();
      g.strokeStyle = 'rgba(40,10,0,.4)'; g.lineWidth = 1; for(let i = 1; i < 4; i++){ g.beginPath(); g.moveTo(fx, by - k * 0.72 + i * k * 0.17); g.lineTo(fx + fw, by - k * 0.72 + i * k * 0.17); g.stroke(); }
      g.fillStyle = '#1a0a04'; rr(g, fx + fw * 0.12, by - k * 0.84, fw * 0.76, k * 0.18, k * 0.04); g.fill();
      if(v !== 0){ line(g, fx + fw * 0.2, by - k * 1.1, fx + fw * 0.45, by - k * 0.84, '#2c2a33', k * 0.025); line(g, fx + fw * 0.24, by - k * 1.12, fx + fw * 0.5, by - k * 0.86, '#2c2a33', k * 0.025);
        g.fillStyle = '#5a3018'; g.beginPath(); g.moveTo(fx + fw * 0.7, by - k * 0.7); g.lineTo(fx + fw * 1.02, by - k * 0.5); g.lineTo(fx + fw * 0.7, by - k * 0.3); g.closePath(); g.fill(); } }
    return;
  }
  /* the others: a bench, with the craft on it */
  plank(g, x + k * 0.04, by - k * 0.6, w - k * 0.08, k * 0.14, P, R, true);
  g.fillStyle = t === 'grass' ? '#5a3c20' : P.woodD; g.fillRect(x + k * 0.12, by - k * 0.48, k * 0.08, k * 0.44); g.fillRect(x + w - k * 0.2, by - k * 0.48, k * 0.08, k * 0.44);
  const top = by - k * 0.6;
  if(t === 'water'){                                                   // a frame, a net half mended on it; floats in a heap
    const fx0 = x + k * 0.18, fx1 = x + w * 0.7, fy = top - k * 0.62;
    line(g, fx0, top, fx0, fy, P.woodD, k * 0.04); line(g, fx1, top, fx1, fy, P.woodD, k * 0.04); line(g, fx0, fy, fx1, fy, P.woodD, k * 0.04);
    g.strokeStyle = 'rgba(70,60,40,.7)'; g.lineWidth = 1;
    for(let i = 0; i <= 6; i++){ g.beginPath(); g.moveTo(fx0 + i * (fx1 - fx0) / 6, fy); g.lineTo(fx0 + i * (fx1 - fx0) / 6 + k * 0.03, top - k * (i < 4 ? 0.04 : 0.3)); g.stroke(); }
    for(let j = 1; j < 4; j++){ g.beginPath(); g.moveTo(fx0, fy + j * (top - fy) / 4); g.lineTo(fx0 + (fx1 - fx0) * (j < 3 ? 1 : 0.6), fy + j * (top - fy) / 4); g.stroke(); }
    for(let i = 0; i < 4; i++) ell(g, x + w * 0.82 + (i % 2) * k * 0.1, top - k * (0.06 + Math.floor(i / 2) * 0.09), k * 0.07, k * 0.045, '#c8743a');
    line(g, x + w * 0.5, top - k * 0.05, x + w * 0.62, top - k * 0.03, P.woodL, k * 0.025);
  } else if(t === 'earth'){                                            // the wheel, a pot on it; pots drying
    ell(g, x + w * 0.35, top - k * 0.02, k * 0.36, k * 0.1, '#6a5e48'); ell(g, x + w * 0.35, top - k * 0.05, k * 0.34, k * 0.09, '#9a8c72');
    pot(g, x + w * 0.35, top - k * 0.06, k * 0.16, k * 0.32, '#b07850', '#d8a078', '#7a4a2a');
    for(let i = 0; i < 3; i++) pot(g, x + w * 0.7 + i * k * 0.18, top, k * 0.07 + i * k * 0.01, k * (0.16 + (i % 2) * 0.06), '#b8a080', '#d8c8a8', '#8a7458');
    ell(g, x + w * 0.85, top - k * 0.28, k * 0.1, k * 0.06, '#a06a40');
  } else {                                                             // mortars and pestles, little bottles
    for(let i = 0; i < 2; i++){ const mx = x + w * (0.25 + i * 0.25); g.fillStyle = '#9a9488'; g.beginPath(); g.ellipse(mx, top - k * 0.1, k * 0.14, k * 0.12, 0, 0, Math.PI); g.fill(); ell(g, mx, top - k * 0.1, k * 0.14, k * 0.04, i ? '#c84a8a' : '#6aa64a'); line(g, mx + k * 0.04, top - k * 0.12, mx + k * 0.14, top - k * 0.32, '#c8c0b0', k * 0.035); }
    for(let i = 0; i < 4; i++){ const bx = x + w * (0.66 + i * 0.08); g.fillStyle = ['rgba(200,80,140,.8)', 'rgba(120,180,90,.8)', 'rgba(240,190,60,.8)', 'rgba(140,120,220,.8)'][i]; rr(g, bx - k * 0.04, top - k * 0.2, k * 0.08, k * 0.2, k * 0.03); g.fill(); g.fillStyle = '#8a6a3a'; g.fillRect(bx - k * 0.02, top - k * 0.25, k * 0.04, k * 0.05); circ(g, bx, top - k * 0.1, k * 0.018, '#fff4dc'); }
    for(let i = 0; i < 6; i++) ell(g, x + w * (0.1 + R() * 0.8), top - k * 0.02, k * 0.03, k * 0.015, ['#f4a9c8', '#f6d76a', '#fff4dc'][i % 3]);
  }
}
function craftLive(g, d, x, y, w, h, k, t){
  if(d.tribe !== 'fire') return;
  const by = y + h, v = d.n || 0, fx = v === 0 ? x + k * 1.05 : x + k * 0.1, fw = w - (v === 0 ? k * 1.15 : k * 0.2);
  if(fw <= k * 0.4) return;
  const glow = 0.6 + 0.4 * Math.sin(t * 2.2 + d.x);
  g.fillStyle = rad(g, fx + fw / 2, by - k * 0.76, 0, fw * 0.5, [[0, `rgba(255,140,40,${(0.85 * glow).toFixed(3)})`], [1, 'rgba(255,90,20,0)']]); g.fillRect(fx, by - k * 1.1, fw, k * 0.5);
  for(let i = 0; i < 5; i++) circ(g, fx + fw * (0.2 + i * 0.15), by - k * 0.76, k * 0.035, i % 2 ? '#ff7a2a' : '#ffd36a');
}
/* ---------- a store (n: which) ---------- */
function drawStore(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(900 + d.x * 7 + d.y * 13 + (d.n || 0)), by = y + h, cx = x + w / 2;
  shadow(g, cx, by - k * 0.04, w * 0.5, k * 0.13, 0.28);
  if(t === 'water'){                                                   // a drying rack of fish
    const t0 = y + k * 0.15; g.fillStyle = P.woodD; g.fillRect(x + k * 0.1, t0, k * 0.07, by - t0); g.fillRect(x + w - k * 0.17, t0, k * 0.07, by - t0);
    for(let r = 0; r < 3; r++){ const ry = t0 + k * 0.1 + r * k * 0.5; line(g, x + k * 0.06, ry, x + w - k * 0.06, ry, P.wood, k * 0.04);
      for(let i = 0; i < Math.floor(w / k * 3); i++){ const fx = x + k * 0.3 + i * k * 0.32, fy = ry + k * 0.24; if(fx > x + w - k * 0.25) break;
        line(g, fx, ry, fx, ry + k * 0.06, '#3a2a1a', k * 0.01);
        g.fillStyle = ['#a8b8b0', '#b8a888', '#98a8a8'][i % 3]; g.beginPath(); g.ellipse(fx, fy, k * 0.05, k * 0.17, 0, 0, TAU); g.fill();
        g.beginPath(); g.moveTo(fx, fy + k * 0.14); g.lineTo(fx - k * 0.06, fy + k * 0.24); g.lineTo(fx + k * 0.06, fy + k * 0.24); g.closePath(); g.fill();
        circ(g, fx, fy - k * 0.1, k * 0.012, '#1a1a1a'); } }
    return;
  }
  if(t === 'fire'){                                                    // logs stacked, ends to you; a sack of charcoal
    const rows = 4, r = k * 0.13;
    for(let row = 0; row < rows; row++) for(let i = 0; i < Math.floor((w - k * 0.2) / (2 * r)) - (row % 2); i++){
      const lx = x + k * 0.1 + r + (row % 2) * r + i * 2 * r, ly = by - r - row * r * 1.75;
      circ(g, lx, ly, r, '#6a3a1e'); circ(g, lx, ly, r * 0.82, '#c89a62'); g.strokeStyle = 'rgba(110,70,30,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(lx, ly, r * 0.5, 0, TAU); g.stroke(); circ(g, lx, ly, r * 0.12, '#8a5a30'); }
    if((d.n || 0) % 2 === 0){ const sx = x + w - k * 0.36; g.fillStyle = '#5a4a3a'; g.beginPath(); g.ellipse(sx, by - k * 0.25, k * 0.22, k * 0.26, 0, 0, TAU); g.fill(); g.fillStyle = '#1a1612'; g.beginPath(); g.ellipse(sx, by - k * 0.48, k * 0.14, k * 0.06, 0, 0, TAU); g.fill(); }
    return;
  }
  /* sacks, and a basket of what the tribe keeps */
  const sacks = Math.max(2, Math.round(w / k * 1.5));
  for(let i = 0; i < sacks; i++){
    const sx = x + w * (i + 0.5) / sacks + (R() - 0.5) * k * 0.05, sw = k * 0.3, sh2 = k * (0.48 + R() * 0.18), col = t === 'earth' ? '#c8b890' : '#b8a878';
    g.fillStyle = lin(g, sx - sw, 0, sx + sw, 0, [[0, sh(col, 0.08)], [1, sh(col, -0.25)]]);
    g.beginPath(); g.moveTo(sx - sw * 0.9, by - k * 0.04); g.quadraticCurveTo(sx - sw * 1.1, by - sh2 * 0.6, sx - sw * 0.5, by - sh2); g.lineTo(sx + sw * 0.5, by - sh2); g.quadraticCurveTo(sx + sw * 1.1, by - sh2 * 0.6, sx + sw * 0.9, by - k * 0.04); g.closePath(); g.fill();
    g.fillStyle = sh(col, -0.3); g.fillRect(sx - sw * 0.35, by - sh2 - k * 0.02, sw * 0.7, k * 0.05);
    g.fillStyle = 'rgba(90,60,30,.5)'; g.font = `${Math.round(k * 0.12)}px sans-serif`; g.textAlign = 'center'; g.fillText(t === 'earth' ? '◆' : '❀', sx, by - sh2 * 0.45);
    if(i === sacks - 1 && R() < 0.8){ const bx = sx, top = by - sh2 - k * 0.02; for(let j = 0; j < 5; j++) circ(g, bx + (j - 2) * k * 0.05, top - k * 0.02, k * 0.035, t === 'earth' ? '#e8d8a0' : ['#8a5a2a', '#c8a050', '#4a3a1a'][j % 3]); }
  }
  if(t === 'earth'){ basket(g, x + w - k * 0.25, by - k * 0.02, k * 0.18, k * 0.26, P, ['#5a5866', '#7a7884', '#ffd36b']); }
}
/* ---------- the elder's seat ---------- */
function drawElder(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(1000 + d.x * 7), by = y + h, cx = x + w / 2, seat = by - k * 0.5, back = y + k * 0.1;
  shadow(g, cx, by - k * 0.05, w * 0.48, k * 0.14, 0.3);
  if(t === 'earth'){ stoneBox(g, x + w * 0.1, back + k * 0.1, w * 0.8, by - back - k * 0.14, P, true); g.fillStyle = sh(P.wallD, -0.15); rr(g, x + w * 0.22, back + k * 0.3, w * 0.56, seat - back - k * 0.3, k * 0.1); g.fill(); }
  else if(t === 'grass'){ g.strokeStyle = '#5a3c20'; g.lineWidth = k * 0.14; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + w * 0.18, by - k * 0.05); g.quadraticCurveTo(x + w * 0.08, back + k * 0.4, cx, back + k * 0.15); g.quadraticCurveTo(x + w * 0.92, back + k * 0.4, x + w * 0.82, by - k * 0.05); g.stroke();
    for(let i = 0; i < 12; i++){ const a = Math.PI + i / 11 * Math.PI, lx = cx + Math.cos(a) * w * 0.42, ly = back + k * 0.45 + Math.sin(a) * k * 0.36; ell(g, lx, ly, k * 0.09, k * 0.04, i % 2 ? '#5fa64a' : '#8cc860'); }
    g.fillStyle = '#6a4a28'; rr(g, x + w * 0.22, seat, w * 0.56, k * 0.14, k * 0.05); g.fill(); }
  else { g.fillStyle = lin(g, x, 0, x + w, 0, [[0, P.woodL], [0.5, P.wood], [1, P.woodD]]);
    g.beginPath(); g.moveTo(x + w * 0.15, by - k * 0.05); g.lineTo(x + w * 0.15, back + k * 0.3); g.quadraticCurveTo(cx, back - k * 0.08, x + w * 0.85, back + k * 0.3); g.lineTo(x + w * 0.85, by - k * 0.05); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.2)'; rr(g, x + w * 0.25, back + k * 0.32, w * 0.5, seat - back - k * 0.3, k * 0.08); g.fill();
    emblem(g, Object.assign({}, P, { clothL:t === 'fire' ? '#f2a23a' : '#f4ebde' }), t, cx, back + k * 0.45, k * 0.14);
    g.fillStyle = sh(P.wood, -0.1); rr(g, x + w * 0.2, seat, w * 0.6, k * 0.14, k * 0.04); g.fill(); }
  /* a pelt over the seat, and what the elder keeps beside it */
  g.fillStyle = t === 'water' ? '#d8cfc0' : t === 'fire' ? '#c8843a' : t === 'earth' ? '#8a7a68' : '#c8b070';
  g.beginPath(); g.moveTo(x + w * 0.24, seat - k * 0.02); for(let i = 0; i <= 8; i++) g.lineTo(x + w * (0.24 + i * 0.065), seat - k * 0.02 + (i % 2) * k * 0.04); g.lineTo(x + w * 0.76, seat + k * 0.3); g.lineTo(x + w * 0.24, seat + k * 0.3); g.closePath(); g.fill();
  const sx = x + w * 0.95;
  if(t === 'water'){ g.strokeStyle = '#d8cfa4'; g.lineWidth = Lw(k, 0.02); for(let i = 0; i < 4; i++){ g.beginPath(); g.ellipse(sx, by - k * 0.15 - i * k * 0.05, k * 0.14, k * 0.05, 0, 0, TAU); g.stroke(); } for(let i = 0; i < 6; i++) circ(g, sx + (R() - 0.5) * k * 0.2, by - k * (0.15 + R() * 0.2), k * 0.02, '#8a7444'); }
  else if(t === 'fire'){ ell(g, sx, by - k * 0.12, k * 0.14, k * 0.06, '#5a5050'); circ(g, sx, by - k * 0.16, k * 0.05, '#ff7a2a'); circ(g, sx, by - k * 0.17, k * 0.025, '#ffe08a'); }
  else if(t === 'earth'){ for(let i = 0; i < 3; i++){ g.fillStyle = sh('#b8a888', -i * 0.08); rr(g, sx - k * 0.14, by - k * (0.12 + i * 0.07), k * 0.28, k * 0.07, k * 0.02); g.fill(); } }
  else { pot(g, sx, by - k * 0.04, k * 0.1, k * 0.22, '#c49a5a', '#e2c088', '#8a6a38'); g.strokeStyle = '#3e7a2c'; g.lineWidth = Lw(k, 0.015); g.beginPath(); g.moveTo(sx, by - k * 0.26); g.lineTo(sx, by - k * 0.5); g.stroke(); circ(g, sx, by - k * 0.52, k * 0.06, '#f4a9c8'); }
}
/* ---------- a cradle ---------- */
function drawCrib(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, by = y + h, cx = x + w / 2;
  shadow(g, cx, by - k * 0.04, w * 0.42, k * 0.1, 0.26);
  if(t === 'grass' || t === 'water'){ basket(g, cx, by - k * 0.12, w * 0.42, k * 0.3, P, null); line(g, x + w * 0.12, by - k * 0.06, x + w * 0.88, by - k * 0.06, P.woodD, k * 0.04); }
  else { g.fillStyle = lin(g, x, 0, x + w, 0, [[0, P.woodL], [1, P.woodD]]); rr(g, x + w * 0.08, by - k * 0.5, w * 0.84, k * 0.42, k * 0.06); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + w * 0.14, by - k * 0.46, w * 0.72, k * 0.08); }
  g.fillStyle = lin(g, 0, by - k * 0.5, 0, by - k * 0.3, [[0, t === 'grass' ? '#f9c8dc' : P.clothL], [1, t === 'grass' ? '#e2508e' : P.cloth]]); rr(g, x + w * 0.2, by - k * 0.52, w * 0.6, k * 0.16, k * 0.06); g.fill();
  /* a toy beside it */
  const tx = x + w * 0.86, ty = by - k * 0.08;
  if(t === 'water'){ g.fillStyle = P.woodL; g.beginPath(); g.moveTo(tx - k * 0.1, ty - k * 0.08); g.quadraticCurveTo(tx, ty, tx + k * 0.1, ty - k * 0.08); g.lineTo(tx + k * 0.07, ty - k * 0.04); g.lineTo(tx - k * 0.07, ty - k * 0.04); g.fill(); line(g, tx, ty - k * 0.06, tx, ty - k * 0.2, P.woodD, k * 0.01); g.fillStyle = '#f4ebde'; g.beginPath(); g.moveTo(tx, ty - k * 0.2); g.lineTo(tx + k * 0.07, ty - k * 0.1); g.lineTo(tx, ty - k * 0.1); g.fill(); }
  else if(t === 'fire'){ circ(g, tx, ty - k * 0.06, k * 0.06, '#c8402a'); line(g, tx, ty - k * 0.06, tx + k * 0.1, ty - k * 0.18, P.woodD, k * 0.015); }
  else if(t === 'earth'){ ell(g, tx, ty - k * 0.05, k * 0.07, k * 0.05, '#9a8c72'); circ(g, tx + k * 0.05, ty - k * 0.08, k * 0.025, '#9a8c72'); }
  else { ell(g, tx, ty - k * 0.05, k * 0.06, k * 0.05, '#f4ead0'); ell(g, tx, ty - k * 0.08, k * 0.07, k * 0.03, '#e04a3a'); }
}
/* ---------- a totem ---------- */
function drawTotem(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, by = y + h, cx = x + w / 2, pw = w * 0.5;
  shadow(g, cx, by - k * 0.04, w * 0.36, k * 0.1, 0.3);
  const body = t === 'earth' ? [P.wallL, P.wall, P.wallD] : t === 'grass' ? ['#946a42', '#6e4c2c', '#48301a'] : [P.woodL, P.wood, P.woodD];
  g.fillStyle = lin(g, cx - pw / 2, 0, cx + pw / 2, 0, [[0, body[0]], [0.5, body[1]], [1, body[2]]]); rr(g, cx - pw / 2, y + h * 0.2, pw, h * 0.8 - k * 0.03, k * 0.06); g.fill();
  /* three spirits, one above another */
  const faces = 3, fh = (h * 0.8 - k * 0.1) / faces;
  for(let i = 0; i < faces; i++){
    const fy = y + h * 0.2 + fh * (i + 0.5), col = [P.cloth, P.clothL, P.accent2][i % 3];
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(cx - pw / 2, y + h * 0.2 + fh * (i + 1) - Lw(k, 0.02), pw, Lw(k, 0.02));
    ell(g, cx - pw * 0.2, fy - fh * 0.12, pw * 0.12, fh * 0.1, col); ell(g, cx + pw * 0.2, fy - fh * 0.12, pw * 0.12, fh * 0.1, col);
    circ(g, cx - pw * 0.2, fy - fh * 0.12, pw * 0.05, '#1a120a'); circ(g, cx + pw * 0.2, fy - fh * 0.12, pw * 0.05, '#1a120a');
    if(i === 0){ g.fillStyle = col; g.beginPath(); g.moveTo(cx - pw * 0.1, fy); g.lineTo(cx + pw * 0.1, fy); g.lineTo(cx, fy + fh * 0.22); g.closePath(); g.fill(); }
    else { g.strokeStyle = col; g.lineWidth = Lw(k, 0.025); g.beginPath(); g.moveTo(cx - pw * 0.25, fy + fh * 0.15); g.quadraticCurveTo(cx, fy + fh * (i === 1 ? 0.32 : 0.05), cx + pw * 0.25, fy + fh * 0.15); g.stroke(); }
    if(i === 1){ g.fillStyle = body[1]; [[-1], [1]].forEach(([s2])=>{ g.beginPath(); g.moveTo(cx + s2 * pw * 0.5, fy - fh * 0.2); g.lineTo(cx + s2 * pw * 0.95, fy - fh * 0.05); g.lineTo(cx + s2 * pw * 0.5, fy + fh * 0.12); g.closePath(); g.fill(); }); }
  }
  emblem(g, Object.assign({}, P, { clothL:P.accent2 }), t, cx, y + h * 0.12, k * 0.2);
}
/* ---------- the guardian's seat ---------- */
function drawThrone(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(1100 + d.x), by = y + h, cx = x + w / 2, seat = by - k * 0.55;
  shadow(g, cx, by - k * 0.05, w * 0.5, k * 0.16, 0.32);
  const bk = y + k * 0.05;
  if(t === 'water'){                                                   // a great shell rising behind it
    for(let i = 0; i < 9; i++){ const a = Math.PI + (i + 0.5) / 9 * Math.PI; g.fillStyle = i % 2 ? '#f2e2d4' : '#e8c8b8'; g.beginPath(); g.moveTo(cx, seat); g.lineTo(cx + Math.cos(a - 0.17) * w * 0.48, seat + Math.sin(a - 0.17) * (seat - bk)); g.quadraticCurveTo(cx + Math.cos(a) * w * 0.55, seat + Math.sin(a) * (seat - bk) * 1.08, cx + Math.cos(a + 0.17) * w * 0.48, seat + Math.sin(a + 0.17) * (seat - bk)); g.closePath(); g.fill(); }
    g.strokeStyle = 'rgba(180,140,120,.6)'; g.lineWidth = Lw(k, 0.015); for(let i = 0; i < 9; i++){ const a = Math.PI + (i + 0.5) / 9 * Math.PI; g.beginPath(); g.moveTo(cx, seat); g.lineTo(cx + Math.cos(a) * w * 0.48, seat + Math.sin(a) * (seat - bk)); g.stroke(); }
  } else if(t === 'fire'){                                             // a fan of wooden flames
    for(let i = 0; i < 7; i++){ const a = Math.PI + (i + 0.5) / 7 * Math.PI, len = (seat - bk) * (i % 2 ? 0.9 : 1.05);
      g.fillStyle = i % 2 ? '#f2a23a' : '#c8402a'; g.beginPath(); g.moveTo(cx + Math.cos(a - 0.2) * w * 0.12, seat + Math.sin(a - 0.2) * k * 0.2); g.quadraticCurveTo(cx + Math.cos(a) * w * 0.4, seat + Math.sin(a) * len * 0.6, cx + Math.cos(a) * w * 0.5, seat + Math.sin(a) * len); g.quadraticCurveTo(cx + Math.cos(a + 0.15) * w * 0.3, seat + Math.sin(a + 0.15) * len * 0.5, cx + Math.cos(a + 0.2) * w * 0.12, seat + Math.sin(a + 0.2) * k * 0.2); g.fill(); }
  } else if(t === 'earth'){                                            // hewn stone, a slab of amber in its back
    stoneBox(g, x + w * 0.08, bk + k * 0.15, w * 0.84, seat - bk, P, true);
    g.fillStyle = lin(g, cx - w * 0.2, 0, cx + w * 0.2, 0, [[0, '#ffd36b'], [1, '#c8781a']]); rr(g, cx - w * 0.2, bk + k * 0.35, w * 0.4, k * 0.6, k * 0.12); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(cx - w * 0.14, bk + k * 0.42, k * 0.05, k * 0.35);
  } else {                                                             // a root curled into a chair, a canopy of leaves
    g.strokeStyle = '#5a3c20'; g.lineWidth = k * 0.16; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + w * 0.15, by - k * 0.05); g.bezierCurveTo(x - w * 0.05, bk + k * 0.5, x + w * 0.3, bk, cx, bk + k * 0.2); g.bezierCurveTo(x + w * 0.7, bk, x + w * 1.05, bk + k * 0.5, x + w * 0.85, by - k * 0.05); g.stroke();
    for(let i = 0; i < 20; i++){ const a = Math.PI * 1.05 + i / 19 * Math.PI * 0.9, lx = cx + Math.cos(a) * w * 0.5, ly = bk + k * 0.55 + Math.sin(a) * k * 0.55; ell(g, lx, ly, k * 0.12, k * 0.05, i % 2 ? '#5fa64a' : '#8cc860'); if(i % 4 === 0){ for(let j = 0; j < 5; j++){ const b = j / 5 * TAU; circ(g, lx + Math.cos(b) * k * 0.03, ly + Math.sin(b) * k * 0.03, k * 0.026, '#f4a9c8'); } } }
  }
  /* the seat itself, and its arms */
  g.fillStyle = lin(g, 0, seat, 0, by, [[0, t === 'earth' ? P.wallL : P.woodL], [1, t === 'earth' ? P.wallD : P.woodD]]); rr(g, x + w * 0.18, seat, w * 0.64, by - seat - k * 0.04, k * 0.06); g.fill();
  g.fillStyle = P.cloth; rr(g, x + w * 0.22, seat - k * 0.05, w * 0.56, k * 0.16, k * 0.06); g.fill();
  g.fillStyle = 'rgba(255,255,255,.25)'; rr(g, x + w * 0.26, seat - k * 0.04, w * 0.3, k * 0.05, k * 0.02); g.fill();
  [x + w * 0.12, x + w * 0.8].forEach(ax=>{ g.fillStyle = t === 'earth' ? P.wall : P.wood; rr(g, ax, seat - k * 0.12, w * 0.08, by - seat, k * 0.03); g.fill(); });
  emblem(g, Object.assign({}, P, { clothL:t === 'water' ? '#3f86c0' : P.accent2 }), t, cx, seat - k * 0.5, k * 0.16);
}
/* ---------- the ancestor's shrine (its lamp, which moves: shrineLive) ---------- */
function drawShrine(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(1200 + d.x), by = y + h, cx = x + w / 2, top = by - k * 0.62;
  shadow(g, cx, by - k * 0.04, w * 0.5, k * 0.14, 0.3);
  if(t === 'earth') stoneBox(g, x + k * 0.05, top, w - k * 0.1, by - top - k * 0.04, P, true);
  else { g.fillStyle = lin(g, 0, top, 0, by, [[0, P.woodL], [1, P.woodD]]); rr(g, x + k * 0.05, top, w - k * 0.1, by - top - k * 0.04, k * 0.06); g.fill(); g.fillStyle = P.cloth; g.fillRect(x + k * 0.1, top + k * 0.04, w - k * 0.2, k * 0.12); g.fillStyle = P.clothL; for(let i = 0; i < 6; i++) g.fillRect(x + k * 0.12 + i * (w - k * 0.24) / 6, top + k * 0.16, (w - k * 0.24) / 12, k * 0.1); }
  /* the empty stand, where the blade rested */
  const sx = cx, sb = top - k * 0.02;
  g.fillStyle = '#4a4034'; rr(g, sx - k * 0.22, sb - k * 0.1, k * 0.44, k * 0.1, k * 0.03); g.fill();
  line(g, sx - k * 0.16, sb - k * 0.1, sx - k * 0.1, sb - k * 0.75, '#3a3028', k * 0.05); line(g, sx + k * 0.16, sb - k * 0.1, sx + k * 0.1, sb - k * 0.75, '#3a3028', k * 0.05);
  g.fillStyle = '#3a3028'; g.beginPath(); g.moveTo(sx - k * 0.14, sb - k * 0.75); g.quadraticCurveTo(sx, sb - k * 0.62, sx + k * 0.14, sb - k * 0.75); g.lineTo(sx + k * 0.1, sb - k * 0.7); g.quadraticCurveTo(sx, sb - k * 0.6, sx - k * 0.1, sb - k * 0.7); g.closePath(); g.fill();
  if(t === 'grass'){ g.strokeStyle = '#3e7a2c'; g.lineWidth = Lw(k, 0.02); g.beginPath(); g.moveTo(sx - k * 0.16, sb - k * 0.1); for(let i = 0; i < 8; i++) g.lineTo(sx - k * 0.16 + (i % 2) * k * 0.08, sb - k * 0.1 - i * k * 0.08); g.stroke(); for(let i = 0; i < 4; i++) ell(g, sx - k * 0.12 + (i % 2) * k * 0.06, sb - k * (0.2 + i * 0.15), k * 0.05, k * 0.025, '#5fa64a'); }
  /* the offerings, either side */
  [x + w * 0.18, x + w * 0.82].forEach((ox, i)=>{
    if(t === 'water'){ ell(g, ox, sb - k * 0.05, k * 0.12, k * 0.08, i ? P.accent : P.accent2); for(let j = 0; j < 3; j++) circ(g, ox + (j - 1) * k * 0.06, sb - k * 0.1, k * 0.03, '#f8f4f0'); }
    else if(t === 'fire'){ ell(g, ox, sb - k * 0.06, k * 0.13, k * 0.06, '#5a5050'); ell(g, ox, sb - k * 0.08, k * 0.1, k * 0.03, '#2a1a10'); }
    else if(t === 'earth'){ g.fillStyle = '#e39a2c'; g.beginPath(); g.moveTo(ox, sb - k * 0.36); g.lineTo(ox + k * 0.08, sb - k * 0.04); g.lineTo(ox - k * 0.08, sb - k * 0.04); g.closePath(); g.fill(); g.fillStyle = '#ffd36b'; g.beginPath(); g.moveTo(ox, sb - k * 0.36); g.lineTo(ox - k * 0.08, sb - k * 0.04); g.lineTo(ox, sb - k * 0.04); g.closePath(); g.fill(); }
    else { pot(g, ox, sb, k * 0.1, k * 0.16, '#f4efe2', '#ffffff', '#c8c0b0'); for(let j = 0; j < 3; j++){ const fx = ox + (j - 1) * k * 0.06, fy = sb - k * (0.26 + (j % 2) * 0.06); for(let q = 0; q < 5; q++){ const b = q / 5 * TAU; circ(g, fx + Math.cos(b) * k * 0.025, fy + Math.sin(b) * k * 0.025, k * 0.022, ['#f4a9c8', '#f6d76a', '#fff4dc'][j]); } } }
  });
  emblem(g, Object.assign({}, P, { clothL:P.accent2 }), t, cx, by - k * 0.3, k * 0.12);
}
function shrineLive(g, d, x, y, w, h, k, t){
  const by = y + h, cx = x + w / 2, top = by - k * 0.62, tr = d.tribe;
  const pulse = 0.55 + 0.45 * Math.sin(t * 1.6 + d.x);
  g.fillStyle = rad(g, cx, top - k * 0.4, 0, k * 0.7, [[0, `rgba(${tr === 'water' ? '150,215,255' : tr === 'fire' ? '255,170,80' : tr === 'earth' ? '255,205,110' : '210,255,150'},${(0.35 * pulse).toFixed(3)})`], [1, 'rgba(255,255,255,0)']]);
  g.fillRect(cx - k * 0.7, top - k * 1.1, k * 1.4, k * 1.4);
  if(tr === 'fire'){ [x + w * 0.18, x + w * 0.82].forEach((ox, i)=> flame(g, ox, top - k * 0.08, k * 0.05, t, d.x + i)); }
}
/* ---------- the long table in the lodge ---------- */
function drawLong(g, d, x, y, w, h, k){ drawTable(g, Object.assign({}, d, { fw:d.fw, n:(d.n || 0) + 1 }), x, y, w, h, k); }
/* ---------- a plant ---------- */
function drawPlant(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, R = rng(1300 + d.x * 7 + d.y * 13 + (d.n || 0)), by = y + h, cx = x + w / 2;
  if(t === 'water'){ pot(g, cx, by - k * 0.03, k * 0.22, k * 0.42, P.pot, P.potL, P.potD, { band:'#f4ebde' });   // reeds and a bulrush
    for(let i = 0; i < 9; i++){ const a = -Math.PI / 2 + (i - 4) * 0.12, len = k * (0.5 + R() * 0.35); line(g, cx + (i - 4) * k * 0.02, by - k * 0.42, cx + Math.cos(a) * len, by - k * 0.42 + Math.sin(a) * len, i % 2 ? '#5a9a4a' : '#7ab85a', k * 0.025); }
    ell(g, cx + k * 0.04, by - k * 0.92, k * 0.035, k * 0.1, '#6b4526'); }
  else if(t === 'fire'){ pot(g, cx, by - k * 0.03, k * 0.2, k * 0.36, P.pot, P.potL, P.potD, { band:'#3a1a0a' });   // a fire-lily
    for(let i = 0; i < 6; i++){ const a = -Math.PI / 2 + (i - 2.5) * 0.35; g.fillStyle = '#4a8a3a'; g.beginPath(); g.ellipse(cx + Math.cos(a) * k * 0.2, by - k * 0.5 + Math.sin(a) * k * 0.16, k * 0.05, k * 0.16, a + Math.PI / 2, 0, TAU); g.fill(); }
    [[0, -0.86], [-0.14, -0.7], [0.15, -0.72]].forEach(([u, v], i)=>{ const fx = cx + u * k, fy = by + v * k; for(let j = 0; j < 6; j++){ const a = j / 6 * TAU; g.fillStyle = j % 2 ? '#f2a23a' : '#e0452a'; g.beginPath(); g.ellipse(fx + Math.cos(a) * k * 0.05, fy + Math.sin(a) * k * 0.05, k * 0.06, k * 0.025, a, 0, TAU); g.fill(); } circ(g, fx, fy, k * 0.025, '#ffd36a'); }); }
  else if(t === 'earth'){ g.fillStyle = lin(g, cx - k * 0.3, 0, cx + k * 0.3, 0, [[0, P.wallL], [1, P.wallD]]); rr(g, cx - k * 0.3, by - k * 0.34, k * 0.6, k * 0.3, k * 0.06); g.fill();   // succulents in a trough of stone
    for(let i = 0; i < 4; i++){ const sx = cx - k * 0.2 + i * k * 0.13; for(let j = 0; j < 7; j++){ const a = j / 7 * TAU; g.fillStyle = j % 2 ? '#8ab890' : '#6a9a78'; g.beginPath(); g.ellipse(sx + Math.cos(a) * k * 0.04, by - k * 0.4 + Math.sin(a) * k * 0.025, k * 0.05, k * 0.022, a, 0, TAU); g.fill(); } circ(g, sx, by - k * 0.4, k * 0.02, '#c8d8a0'); } }
  else { basket(g, cx, by - k * 0.03, k * 0.24, k * 0.3, P, null);                       // a fern, spilling over
    for(let i = 0; i < 9; i++){ const a = -Math.PI / 2 + (i - 4) * 0.33, len = k * (0.5 + R() * 0.25), ex = cx + Math.cos(a) * len, ey = by - k * 0.34 + Math.sin(a) * len * 0.9;
      g.strokeStyle = '#3e7a2c'; g.lineWidth = Lw(k, 0.02); g.beginPath(); g.moveTo(cx, by - k * 0.34); g.quadraticCurveTo((cx + ex) / 2, ey - k * 0.1, ex, ey); g.stroke();
      for(let j = 1; j < 6; j++){ const f = j / 6, px = cx + (ex - cx) * f, py = by - k * 0.34 + (ey - by + k * 0.34) * f - Math.sin(f * Math.PI) * k * 0.08; ell(g, px - k * 0.03, py, k * 0.04, k * 0.015, '#5fa64a'); ell(g, px + k * 0.03, py, k * 0.04, k * 0.015, '#8cc860'); } } }
}
/* ---------- a drum ---------- */
function drawDrum(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, by = y + h, cx = x + w / 2, r = w * 0.36, top = by - k * 0.62;
  shadow(g, cx, by - k * 0.04, r * 1.1, k * 0.1, 0.28);
  if(t === 'water'){ g.fillStyle = lin(g, cx - r, 0, cx + r, 0, [[0, '#c8a888'], [1, '#7a5a3e']]); g.beginPath(); g.ellipse(cx, by - k * 0.3, r * 1.05, k * 0.3, 0, 0, Math.PI); g.lineTo(cx - r * 1.05, by - k * 0.3); g.fill(); ell(g, cx, by - k * 0.3, r * 1.05, k * 0.12, '#5d9fbf'); ell(g, cx + k * 0.05, by - k * 0.33, r * 0.4, k * 0.07, '#c8a464'); return; }
  const body = t === 'earth' ? [P.wallL, P.wallD] : t === 'grass' ? ['#946a42', '#48301a'] : ['#c8402a', '#6a1a0a'];
  g.fillStyle = lin(g, cx - r, 0, cx + r, 0, [[0, body[0]], [1, body[1]]]); g.beginPath(); g.moveTo(cx - r, top); g.lineTo(cx - r * 0.85, by - k * 0.05); g.lineTo(cx + r * 0.85, by - k * 0.05); g.lineTo(cx + r, top); g.closePath(); g.fill();
  g.strokeStyle = t === 'fire' ? '#f2a23a' : 'rgba(240,230,200,.7)'; g.lineWidth = Lw(k, 0.015); for(let i = 0; i < 5; i++){ g.beginPath(); g.moveTo(cx - r + i * r * 0.5, top + k * 0.05); g.lineTo(cx - r * 0.85 + (i + 1) * r * 0.42, by - k * 0.1); g.stroke(); }
  if(t === 'grass') for(let i = 0; i < 4; i++){ const fx = cx - r * 0.6 + i * r * 0.4, fy = top + k * 0.3; for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; circ(g, fx + Math.cos(a) * k * 0.025, fy + Math.sin(a) * k * 0.025, k * 0.022, ['#f4a9c8', '#f6d76a'][i % 2]); } }
  ell(g, cx, top, r, k * 0.1, '#e8d4b0'); ell(g, cx, top, r * 0.8, k * 0.07, '#d8c0a0');
}
/* ---------- a basin ---------- */
function drawBasin(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, by = y + h, cx = x + w / 2, r = w * 0.44, top = by - k * 0.42;
  shadow(g, cx, by - k * 0.04, r * 1.05, k * 0.1, 0.28);
  const col = t === 'water' ? ['#f2e2d4', '#c8a898'] : t === 'fire' ? ['#5a5866', '#2c2a33'] : t === 'earth' ? [P.wallL, P.wallD] : ['#946a42', '#48301a'];
  g.fillStyle = lin(g, cx - r, 0, cx + r, 0, [[0, col[0]], [1, col[1]]]); g.beginPath(); g.moveTo(cx - r, top); g.quadraticCurveTo(cx - r * 0.9, by, cx, by - k * 0.04); g.quadraticCurveTo(cx + r * 0.9, by, cx + r, top); g.closePath(); g.fill();
  ell(g, cx, top, r, k * 0.12, col[1]); ell(g, cx, top + k * 0.01, r * 0.85, k * 0.09, '#4f8fb8');
  if(t === 'grass') for(let i = 0; i < 4; i++) ell(g, cx + (i - 1.5) * r * 0.4, top + (i % 2) * k * 0.03, k * 0.03, k * 0.015, '#f4a9c8');
}
function basinLive(g, d, x, y, w, h, k, t){
  const cx = x + w / 2, top = y + h - k * 0.42, r = w * 0.44, p = (t * 0.4 + d.x * 0.1) % 1;
  g.strokeStyle = `rgba(230,248,255,${(0.5 * (1 - p)).toFixed(3)})`; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, top + k * 0.01, r * 0.85 * p, k * 0.09 * p, 0, 0, TAU); g.stroke();
}
/* ---------- a lamp on the wall: its light ---------- */
function lightLive(g, d, x, y, w, h, k, t){
  const tr = d.tribe, cx = x + w / 2, cy = y + h / 2;
  if(tr === 'fire'){ flame(g, cx, cy - k * 0.13, k * 0.06, t, d.x); return; }
  if(tr === 'water'){ flame(g, cx, cy + k * 0.06, k * 0.035, t, d.x); return; }
  if(tr === 'castle'){ flame(g, cx, cy - k * 0.16, k * 0.03, t, d.x); return; }
  if(tr === 'earth'){ const p = 0.6 + 0.4 * Math.sin(t * 2 + d.x); g.fillStyle = rad(g, cx, cy, 0, k * 0.3, [[0, `rgba(255,214,110,${(0.6 * p).toFixed(3)})`], [1, 'rgba(255,190,80,0)']]); g.fillRect(cx - k * 0.3, cy - k * 0.3, k * 0.6, k * 0.6); return; }
  for(let i = 0; i < 4; i++){ const a = t * (1.3 + i * 0.4) + i * 2, fx = cx + Math.cos(a) * k * 0.05, fy = cy + Math.sin(a * 1.3) * k * 0.06, on = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.7);
    circ(g, fx, fy, k * 0.02, `rgba(230,255,140,${on.toFixed(3)})`); g.fillStyle = rad(g, fx, fy, 0, k * 0.06, [[0, `rgba(220,255,140,${(0.4 * on).toFixed(3)})`], [1, 'rgba(220,255,140,0)']]); g.fillRect(fx - k * 0.06, fy - k * 0.06, k * 0.12, k * 0.12); }
}

/* ---------- odds and ends that stand about (n: which) ---------- */
function drawProp(g, d, x, y, w, h, k){
  const P = PAL(d), t = d.tribe, v = (d.n || 0) % 4, R = rng(1400 + d.x * 7 + d.y * 13 + v), by = y + h, cx = x + w / 2;
  if(t === 'castle') return propCastle(g, d, x, y, w, h, k, P, by, cx);
  shadow(g, cx, by - k * 0.04, w * 0.42, k * 0.1, 0.26);
  if(t === 'water'){
    if(v === 0){ [[-0.18, 0.12], [0.06, -0.06], [0.22, 0.2]].forEach(([u, lean], i)=>{ const bx = cx + u * k, tx = bx + lean * k;   // oars and a rod against the wall
        line(g, bx, by - k * 0.05, tx, by - k * 1.25, i === 2 ? '#5a4a3a' : P.woodD, k * (i === 2 ? 0.02 : 0.035));
        if(i < 2){ g.fillStyle = lin(g, bx - k * 0.08, 0, bx + k * 0.08, 0, [[0, P.woodL], [1, P.wood]]); g.beginPath(); g.ellipse(bx + lean * k * 0.08, by - k * 0.22, k * 0.08, k * 0.2, lean * 0.1, 0, TAU); g.fill(); } else { g.strokeStyle = 'rgba(230,230,220,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tx, by - k * 1.25); g.quadraticCurveTo(tx + k * 0.15, by - k * 0.9, tx + k * 0.1, by - k * 0.4); g.stroke(); } }); }
    else if(v === 1){ g.fillStyle = lin(g, cx - k * 0.22, 0, cx + k * 0.22, 0, [[0, P.woodL], [1, P.woodD]]); g.beginPath(); g.moveTo(cx - k * 0.22, by - k * 0.42); g.lineTo(cx - k * 0.18, by - k * 0.04); g.lineTo(cx + k * 0.18, by - k * 0.04); g.lineTo(cx + k * 0.22, by - k * 0.42); g.closePath(); g.fill();   // a bucket of fish
      [0.14, 0.3].forEach(f=>{ g.fillStyle = '#2c2a33'; g.fillRect(cx - k * 0.21, by - k * (0.42 - f), k * 0.42, k * 0.025); }); ell(g, cx, by - k * 0.42, k * 0.22, k * 0.06, '#4f8fb8');
      for(let i = 0; i < 3; i++){ g.fillStyle = '#a8b8b0'; g.beginPath(); g.ellipse(cx + (i - 1) * k * 0.1, by - k * 0.5, k * 0.035, k * 0.1, (i - 1) * 0.4, 0, TAU); g.fill(); } }
    else if(v === 2){ plank(g, cx - k * 0.3, by - k * 0.32, k * 0.6, k * 0.3, P, R, true); g.strokeStyle = '#c8a464'; g.lineWidth = k * 0.05; for(let i = 0; i < 3; i++){ g.beginPath(); g.ellipse(cx, by - k * (0.4 + i * 0.05), k * (0.22 - i * 0.04), k * 0.07, 0, 0, TAU); g.stroke(); }   // rope on a crate
      ell(g, cx + k * 0.2, by - k * 0.5, k * 0.06, k * 0.045, '#c8743a'); }
    else { g.strokeStyle = P.woodD; g.lineWidth = Lw(k, 0.025); for(let i = 0; i < 6; i++){ g.beginPath(); g.ellipse(cx, by - k * 0.3, k * 0.28 * (1 - i * 0.12), k * 0.26, 0, Math.PI, 0); g.stroke(); }   // a pot for crabs, woven
      g.beginPath(); g.moveTo(cx - k * 0.28, by - k * 0.3); g.lineTo(cx - k * 0.28, by - k * 0.06); g.lineTo(cx + k * 0.28, by - k * 0.06); g.lineTo(cx + k * 0.28, by - k * 0.3); g.stroke(); ell(g, cx, by - k * 0.3, k * 0.08, k * 0.05, 'rgba(0,0,0,.4)'); }
  } else if(t === 'fire'){
    if(v === 0){ g.fillStyle = P.woodD; rr(g, cx - k * 0.25, by - k * 0.3, k * 0.5, k * 0.26, k * 0.04); g.fill();   // a rack of spears
      for(let i = 0; i < 3; i++){ const sx = cx + (i - 1) * k * 0.14; line(g, sx, by - k * 0.2, sx + (i - 1) * k * 0.04, by - k * 1.3, '#6e4224', k * 0.03); g.fillStyle = '#c8c0b0'; g.beginPath(); g.moveTo(sx + (i - 1) * k * 0.04, by - k * 1.42); g.lineTo(sx + (i - 1) * k * 0.04 + k * 0.04, by - k * 1.26); g.lineTo(sx + (i - 1) * k * 0.04 - k * 0.04, by - k * 1.26); g.closePath(); g.fill(); g.fillStyle = '#c8402a'; g.fillRect(sx + (i - 1) * k * 0.035 - k * 0.025, by - k * 1.22, k * 0.05, k * 0.05); } }
    else if(v === 1){ for(let i = 0; i < 3; i++){ g.fillStyle = ['#c8843a', '#8a5a32', '#d8a060'][i]; rr(g, cx - k * (0.3 - i * 0.03), by - k * (0.16 + i * 0.12), k * (0.6 - i * 0.06), k * 0.14, k * 0.05); g.fill(); g.strokeStyle = 'rgba(60,30,10,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - k * 0.2, by - k * (0.1 + i * 0.12)); g.lineTo(cx + k * 0.2, by - k * (0.1 + i * 0.12)); g.stroke(); } }   // furs, folded
    else if(v === 2){ g.fillStyle = lin(g, cx - k * 0.2, 0, cx + k * 0.2, 0, [[0, '#8a5a32'], [1, '#4a2a14']]); rr(g, cx - k * 0.2, by - k * 0.5, k * 0.4, k * 0.46, k * 0.06); g.fill();   // torches in a barrel
      for(let i = 0; i < 4; i++){ const tx = cx + (i - 1.5) * k * 0.08; line(g, tx, by - k * 0.48, tx + (i - 1.5) * k * 0.03, by - k * 1.0, '#7a4a28', k * 0.035); g.fillStyle = '#2a1408'; g.fillRect(tx + (i - 1.5) * k * 0.03 - k * 0.03, by - k * 1.06, k * 0.06, k * 0.08); } }
    else { line(g, cx - k * 0.18, by - k * 0.05, cx, by - k * 0.5, '#2c2a33', k * 0.035); line(g, cx + k * 0.18, by - k * 0.05, cx, by - k * 0.5, '#2c2a33', k * 0.035);   // a brazier
      g.fillStyle = lin(g, cx - k * 0.22, 0, cx + k * 0.22, 0, [[0, '#4a4650'], [1, '#18161c']]); g.beginPath(); g.ellipse(cx, by - k * 0.52, k * 0.22, k * 0.14, 0, 0, Math.PI); g.fill(); ell(g, cx, by - k * 0.52, k * 0.22, k * 0.05, '#2a1a10'); }
  } else if(t === 'earth'){
    if(v === 0){ g.fillStyle = lin(g, 0, by - k * 0.5, 0, by - k * 0.12, [[0, P.woodL], [1, P.woodD]]); g.beginPath(); g.moveTo(cx - k * 0.32, by - k * 0.48); g.lineTo(cx - k * 0.26, by - k * 0.14); g.lineTo(cx + k * 0.26, by - k * 0.14); g.lineTo(cx + k * 0.32, by - k * 0.48); g.closePath(); g.fill();   // a cart of ore
      circ(g, cx - k * 0.18, by - k * 0.1, k * 0.08, '#3a2a1a'); circ(g, cx + k * 0.18, by - k * 0.1, k * 0.08, '#3a2a1a'); for(let i = 0; i < 6; i++) ell(g, cx + (i - 2.5) * k * 0.09, by - k * (0.52 + (i % 2) * 0.05), k * 0.07, k * 0.05, ['#6a6878', '#8a8898', '#5a5866'][i % 3]); circ(g, cx + k * 0.05, by - k * 0.58, k * 0.03, '#ffd36b'); }
    else if(v === 1){ for(let i = 0; i < 4; i++){ g.fillStyle = sh('#b8a888', -i * 0.06); rr(g, cx - k * 0.24 + i * k * 0.02, by - k * (0.12 + i * 0.1), k * 0.48, k * 0.09, k * 0.02); g.fill(); g.strokeStyle = 'rgba(80,70,50,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - k * 0.15, by - k * (0.08 + i * 0.1)); g.lineTo(cx + k * 0.15, by - k * (0.08 + i * 0.1)); g.stroke(); } }   // tablets, stacked
    else if(v === 2){ for(let i = 0; i < 7; i++) ell(g, cx + (R() - 0.5) * k * 0.5, by - k * (0.08 + R() * 0.2), k * (0.07 + R() * 0.05), k * (0.05 + R() * 0.03), ['#8f8268', '#a8a088', '#6e6450'][i % 3]);   // a heap of stone, a pick in it
      line(g, cx - k * 0.1, by - k * 0.2, cx + k * 0.15, by - k * 0.75, P.wood, k * 0.035); g.fillStyle = '#7a7884'; g.beginPath(); g.moveTo(cx + k * 0.0, by - k * 0.82); g.quadraticCurveTo(cx + k * 0.15, by - k * 0.8, cx + k * 0.3, by - k * 0.68); g.lineTo(cx + k * 0.27, by - k * 0.66); g.quadraticCurveTo(cx + k * 0.15, by - k * 0.75, cx + k * 0.0, by - k * 0.77); g.closePath(); g.fill(); }
    else { g.fillStyle = '#c8b890'; g.beginPath(); g.moveTo(cx - k * 0.25, by - k * 0.05); g.quadraticCurveTo(cx - k * 0.3, by - k * 0.4, cx - k * 0.12, by - k * 0.52); g.lineTo(cx + k * 0.12, by - k * 0.52); g.quadraticCurveTo(cx + k * 0.3, by - k * 0.4, cx + k * 0.25, by - k * 0.05); g.closePath(); g.fill();   // a sack, a sieve against it
      g.strokeStyle = P.woodD; g.lineWidth = k * 0.035; g.beginPath(); g.ellipse(cx + k * 0.26, by - k * 0.3, k * 0.12, k * 0.24, 0.2, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(80,70,50,.5)'; g.lineWidth = 1; for(let i = -2; i <= 2; i++){ g.beginPath(); g.moveTo(cx + k * (0.18 + i * 0.03), by - k * 0.48); g.lineTo(cx + k * (0.2 + i * 0.03), by - k * 0.12); g.stroke(); } }
  } else {
    if(v === 0){ g.fillStyle = lin(g, cx - k * 0.26, 0, cx + k * 0.26, 0, [[0, '#e8c878'], [0.5, '#c8a050'], [1, '#8a6a28']]); g.beginPath(); g.moveTo(cx - k * 0.26, by - k * 0.06); g.bezierCurveTo(cx - k * 0.3, by - k * 0.5, cx - k * 0.1, by - k * 0.68, cx, by - k * 0.68); g.bezierCurveTo(cx + k * 0.1, by - k * 0.68, cx + k * 0.3, by - k * 0.5, cx + k * 0.26, by - k * 0.06); g.closePath(); g.fill();   // a skep of bees
      g.strokeStyle = 'rgba(110,80,20,.5)'; g.lineWidth = Lw(k, 0.018); for(let i = 1; i < 6; i++){ const yy = by - k * 0.06 - i * k * 0.11; const hw = k * 0.27 * Math.sqrt(1 - Math.pow(i / 6.2, 2)); g.beginPath(); g.moveTo(cx - hw, yy); g.quadraticCurveTo(cx, yy + k * 0.03, cx + hw, yy); g.stroke(); }
      ell(g, cx, by - k * 0.16, k * 0.06, k * 0.05, '#3a2a10'); }
    else if(v === 1){ g.fillStyle = lin(g, cx - k * 0.18, 0, cx + k * 0.18, 0, [[0, '#9ab0a0'], [1, '#5a7066']]); rr(g, cx - k * 0.2, by - k * 0.4, k * 0.3, k * 0.34, k * 0.06); g.fill();   // a watering can, seedlings
      line(g, cx + k * 0.08, by - k * 0.3, cx + k * 0.3, by - k * 0.5, '#5a7066', k * 0.04); ell(g, cx + k * 0.31, by - k * 0.51, k * 0.04, k * 0.03, '#5a7066'); g.strokeStyle = '#5a7066'; g.lineWidth = k * 0.03; g.beginPath(); g.arc(cx - k * 0.05, by - k * 0.42, k * 0.12, Math.PI, 0); g.stroke();
      for(let i = 0; i < 3; i++){ pot(g, cx - k * 0.3 + i * k * 0.08, by - k * 0.02, k * 0.04, k * 0.08, '#a8703a', '#d09a60', '#6e4420'); ell(g, cx - k * 0.3 + i * k * 0.08, by - k * 0.14, k * 0.03, k * 0.02, '#8cc860'); } }
    else if(v === 2){ g.fillStyle = lin(g, cx - k * 0.24, 0, cx + k * 0.24, 0, [[0, '#946a42'], [1, '#48301a']]); rr(g, cx - k * 0.24, by - k * 0.62, k * 0.48, k * 0.58, k * 0.1); g.fill();   // a rain barrel, a ladle in it
      [0.18, 0.44].forEach(f=>{ g.fillStyle = '#2c2a33'; g.fillRect(cx - k * 0.245, by - k * (0.62 - f), k * 0.49, k * 0.03); }); ell(g, cx, by - k * 0.62, k * 0.24, k * 0.07, '#4f8fb8'); line(g, cx + k * 0.05, by - k * 0.62, cx + k * 0.2, by - k * 0.86, '#6e4c2c', k * 0.03); }
    else { g.fillStyle = lin(g, 0, by - k * 0.45, 0, by - k * 0.15, [[0, '#946a42'], [1, '#48301a']]); g.beginPath(); g.moveTo(cx - k * 0.35, by - k * 0.42); g.lineTo(cx - k * 0.22, by - k * 0.14); g.lineTo(cx + k * 0.2, by - k * 0.14); g.lineTo(cx + k * 0.3, by - k * 0.42); g.closePath(); g.fill();   // a barrow of flowers
      circ(g, cx + k * 0.22, by - k * 0.1, k * 0.07, '#3a2a1a'); line(g, cx - k * 0.3, by - k * 0.3, cx - k * 0.42, by - k * 0.05, '#48301a', k * 0.03);
      for(let i = 0; i < 6; i++){ const fx = cx - k * 0.22 + i * k * 0.09, fy = by - k * (0.48 + (i % 2) * 0.06); for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; circ(g, fx + Math.cos(a) * k * 0.03, fy + Math.sin(a) * k * 0.03, k * 0.026, ['#f4a9c8', '#fff4dc', '#f6d76a', '#a9c8f4'][i % 4]); } circ(g, fx, fy, k * 0.016, '#f2c043'); } }
  }
}
function propLive(g, d, x, y, w, h, k, t){
  const v = (d.n || 0) % 4, by = y + h, cx = x + w / 2;
  if(d.tribe === 'fire' && v === 3){ for(let i = 0; i < 3; i++) flame(g, cx + (i - 1) * k * 0.08, by - k * 0.55, k * 0.06, t, d.x + i); g.fillStyle = rad(g, cx, by - k * 0.7, 0, k * 0.5, [[0, 'rgba(255,170,80,.3)'], [1, 'rgba(255,170,80,0)']]); g.fillRect(cx - k * 0.5, by - k * 1.2, k, k); }
  if(d.tribe === 'grass' && v === 0){ for(let i = 0; i < 3; i++){ const a = t * (1.6 + i * 0.5) + i * 2.1, bx = cx + Math.cos(a) * k * (0.2 + i * 0.05), byy = by - k * (0.5 + 0.12 * Math.sin(a * 1.7)); ell(g, bx, byy, k * 0.025, k * 0.018, '#f2c043'); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(bx - k * 0.01, byy - k * 0.02, k * 0.015, k * 0.01, -0.5, 0, TAU); g.fill(); } }
}
/* ---------- (4.25) the castle's homes: a cottage bed, a kitchen range, a dresser of plates ---------- */
const heart = (g, cx, cy, r, c)=>{ g.fillStyle = c; g.beginPath(); g.moveTo(cx, cy + r); g.bezierCurveTo(cx - r * 1.5, cy - r * 0.15, cx - r * 0.7, cy - r * 1.15, cx, cy - r * 0.4); g.bezierCurveTo(cx + r * 0.7, cy - r * 1.15, cx + r * 1.5, cy - r * 0.15, cx, cy + r); g.fill(); };
const woodV = (g, P, x0, x1)=> lin(g, x0, 0, x1, 0, [[0, P.woodL], [0.5, P.wood], [1, P.woodD]]);
/* a plate standing on its rim: willow blue in the house's colour */
function plate(g, cx, cy, r, col){
  ell(g, cx + r * 0.08, cy + r * 0.08, r, r, 'rgba(0,0,0,.18)');
  ell(g, cx, cy, r, r, '#f6f2ea'); g.strokeStyle = col; g.lineWidth = Math.max(1, r * 0.12); g.beginPath(); g.arc(cx, cy, r * 0.8, 0, TAU); g.stroke();
  ell(g, cx, cy, r * 0.48, r * 0.48, sh(col, 0.35)); circ(g, cx - r * 0.12, cy + r * 0.05, r * 0.16, col); circ(g, cx + r * 0.16, cy - r * 0.12, r * 0.1, col);
  g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx - r * 0.45, cy - r * 0.45, r * 0.18, r * 0.08, -0.8, 0, TAU); g.fill();
}
/* a bed seen from its foot, its head against the wall: a carved headboard, two pillows, a patchwork quilt in the
   house's colours, a throw folded at its foot, a low footboard */
function drawCot(g, d, x, y, w, h, k){
  const P = PAL(d), R = rng(720 + d.x * 7 + d.y * 13 + (d.n || 0)), by = y + h, ft = by - (d.fh || 3) * k;
  shadow(g, x + w / 2, by - k * 0.05, w * 0.52, k * 0.16, 0.32);
  /* the headboard: two posts with knobs, an arched panel, a heart cut in it */
  const hb = y + k * 0.1, hm = ft + k * 0.42;
  [x + k * 0.03, x + w - k * 0.19].forEach(px=>{ g.fillStyle = woodV(g, P, px, px + k * 0.16); g.fillRect(px, hb + k * 0.1, k * 0.16, hm + k * 0.3 - hb); circ(g, px + k * 0.08, hb + k * 0.08, k * 0.1, P.wood); circ(g, px + k * 0.055, hb + k * 0.055, k * 0.04, 'rgba(255,255,255,.3)'); });
  g.fillStyle = lin(g, 0, hb, 0, hm, [[0, P.woodL], [1, P.woodD]]);
  g.beginPath(); g.moveTo(x + k * 0.19, hm); g.lineTo(x + k * 0.19, hb + k * 0.42); g.quadraticCurveTo(x + w / 2, hb - k * 0.14, x + w - k * 0.19, hb + k * 0.42); g.lineTo(x + w - k * 0.19, hm); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(50,25,10,.35)'; g.lineWidth = Lw(k, 0.02);
  g.beginPath(); g.moveTo(x + k * 0.28, hm); g.lineTo(x + k * 0.28, hb + k * 0.48); g.quadraticCurveTo(x + w / 2, hb + k * 0.02, x + w - k * 0.28, hb + k * 0.48); g.lineTo(x + w - k * 0.28, hm); g.stroke();
  heart(g, x + w / 2, hb + k * 0.44, k * 0.12, 'rgba(40,20,8,.6)'); heart(g, x + w / 2, hb + k * 0.42, k * 0.1, P.cloth);
  /* the rails, the mattress, the sheet turned down, two pillows */
  const mx0 = x + k * 0.12, mx1 = x + w - k * 0.12, my0 = hm - k * 0.08, my1 = by - k * 0.4;
  g.fillStyle = woodV(g, P, x + k * 0.06, x + k * 0.16); g.fillRect(x + k * 0.06, hm, k * 0.1, my1 - hm);
  g.fillStyle = woodV(g, P, x + w - k * 0.16, x + w - k * 0.06); g.fillRect(x + w - k * 0.16, hm, k * 0.1, my1 - hm);
  g.fillStyle = lin(g, 0, my0, 0, my0 + k * 0.6, [[0, '#fbf8f2'], [1, '#e2dacb']]); rr(g, mx0, my0, mx1 - mx0, k * 0.62, k * 0.1); g.fill();
  const pw = (mx1 - mx0 - k * 0.14) / 2;
  for(let i = 0; i < 2; i++){ const px = mx0 + k * 0.05 + i * (pw + k * 0.04), py = my0 + k * 0.04;
    g.fillStyle = 'rgba(60,40,20,.14)'; rr(g, px + 2, py + 3, pw, k * 0.34, k * 0.13); g.fill();
    g.fillStyle = lin(g, 0, py, 0, py + k * 0.34, [[0, '#ffffff'], [1, '#e6dfd2']]); rr(g, px, py, pw, k * 0.34, k * 0.13); g.fill();
    g.strokeStyle = 'rgba(150,130,100,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px + pw * 0.2, py + k * 0.17); g.quadraticCurveTo(px + pw / 2, py + k * 0.22, px + pw * 0.8, py + k * 0.17); g.stroke();
    if(i === 1){ g.fillStyle = P.clothL; g.fillRect(px + pw * 0.12, py + k * 0.27, pw * 0.76, k * 0.025); } }
  /* the quilt: patches in the house's colours, stitched, falling over the sides */
  const qx0 = mx0 - k * 0.05, qx1 = mx1 + k * 0.05, qy = my0 + k * 0.44, qb = my1 + k * 0.04;
  g.fillStyle = '#f6f1e6'; rr(g, qx0, qy, qx1 - qx0, k * 0.14, k * 0.04); g.fill();
  g.strokeStyle = P.clothL; g.lineWidth = Lw(k, 0.015); g.beginPath(); g.moveTo(qx0 + k * 0.04, qy + k * 0.1); g.lineTo(qx1 - k * 0.04, qy + k * 0.1); g.stroke();
  const py0 = qy + k * 0.13, rows = Math.max(3, Math.round((qb - py0) / (k * 0.4))), cols = 4, ph = (qb - py0) / rows, pw2 = (qx1 - qx0) / cols;
  const cs = [P.cloth, '#f6efe0', P.clothL, sh(P.cloth, -0.18), '#efd9b4'];
  for(let j = 0; j < rows; j++) for(let i = 0; i < cols; i++){
    const c = cs[(i * 3 + j * 2 + Math.floor(R() * 2)) % cs.length], X = qx0 + i * pw2, Y = py0 + j * ph;
    g.fillStyle = c; g.fillRect(X, Y, pw2 + 0.5, ph + 0.5);
    if(c === '#f6efe0' || c === '#efd9b4'){ for(let q = 0; q < 4; q++) circ(g, X + pw2 * (0.25 + (q % 2) * 0.5), Y + ph * (0.28 + Math.floor(q / 2) * 0.45), k * 0.022, P.cloth); }
    else if(c === P.cloth){ g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X + pw2 * 0.2, Y + ph / 2); g.lineTo(X + pw2 * 0.8, Y + ph / 2); g.moveTo(X + pw2 / 2, Y + ph * 0.2); g.lineTo(X + pw2 / 2, Y + ph * 0.8); g.stroke(); }
  }
  g.save(); g.strokeStyle = 'rgba(255,250,235,.6)'; g.lineWidth = Lw(k, 0.012); g.setLineDash([k * 0.04, k * 0.035]);
  for(let i = 1; i < cols; i++){ g.beginPath(); g.moveTo(qx0 + i * pw2, py0); g.lineTo(qx0 + i * pw2, qb); g.stroke(); }
  for(let j = 1; j < rows; j++){ g.beginPath(); g.moveTo(qx0, py0 + j * ph); g.lineTo(qx1, py0 + j * ph); g.stroke(); }
  g.restore();
  g.fillStyle = lin(g, qx0, 0, qx1, 0, [[0, 'rgba(30,15,5,.22)'], [0.12, 'rgba(30,15,5,0)'], [0.88, 'rgba(30,15,5,0)'], [1, 'rgba(30,15,5,.26)']]); g.fillRect(qx0, qy, qx1 - qx0, qb - qy);
  g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(qx0 + (qx1 - qx0) * 0.2, py0, (qx1 - qx0) * 0.25, qb - py0);
  /* a throw folded across its foot, fringed */
  const ty = qb - k * 0.5, th = k * 0.3;
  g.fillStyle = lin(g, 0, ty, 0, ty + th, [[0, sh(P.clothD, 0.15)], [1, P.clothD]]); rr(g, qx0 - k * 0.03, ty, qx1 - qx0 + k * 0.06, th, k * 0.05); g.fill();
  [0.3, 0.62].forEach(f=>{ g.fillStyle = P.clothL; g.fillRect(qx0 - k * 0.03, ty + th * f, qx1 - qx0 + k * 0.06, th * 0.1); });
  g.strokeStyle = P.clothD; g.lineWidth = 1; for(let i = 0; i < 6; i++){ [qx0 - k * 0.03, qx1 + k * 0.03].forEach((ex, s2)=>{ const yy = ty + th * (0.12 + i * 0.15); g.beginPath(); g.moveTo(ex, yy); g.lineTo(ex + (s2 ? 1 : -1) * k * 0.06, yy + k * 0.02); g.stroke(); }); }
  /* the footboard, lower than the head, its posts knobbed */
  const fy = by - k * 0.46;
  g.fillStyle = lin(g, 0, fy, 0, by, [[0, P.woodL], [0.4, P.wood], [1, P.woodD]]); rr(g, x + k * 0.07, fy, w - k * 0.14, k * 0.38, k * 0.04); g.fill();
  g.strokeStyle = 'rgba(50,25,10,.32)'; g.lineWidth = Lw(k, 0.016); rr(g, x + k * 0.2, fy + k * 0.08, w - k * 0.4, k * 0.22, k * 0.03); g.stroke();
  heart(g, x + w / 2, fy + k * 0.2, k * 0.06, P.cloth);
  [x + k * 0.03, x + w - k * 0.17].forEach(px=>{ g.fillStyle = woodV(g, P, px, px + k * 0.14); g.fillRect(px, fy - k * 0.1, k * 0.14, by - fy + k * 0.06); circ(g, px + k * 0.07, fy - k * 0.12, k * 0.08, P.wood); circ(g, px + k * 0.05, fy - k * 0.14, k * 0.03, 'rgba(255,255,255,.3)'); });
}
/* a cast-iron kitchen range: blue-and-white tiles on the wall behind, its flue up into the wall, a copper kettle and a
   pot on the hob, the firebox glowing, a towel over the brass rail */
function drawStove(g, d, x, y, w, h, k){
  const P = PAL(d), by = y + h, ft = by - (d.fh || 1) * k;
  const iron = (x0, x1)=> lin(g, x0, 0, x1, 0, [[0, '#4e4a56'], [0.45, '#2e2b34'], [1, '#17151b']]);
  /* the tiles */
  const tx0 = x + k * 0.04, tx1 = x + w - k * 0.04, ty0 = ft - k * 0.98, ty1 = ft - k * 0.3, n = 7, ts = (tx1 - tx0) / n;
  g.fillStyle = '#cfc8ba'; g.fillRect(tx0, ty0, tx1 - tx0, ty1 - ty0);
  for(let j = 0; ty0 + j * ts < ty1; j++) for(let i = 0; i < n; i++){ const X = tx0 + i * ts, Y = ty0 + j * ts, hh = Math.min(ts, ty1 - Y);
    g.fillStyle = (i + j) % 2 ? '#f6f3ec' : '#ece7dc'; g.fillRect(X + 0.5, Y + 0.5, ts - 1, hh - 1);
    if(hh > ts * 0.7){ g.fillStyle = '#3f6aa8'; g.beginPath(); g.moveTo(X + ts / 2, Y + ts * 0.2); g.lineTo(X + ts * 0.8, Y + ts / 2); g.lineTo(X + ts / 2, Y + ts * 0.8); g.lineTo(X + ts * 0.2, Y + ts / 2); g.closePath(); g.fill(); circ(g, X + ts / 2, Y + ts / 2, ts * 0.1, '#f6f3ec'); } }
  /* the flue */
  const fx = x + w * 0.8, fw = k * 0.17;
  g.fillStyle = iron(fx - fw / 2, fx + fw / 2); g.fillRect(fx - fw / 2, y, fw, ft - k * 0.2 - y);
  [y + k * 0.22, ft - k * 0.66].forEach(cy=>{ g.fillStyle = '#5a5662'; g.fillRect(fx - fw * 0.65, cy, fw * 1.3, k * 0.06); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(fx - fw * 0.65, cy, fw * 1.3, 1); });
  shadow(g, x + w / 2, by - k * 0.04, w * 0.5, k * 0.12, 0.3);
  /* the hob */
  const hy0 = ft - k * 0.36, hy1 = ft + k * 0.02, hc = (hy0 + hy1) / 2;
  g.fillStyle = lin(g, 0, hy0, 0, hy1, [[0, '#46424c'], [1, '#232026']]); rr(g, x + k * 0.04, hy0, w - k * 0.08, hy1 - hy0, k * 0.05); g.fill();
  g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x + k * 0.08, hy0 + 1, w - k * 0.16, Lw(k, 0.015));
  const rings = [x + w * 0.3, x + w * 0.6];
  rings.forEach(rx=>{ ell(g, rx, hc, k * 0.22, k * 0.1, '#19171d'); g.strokeStyle = '#5c5864'; g.lineWidth = Lw(k, 0.015); g.beginPath(); g.ellipse(rx, hc, k * 0.16, k * 0.07, 0, 0, TAU); g.stroke(); });
  { const kx = rings[0], ky = hc + k * 0.02;                               // the kettle
    g.fillStyle = lin(g, kx - k * 0.22, 0, kx + k * 0.22, 0, [[0, '#f2b888'], [0.4, '#c8743a'], [1, '#7a3e18']]);
    g.beginPath(); g.moveTo(kx - k * 0.21, ky); g.bezierCurveTo(kx - k * 0.27, ky - k * 0.34, kx + k * 0.27, ky - k * 0.34, kx + k * 0.21, ky); g.closePath(); g.fill();
    g.fillStyle = '#9a5428'; g.beginPath(); g.moveTo(kx - k * 0.15, ky - k * 0.06); g.quadraticCurveTo(kx - k * 0.3, ky - k * 0.1, kx - k * 0.36, ky - k * 0.28); g.lineTo(kx - k * 0.31, ky - k * 0.29); g.quadraticCurveTo(kx - k * 0.26, ky - k * 0.16, kx - k * 0.13, ky - k * 0.15); g.closePath(); g.fill();
    g.strokeStyle = '#2e2b34'; g.lineWidth = k * 0.035; g.beginPath(); g.arc(kx, ky - k * 0.24, k * 0.13, Math.PI * 1.05, -0.05 * Math.PI); g.stroke();
    circ(g, kx, ky - k * 0.27, k * 0.035, '#2e2b34'); ell(g, kx - k * 0.08, ky - k * 0.14, k * 0.04, k * 0.08, 'rgba(255,240,220,.45)'); }
  { const px = rings[1], py = hc + k * 0.02;                               // a pot, its lid
    g.fillStyle = iron(px - k * 0.2, px + k * 0.2); rr(g, px - k * 0.18, py - k * 0.24, k * 0.36, k * 0.24, k * 0.05); g.fill();
    ell(g, px, py - k * 0.24, k * 0.19, k * 0.06, '#56525e'); circ(g, px, py - k * 0.3, k * 0.03, '#c9a24a');
    [px - k * 0.23, px + k * 0.18].forEach(hx=>{ g.fillStyle = '#2e2b34'; g.fillRect(hx, py - k * 0.18, k * 0.05, k * 0.04); }); }
  /* the front */
  const fy0 = hy1, fy1 = by - k * 0.1;
  g.fillStyle = iron(x + k * 0.04, x + w - k * 0.04); g.fillRect(x + k * 0.04, fy0, w - k * 0.08, fy1 - fy0);
  g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + k * 0.04, fy0, w - k * 0.08, Lw(k, 0.02));
  const fb = { x:x + w * 0.08, y:fy0 + k * 0.16, w:w * 0.32, h:(fy1 - fy0) * 0.62 }, ov = { x:x + w * 0.46, y:fy0 + k * 0.14, w:w * 0.46, h:(fy1 - fy0) * 0.7 };
  [fb, ov].forEach(p=>{ g.fillStyle = '#211e25'; rr(g, p.x, p.y, p.w, p.h, k * 0.04); g.fill(); g.strokeStyle = '#c9a24a'; g.lineWidth = Lw(k, 0.018); rr(g, p.x + k * 0.03, p.y + k * 0.03, p.w - k * 0.06, p.h - k * 0.06, k * 0.03); g.stroke(); });
  for(let i = 0; i < 4; i++){ g.fillStyle = '#0c0a0e'; g.fillRect(fb.x + fb.w * (0.2 + i * 0.18), fb.y + fb.h * 0.3, fb.w * 0.08, fb.h * 0.45); }
  line(g, ov.x + ov.w * 0.2, ov.y + k * 0.1, ov.x + ov.w * 0.8, ov.y + k * 0.1, '#e0c070', k * 0.03);
  circ(g, ov.x + ov.w / 2, ov.y + ov.h * 0.56, k * 0.075, '#f4efe2'); g.strokeStyle = '#c9a24a'; g.lineWidth = Lw(k, 0.012); g.beginPath(); g.arc(ov.x + ov.w / 2, ov.y + ov.h * 0.56, k * 0.075, 0, TAU); g.stroke();
  line(g, ov.x + ov.w / 2, ov.y + ov.h * 0.56, ov.x + ov.w / 2 + k * 0.04, ov.y + ov.h * 0.56 - k * 0.045, '#c0392b', k * 0.014);
  line(g, x + k * 0.06, fy0 + k * 0.07, x + w - k * 0.06, fy0 + k * 0.07, '#e8c878', k * 0.03);           // the rail
  { const tx = x + w * 0.5, tw = k * 0.32, tt = fy0 + k * 0.05, tl = k * 0.42;                          // a towel over it, checked
    g.fillStyle = '#f4efe2'; rr(g, tx, tt, tw, tl, k * 0.03); g.fill();
    g.fillStyle = P.cloth; for(let i = 0; i < 4; i++) g.fillRect(tx + tw * (0.1 + i * 0.24), tt, tw * 0.1, tl); for(let j = 0; j < 4; j++) g.fillRect(tx, tt + tl * (0.12 + j * 0.24), tw, tl * 0.08);
    g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(tx, tt, tw, k * 0.04); }
  g.fillStyle = '#121014'; g.fillRect(x + k * 0.02, fy1 - k * 0.05, w - k * 0.04, k * 0.07);
  [x + k * 0.1, x + w - k * 0.2].forEach(lx=>{ g.fillStyle = '#121014'; g.fillRect(lx, fy1, k * 0.1, by - fy1 - k * 0.02); });
}
function stoveLive(g, d, x, y, w, h, k, t){
  const by = y + h, ft = by - (d.fh || 1) * k, fy0 = ft + k * 0.02, fy1 = by - k * 0.1;
  const fb = { x:x + w * 0.08, y:fy0 + k * 0.16, w:w * 0.32, h:(fy1 - fy0) * 0.62 };
  const f = 0.65 + 0.2 * Math.sin(t * 7 + d.x) + 0.15 * Math.sin(t * 17 + d.y);
  for(let i = 0; i < 4; i++){ g.fillStyle = `rgba(255,${(140 + 70 * f) | 0},60,${(0.5 + 0.45 * f).toFixed(3)})`; g.fillRect(fb.x + fb.w * (0.2 + i * 0.18), fb.y + fb.h * (0.3 + 0.18 * (1 - f)), fb.w * 0.08, fb.h * (0.45 - 0.18 * (1 - f))); }
  g.fillStyle = rad(g, fb.x + fb.w / 2, by, 0, k * 0.6, [[0, `rgba(255,150,60,${(0.2 * f).toFixed(3)})`], [1, 'rgba(255,150,60,0)']]); g.fillRect(fb.x + fb.w / 2 - k * 0.6, by - k * 0.6, k * 1.2, k * 0.8);
  const hc = (ft - k * 0.36 + ft + k * 0.02) / 2;
  steam(g, x + w * 0.3 - k * 0.36, hc - k * 0.32, k, t);                  // from the kettle's spout
}
/* a dresser: its rack of willow plates and hanging cups above, a jug and the day's bread on its top, drawers and
   cupboards below */
function drawDresser(g, d, x, y, w, h, k){
  const P = PAL(d), by = y + h, ft = by - (d.fh || 1) * k;
  shadow(g, x + w / 2, by - k * 0.04, w * 0.5, k * 0.12, 0.28);
  const rx0 = x + k * 0.1, rx1 = x + w - k * 0.1, ry0 = y + k * 0.16, ry1 = ft - k * 0.24;
  g.fillStyle = sh(P.woodD, -0.04); g.fillRect(rx0, ry0, rx1 - rx0, ry1 - ry0);
  g.fillStyle = 'rgba(0,0,0,.2)'; for(let i = 1; i < 5; i++) g.fillRect(rx0 + (rx1 - rx0) * i / 5, ry0, 1, ry1 - ry0);
  g.fillStyle = woodV(g, P, rx0 - k * 0.07, rx0 + k * 0.03); g.fillRect(rx0 - k * 0.07, ry0, k * 0.1, ry1 - ry0);
  g.fillStyle = woodV(g, P, rx1 - k * 0.03, rx1 + k * 0.07); g.fillRect(rx1 - k * 0.03, ry0, k * 0.1, ry1 - ry0);
  g.fillStyle = lin(g, 0, ry0 - k * 0.12, 0, ry0 + k * 0.06, [[0, P.woodL], [1, P.woodD]]); rr(g, x + k * 0.01, ry0 - k * 0.12, w - k * 0.02, k * 0.18, k * 0.03); g.fill();
  g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x + k * 0.03, ry0 - k * 0.12, w - k * 0.06, Lw(k, 0.02));
  const s1 = ry0 + (ry1 - ry0) * 0.5;
  [s1, ry1].forEach(sy=>{ g.fillStyle = woodV(g, P, rx0, rx1); g.fillRect(rx0, sy - k * 0.05, rx1 - rx0, k * 0.06); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(rx0, sy + k * 0.01, rx1 - rx0, k * 0.02); });
  const pr = Math.min(k * 0.17, (s1 - ry0) * 0.42);
  for(let i = 0; i < 3; i++) plate(g, rx0 + (rx1 - rx0) * (0.18 + i * 0.32), s1 - k * 0.06 - pr, pr, i === 1 ? P.cloth : '#3f6aa8');
  for(let i = 0; i < 4; i++){ const cx = rx0 + (rx1 - rx0) * (0.14 + i * 0.24), cy = s1 + k * 0.08;    // cups on hooks
    line(g, cx, s1 + k * 0.01, cx, cy, '#c9a24a', Lw(k, 0.012)); g.fillStyle = i % 2 ? P.cloth : '#f4efe2'; rr(g, cx - k * 0.06, cy, k * 0.12, k * 0.11, k * 0.025); g.fill();
    g.strokeStyle = g.fillStyle; g.lineWidth = Lw(k, 0.015); g.beginPath(); g.arc(cx + k * 0.07, cy + k * 0.055, k * 0.03, -1.3, 1.3); g.stroke(); }
  for(let i = 0; i < 2; i++){ const bx = rx0 + (rx1 - rx0) * (0.2 + i * 0.6); pot(g, bx, ry1 - k * 0.05, k * 0.08, k * 0.2, i ? '#f4efe2' : P.pot, i ? '#ffffff' : P.potL, i ? '#cfc8ba' : P.potD, { band:i ? P.cloth : null }); }
  /* the top: a jug, a loaf on its board, a rolling pin */
  const wt = ft - k * 0.24;
  g.fillStyle = lin(g, 0, wt, 0, wt + k * 0.14, [[0, P.woodL], [1, P.wood]]); g.fillRect(x + k * 0.02, wt, w - k * 0.04, k * 0.14);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + k * 0.02, wt + k * 0.12, w - k * 0.04, k * 0.02);
  pot(g, x + w * 0.2, wt + k * 0.06, k * 0.11, k * 0.26, '#f4efe2', '#ffffff', '#cfc8ba', { band:P.cloth });
  g.fillStyle = P.woodL; rr(g, x + w * 0.42, wt - k * 0.02, w * 0.3, k * 0.08, k * 0.02); g.fill();
  g.fillStyle = lin(g, 0, wt - k * 0.24, 0, wt, [[0, '#e8b46a'], [1, '#a8662a']]); g.beginPath(); g.ellipse(x + w * 0.57, wt - k * 0.06, w * 0.13, k * 0.15, 0, Math.PI, 0); g.fill();
  g.strokeStyle = 'rgba(255,240,200,.55)'; g.lineWidth = Lw(k, 0.012); for(let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(x + w * (0.5 + i * 0.05), wt - k * 0.17); g.lineTo(x + w * (0.53 + i * 0.05), wt - k * 0.08); g.stroke(); }
  line(g, x + w * 0.76, wt - k * 0.03, x + w * 0.94, wt - k * 0.05, P.woodL, k * 0.055); line(g, x + w * 0.73, wt - k * 0.025, x + w * 0.97, wt - k * 0.055, P.woodD, k * 0.02);
  /* below: two drawers, two doors */
  const cy0 = wt + k * 0.14, cy1 = by - k * 0.08;
  g.fillStyle = woodV(g, P, x + k * 0.05, x + w - k * 0.05); g.fillRect(x + k * 0.05, cy0, w - k * 0.1, cy1 - cy0);
  const dh = (cy1 - cy0) * 0.28;
  for(let i = 0; i < 2; i++){ const dx = x + k * 0.1 + i * (w - k * 0.2) / 2, dw = (w - k * 0.2) / 2 - k * 0.04;
    g.strokeStyle = 'rgba(40,20,8,.45)'; g.lineWidth = Lw(k, 0.016); g.strokeRect(dx, cy0 + k * 0.04, dw, dh - k * 0.04); circ(g, dx + dw / 2, cy0 + dh / 2 + k * 0.02, k * 0.03, '#e0c070');
    g.strokeRect(dx, cy0 + dh + k * 0.04, dw, cy1 - cy0 - dh - k * 0.1); g.strokeStyle = 'rgba(255,230,190,.18)'; g.strokeRect(dx + k * 0.06, cy0 + dh + k * 0.1, dw - k * 0.12, cy1 - cy0 - dh - k * 0.22);
    circ(g, i ? dx + k * 0.08 : dx + dw - k * 0.08, cy0 + dh + (cy1 - cy0 - dh) * 0.45, k * 0.028, '#e0c070'); }
  g.fillStyle = P.woodD; g.fillRect(x + k * 0.05, cy1, w - k * 0.1, k * 0.04); [x + k * 0.06, x + w - k * 0.14].forEach(lx=> g.fillRect(lx, cy1, k * 0.08, by - cy1 - k * 0.01));
}
/* odds and ends standing about a castle home */
function propCastle(g, d, x, y, w, h, k, P, by, cx){
  const v = (d.n || 0) % 4;
  if(v === 0){ basket(g, cx, by - k * 0.04, k * 0.3, k * 0.3, P);                                     // the washing, folded
    for(let i = 0; i < 3; i++){ g.fillStyle = [P.cloth, '#f4efe2', P.clothL][i]; rr(g, cx - k * 0.24 + i * k * 0.03, by - k * (0.42 + i * 0.07), k * 0.44, k * 0.08, k * 0.03); g.fill(); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(cx - k * 0.22 + i * k * 0.03, by - k * (0.35 + i * 0.07), k * 0.4, 1); }
    return; }
  if(v === 1){                                                                                            // a broom against the wall, a dustpan
    line(g, cx - k * 0.04, by - k * 0.26, cx + k * 0.14, by - k * 1.36, P.woodD, k * 0.045);
    g.fillStyle = lin(g, cx - k * 0.22, 0, cx + k * 0.12, 0, [[0, '#e6c886'], [1, '#a8823e']]); g.beginPath(); g.moveTo(cx - k * 0.24, by - k * 0.02); g.lineTo(cx + k * 0.12, by - k * 0.02); g.lineTo(cx + k * 0.03, by - k * 0.32); g.lineTo(cx - k * 0.11, by - k * 0.32); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(110,80,30,.5)'; g.lineWidth = 1; for(let i = 0; i < 6; i++){ g.beginPath(); g.moveTo(cx - k * (0.1 - i * 0.025), by - k * 0.3); g.lineTo(cx - k * (0.22 - i * 0.06), by - k * 0.03); g.stroke(); }
    g.fillStyle = P.cloth; g.fillRect(cx - k * 0.11, by - k * 0.34, k * 0.15, k * 0.05);
    g.fillStyle = lin(g, 0, by - k * 0.2, 0, by, [[0, '#9a98a4'], [1, '#5a5866']]); g.beginPath(); g.moveTo(cx + k * 0.16, by - k * 0.02); g.lineTo(cx + k * 0.42, by - k * 0.02); g.lineTo(cx + k * 0.4, by - k * 0.2); g.lineTo(cx + k * 0.18, by - k * 0.2); g.closePath(); g.fill();
    line(g, cx + k * 0.29, by - k * 0.2, cx + k * 0.29, by - k * 0.38, '#5a5866', k * 0.035); return; }
  if(v === 2){                                                                                            // sacks of flour, a scoop
    [[-0.13, 0.74, 0], [0.19, 0.6, 1]].forEach(([u, hh, i])=>{ const sx = cx + u * k, top = by - k * hh, r = k * (i ? 0.2 : 0.25);
      shadow(g, sx + r * 0.2, by - k * 0.03, r * 1.2, k * 0.07, 0.25);
      g.fillStyle = lin(g, sx - r, 0, sx + r, 0, [[0, '#f6efdc'], [0.55, '#ddd2b8'], [1, '#ad9f80']]);
      g.beginPath(); g.moveTo(sx - r, by - k * 0.03); g.quadraticCurveTo(sx - r * 1.35, top + k * 0.28, sx - r * 0.42, top + k * 0.07); g.lineTo(sx + r * 0.42, top + k * 0.07); g.quadraticCurveTo(sx + r * 1.35, top + k * 0.28, sx + r, by - k * 0.03); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,100,70,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(sx - r * 0.5, by - k * 0.2); g.quadraticCurveTo(sx, by - k * 0.14, sx + r * 0.6, by - k * 0.24); g.stroke();
      g.fillStyle = '#e8dfc8'; g.beginPath(); g.moveTo(sx - r * 0.36, top + k * 0.09); g.lineTo(sx - r * 0.55, top - k * 0.05); g.quadraticCurveTo(sx, top + k * 0.02, sx + r * 0.55, top - k * 0.05); g.lineTo(sx + r * 0.36, top + k * 0.09); g.closePath(); g.fill();
      g.fillStyle = P.cloth; g.fillRect(sx - r * 0.42, top + k * 0.05, r * 0.84, k * 0.045);
      if(!i){ g.strokeStyle = P.cloth; g.lineWidth = Lw(k, 0.02); g.beginPath(); g.arc(sx, by - k * 0.36, k * 0.09, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(sx - k * 0.05, by - k * 0.37, k * 0.1, k * 0.02); } });
    ell(g, cx + k * 0.38, by - k * 0.05, k * 0.08, k * 0.04, '#f8f4ea'); g.fillStyle = '#b8b8c0'; g.beginPath(); g.ellipse(cx + k * 0.3, by - k * 0.06, k * 0.07, k * 0.045, 0.2, 0, TAU); g.fill(); line(g, cx + k * 0.24, by - k * 0.06, cx + k * 0.12, by - k * 0.1, P.woodD, k * 0.025);
    return; }
  /* an umbrella stand of brass: an umbrella and a walking stick in it */
  line(g, cx + k * 0.06, by - k * 0.3, cx + k * 0.16, by - k * 1.05, '#6a4024', k * 0.035); g.strokeStyle = '#6a4024'; g.lineWidth = k * 0.035; g.beginPath(); g.arc(cx + k * 0.22, by - k * 1.05, k * 0.06, Math.PI, 0); g.stroke();
  g.fillStyle = lin(g, cx - k * 0.1, 0, cx + k * 0.1, 0, [[0, P.clothL], [1, P.clothD]]); g.beginPath(); g.moveTo(cx - k * 0.04, by - k * 0.3); g.quadraticCurveTo(cx - k * 0.16, by - k * 0.8, cx - k * 0.08, by - k * 1.0); g.lineTo(cx + k * 0.0, by - k * 1.0); g.quadraticCurveTo(cx + k * 0.06, by - k * 0.7, cx + k * 0.04, by - k * 0.3); g.closePath(); g.fill();
  line(g, cx - k * 0.04, by - k * 1.0, cx - k * 0.06, by - k * 1.14, '#2c2a33', k * 0.025);
  g.fillStyle = lin(g, cx - k * 0.17, 0, cx + k * 0.17, 0, [[0, '#f0d890'], [0.5, '#c9a24a'], [1, '#7a5a18']]); rr(g, cx - k * 0.16, by - k * 0.42, k * 0.32, k * 0.4, k * 0.04); g.fill();
  ell(g, cx, by - k * 0.42, k * 0.16, k * 0.05, '#5a4210'); [0.12, 0.3].forEach(f=>{ g.fillStyle = 'rgba(255,240,190,.5)'; g.fillRect(cx - k * 0.16, by - k * (0.42 - f), k * 0.32, k * 0.02); });
}
/* a thing that never moves, drawn once at a size and kept (each room's own: its key in the picture's name) */
function still(draw, pad){
  return (g, d, x, y, w, h, k)=>{
    const kc = Math.max(4, Math.min(PIC_MAX_S, Math.round(k))), M = pad == null ? 0.4 : pad;
    const cv = pic(`hut:${d.room}:${d.kind}:${d.x.toFixed(2)},${d.y.toFixed(2)}:${d.n || 0}@${kc}`, (d.w + 2 * M) * kc, (d.h + 2 * M) * kc, g2=> draw(g2, d, M * kc, M * kc, d.w * kc, d.h * kc, kc));
    const s = k / kc;
    g.drawImage(cv, x - M * k, y - M * k, cv.width * s, cv.height * s);
  };
}
const KEEP = { hbed:still(drawBed), htable:still(drawTable), hseat:still(drawSeat, 0.3), hshelf:still(drawShelf), hjars:still(drawJars, 0.3), hcook:still(drawCook), hloom:still(drawLoom),
  hcraft:still(drawCraft), hstore:still(drawStore), helder:still(drawElder), hcrib:still(drawCrib, 0.3), htotem:still(drawTotem), hthrone:still(drawThrone, 0.5), hshrine:still(drawShrine),
  hlong:still(drawLong), hplant:still(drawPlant, 0.5), hdrum:still(drawDrum, 0.3), hbasin:still(drawBasin, 0.3), hprop:still(drawProp, 0.4),
  hcot:still(drawCot, 0.3), hstove:still(drawStove, 0.3), hdresser:still(drawDresser, 0.3) };
const LIVE = { hcook:cookLive, hcraft:craftLive, hshrine:shrineLive, hbasin:basinLive, hprop:propLive, hstove:stoveLive };
function furn(g, d, x, y, w, h, k, t){
  if(d.kind === 'hlight'){ lightLive(g, d, x, y, w, h, k, t); return true; }
  const P = KEEP[d.kind];
  if(!P) return false;
  P(g, d, x, y, w, h, k);
  const Lv = LIVE[d.kind];
  if(Lv) Lv(g, d, x, y, w, h, k, t);
  return true;
}
return { paint, furn, emblem };
})();
/* tall things stand over whoever walks behind them (21-castle.js: the layer over everyone) */
['hshelf', 'hloom', 'htotem', 'hthrone', 'hshrine', 'hstore', 'hcook', 'hplant', 'helder'].forEach(k=> CA_OVER_KINDS.add(k));

/* ---------- Lucesco, in a house: what he notices (and a find still hidden in it) ---------- */
const HUT_LION_LINES = {
  water:[`<b>"The whole house smells of the river. I like it."</b>`, `<b>"See how the reeds are tied? Every knot the same. Patient people."</b>`],
  fire:[`<b>"Warm in here. Warmer than outside. That is the Fire tribe's way: the heat is on the inside."</b>`, `<b>"Everything here has been mended at least twice. And painted afterwards. Proudly."</b>`],
  earth:[`<b>"Cool, and quiet, and very old. These walls have kept a great many secrets."</b>`, `<b>"Listen. You can hear the hill breathing. …Or is that the cook?"</b>`],
  grass:[`<b>"Everything in here is growing. Even the chairs."</b>`, `<b>"It smells of honey and rain. I could nap here for a week."</b>`],
};
function hutLionTalk(key){
  const H = hutParse(key);
  if(!H) return false;
  const lines = (H.n === 'lodge' ? [HUT_LION.lodge] : []).concat(HUT_LION_LINES[H.k] || []);
  const hidden = typeof prizeTaken === 'function' && !prizeTaken(key, 0);
  const line = hidden && caTurn('hutHide', [0, 1, 1]) === 0 ? `<i>Lucesco sniffs at the corners.</i> <b>"Something is tucked away in here. Something shiny. Look where nobody looks."</b>`
             : caTurn('hutLion_' + H.k, lines);
  caLines([['lion', line]]);
  return true;
}

/* ============================================================
   THE CASTLE'S HOMES (4.25)
   The designer: "Could more of the castles homes be visitable as well, and could we have hidden tickets in each room
   please?" Every house along the castle's two streets (not the tavern nor the record store, which were open already)
   can be gone into: papered walls the colour of its paint outside, oak boards, cottage windows, pictures, a rack of
   plates, a sampler, a cadet's shield; the castle's own furniture (24-room-art.js: wardrobes, hearths, bookcases,
   harps…) with a cottage bed under a patchwork quilt, a kitchen range and a dresser of willow plates drawn in the
   house's colours (HUT_ART); six families' rooms (HOME_RECIPES: a family, a scholar, a musician, a baker, a cadet, a
   parlour for tea), every second house of a kind laid out the other way round; two of the townsfolk at home, things
   to look at, odds and ends on the floor, and a find hidden in each, as in the huts. Entered at its door from the
   street (hutThings, asked by caThings for the grounds), left by it.
   ============================================================ */
const HOME_PAL = {
  red:   { wall:'#f2dcd2', motif:'rgba(190,80,70,.22)', kind:'flowers', cloth:'#b8403a', clothL:'#f09a8a', clothD:'#7a2420' },
  blue:  { wall:'#dce6f2', motif:'rgba(70,100,170,.18)', kind:'stripes', cloth:'#3f6aa8', clothL:'#9ab8e0', clothD:'#24406a' },
  green: { wall:'#e2ecd8', motif:'rgba(80,130,70,.22)', kind:'flowers', cloth:'#4a8a4a', clothL:'#a8d098', clothD:'#2a5a2a' },
  plum:  { wall:'#eadcf0', motif:'rgba(130,80,160,.2)', kind:'stripes', cloth:'#7a4a9a', clothL:'#c8a8e0', clothD:'#4a2a62' },
  ochre: { wall:'#f2e6c8', motif:'rgba(180,130,40,.22)', kind:'flowers', cloth:'#c8902a', clothL:'#f0d080', clothD:'#8a5a14' },
};
function homePal(scheme){
  const c = HOME_PAL[scheme] || HOME_PAL.red;
  return Object.assign({ floor:'#b57e4a', floorL:'#d0a070', floorD:'#7e5230', rail:'#6a4024', wainsL:'#8d5a34', wainsD:'#4a2a16', glow:'rgba(255,205,130,.22)', tie:'#c9a24a',
    wood:'#8a5a34', woodL:'#b78456', woodD:'#55331a', pot:'#a8703a', potL:'#d09a60', potD:'#6e4420', accent:'#f4efe2', accent2:'#c9a24a' }, c);
}
/* what they say at home (by the line's key: who says it is the recipe's) */
const HOME_LINES = {
  townChoux:[`<b>"Oh! A visitor! Sit anywhere — except the blue chair. That's Grandma's. She'll know."</b>`, `<b>"I'm practising choux buns at home. Don't look in the oven. It's… a work in progress."</b>`],
  townBunny:[`<b>"Welcome to our burrow! Well, house. We call it the burrow. Habit."</b>`, `<b>"Seventeen carrots in the larder. I counted. Twice. Once more, to be sure."</b>`],
  townBird:[`<b>"Hoo. Excuse the books. And the other books. And those. I'm studying."</b>`, `<b>"The view from the top window is the best in the castle. You can see three of the tribes' smoke from up there."</b>`],
  townDuck:[`<b>"Cadet quarters! …It's my bedroom. But it's VERY tidy. Inspect it if you like."</b>`, `<b>"I polish my helmet every night. One day it'll be a real knight's helmet."</b>`],
  townCream:[`<b>"Mind the cat — she likes to sleep across the doorway, so everyone has to step over her and say hello."</b>`, `<b>"Tea? It's always time for tea in this house."</b>`],
  townMelody:[`<b>"♪ Welcome, welcome, come in from the cold ♪ … sorry, I sing everything."</b>`, `<b>"That harp was my great-grandmother's. It still remembers every song she played on it."</b>`],
  bunnyKid:[`<b>"Mum says no carrots before dinner. …Have you got a carrot? Asking for a friend."</b>`, `<b>"The cat sleeps by the fire all day. She's the boss of this house. Don't tell Mum."</b>`],
  chouxVisit:[`<b>"I only came to borrow one book. That was three hours ago. I'm still choosing."</b>`, `<b>"Shh! He's reading. If you're very quiet you can hear him turning the pages."</b>`],
  creamVisit:[`<b>"She plays, I sing along. Badly. She says it's lovely. She's very kind."</b>`, `<b>"Every evening there's a little concert in here. The best seat is the bed."</b>`],
  bunnyTaster:[`<b>"I'm the taster. It's the most important job in the house. Somebody has to do it."</b>`, `<b>"Seventeen choux buns came out of that oven this morning. There are four left. I can't think where they went."</b>`],
  duckTwin:[`<b>"He polishes his helmet at night, I polish mine in the morning. We take turns being the knight."</b>`, `<b>"Left, right, left, right! Mind the rug — that's the parade ground."</b>`],
  melodyVisit:[`<b>"♪ Tea for two, and cake for three ♪ … the third slice is for you!"</b>`, `<b>"I come for the tea and stay for the cat. Or is it the other way round?"</b>`],
};
/* Six homes, each a family's one room: [kind, x, y, w, h, dx, dy, dw, dh, extra] — its squares, and its picture's rect
   from them (as the castle's rooms place theirs); the castle's own furniture (24-room-art.js), or a cottage bed, a
   kitchen range, a dresser, odds and ends (HUT_ART, in the house's colours: HOME_HUT). What hangs on the back wall
   stands clear of what is tall before it. Every second house of a kind is laid out the other way round (homeVariant),
   its find somewhere else. A thing with `look` can be looked at. */
const HOME_HUT = new Set(['hcot', 'hstove', 'hdresser', 'hprop']);
const COT = [-0.08, -0.85, 2.16, 3.85];
const HOME_RECIPES = [
  { name:'family', wall:{ 3:'lamp', 7:'deco:3', 8:'window', 10:'deco:0' },
    put:[['wardrobe', 1, 2, 2, 2, -0.1, -1.6, 2.2, 3.7], ['hearth', 4, 2, 3, 1, -0.2, -1.6, 3.4, 2.8, { look:`The fire is banked low and the kettle hook is swung aside. The cat has the warmest spot, as usual.` }], ['chest', 7, 2, 1, 1, -0.1, -0.5, 1.2, 1.45],
         ['hprop', 8, 2, 1, 1, -0.12, -1.2, 1.24, 2.22, { n:0 }], ['hcot', 9, 2, 2, 3, ...COT], ['table', 4, 5, 1, 1, -0.3, -0.55, 1.6, 1.5], ['stool', 3, 5, 1, 1, 0.15, 0.1, 0.7, 0.8], ['stool', 5, 5, 1, 1, 0.15, 0.1, 0.7, 0.8],
         ['toyChest', 10, 6, 1, 1, -0.15, -0.65, 1.3, 1.6, { look:`A toy chest, its lid propped open with a wooden sword. Inside: three dolls, a drum, and a great many marbles.` }], ['plantPot', 1, 7, 1, 1, -0.25, -1.55, 1.5, 2.5], ['cat', 6, 3, 1, 1, -0.05, -0.4, 1.1, 1.3]],
    floor:[{ kind:'rug', x:2.4, y:4.3, w:4.4, h:2.4 }], prizes:[[3, 2], [10, 7], [1, 4]], folk:[[7, 5, 'townBunny', 'townBunny'], [2, 4, 'townBunny', 'bunnyKid']] },
  { name:'scholar', wall:{ 3:'lamp', 4:'deco:0', 5:'window', 6:'deco:1' },
    put:[['bookcase', 1, 2, 2, 2, -0.05, -1.2, 2.1, 3.2, { look:`Books on the stars, on plants, on the history of the kingdom — and one called <i>How to Talk to Owls</i>, very well read.` }], ['desk', 4, 2, 2, 1, -0.1, -0.8, 2.2, 1.75], ['clock', 7, 2, 1, 1, -0.05, -1.75, 1.1, 2.7],
         ['canopyBed', 8, 2, 3, 3, -0.1, -1.4, 3.2, 4.6, { blue:true }], ['armchair', 2, 5, 1, 1, -0.1, -0.55, 1.2, 1.5], ['teaTable', 3, 5, 1, 1, -0.25, -0.45, 1.5, 1.4],
         ['armchair', 4, 5, 1, 1, -0.1, -0.55, 1.2, 1.5], ['globe', 10, 6, 1, 1, -0.1, -0.95, 1.2, 1.9, { look:`A globe of the kingdom. Someone has drawn a tiny crown on the castle, and a smiling sun over the jungle.` }], ['plantPot', 1, 7, 1, 1, -0.25, -1.55, 1.5, 2.5, { pot:'#e8e4dc' }]],
    floor:[{ kind:'rug', x:1.6, y:4.4, w:4.8, h:2.2 }], prizes:[[7, 3], [3, 2], [10, 7]], folk:[[5, 3, 'townBird', 'townBird'], [8, 6, 'townChoux', 'chouxVisit']] },
  { name:'music', wall:{ 2:'deco:0', 3:'window', 5:'lamp', 6:'deco:1', 8:'window' },
    put:[['harp', 1, 2, 1, 1, -0.15, -1.4, 1.3, 2.35, { look:`The old harp. Brush a string and it hums for a long time afterwards, as if it is remembering.` }], ['settee', 3, 2, 2, 1, -0.1, -0.5, 2.2, 1.45], ['sideboard', 6, 2, 3, 1, -0.05, -0.75, 3.1, 1.7, { look:`Sheet music in tidy piles, a tuning fork, and a pot of tea gone cold beside them.` }],
         ['vanity', 9, 2, 2, 1, -0.1, -1.1, 2.2, 2.05], ['canopyBed', 8, 4, 3, 3, -0.1, -1.4, 3.2, 4.6], ['armchair', 1, 5, 1, 1, -0.1, -0.55, 1.2, 1.5],
         ['teaTable', 2, 5, 1, 1, -0.25, -0.45, 1.5, 1.4], ['rockingHorse', 4, 6, 1, 1, -0.2, -0.9, 1.4, 1.85], ['plantPot', 1, 7, 1, 1, -0.25, -1.55, 1.5, 2.5]],
    floor:[{ kind:'rug', x:2.4, y:3.4, w:4.2, h:2 }], prizes:[[10, 7], [5, 2], [1, 6]], folk:[[4, 4, 'townMelody', 'townMelody'], [6, 5, 'townCream', 'creamVisit']] },
  { name:'baker', wall:{ 3:'lamp', 6:'window', 7:'deco:0', 8:'window', 10:'deco:3' },
    put:[['hstove', 1, 2, 2, 1, -0.05, -1.55, 2.1, 2.5, { look:`The range is hot. Something in the oven smells of butter and sugar — the choux buns, rising, you hope.` }], ['firewood', 3, 2, 1, 1, -0.1, -0.5, 1.2, 1.45],
         ['hdresser', 4, 2, 2, 1, -0.05, -1.75, 2.1, 2.75, { look:`Willow-pattern plates, a row of cups on their hooks, a cottage loaf still warm, and a rolling pin white with flour.` }], ['hprop', 7, 2, 1, 1, -0.12, -1.2, 1.24, 2.22, { n:2 }],
         ['hcot', 9, 2, 2, 3, ...COT], ['table', 5, 5, 1, 1, -0.3, -0.55, 1.6, 1.5], ['stool', 4, 5, 1, 1, 0.15, 0.1, 0.7, 0.8], ['stool', 6, 5, 1, 1, 0.15, 0.1, 0.7, 0.8],
         ['hprop', 1, 7, 1, 1, -0.12, -1.2, 1.24, 2.22, { n:1 }], ['plantPot', 10, 6, 1, 1, -0.25, -1.55, 1.5, 2.5]],
    floor:[{ kind:'rug', x:3.4, y:4.3, w:4.4, h:2.4 }], prizes:[[8, 2], [6, 2], [10, 7]], folk:[[7, 4, 'townChoux', 'townChoux'], [2, 5, 'townBunny', 'bunnyTaster']] },
  { name:'knight', wall:{ 3:'deco:2', 5:'window', 6:'lamp', 7:'deco:0', 8:'window' },
    put:[['armour', 1, 2, 1, 1, -0.15, -1.5, 1.3, 2.45, { look:`A little suit of armour, polished until you can see your face in it. A note pinned to it says: DO NOT TOUCH. (Signed, the Cadet.)` }], ['weaponRack', 2, 2, 1, 1, -0.15, -1.3, 1.3, 2.2, { look:`Two wooden practice swords and a spear with a cork on its point, all well worn.` }],
         ['chest', 3, 2, 1, 1, -0.1, -0.5, 1.2, 1.45], ['desk', 5, 2, 2, 1, -0.1, -0.8, 2.2, 1.75], ['hcot', 9, 2, 2, 3, ...COT], ['chest', 10, 5, 1, 1, -0.1, -0.5, 1.2, 1.45],
         ['table', 2, 5, 1, 1, -0.3, -0.55, 1.6, 1.5], ['stool', 1, 5, 1, 1, 0.15, 0.1, 0.7, 0.8], ['stool', 3, 5, 1, 1, 0.15, 0.1, 0.7, 0.8],
         ['hprop', 7, 7, 1, 1, -0.12, -1.2, 1.24, 2.22, { n:3 }], ['plantPot', 1, 7, 1, 1, -0.25, -1.55, 1.5, 2.5]],
    floor:[{ kind:'rug', x:4.4, y:4.4, w:3.2, h:2.2 }], prizes:[[4, 2], [1, 6], [9, 5]], folk:[[6, 4, 'townDuck', 'townDuck'], [3, 6, 'townDuck', 'duckTwin']] },
  { name:'parlour', wall:{ 2:'window', 3:'deco:0', 4:'lamp', 8:'lamp', 9:'window' },
    put:[['clock', 1, 2, 1, 1, -0.05, -1.75, 1.1, 2.7, { look:`The clock ticks, slow and loud. It stopped once, years ago, and the whole house noticed.` }], ['settee', 2, 2, 2, 1, -0.1, -0.5, 2.2, 1.45], ['vase', 4, 2, 1, 1, -0.1, -0.9, 1.2, 1.85],
         ['hearth', 5, 2, 3, 1, -0.2, -1.6, 3.4, 2.8, { look:`A cosy fire. Two chairs are drawn up to it, and a pot of tea sits warming on the hearthstone.` }], ['vase', 8, 2, 1, 1, -0.1, -0.9, 1.2, 1.85], ['palm', 10, 2, 1, 1, -0.35, -1.7, 1.7, 2.65],
         ['armchair', 5, 4, 1, 1, -0.1, -0.55, 1.2, 1.5], ['teaTable', 6, 4, 1, 1, -0.25, -0.45, 1.5, 1.4], ['armchair', 7, 4, 1, 1, -0.1, -0.55, 1.2, 1.5],
         ['cat', 7, 7, 1, 1, -0.05, -0.4, 1.1, 1.3], ['hprop', 4, 7, 1, 1, -0.12, -1.2, 1.24, 2.22, { n:3 }], ['plantPot', 1, 7, 1, 1, -0.25, -1.55, 1.5, 2.5]],
    floor:[{ kind:'rug', x:4.3, y:3.3, w:4.4, h:2.6 }], prizes:[[9, 2], [1, 3], [10, 7]], folk:[[3, 5, 'townCream', 'townCream'], [9, 5, 'townMelody', 'melodyVisit']] },
];
function homeKey(bi){ return 'r6_home_' + bi; }
function homeParse(key){ const r = /^r6_home_(\d+)$/.exec(key || ''); return r ? { bi:+r[1] } : null; }
let _homeList = null;
/* the houses along the streets: every building but the shops (they have signs) */
function homeList(){
  if(_homeList) return _homeList;
  try { _homeList = caGrounds().tags.buildings.map((b, bi)=> ({ b, bi })).filter(({ b })=> !b.sign && b.door && b.door.length); }
  catch(e){ _homeList = []; }
  return _homeList;
}
function homeTitle(bi){
  const list = homeList(), it = list.find(h=> h.bi === bi);
  if(!it) return 'A house';
  const b = it.b, row = b.y < 50 ? 'Lantern Row' : 'Gate Row', same = list.filter(h=> (h.b.y < 50) === (b.y < 50)).sort((p, q)=> p.b.x - q.b.x);
  return `No. ${same.indexOf(it) + 1}, ${row}`;
}
/* which of the six a house is, which way round, and where its find is */
function homeVariant(bi){
  const i = Math.max(0, homeList().findIndex(h=> h.bi === bi)), n = HOME_RECIPES.length;
  return { R:HOME_RECIPES[i % n], flip:Math.floor(i / n) % 2 === 1, pick:Math.floor(i / n) };
}
const _homeMaps = {};
function homeMap(bi){
  const key = homeKey(bi);
  if(_homeMaps[key]) return _homeMaps[key];
  const it = homeList().find(h=> h.bi === bi), b = it ? it.b : { scheme:'red' };
  const { R, flip, pick } = homeVariant(bi), T = CA_T, W = 12, H = 9;
  const fx = (x, w)=> flip ? W - x - (w || 1) : x;
  const m = caGrid(W, H, T.WOODWALL);
  caFill(m, 0, 0, W, H, T.WOODWALL, 'hw:top');
  caFill(m, 1, 2, W - 2, H - 3, T.PLANK, 'hf');
  const wall = {};
  Object.keys(R.wall).forEach(x=>{ wall[fx(+x)] = R.wall[x]; });
  for(let x = 1; x < W - 1; x++) caPut(m, x, 1, T.WOODWALL, 'hw:' + (wall[x] || 'plain'));
  const doorX = (W >> 1) - 1;
  m.tags.door = { x:doorX, y:H - 2, w:2, stand:{ x:doorX, y:H - 2 } };
  m.tags.tribe = 'castle'; m.tags.pal = homePal(b.scheme); m.tags.bi = bi; m.tags.recipe = R.name; m.tags.flip = flip;
  m.tags.floor = R.floor.map(f=> Object.assign({}, f, { x:flip ? W - f.x - f.w : f.x })).concat([{ kind:'mat', x:doorX + 0.2, y:H - 2 + 0.3, w:1.6, h:0.56 }]);
  m.tags.glows = [];
  R.put.forEach(([kind, x, y, w, h, dx, dy, dw, dh, o])=>{
    const X = fx(x, w), DX = flip ? w - dx - dw : dx;
    caFill(m, X, y, w, h, kind === 'canopyBed' || kind === 'hcot' ? T.BEDROYAL : kind === 'wardrobe' ? T.WARDROBE : kind === 'hearth' ? T.HEARTH : T.PLANTER, 'hf');
    caDeco(m, kind, X + DX, y + dy, dw, dh, Object.assign({ z:y + h - 0.1, n:500 + bi * 13 + X * 3 + y, foot:[X, y, w, h] },
      HOME_HUT.has(kind) ? { tribe:'castle', room:key, pal:m.tags.pal, fw:w, fh:h } : {}, o || {}));
  });
  for(let x = 1; x < W - 1; x++) if(wall[x] === 'lamp'){ m.tags.glows.push({ x:x + 0.5, y:2.3, r:2.1, c:'rgba(255,205,130,.22)' }); caDeco(m, 'hlight', x + 0.25, 0.75, 0.5, 0.5, { z:1.95, tribe:'castle', room:key }); }
  m.deco.forEach(d=>{
    if(d.kind === 'hearth') m.tags.glows.push({ x:d.x + d.w / 2, y:d.y + d.h + 0.5, r:2.6, c:'rgba(255,160,70,.24)' });
    if(d.kind === 'hstove') m.tags.glows.push({ x:d.x + d.w * 0.3, y:d.y + d.h + 0.3, r:1.8, c:'rgba(255,160,70,.2)' });
  });
  const pz = R.prizes[pick % R.prizes.length];
  m.tags.prize = [fx(pz[0]), pz[1]];
  m.tags.people = R.folk.map(([x, y, who, say], i)=> ({ x:fx(x), y, who, say, faceR:(i % 2 === 1) !== flip }));
  m.tags.folk = m.tags.people.map(p=> [p.x, p.y]);
  /* flat things lying about: by the walls and the furniture, never where the find, the folk or the door are */
  const RR = jgRng((9973 + bi * 7919) >>> 0), busy = new Set([m.tags.prize.join(','), doorX + ',' + (H - 2), (doorX + 1) + ',' + (H - 2)].concat(m.tags.folk.map(f=> f.join(',')))), cand = [];
  for(let y = 2; y < H - 1; y++) for(let x = 1; x < W - 1; x++){
    if(caSolidCode(caAt(m, x, y)) || busy.has(x + ',' + y)) continue;
    if([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy])=> caSolidCode(caAt(m, x + dx, y + dy)))) cand.push({ x, y });
  }
  m.tags.props = [];
  for(let i = 0; i < 3 && cand.length; i++){ const c = cand.splice(Math.floor(RR() * cand.length), 1)[0]; m.tags.props.push({ x:c.x + 0.2 + RR() * 0.3, y:c.y + 0.3 + RR() * 0.35, n:(bi + i) % 4, a:RR() }); }
  m.painter = HUT_ART.paint;
  m.room = 'home:' + key;
  m.deco.sort((a, c)=> a.z - c.z);
  _homeMaps[key] = m;
  return m;
}
const HOME_PRIZE_LINES = [`Tucked away where only a curious visitor would look…`, `Something glints behind the furniture.`, `Somebody lost this a long time ago.`, `Lucesco noses at something shiny.`];
homeList().forEach(({ b, bi })=>{
  const key = homeKey(bi);
  CA_MAPS[key] = ()=> homeMap(bi);
  CA_PLACES[key] = { title:homeTitle(bi), backLabel:'Castle', music:'zone_castle', spawn:()=> [5, 7] };
  caMakeDeck(key, CA_PLACES[key]);
  const d = DECKS[key];
  if(d){ d.prizes = [homeMap(bi).tags.prize.slice()]; d.prizeLines = HOME_PRIZE_LINES; }
});
/* (4.25) and one in each room of the castle's own: in the palace, behind the potted fern in the library, at the feet
   of a suit of armour in the dining hall, behind the palm by the throne; in the tower, by the toy chest in the
   princess's room, beside the fireplace in the sitting room, under the chest in the blue bedroom, under the palm at
   the end of the gallery; under the tavern's barrels; beside the record store's jukebox */
const CA_ROOM_PRIZES = { r6_palace:[[37, 32], [2, 20], [13, 2]], r6_tower:[[2, 10], [13, 2], [27, 10], [2, 13]], r6_tavern:[[14, 10]], r6_records:[[2, 2]] };
Object.keys(CA_ROOM_PRIZES).forEach(k=>{ const d = typeof DECKS !== 'undefined' && DECKS[k]; if(d && !d.prizes){ d.prizes = CA_ROOM_PRIZES[k].map(q=> q.slice()); d.prizeLines = HOME_PRIZE_LINES; } });
/* in from the street; out to it, before the door */
function homeEnter(bi){
  if(ui.caTalk) return;
  caGo(homeKey(bi), [5, 7]);
}
function homeLeave(bi){
  const it = homeList().find(h=> h.bi === bi);
  if(!it) return caGo(CA_KEY);
  caGo(CA_KEY, [it.b.door[0], it.b.y + it.b.h]);
}
function homeThings(key, list, T){
  if(key === CA_KEY){
    homeList().forEach(({ b, bi })=> T({ x:b.door[0], y:b.y + b.h - 1, w:b.door.length, icon:'', verb:'Enter', where:homeTitle(bi), arrow:'up', act:()=> homeEnter(bi) }));   // on its door, spoken to from the street
    return;
  }
  const H = homeParse(key);
  if(!H) return;
  const m = homeMap(H.bi), tg = m.tags;
  T({ x:tg.door.x, y:tg.door.y, w:2, walk:true, icon:'', verb:'Out', where:'Into the street', arrow:'down', act:()=> homeLeave(H.bi) });
  tg.people.forEach((f, i)=> T(caNpc(f.who, f.x, f.y, { faceR:f.faceR, act:()=> homeTalk(H.bi, i, f.who, f.say) })));
  m.deco.forEach(d=>{ if(!d.look || !d.foot) return; const [x, y, w, h] = d.foot; T({ x, y, w, h, icon:'', verb:'Look', sub:homeLookName(d.kind), act:()=> caLines([d.look]) }); });
}
function homeLookName(kind){
  return ({ hearth:'The fire', toyChest:'The toy chest', bookcase:'The books', globe:'The globe', harp:'The harp', sideboard:'The sideboard', hstove:'The range', hdresser:'The dresser',
            armour:'The armour', weaponRack:'The practice swords', clock:'The clock' })[kind] || 'Look';
}
function homeTalk(bi, i, who, say){
  const lines = HOME_LINES[say] || HOME_LINES[who] || [`<b>"Hello!"</b>`];
  return caLines([[who, caTurn('home_' + bi + '_' + i, lines)]]);
}
/* both the huts' things and the homes', from one hook (caThings) */
const _hutThingsHuts = hutThings;
hutThings = function(key, list, T){ _hutThingsHuts(key, list, T); homeThings(key, list, T); };
/* Lucesco in a home */
const _hutLionHuts = hutLionTalk;
hutLionTalk = function(key){
  if(_hutLionHuts(key)) return true;
  const H = homeParse(key);
  if(!H){                                                              // one of the castle's own rooms: now and then, a hint
    if(CA_ROOM_PRIZES[key] && typeof prizeTaken === 'function' && CA_ROOM_PRIZES[key].some((q, i)=> !prizeTaken(key, i)) && caTurn('roomHide_' + key, [0, 1, 1]) === 0){
      caLines([['lion', `<i>Lucesco's nose twitches.</i> <b>"There is a ticket somewhere in here. I can smell it — paper, and a little gold."</b>`]]);
      return true;
    }
    return false;
  }
  const hidden = typeof prizeTaken === 'function' && !prizeTaken(key, 0);
  caLines([['lion', hidden && caTurn('homeHide', [0, 1]) === 0 ? `<i>Lucesco sniffs under the furniture.</i> <b>"Something shiny is hidden in this house. I can smell it — metal and dust."</b>`
                                                            : caTurn('homeLion', [`<b>"A home full of people who love it. You can tell by the dust: there is none."</b>`, `<b>"Cinnamon, candle wax and wool. The castle smells like this all over."</b>`])]]);
  return true;
};
