/* ==========================================================
   46-kingdom-city.js — THE CITY: the kingdom built up plot by plot, and the screen it is all seen from.

   (4.73) The designer: "Please also make the nation building a progressive area, not just a castle. Start with a 3x3
   plot of land with fixed core buildings for healing, shopping, construction, food, and a palace. With the fire
   evolution skill, the player can clear up to 9x9 area. Farmlands outside of the city. City walls need to be built.
   Towers within walls in the city compound. Water enables farmlands to be irrigated for more food and a moat for greater
   defense (reduces damage taken by walls). Grass enables fertile growth, improving farmland yields. Players do not earn
   money from defeating monsters. They earn raw materials. The city needs to be managed with its farmlands to earn money.
   Upgrades require completing questions."

   (4.74) The designer, growing it:
   · "Please make upgrading buildings require much much more resources than currently needed so as to prolong the
     longevity of the game." (KC_G: each level dearer, steeply)
   · "Can you make them scale to 10 and get more and more grand each time? … Make the inner city tiles for the
     construction yard, granary, shops and healer increase to 2x2 the current scale and the palace eventually increase to
     4 (length) x 3 (height) the current scale. 2x2 increase happens at level 6, then the palace's 3x2 and 4x3 eventually
     at levels 9 and 10. Palace must be upgraded first before everything else can be upgraded. once palace hits level 6,
     allocate the 2x2 empty land for the main buildings even if they aren't upgraded yet. Castle area and therefore length
     of the walls scale according to palace level, as do the number of towers (Up to 4). tower range and spell capacity
     improves according to level of the palace as well. for now we will use a zoomed out view that can be scrolled"
   · "make burned forests up to 4 plots beyond the walls according to palace level."
   · "Change healer to barracks." "Walls can be manned by an army, which costs both gold and food upkeep. Towers can be
     loaded with spells which must be done prior to the attack … The construction site can be loaded up with sums to
     provide limited self-repair to the walls. Barracks can be upgraded with sums to load up additional reserve
     defenders." "charge up tower: requires electric evolution, sums depend on number of spells and types of spells
     loaded up."
   · "Starting from castle level 2 (all buildings, towers and walls must be fully upgraded to level 2), the kingdom
     attracts the attention of the aliens, which will attack 3 times per level and must be defended against to progress
     kingdom construction to higher levels. (Once before palace upgrade, which is always the first), once before 4 main
     building upgrades, and finally once before tower and wall upgrades." (the raids themselves: 49-kingdom-raid.js)
   · "clear land: 3 sums per plot; irrigate: 1 sum per field per cycle (a cycle is an economic cycle); fertilise: 1 sum
     per field per cycle"

   The map: 21 by 21 plots, the palace in the middle (10, 10). Inside the walls, by the palace's level: 5 by 5 (1 to 3),
   7 by 7 (4, 5), 9 by 9 (6, 7), 11 by 11 (8, 9), 13 by 13 (10); the wild can be burnt back 2, 3 or 4 plots beyond them
   (palace 1 to 3, 4 to 6, 7 on); the edge of the map stays forest. Palace 1 to 5: the old town, three by three. Palace 6:
   the new plan (kcReplan): the palace's ground, four by three, the palace on it 2 by 2 (6 to 8), 3 by 2 (9), 4 by 3 (10);
   each main building a 2 by 2 lot, which it fills at every level ((4.78); until then it stood small in a corner till 6).
   State: kd().city: { v:3, cells:[441 × { k, lv, irr, fer, spells? }], at:{ palace, barracks, market, yard, granary },
   plan, walls, moat, day, last, army, kits, reserves, raids:{ castle level: raids won } }. A cell under a building's
   ground or lot that is not its seat: { k:'part', of:<its key> }.
   ========================================================== */
const KC_N = 21, KC_C = 10;
const kcAt = (x, y)=> y * KC_N + x;
const kcXY = i=> [i % KC_N, Math.floor(i / KC_N)];
const kcOnMap = (x, y)=> x >= 0 && y >= 0 && x < KC_N && y < KC_N;
const KC_MAX = 10;
const KC_MAIN = ['barracks', 'market', 'yard', 'granary'];
const KC_OLD_AT = { palace:[10, 10], barracks:[10, 9], yard:[9, 10], market:[11, 10], granary:[10, 11] };   // the old town
const KC_LOTS = { barracks:[7, 6], market:[13, 6], yard:[7, 11], granary:[13, 11] };                   // (palace 6) each 2 by 2, its top left
const kcLotSeat = k=> [KC_LOTS[k][0], KC_LOTS[k][1] + 1];                                               // where it stands until it fills its lot
const KC_PALACE_GROUND = [9, 8, 4, 3];
/* (4.78) from 6 the palace fills its ground at every level, inside walls of its own (the designer: "the empty space looks weird
   while pending its upgrade … allow the walls to suit the available space inside"); till 4.77 it grew into it, 2 by 2 to 4 by 3 */
function kcPalaceFoot(L){ return L >= 6 ? KC_PALACE_GROUND.slice() : [10, 10, 1, 1]; }
const kcHalf = P=> P >= 10 ? 6 : P >= 8 ? 5 : P >= 6 ? 4 : P >= 4 ? 3 : 2;      // the castle's area: 5 by 5 … 13 by 13
const kcBand = P=> P >= 7 ? 4 : P >= 4 ? 3 : 2;                                  // the wild burnt back beyond the walls
const kcMaxTowers = P=> P >= 8 ? 4 : P >= 6 ? 3 : P >= 4 ? 2 : P >= 2 ? 1 : 0;
const kcTowerRange = P=> +(1.5 + 0.12 * P).toFixed(2);                          // plots
const kcSpellSlots = P=> 1 + Math.floor(P / 3);
const KC_RES = ['coins', 'wood', 'stone', 'iron'];
/* each kind of building, its cost by level: its base × KC_G[level − 1] ("much much more resources") */
const KC_G = [1, 2.2, 4.5, 8, 13, 20, 30, 45, 65, 95];
const kcScale = (base, L)=> base.map(v=> Math.round(v * KC_G[L - 1] / (v >= 20 ? 5 : 1)) * (v >= 20 ? 5 : 1));
const KC_B = {
  palace:  { name:'The palace', a:'the palace', start:1, max:10, base:[140, 36, 28, 4],
             say:(L, K)=> `Your home, at level ${L}. Nothing in the kingdom can be raised above it. Its level sets how far the walls reach, how many towers there can be (${kcMaxTowers(L)}), and how far they see.` },
  barracks:{ name:'The barracks', a:'the barracks', start:0, max:10, base:[60, 14, 12, 2],
             say:L=> L ? `The chestnut knights. Reserves trained here (${2 * L} at most) rush out when a wall is breached.` : 'In ruins. Repaired, it trains reserves for the raids.' },
  market:  { name:'The market', a:'the market', start:0, max:10, base:[60, 16, 10, 2],
             say:L=> L ? `Potions for battles: carry up to ${Math.min(6, L + 1)}, each healing ${Math.min(80, 35 + 5 * L)}%. Each day it sells up to ${6 * L} spare food, a coin each.` : 'Empty stalls. Repaired, it sells potions, and the city\'s spare food for coins.' },
  yard:    { name:'The builders\' yard', a:'the builders\' yard', start:1, max:10, base:[50, 18, 12, 0],
             say:L=> `The strongmen. Repair kits loaded here (${2 + L} at most) mend the walls in a raid.` },
  granary: { name:'The granary', a:'the granary', start:0, max:10, base:[50, 18, 8, 0],
             say:L=> L ? `Holds ${20 + 30 * L} food. Its kitchen garden grows ${1 + L} a day.` : 'In ruins: it holds only 20 food, and grows none. Repaired, its kitchen garden feeds a first house.' },
  house:   { name:'A house', a:'a house', max:10, base:[30, 12, 4, 0],
             say:L=> `A family: it eats ${L} food a day and, fed, pays ${2 * L} coins.` },
  tower:   { name:'A tower', a:'a tower', max:10, base:[120, 12, 30, 10],
             say:(L, K)=>{ const P = kcLv(K, 'palace'); return `A fairybird mage's tower, level ${L}: its bolts reach ${kcTowerRange(P)} plots, and it holds ${kcSpellSlots(P)} spell${kcSpellSlots(P) > 1 ? 's' : ''} (the palace's level sets both).`; } },
  field:   { name:'A field', a:'a field', max:3, costs:[[10, 6, 0, 0], [30, 10, 4, 0], [70, 16, 8, 2]],
             say:(L, K, c)=> `Grows ${kcFieldFood(c)} food a day${c && (c.irr || c.fer) ? ` today (${[c.irr ? 'watered' : '', c.fer ? 'fertile' : ''].filter(Boolean).join(', ')})` : ''}.` },
};
const kcCost = (key, L)=> KC_B[key].costs ? KC_B[key].costs[L - 1] : kcScale(KC_B[key].base, L);
const KC_WALLS = { max:10, base:[150, 60, 40, 4] };
const KC_MOAT = { max:3, cost:[[150, 0, 50, 0], [400, 0, 110, 10], [900, 0, 220, 30]] };
const KD_POTION = 8;                                                // a potion at the market (coins)
const KC_FIELD = [3, 5, 7];
const kcFieldFood = c=> c ? Math.round(KC_FIELD[(c.lv || 1) - 1] * (c.irr ? 1.5 : 1) * (c.fer ? 1.5 : 1)) : KC_FIELD[0];
const kcSums = L=> 2 + 2 * L;                                        // the builders' sums for a level: 4 … 22
/* the army on the walls; the spells for the towers; the yard's repair kits; the barracks' reserves */
const KC_SOLDIER = { coins:20, upkeepCoins:1, upkeepFood:1, perWall:4 };
const KC_SPELLS = {
  fire:   { name:'Fire Rain',     kind:'aoe',     coins:40, sums:3, casts:4, say:'Rains fire on a crowd of them.' },
  thunder:{ name:'Thunder Spear', kind:'single',  coins:40, sums:2, casts:4, say:'One great bolt, at the strongest first: the elite.' },
  frost:  { name:'Frost Ring',    kind:'slow',    coins:30, sums:2, casts:3, say:'Slows every one near the tower by half.' },
  silence:{ name:'Silence Bell',  kind:'silence', coins:35, sums:3, casts:3, say:'Stops their special powers: no flying over the walls, no healing, no blasts.' },
};
const KC_KIT_SUMS = 2, KC_RESERVE_SUMS = 2;
const kcKitMax = K=> 2 + kcLv(K, 'yard');
const kcReserveMax = K=> 2 * kcLv(K, 'barracks');
const kcArmyMax = K=> KC_SOLDIER.perWall * (K.city.walls || 0);

/* ============================================================
   THE STATE, AND THE PLACES ON THE MAP
   ============================================================ */
function kcFreshCity(){
  const cells = Array.from({ length:KC_N * KC_N }, (_, i)=>{ const [x, y] = kcXY(i); return { k:Math.abs(x - KC_C) <= 1 && Math.abs(y - KC_C) <= 1 ? 'clear' : 'wild', lv:0 }; });
  const at = {};
  Object.entries(KC_OLD_AT).forEach(([k, [x, y]])=>{ cells[kcAt(x, y)] = { k, lv:KC_B[k].start }; at[k] = [x, y]; });
  return { v:3, cells, at, plan:0, walls:0, moat:0, day:1, last:null, army:0, kits:0, reserves:0, raids:{} };
}
function kcEnsure(K){
  const C = K.city;
  if(C && C.v === 3 && Array.isArray(C.cells) && C.cells.length === KC_N * KC_N) return C;
  if(C && Array.isArray(C.cells) && C.cells.length === 81) return (K.city = kcFrom473(C));
  return (K.city = kcFreshCity());
}
/* (4.74) a 4.73 city, nine by nine, set in the middle of the new map (its plots 6 on); the healer is the barracks now;
   its fields watered and fertile for the day they were */
function kcFrom473(old){
  const C = kcFreshCity();
  old.cells.forEach((c, i)=>{
    const x = i % 9 + 6, y = Math.floor(i / 9) + 6, n = Object.assign({}, c);
    if(n.k === 'healer') n.k = 'barracks';
    C.cells[kcAt(x, y)] = n;
  });
  Object.assign(C, { walls:old.walls || 0, moat:old.moat || 0, day:old.day || 1, last:old.last || null });
  return C;
}
const kcSeatOf = (C, key)=> C.at && C.at[key] ? kcAt(C.at[key][0], C.at[key][1]) : -1;
/* a core building's level */
function kcLv(K, key){
  const C = K && K.city;
  if(!C || !C.cells) return 0;
  const i = kcSeatOf(C, key), c = C.cells[i];
  return c && c.k === key ? c.lv : 0;
}
const kcPal = C=> { const c = C.cells[kcAt(KC_C, KC_C)]; return c && c.k === 'palace' ? c.lv : 1; };
const kcFoodCap = K=> 20 + 30 * kcLv(K, 'granary');
const kcHave = (K, r)=> r === 'coins' ? K.coins : (K.mats[r] || 0);
const kcAfford = (K, cost)=> KC_RES.every((r, j)=> kcHave(K, r) >= ((cost && cost[j]) || 0));
function kcPay(K, cost){ KC_RES.forEach((r, j)=>{ const n = (cost && cost[j]) || 0; if(r === 'coins') K.coins -= n; else K.mats[r] -= n; }); }
/* inside the walls (as far as they reach at the palace's level); and where the wild can be burnt back */
const kcInsideP = (P, x, y)=> Math.abs(x - KC_C) <= kcHalf(P) && Math.abs(y - KC_C) <= kcHalf(P);
const kcInside = (C, x, y)=> kcInsideP(kcPal(C), x, y);
/* (the edge of the map stays forest: at palace 10 the wild goes back three plots, not four) */
const kcReach = (C, x, y)=>{ const P = kcPal(C), r = Math.min(KC_C - 1, kcHalf(P) + kcBand(P)); return Math.abs(x - KC_C) <= r && Math.abs(y - KC_C) <= r; };
/* the old town (palace 1 to 5): its three by three */
const kcOldTown = (x, y)=> Math.abs(x - KC_C) <= 1 && Math.abs(y - KC_C) <= 1;
const kcNextToCleared = (C, x, y)=> [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy])=>{ const X = x + dx, Y = y + dy; return kcOnMap(X, Y) && C.cells[kcAt(X, Y)].k !== 'wild'; });
/* the ring round the old town, cleared: the first walls can go up */
const kcRingClear = C=> C.cells.every((c, i)=>{ const [x, y] = kcXY(i); return !(Math.abs(x - KC_C) <= 2 && Math.abs(y - KC_C) <= 2) || c.k !== 'wild'; });
/* what a plot belongs to (a building's seat, its ground, its lot) */
function kcOwner(C, i){
  const c = C.cells[i];
  if(!c) return null;
  if(c.k === 'part') return c.of;
  return KC_B[c.k] && C.at && C.at[c.k] && kcSeatOf(C, c.k) === i ? c.k : null;
}
/* a building's ground on the map [x, y, w, h]: the palace's by its level; a main building's lot (from palace 6) */
function kcFoot(C, key){
  const i = kcSeatOf(C, key), c = C.cells[i], [x, y] = kcXY(i);
  if(key === 'palace') return kcPalaceFoot(c.lv);
  if(C.plan && KC_MAIN.includes(key)) return [KC_LOTS[key][0], KC_LOTS[key][1], 2, 2];          // (4.78) its whole lot, at every level
  return [x, y, 1, 1];
}
/* the plots a finger tapping selects as one: a building's whole ground or lot */
function kcSelRect(C, i){
  const key = kcOwner(C, i);
  if(key === 'palace') return C.plan ? KC_PALACE_GROUND : [KC_C, KC_C, 1, 1];
  if(key && C.plan && KC_MAIN.includes(key)) return [KC_LOTS[key][0], KC_LOTS[key][1], 2, 2];
  const [x, y] = kcXY(i); return [x, y, 1, 1];
}
const kcTowers = C=> C.cells.map((c, i)=> c.k === 'tower' ? i : -1).filter(i=> i >= 0);
/* THE CASTLE'S LEVEL: the lowest of the palace, the four main buildings, the walls and every tower (none: 0) */
function kcCastle(K){
  const C = K.city, T = kcTowers(C);
  return Math.min(kcLv(K, 'palace'), ...KC_MAIN.map(k=> kcLv(K, k)), C.walls || 0, T.length ? Math.min(...T.map(i=> C.cells[i].lv)) : 0);
}
/* THE RAIDS (from castle level 2): won at this castle level so far (0 to 3), and the one to come: { n, CL, ready, why } */
const kcRaidsWon = (K, CL)=> (K.city.raids && K.city.raids[CL]) || 0;
function kcRaidNext(K){
  const CL = kcCastle(K);
  /* (4.77) the final raid of the level just finished: the whole castle up a level, the three raids of the level below
     held off — the aliens come a fourth time, all at once; held off, Nótt's dream (50-kingdom-nott.js). Before any raid
     of the new level. The designer: "new elements should be gained only after each time the entire castle is upgraded
     and completes its final fight (making a fourth fight)". */
  if(CL >= 3 && kcRaidsWon(K, CL - 1) === 3) return { n:4, CL:CL - 1, ready:true, why:'', final:true };
  if(CL < 2 || CL >= KC_MAX) return null;
  const n = kcRaidsWon(K, CL) + 1;
  if(n > 3) return null;
  const L = CL + 1;
  if(n === 2 && kcLv(K, 'palace') < L) return { n, CL, ready:false, why:`Raise the palace to level ${L} first.` };
  if(n === 3 && KC_MAIN.some(k=> kcLv(K, k) < L)) return { n, CL, ready:false, why:`Raise the barracks, the market, the builders' yard and the granary to level ${L} first.` };
  return { n, CL, ready:true, why:'' };
}
const KC_RAID_UNLOCKS = ['', 'the palace\'s next level', 'the next level of the barracks, the market, the builders\' yard and the granary', 'the next level of the towers and the walls'];
/* how high a building can go now, and if not, why: nothing above the palace ("Palace must be upgraded first"); from
   castle level 2, each step past it waits for its raid */
function kcGate(K, key, L){
  const P = kcLv(K, 'palace'), CL = kcCastle(K);
  if(key !== 'palace' && key !== 'field' && L > P) return `Raise the palace to level ${L} first: nothing goes above it.`;
  if(CL >= 2 && L > CL && key !== 'house' && key !== 'field'){
    const stage = key === 'palace' ? 1 : KC_MAIN.includes(key) ? 2 : 3;
    if(stage === 3 && KC_MAIN.some(k=> kcLv(K, k) < L)) return `Raise the four main buildings to level ${L} first.`;
    if(kcRaidsWon(K, CL) < stage) return `The aliens are coming: defend the city from raid ${stage} of castle level ${CL} first.`;
  }
  return '';
}

/* ============================================================
   PALACE 6: THE NEW PLAN. The palace's ground (four by three) and a 2 by 2 lot for each main building are cleared and
   kept; the main buildings move to their lots; anything standing in the way moves to the nearest free plot like it
   ============================================================ */
function kcReplan(K){
  const C = K.city, moved = [];
  if(C.plan) return moved;
  const keep = new Map();                                            // cell → what it is for
  const [px, py, pw, ph] = KC_PALACE_GROUND;
  for(let y = py; y < py + ph; y++) for(let x = px; x < px + pw; x++) keep.set(kcAt(x, y), 'palace');
  KC_MAIN.forEach(k=>{ const [lx, ly] = KC_LOTS[k]; for(let y = ly; y < ly + 2; y++) for(let x = lx; x < lx + 2; x++) keep.set(kcAt(x, y), k); });
  /* the main buildings, lifted from the old town */
  const lift = {};
  KC_MAIN.forEach(k=>{ const i = kcSeatOf(C, k); lift[k] = Object.assign({}, C.cells[i]); C.cells[i] = { k:'clear', lv:0 }; });
  /* whatever else stands where the plan goes */
  const homeless = [];
  keep.forEach((what, i)=>{
    const c = C.cells[i];
    if(i === kcAt(KC_C, KC_C)) return;                             // the palace's own seat
    if(c.k === 'house' || c.k === 'tower' || c.k === 'field') homeless.push({ from:i, c:Object.assign({}, c) });
    C.cells[i] = { k:'part', of:what };
  });
  KC_MAIN.forEach(k=>{ const [sx, sy] = kcLotSeat(k), i = kcAt(sx, sy); C.cells[i] = lift[k]; C.at[k] = [sx, sy]; });
  C.plan = 6;
  /* each moved to the nearest free plot: houses and towers inside the walls, fields outside (cleared for it if wild) */
  homeless.forEach(h=>{
    const [hx, hy] = kcXY(h.from), want = h.c.k === 'field' ? 'out' : 'in';
    let best = -1, bd = 1e9, wild = false;
    C.cells.forEach((c, i)=>{
      if(c.k !== 'clear' && c.k !== 'wild') return;
      const [x, y] = kcXY(i), inn = kcInside(C, x, y);
      if((want === 'in') !== inn || !kcReach(C, x, y)) return;
      if(want === 'in' && kcOldTown(x, y) && !C.plan) return;
      const d = Math.abs(x - hx) + Math.abs(y - hy) + (c.k === 'wild' ? 6 : 0);
      if(d < bd){ bd = d; best = i; wild = c.k === 'wild'; }
    });
    if(best >= 0){ C.cells[best] = h.c; moved.push({ what:h.c.k, from:h.from, to:best, cleared:wild }); }
  });
  return moved;
}

/* ============================================================
   A DAY IN THE KINGDOM (a battle won): the fields and the granary's garden grow; the families eat and pay; the army is
   paid; the market sells what is to spare; the granary keeps what it can. The fields' water and goodness are for the day.
   ============================================================ */
function kcDay(K){
  const C = kcEnsure(K), cap = kcFoodCap(K);
  let grown = kcLv(K, 'granary') >= 1 ? 1 + kcLv(K, 'granary') : 0;
  C.cells.forEach(c=>{ if(c.k === 'field'){ grown += kcFieldFood(c); c.irr = false; c.fer = false; } });
  K.food += grown;
  const houses = C.cells.filter(c=> c.k === 'house'), need = houses.reduce((a, h)=> a + h.lv, 0) + (C.army || 0) * KC_SOLDIER.upkeepFood;
  let fed = 0, eaten = 0, tax = 0;
  houses.forEach(h=>{ if(K.food >= h.lv){ K.food -= h.lv; eaten += h.lv; tax += 2 * h.lv; fed++; } });
  K.coins += tax;
  /* the army: a coin and a food each a day; any not paid leave */
  let paid = 0, left = 0;
  for(let s = 0; s < (C.army || 0); s++){
    if(K.food >= KC_SOLDIER.upkeepFood && K.coins >= KC_SOLDIER.upkeepCoins){ K.food -= KC_SOLDIER.upkeepFood; K.coins -= KC_SOLDIER.upkeepCoins; paid++; }
    else left++;
  }
  C.army = paid;
  const mk = kcLv(K, 'market');
  const sold = mk ? Math.max(0, Math.min(6 * mk, K.food - need)) : 0;     // keeping tomorrow's meals
  K.food -= sold; K.coins += sold;
  const spoiled = Math.max(0, K.food - cap); K.food -= spoiled;
  const rep = { day:C.day, grown, eaten, fed, hungry:houses.length - fed, tax, sold, spoiled, army:paid, left };
  C.day++; C.last = rep;
  return rep;
}
function kcDayHtml(r){
  const bits = [r.grown ? `the fields grew ${r.grown} food` : 'nothing grew (no fields yet)',
    r.fed ? `${r.fed} ${r.fed > 1 ? 'families' : 'family'} ate ${r.eaten} and paid ${r.tax} coins` : '',
    r.hungry ? `${r.hungry} went hungry and paid nothing` : '',
    r.army ? `${r.army} soldier${r.army > 1 ? 's were' : ' was'} paid` : '', r.left ? `${r.left} soldier${r.left > 1 ? 's' : ''} left, unpaid` : '',
    r.sold ? `the market sold ${r.sold} food for ${r.sold} coins` : '', r.spoiled ? `${r.spoiled} spoiled: the granary was full` : ''].filter(Boolean);
  return `<p class="kc-day">${kcIcon('day')}<span><b>Day ${r.day} in the kingdom:</b> ${bits.join('; ')}.</span></p>`;
}

/* ============================================================
   WHAT CAN BE DONE ON A PLOT: { id, label, cost, sums, ok, why, done, said }
   ============================================================ */
function kcRaise(K, i, key){
  const C = K.city, c = C.cells[i], B = KC_B[key], L = c.lv + 1;
  if(c.lv >= B.max) return null;
  const why = c.lv ? kcGate(K, key, L) : '';
  return { id:'up', label:c.lv ? `Raise it to level ${L}` : 'Repair it', cost:kcCost(key, L), sums:kcSums(L), ok:!why, why,
           done:()=>{ c.lv = L; if(key === 'palace' && L >= 6 && !C.plan){ const mv = kcReplan(K); ui.kcMoved = mv; } },
           said:c.lv ? `${B.name} is now level ${L}.` : `${B.name} is repaired!` };
}
function kcActions(K, i){
  const C = K.city, c = C.cells[i], [x, y] = kcXY(i), P = K.partner, out = [];
  const has = f=> !!(P && P.forms.includes(f)), pal = kcLv(K, 'palace');
  if(c.k === 'part'){ const s = kcSeatOf(C, c.of); return s >= 0 ? kcActions(K, s) : out; }
  if(c.k === 'wild'){
    const next = kcNextToCleared(C, x, y), reach = kcReach(C, x, y);
    /* too far: the palace's level that lets the city reach it (the map's edge, never) */
    const far = Math.max(Math.abs(x - KC_C), Math.abs(y - KC_C)), at = [2, 3, 4, 5, 6, 7, 8, 9, 10].find(L=> L > pal && Math.min(KC_C - 1, kcHalf(L) + kcBand(L)) >= far);
    const why = !has('fire') ? `Needs the Fire form: Nótt brings it in a dream after ${typeof NOTT !== 'undefined' ? NOTT.firstWins : 5} battles won.` : !reach ? (at ? `Too far out for now: the palace at level ${at} lets the city reach it.` : 'The edge of the map stays wild.') : !next ? 'Clear a plot next to it first.' : '';
    out.push({ id:'clear', label:'Burn back the wild', cost:[0, 0, 0, 0], sums:3, ok:!why, why, done:()=>{ c.k = 'clear'; c.lv = 0; }, said:'The wild land is burnt back.' });
    return out;
  }
  if(c.k === 'clear'){
    if(kcInside(C, x, y)){
      out.push(kcNewAct(K, c, 'house'));
      if(!(kcOldTown(x, y) && !C.plan)){
        const T = kcTowers(C).length, mx = kcMaxTowers(pal);
        out.push(kcNewAct(K, c, 'tower', !C.walls ? 'Needs the city walls first.' : T >= mx ? (mx < 4 ? `${mx} tower${mx > 1 ? 's' : ''} at most for now: the palace at level ${pal >= 6 ? 8 : pal >= 4 ? 6 : pal >= 2 ? 4 : 2} allows ${mx + 1}.` : 'Four towers is the most a city can have.') : ''));
      }
    } else out.push(kcNewAct(K, c, 'field'));
    return out;
  }
  const B = KC_B[c.k];
  if(!B) return out;
  const up = kcRaise(K, i, c.k); if(up) out.push(up);
  if(c.k === 'field'){
    if(!c.irr) out.push({ id:'water', label:'Water it today', cost:[0, 0, 0, 0], sums:1, ok:has('water'), why:has('water') ? '' : 'Needs the Water form.',
                          done:()=>{ c.irr = true; }, said:'The field is watered: half as much food again today.' });
    if(!c.fer) out.push({ id:'fertile', label:'Make it fertile today', cost:[0, 0, 0, 0], sums:1, ok:has('grass'), why:has('grass') ? '' : 'Needs the Grass form.',
                          done:()=>{ c.fer = true; }, said:'The field is fertile: half as much food again today.' });
  }
  if(c.k === 'yard' && c.lv){
    const n = C.kits || 0, mx = kcKitMax(K);
    if(n < mx) out.push({ id:'kit', label:`Load a repair kit (${n} of ${mx})`, cost:[0, 0, 0, 0], sums:KC_KIT_SUMS, ok:true, why:'', done:()=>{ C.kits = Math.min(kcKitMax(K), (C.kits || 0) + 1); }, said:'A repair kit is ready for the walls.' });
  }
  if(c.k === 'barracks' && c.lv){
    const n = C.reserves || 0, mx = kcReserveMax(K);
    if(n < mx) out.push({ id:'reserve', label:`Train a reserve (${n} of ${mx})`, cost:[0, 0, 0, 0], sums:KC_RESERVE_SUMS, ok:true, why:'', done:()=>{ C.reserves = Math.min(kcReserveMax(K), (C.reserves || 0) + 1); }, said:'A chestnut knight is ready in reserve.' });
  }
  if(c.k === 'tower'){
    const slots = kcSpellSlots(pal), sp = c.spells || [];
    if(sp.length < slots) Object.entries(KC_SPELLS).forEach(([k, S])=>{
      out.push({ id:'spell-' + k, label:`Charge ${S.name}`, cost:[S.coins, 0, 0, 0], sums:S.sums, ok:has('electric'), why:has('electric') ? S.say : 'Charging a tower needs the Electric form.',
                 done:()=>{ (c.spells || (c.spells = [])).push({ k, casts:S.casts }); }, said:`${S.name} is charged in the tower.` });
    });
  }
  return out;
}
function kcNewAct(K, c, key, block){
  const B = KC_B[key];
  return { id:'new-' + key, label:`Build ${B.a}`, cost:kcCost(key, 1), sums:kcSums(1), ok:!block, why:block || '',
           done:()=>{ c.k = key; c.lv = 1; c.irr = false; c.fer = false; }, said:`${B.name} is built!` };
}
function kcWallAct(K){
  const C = K.city, L = C.walls + 1, pal = kcLv(K, 'palace');
  if(C.walls >= KC_WALLS.max) return null;
  const why = !C.walls && !kcRingClear(C) ? 'First clear all the land round the old town.' : pal < 2 ? 'Needs the palace at level 2.' : (C.walls ? kcGate(K, 'walls', L) : '');
  return { id:'walls', label:C.walls ? `Raise the walls to level ${L}` : 'Build the walls', cost:kcScale(KC_WALLS.base, L), sums:kcSums(L), ok:!why, why,
           done:()=>{ C.walls = L; }, said:C.walls ? `The walls are now level ${L}.` : 'The city has walls!' };
}
function kcMoatAct(K){
  const C = K.city, L = C.moat + 1, P = K.partner, water = !!(P && P.forms.includes('water'));
  if(C.moat >= KC_MOAT.max) return null;
  const why = !water ? 'Needs the Water form.' : !C.walls ? 'Needs the walls first.' : L > C.walls ? `Raise the walls to level ${L} first.` : '';
  return { id:'moat', label:C.moat ? `Deepen the moat to level ${L}` : 'Dig the moat', cost:KC_MOAT.cost[L - 1], sums:kcSums(L), ok:!why, why,
           done:()=>{ C.moat = L; }, said:C.moat ? `The moat is now level ${L}.` : 'The moat is dug and filled!' };
}
/* the fields, all at once: watered (Water) or made fertile (Grass) for today, a sum each */
function kcFieldsAct(K, what){
  const C = K.city, P = K.partner, form = what === 'irr' ? 'water' : 'grass', has = !!(P && P.forms.includes(form));
  const todo = C.cells.filter(c=> c.k === 'field' && !c[what]);
  if(!C.cells.some(c=> c.k === 'field')) return null;
  return { id:'all-' + what, label:what === 'irr' ? `Water every field today (${todo.length})` : `Make every field fertile today (${todo.length})`, cost:[0, 0, 0, 0], sums:todo.length,
           ok:has && todo.length > 0, why:!has ? `Needs the ${form === 'water' ? 'Water' : 'Grass'} form.` : !todo.length ? 'Every field is done for today.' : '',
           done:()=>{ todo.forEach(c=> c[what] = true); }, said:what === 'irr' ? 'Every field is watered for today.' : 'Every field is fertile for today.' };
}
const kcMoatSay = L=> L ? `The walls will take ${15 * L}% less damage in the raids.` : 'Water round the walls: they will take less damage in the raids.';
const KC_WALL_NAMES = ['', 'A wooden palisade', 'Stone walls', 'Thick stone walls', 'Great walls, iron-bound', 'The great walls, crowned', 'Walls of white stone', 'High white walls', 'Walls with gilded gates', 'The shining walls', 'The kingdom\'s great walls'];
const kcWallSay = (K, L)=> L ? `${KC_WALL_NAMES[L]}, round the city: ${2 * kcHalf(kcLv(K, 'palace')) + 1} plots a side (the palace's level sets how far they reach).` : 'Not built yet. They go round the city: the old town and the ring of plots round it, and further as the palace grows.';

/* DO IT: what it costs is checked; the builders' sums (none: done at once); then it is paid for and done */
function kcRun(K, act, title){
  if(!act || !act.ok) return;
  if(!kcAfford(K, act.cost)){ toast('Not enough yet: ' + kcShort(K, act.cost) + '.'); return; }
  const finish = async ()=>{
    if(!kcAfford(K, act.cost)){ toast('Not enough any more.'); return; }
    kcPay(K, act.cost); act.done();
    await saveProfile();
    ui.kcPop = ui.kcSel;
    kcRerender();
    toast(act.said);
    if(ui.kcMoved){ const mv = ui.kcMoved; ui.kcMoved = null; kcReplanSay(K, mv); }
  };
  if(!act.sums) return finish();
  kcQuiz(title || act.label, act.sums, finish);
}
function kcShort(K, cost){ return KC_RES.map((r, j)=>{ const n = (cost[j] || 0) - kcHave(K, r); return n > 0 ? `${n} more ${r}` : ''; }).filter(Boolean).join(', '); }
/* palace 6: what the new plan did, said once */
async function kcReplanSay(K, moved){
  if(typeof kdSay !== 'function') return;
  ui.kdTalk = true;
  try {
    await kdSay('The palace is level 6, and the city has a new plan: the palace has its own grounds now, and the barracks, the market, the builders\' yard and the granary each have a lot of four plots. Each of them fills its lot, and grows grander with every level.');
    if(moved.length) await kdSay(`${moved.length} ${moved.length > 1 ? 'buildings' : 'building'} stood in the way, and ${moved.length > 1 ? 'were' : 'was'} moved, just as ${moved.length > 1 ? 'they were' : 'it was'}, to the nearest free plot.`);
  } finally { ui.kdTalk = false; }
}

/* ============================================================
   THE BUILDERS' SUMS: no enemy, no timer; a wrong one shows the answer and another comes
   ============================================================ */
function kcQuiz(title, need, onDone){
  kdCss();
  const K = kd(), st = { q:null, vals:[''], cur:0, at:0, got:0, need, reveal:false };
  document.querySelectorAll('.kcq').forEach(b=> b.remove());
  ui.kcQ = st;                                                       // (what is being asked, for a test to read)
  const box = document.createElement('div');
  box.className = 'kd-over kcq';
  box.innerHTML = `<div class="kd-card kd-overcard kcq-card">
    <div class="kd-h">${escapeHtml(title)}</div>
    <div class="kd-sub2">The builders need ${need} sums right. There is no enemy here: take your time.</div>
    <div class="kcq-pips" aria-hidden="true">${Array.from({ length:need }, ()=> '<i></i>').join('')}</div>
    <div class="kcq-sum" id="kcqSum"></div>
    ${kdPadHtml('kcqPad')}
    <div class="kd-row"><button class="btn btn-ghost" id="kcqNo">Stop for now</button></div></div>`;
  document.body.appendChild(box);
  const sum = box.querySelector('#kcqSum');
  const draw = ()=>{
    sum.innerHTML = st.q.skill === 'word' ? '<span class="kq-wording">A problem sum: working it out…</span>'
                                          : kdQHtml(st.q, st.vals, st.cur) + (st.q.nb > 1 ? `<small class="kq-hint">✓ moves to the next blank</small>` : '');
    box.querySelectorAll('.kcq-pips i').forEach((p, i)=> p.classList.toggle('on', i < st.got));
  };
  const next = async ()=>{
    st.q = kqNext(K); st.vals = Array.from({ length:st.q.nb }, ()=> ''); st.cur = 0; st.at = performance.now(); draw();
    /* (4.74) a problem sum: worked out on its own card; right, it counts three */
    if(st.q.skill === 'word'){
      const q = st.q, r = await kqwOpen(q, { title:'A problem sum for the builders: right, it counts 3', grade:(vals, ms)=> kqAnswer(K, q, vals, ms, 'build'), right:()=> 'It counts three.' });
      if(!box.isConnected) return;
      if(r.ok) st.got = Math.min(need, st.got + 3);
      saveProfile();
      if(st.got >= need){ draw(); close(); await onDone(); return; }
      next();
    }
  };
  const close = ()=>{ removeEventListener('keydown', onKeyDown); box.remove(); if(ui.kcQ === st) ui.kcQ = null; };
  const submit = async ()=>{
    const r = kqAnswer(K, st.q, st.vals, performance.now() - st.at, 'build');
    if(r.ok){
      st.got++;
      sum.classList.remove('right', 'wrong'); void sum.offsetWidth; sum.classList.add('right');
      if(st.got >= need){ draw(); close(); await onDone(); return; }
      next();
    } else {
      st.reveal = true;
      sum.classList.remove('right', 'wrong'); void sum.offsetWidth; sum.classList.add('wrong');
      sum.innerHTML = kdQHtml(st.q, st.vals, -1, st.q.sol);
      setTimeout(()=>{ if(!box.isConnected) return; st.reveal = false; sum.classList.remove('wrong'); next(); }, 1700);
    }
    saveProfile();
  };
  const key = k=>{ if(st.reveal) return; if(kdQKey(st, k) === 'submit') submit(); else draw(); };
  const onKeyDown = e=>{
    if(!box.isConnected) return removeEventListener('keydown', onKeyDown);
    if(/^\d$/.test(e.key)){ key(e.key); e.preventDefault(); }
    else if(e.key === 'Backspace'){ key('del'); e.preventDefault(); }
    else if(e.key === 'Enter'){ key('ok'); e.preventDefault(); }
    else if(e.key === 'Tab' || e.key === 'x' || e.key === '*'){ key('next'); e.preventDefault(); }
    else if(e.key === 'Escape') close();
  };
  addEventListener('keydown', onKeyDown);
  kdPadWire(box, key);
  sum.addEventListener('click', e=>{ const bl = e.target.closest('[data-bi]'); if(bl && !st.reveal){ st.cur = +bl.dataset.bi; draw(); } });
  box.querySelector('#kcqNo').addEventListener('click', close);
  next();
}


/* ============================================================
   THE KINGDOM SCREEN (screen 'kingdom'): the board, the plot chosen, the city's cards, the partner, what to do
   ============================================================ */
function renderKingdom(){
  kdCss(); if(typeof kdNottCss === 'function') kdNottCss();
  document.querySelectorAll('.kd-over').forEach(b=> b.remove());
  $('#brandSub').textContent = 'The Kingdom';
  if(kdLocked()) return kdGateRender();                              // (4.77) the parents' password, while it is being built
  const K = kd();
  if(!K.partner) return kdNameRender();
  const P = K.partner, F = KD_FORMS[P.form], max = kdMaxHp(P, K);
  if(P.hp == null || P.hp > max) P.hp = Math.min(max, P.hp == null ? max : P.hp);
  const C = K.city;
  let sel = ui.kcSel != null && C.cells[ui.kcSel] ? ui.kcSel : kcAt(KC_C, KC_C);
  if(C.cells[sel].k === 'part'){ const s = kcSeatOf(C, C.cells[sel].of); if(s >= 0) sel = s; }
  ui.kcSel = sel;
  const pts = kdTalPoints(P), mk = kcLv(K, 'market'), potMax = mk ? Math.min(6, mk + 1) : 0;   // (4.77) no guardians: Nótt (50-kingdom-nott.js)
  const wall = kcWallAct(K), moat = kcMoatAct(K), wat = kcFieldsAct(K, 'irr'), fer = kcFieldsAct(K, 'fer');
  const army = C.army || 0, armyMax = kcArmyMax(K);
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← The Time Rift</button>
    ${kcPurseHtml(K)}
    <div class="kc-main">
      <div class="kc-boardwrap">
        <div class="kc-board" id="kcBoard">${kcBoardHtml(K, sel)}</div>
        <div class="kc-boardnote">${kcBoardNote(K)}</div>
      </div>
      <div class="kc-left">
        <div class="kd-card kc-plot" id="kcPlot">${kcPlotHtml(K, sel)}</div>
        <div class="kc-city">
          ${kcRaidCardHtml(K)}
          <div class="kd-card kc-wall">
            <div class="kc-pt">${kcIcon('wall')}<div><b>The city walls</b> <span class="kd-lv">${C.walls ? 'Level ' + C.walls : 'Not built'}</span><small>${kcWallSay(K, C.walls)}</small></div></div>
            ${wall ? kcActBtn(K, wall) : ''}
            ${C.walls ? `<div class="kc-army"><div class="kc-pt">${kcIcon('soldier')}<div><b>Soldiers on the walls</b> <span class="kd-lv">${army} of ${armyMax}</span><small>They shoot at the raiders from the walls. ${KC_SOLDIER.coins} coins to recruit; each costs ${KC_SOLDIER.upkeepCoins} coin and ${KC_SOLDIER.upkeepFood} food a day, or leaves.</small></div></div>
              ${army < armyMax ? `<div class="kc-row2"><button class="btn ${K.coins >= KC_SOLDIER.coins ? 'btn-primary' : 'btn-ghost'} kc-act" id="kcRecruit" ${K.coins >= KC_SOLDIER.coins ? '' : 'disabled'}><span class="kc-an">Recruit a soldier</span><span class="kc-cost"><span class="kc-c">${kcIcon('coins')}${KC_SOLDIER.coins}</span></span></button>
                ${armyMax - army > 1 ? `<button class="btn btn-ghost kc-act" id="kcRecruitAll" ${K.coins >= KC_SOLDIER.coins * 2 ? '' : 'disabled'}><span class="kc-an">Recruit up to ${Math.min(armyMax - army, Math.floor(K.coins / KC_SOLDIER.coins)) || armyMax - army}</span><span class="kc-cost"><span class="kc-c">${kcIcon('coins')}${KC_SOLDIER.coins} each</span></span></button>` : ''}</div>` : ''}</div>` : ''}
          </div>
          ${P.forms.includes('water') || C.moat ? `<div class="kd-card kc-wall">
            <div class="kc-pt">${kcIcon('moat')}<div><b>The moat</b> <span class="kd-lv">${C.moat ? 'Level ' + C.moat : 'Not dug'}</span><small>${kcMoatSay(C.moat)}</small></div></div>
            ${moat ? kcActBtn(K, moat) : ''}
          </div>` : ''}
          ${wat || fer ? `<div class="kd-card kc-wall kc-fieldsall">
            <div class="kc-pt">${kcIcon('field')}<div><b>The fields today</b><small>Watered, a field grows half as much again; fertile, half as much again on top. A sum a field, each day.</small></div></div>
            ${wat ? kcActBtn(K, wat) : ''}${fer ? kcActBtn(K, fer) : ''}</div>` : ''}
          ${C.last ? `<div class="kd-card kc-last">${kcDayHtml(C.last)}</div>` : `<div class="kd-card kc-last"><p class="kc-day">${kcIcon('day')}<span>Every battle you win is a day in the kingdom: the fields grow, the families pay their taxes, the soldiers are paid, the market sells.</span></p></div>`}
        </div>
      </div>
      <div class="kc-right">
        <div class="kd-card kd-partner">
          <div class="kd-pic">${kdPartnerArt(P.form, 'front', 124)}</div>
          <div class="kd-pinfo">
            <div class="kd-pname">${escapeHtml(P.name)} ${kdTypeBadge(F.type)} <span class="kd-lv">Lv ${P.level}</span></div>
            ${kdBar('Health', P.hp, max, 'hp')}
            ${kdBar('Experience', P.xp, kdNeed(P.level), 'xp')}
            <div class="kd-forms">${P.forms.length > 1 ? `Forms: ${P.forms.map(f=> kdTypeBadge(KD_FORMS[f].name === 'Stronger Physical' ? 'Physical+' : KD_FORMS[f].type)).join(' ')}` : 'Its first new form comes from Nótt, in a dream.'}</div>
          </div>
        </div>
        <div class="kd-acts">
          <button class="btn btn-primary kd-go" id="kdMeadow">${kdIcon('sword')}<span>Into the meadow<small>Rescue the mind-controlled monsters</small></span></button>
          ${typeof kdNottCardHtml === 'function' ? kdNottCardHtml(K) : ''}
          <button class="btn btn-ghost kd-rest" id="kdRest" ${P.hp >= max ? 'disabled' : ''}>Rest at the palace<small>${P.hp >= max ? 'Fully healed' : 'Heals in full'}</small></button>
          ${potMax ? `<button class="btn btn-ghost kd-rest" id="kdPotion" ${K.potions >= potMax || K.coins < KD_POTION ? 'disabled' : ''}>Buy a potion<small>${K.potions} of ${potMax} · ${KD_POTION} coins</small></button>` : ''}
          <button class="btn kd-rest kd-tal ${pts ? 'has' : ''}" id="kdTal">Talents<small>${pts ? `${pts} point${pts > 1 ? 's' : ''} to spend` : 'A point every level'}</small></button>
        </div>
      </div>
    </div>
    <div class="kd-foot">
      <button class="btn btn-ghost pill" id="kdGrown">For grown-ups: the sums</button>
      <span>${K.stats.won} rescued · ${K.stats.lost} lost</span>
    </div>`;
  $('#backBtn').addEventListener('click', ()=>{ ui.walkFresh = false; go('r6_rift'); });
  $('#kdMeadow').addEventListener('click', ()=> kdBattleStart(kdWild()));
  $('#kdRest').addEventListener('click', async ()=>{ P.hp = kdMaxHp(P, K); await saveProfile(); kcRerender(); });
  const pt = $('#kdPotion'); if(pt) pt.addEventListener('click', async ()=>{ if(K.coins < KD_POTION || K.potions >= potMax) return; K.coins -= KD_POTION; K.potions++; await saveProfile(); kcRerender(); });
  $('#kdTal').addEventListener('click', ()=> go('kdTalents'));
  $('#kdGrown').addEventListener('click', ()=> kdGrownUps());
  $('#kcBoard').addEventListener('click', e=>{ const g = e.target.closest('[data-i]'); if(!g) return; kcSelect(+g.dataset.i); });
  screenEl.querySelectorAll('.kc-wall [data-act]').forEach(b=> b.addEventListener('click', ()=>{
    const id = b.dataset.act, a = id === 'walls' ? kcWallAct(K) : id === 'moat' ? kcMoatAct(K) : id === 'all-irr' ? kcFieldsAct(K, 'irr') : id === 'all-fer' ? kcFieldsAct(K, 'fer') : null;
    kcRun(K, a, a && a.label); }));
  const rc = $('#kcRecruit'); if(rc) rc.addEventListener('click', ()=> kcRecruit(K, 1));
  const ra = $('#kcRecruitAll'); if(ra) ra.addEventListener('click', ()=> kcRecruit(K, kcArmyMax(K) - (K.city.army || 0)));
  const rd = $('#kcDefend'); if(rd) rd.addEventListener('click', ()=>{ if(typeof kdRaidStart === 'function') kdRaidStart(); });
  kcPlotWire(K, sel);
  kcBoardWire();
  kcPaintBoard();
  ui.kcPop = null;
  if(!K.met && !ui.kdTalk) setTimeout(kdWelcome, 300);
  else if(!K.vesper && !ui.kdTalk && typeof kdVesperNews === 'function') setTimeout(kdVesperNews, 300);
  else if(typeof kdDreamDue === 'function' && kdDreamDue(K) && !ui.kdDreaming) setTimeout(kdNottDreamDue, 500);   // (4.77) Nótt
}
async function kcRecruit(K, n){
  const C = K.city, room = kcArmyMax(K) - (C.army || 0), can = Math.min(n, room, Math.floor(K.coins / KC_SOLDIER.coins));
  if(can <= 0) return;
  K.coins -= can * KC_SOLDIER.coins; C.army = (C.army || 0) + can;
  await saveProfile(); kcRerender();
  toast(can > 1 ? `${can} soldiers join the walls.` : 'A soldier joins the walls.');
}
/* drawn again where it was (neither the page nor the board jumps) */
function kcRerender(){ const y = window.scrollY; renderKingdom(); window.scrollTo(0, y); }
function kcSelect(i){
  const K = kd(), C = K.city;
  if(C.cells[i] && C.cells[i].k === 'part'){ const s = kcSeatOf(C, C.cells[i].of); if(s >= 0) i = s; }
  ui.kcSel = i;
  const r = $('#kcSel'), [x, y, w, h] = kcSelRect(C, i);
  if(r){ r.setAttribute('x', x * 100 + 3); r.setAttribute('y', y * 100 + 3); r.setAttribute('width', w * 100 - 6); r.setAttribute('height', h * 100 - 6); }
  const p = $('#kcPlot'); if(p){ p.innerHTML = kcPlotHtml(K, i); kcPlotWire(K, i); }
}
function kcPlotWire(K, i){
  screenEl.querySelectorAll('#kcPlot [data-act]').forEach(b=> b.addEventListener('click', ()=>{
    const a = kcActions(K, i).find(x=> x.id === b.dataset.act);
    kcRun(K, a, a && kcJobTitle(K, i, a));
  }));
}
function kcJobTitle(K, i, a){ const c = K.city.cells[i]; return a.id === 'clear' ? 'Burning back the wild' : a.id.startsWith('new-') ? `Building ${KC_B[a.id.slice(4)].a}` : `${KC_B[c.k] ? KC_B[c.k].name : 'It'}: ${a.label.toLowerCase()}`; }
function kcPlotName(C, c, x, y){
  if(c.k === 'wild') return kcInside(C, x, y) ? 'Wild land, inside the walls\' reach' : 'Wild land';
  if(c.k === 'clear') return kcInside(C, x, y) ? 'An empty plot in the city' : 'An empty plot outside the city';
  return KC_B[c.k].name;
}
function kcPlotHtml(K, i){
  const C = K.city, c = C.cells[i], [x, y] = kcXY(i), B = KC_B[c.k];
  const say = c.k === 'wild' ? (kcReach(C, x, y) ? 'Brambles and trees. Burnt back, it can be built on.' : 'Deep forest, beyond the city\'s reach for now.')
    : c.k === 'clear' ? (kcInside(C, x, y) ? 'Inside the walls: for houses, and towers once the walls stand.' : 'Outside the walls: for fields.')
    : B.say(c.lv, K, c);
  const acts = kcActions(K, i);
  let extra = '';
  if(c.k === 'tower'){ const sp = c.spells || [], slots = kcSpellSlots(kcLv(K, 'palace'));
    extra = `<div class="kc-spells"><b>Spells</b> ${sp.length} of ${slots}: ${sp.length ? sp.map(s=> `<span class="kc-sp ${s.k}">${KC_SPELLS[s.k].name} <em>${s.casts}</em></span>`).join('') : '<span class="kc-none">none charged</span>'}</div>`; }
  if(c.k === 'yard' && c.lv) extra = `<div class="kc-spells"><b>Repair kits</b> ${C.kits || 0} of ${kcKitMax(K)}</div>`;
  if(c.k === 'barracks' && c.lv) extra = `<div class="kc-spells"><b>Reserves</b> ${C.reserves || 0} of ${kcReserveMax(K)}</div>`;
  if(c.k === 'palace' && C.plan) extra = `<div class="kc-spells">The palace grounds are four plots by three, inside the palace's own walls; each level makes the palace grander.</div>`;   // (4.78)
  if(KC_MAIN.includes(c.k) && C.plan && c.lv < 6) extra = `<div class="kc-spells">Its lot is four plots, and it fills them; each level adds to it.</div>`;
  return `<div class="kc-pt">${kcIcon(B ? c.k : c.k === 'wild' ? 'wild' : 'clear')}<div><b>${kcPlotName(C, c, x, y)}</b>${B ? ` <span class="kd-lv">${c.lv ? 'Level ' + c.lv : 'In ruins'}</span>` : ''}<small>${say}</small></div></div>
    ${extra}
    ${acts.length ? `<div class="kc-acts">${acts.map(a=> kcActBtn(K, a)).join('')}</div>` : `<small class="kc-full">As good as it can be.</small>`}`;
}
function kcActBtn(K, a){
  const enough = kcAfford(K, a.cost);
  const cost = KC_RES.map((r, j)=> (a.cost[j] || 0) ? `<span class="kc-c ${kcHave(K, r) >= a.cost[j] ? '' : 'short'}">${kcIcon(r)}${a.cost[j]}</span>` : '').join('');
  return `<button class="btn kc-act ${a.ok && enough ? 'btn-primary' : 'btn-ghost'}" data-act="${a.id}" ${a.ok ? '' : 'disabled'}>
    <span class="kc-an">${a.label}</span>
    <span class="kc-cost">${cost}${a.sums ? `<span class="kc-c sums">${a.sums} sum${a.sums > 1 ? 's' : ''}</span>` : ''}</span>
    ${a.why ? `<small class="kc-why">${a.why}</small>` : ''}</button>`;
}
/* THE RAIDS' CARD: the castle's level, the three raids of it, what the next one unlocks, the city's defences */
function kcRaidCardHtml(K){
  const C = K.city, CL = kcCastle(K), nx = kcRaidNext(K), T = kcTowers(C);
  const spells = T.reduce((a, i)=> a + (C.cells[i].spells || []).length, 0);
  const def = `<div class="kc-def"><span>${kcIcon('soldier')}${C.army || 0} soldiers</span><span>${kcIcon('tower')}${T.length} tower${T.length === 1 ? '' : 's'}, ${spells} spell${spells === 1 ? '' : 's'}</span><span>${kcIcon('kit')}${C.kits || 0} repair kits</span><span>${kcIcon('reserve')}${C.reserves || 0} reserves</span></div>`;
  if(CL < 2) return `<div class="kd-card kc-wall kc-raid"><div class="kc-pt">${kcIcon('raid')}<div><b>The aliens</b> <span class="kd-lv">Castle level ${CL}</span>
    <small>Once the palace, the four main buildings, the walls and a tower all stand at level 2 or more, the aliens will raid the city: three times a level, and a fourth time, all at once, when the whole castle has gone up a level. Each raid held off lets the city grow; each final raid brings Nótt with a new element.</small></div></div></div>`;
  /* (4.77) four a level: three, then the final raid once the whole castle has gone up */
  const RL = nx ? nx.CL : CL, won = kcRaidsWon(K, RL);
  return `<div class="kd-card kc-wall kc-raid ${nx && nx.ready ? 'due' : ''}"><div class="kc-pt">${kcIcon('raid')}<div><b>The aliens</b> <span class="kd-lv">Castle level ${CL}</span>
    <small>${nx ? (nx.final ? `The final raid of castle level ${RL} is coming: every alien at once. Held off, Nótt comes in a dream with the next element.` : `Raid ${nx.n} of 4 is coming. Held off, it opens ${KC_RAID_UNLOCKS[nx.n]}.`)
      : CL >= KC_MAX ? 'The kingdom is at its greatest.' : won >= 3 ? `Raise everything to level ${RL + 1}: then the final raid of castle level ${RL}.` : 'Raise everything to the next level: the raids of the next castle level follow.'}</small></div></div>
    <div class="kc-raidpips" aria-label="${won} of 4 raids of castle level ${RL} held off">${[1, 2, 3, 4].map(n=> `<i class="${n === 4 ? 'fin ' : ''}${n <= won ? 'on' : nx && nx.n === n ? 'next' : ''}"></i>`).join('')}<span>${won} of 4 held off</span></div>
    ${def}
    ${nx ? `<button class="btn ${nx.ready ? 'btn-primary' : 'btn-ghost'} kc-act kc-defend" id="kcDefend" ${nx.ready ? '' : 'disabled'}><span class="kc-an">Defend the city</span>${nx.why ? `<small class="kc-why">${nx.why}</small>` : '<small class="kc-why">Load the towers, the yard and the barracks first: everything is used by itself in the raid.</small>'}</button>` : ''}</div>`;
}
function kcBoardNote(K){
  const P = kcLv(K, 'palace');
  return `Drag to look round. Inside the walls: ${2 * kcHalf(P) + 1} by ${2 * kcHalf(P) + 1} plots; the wild can be burnt back ${kcBand(P)} plots beyond. Towers: ${kcTowers(K.city).length} of ${kcMaxTowers(P)}.`;
}
function kcPurseHtml(K){
  const r = (k, v, label)=> `<span class="kc-r ${k}" aria-label="${v} ${label}">${kcIcon(k)}<b>${v}</b><small>${label}</small></span>`;
  return `<div class="kc-purse">
    ${r('coins', K.coins, 'coins')}${r('food', `${K.food}<i>/${kcFoodCap(K)}</i>`, 'food')}${r('wood', K.mats.wood, 'wood')}${r('stone', K.mats.stone, 'stone')}${r('iron', K.mats.iron, 'iron')}
    <span class="kc-r day">${kcIcon('day')}<b>Day ${K.city.day}</b></span></div>`;
}
function kdBar(label, v, max, cls){
  const pct = Math.max(0, Math.min(100, Math.round(v * 100 / Math.max(1, max))));
  return `<div class="kd-bar ${cls}" role="img" aria-label="${label} ${v} of ${max}"><span>${label}</span><i><b style="width:${pct}%"></b></i><em>${v} / ${max}</em></div>`;
}
const KD_ICON = { sword:'<path d="M14.5 3H21v6.5L10 20.5 3.5 14z"/><path d="M5.5 16.5L3 19l2 2 2.5-2.5"/>' };
const kdIcon = (k, cls)=> `<svg class="kd-ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${KD_ICON[k]}</svg>`;
/* the small pictures: the purse's, and each plot's */
function kcIcon(k){
  const I = {
    coins:'<circle cx="12" cy="12" r="8.5" fill="#f2c24e" stroke="#a5741c" stroke-width="1.6"/><circle cx="12" cy="12" r="5.2" fill="none" stroke="#c99325" stroke-width="1.4"/><path d="M10 9.5h3.2a1.6 1.6 0 0 1 0 3.2H10.6M10 14.5h3.4" stroke="#a5741c" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
    food:'<path d="M12 21V8" stroke="#a5741c" stroke-width="1.6"/><g fill="#e2b84a" stroke="#a5741c" stroke-width="1"><ellipse cx="12" cy="5" rx="1.8" ry="3"/><ellipse cx="8.6" cy="9" rx="1.6" ry="2.8" transform="rotate(-30 8.6 9)"/><ellipse cx="15.4" cy="9" rx="1.6" ry="2.8" transform="rotate(30 15.4 9)"/><ellipse cx="8.8" cy="13.8" rx="1.6" ry="2.8" transform="rotate(-30 8.8 13.8)"/><ellipse cx="15.2" cy="13.8" rx="1.6" ry="2.8" transform="rotate(30 15.2 13.8)"/></g>',
    wood:'<rect x="3" y="8" width="16" height="8" rx="4" fill="#b07a45" stroke="#6b4422" stroke-width="1.4"/><ellipse cx="19" cy="12" rx="2.6" ry="4" fill="#e2b98a" stroke="#6b4422" stroke-width="1.4"/><ellipse cx="19" cy="12" rx="1" ry="1.6" fill="none" stroke="#a5743f" stroke-width="1"/><path d="M6 11h7M8 13.5h6" stroke="#8a5a2b" stroke-width="1"/>',
    stone:'<path d="M4 17l2-8 6-4 7 3 2 8-6 4z" fill="#a9a49a" stroke="#5f5a52" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 9l6 2 7-3M12 11l-1 9" stroke="#7d786e" stroke-width="1" fill="none"/>',
    iron:'<path d="M3 16l3-7h12l3 7z" fill="#8f9bab" stroke="#3f4855" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 9l2 3h8l2-3M8 12l-2 4M16 12l2 4" stroke="#5f6b7a" stroke-width="1" fill="none"/>',
    day:'<circle cx="12" cy="12" r="4.4" fill="#f6c94c" stroke="#b07a1c" stroke-width="1.4"/><g stroke="#b07a1c" stroke-width="1.6" stroke-linecap="round"><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></g>',
    wild:'<circle cx="8" cy="10" r="5" fill="#3f7a35"/><circle cx="15" cy="8" r="5.5" fill="#2e5a2b"/><circle cx="14" cy="15" r="5" fill="#4d8a3f"/>',
    clear:'<path d="M3 16c3-3 15-3 18 0v3H3z" fill="#cfae72" stroke="#8a6d4b" stroke-width="1.2"/><circle cx="8" cy="15" r="1" fill="#8a7a62"/><circle cx="15" cy="16" r="1.2" fill="#8a7a62"/>',
    house:'<path d="M4 11l8-6 8 6" fill="#b9533c" stroke="#6b2a1c" stroke-width="1.4" stroke-linejoin="round"/><rect x="6" y="11" width="12" height="9" fill="#ecdcb8" stroke="#8a6d4b" stroke-width="1.4"/><rect x="10.5" y="14" width="3" height="6" fill="#7a4a2a"/>',
    field:'<rect x="3" y="6" width="18" height="13" rx="2" fill="#9b6a3a"/><path d="M5 9h14M5 12.5h14M5 16h14" stroke="#6fb34a" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="2 2.4"/>',
    tower:'<path d="M8 21V9l4-6 4 6v12z" fill="#b3ab9b" stroke="#5f5a52" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 9h8" stroke="#5f5a52" stroke-width="1.2"/><path d="M12 3l-5 6h10z" fill="#6b4a8a"/><circle cx="12" cy="13" r="1.6" fill="#a9e2ff"/><path d="M11 21v-3h2v3" fill="#4a3a2a"/>',
    palace:'<path d="M3 20V10h3V7h2v3h2V5l2-2 2 2v5h2V7h2v3h3v10z" fill="#e9dfc8" stroke="#6b5b45" stroke-width="1.3" stroke-linejoin="round"/><path d="M10.5 20v-4a1.5 1.5 0 0 1 3 0v4" fill="#3e5f9a"/>',
    barracks:'<rect x="4" y="9" width="16" height="11" fill="#d9d2c2" stroke="#5f5a52" stroke-width="1.3"/><path d="M3 10l9-6 9 6" fill="#8a2f26" stroke="#5a1c16" stroke-width="1.3" stroke-linejoin="round"/><path d="M10 20v-5h4v5" fill="#4a3a2a"/><path d="M6 12v5M18 12v5" stroke="#8a2f26" stroke-width="2"/>',
    market:'<path d="M3 9l2-4h14l2 4z" fill="#c8463c" stroke="#7a2a22" stroke-width="1.2"/><path d="M7 5l-1 4M11 5v4M15 5l1 4" stroke="#f6eee0" stroke-width="1.6"/><rect x="5" y="9" width="14" height="10" fill="#e9d7b0" stroke="#8a6d4b" stroke-width="1.2"/><rect x="8" y="13" width="3" height="3" fill="#a8743f"/><rect x="13" y="13" width="3" height="3" fill="#6fb34a"/>',
    yard:'<path d="M5 20V6h2v14M17 20V9h2v11M4 8h16" stroke="#8a5a2b" stroke-width="1.8" fill="none"/><path d="M12 8v5" stroke="#5f5a52" stroke-width="1.2"/><rect x="10" y="13" width="4" height="3" fill="#a9a49a" stroke="#5f5a52"/><rect x="3" y="18" width="18" height="2.5" rx="1.2" fill="#b07a45"/>',
    granary:'<path d="M4 20V10l8-6 8 6v10z" fill="#a5462f" stroke="#5f2418" stroke-width="1.3" stroke-linejoin="round"/><path d="M9 20v-6h6v6M9 14l6 6M15 14l-6 6" stroke="#f3e6d0" stroke-width="1.2" fill="none"/>',
    wall:'<path d="M3 20V9h3V7h3v2h2V7h2v2h2V7h3v2h3v11z" fill="#b3ab9b" stroke="#5f5a52" stroke-width="1.3" stroke-linejoin="round"/><path d="M10 20v-4a2 2 0 0 1 4 0v4" fill="#4a3a2a"/>',
    moat:'<path d="M2 14c2.5-2 5-2 7.5 0s5 2 7.5 0 3-2 5 0v6H2z" fill="#5aa9e0" stroke="#2b6f9e" stroke-width="1.3"/><path d="M4 17c2-1 4-1 6 0" stroke="#d8efff" stroke-width="1.2" fill="none"/>',
    soldier:'<circle cx="12" cy="7" r="3.2" fill="#e7c9a0" stroke="#6b4a2a" stroke-width="1.1"/><path d="M8.6 6.4a3.4 3.4 0 0 1 6.8 0z" fill="#8f9bab" stroke="#3f4855" stroke-width="1"/><path d="M6.5 21v-5a5.5 5.5 0 0 1 11 0v5z" fill="#8a2f26" stroke="#5a1c16" stroke-width="1.1"/><path d="M19 4v15" stroke="#6b4a2a" stroke-width="1.4"/><path d="M17.5 5l1.5-2 1.5 2" fill="#8f9bab"/>',
    kit:'<rect x="4" y="8" width="16" height="11" rx="2" fill="#c9a26a" stroke="#6b4a2a" stroke-width="1.3"/><path d="M9 8V6h6v2" fill="none" stroke="#6b4a2a" stroke-width="1.3"/><path d="M12 11v5M9.5 13.5h5" stroke="#8a2f26" stroke-width="2" stroke-linecap="round"/>',
    reserve:'<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" fill="#c8463c" stroke="#5a1c16" stroke-width="1.3"/><path d="M12 7v9M8.5 11h7" stroke="#f6eee0" stroke-width="1.6"/>',
    raid:'<circle cx="12" cy="11" r="7" fill="#7b5bd6" stroke="#3a2a7a" stroke-width="1.3"/><ellipse cx="9.4" cy="10.4" rx="1.8" ry="2.6" fill="#1a1236"/><ellipse cx="14.6" cy="10.4" rx="1.8" ry="2.6" fill="#1a1236"/><path d="M9 4L7 1.5M15 4l2-2.5" stroke="#3a2a7a" stroke-width="1.4"/><path d="M8 19l-1 3M16 19l1 3M12 18v4" stroke="#3a2a7a" stroke-width="1.4"/>',
  };
  /* (4.74) coins and the three materials: the designer's item pictures (assets/items), the drawn one if one is missing */
  const PIC = { coins:'coin', wood:'wood', stone:'stone', iron:'iron' };
  if(PIC[k]) return `<span class="kc-ic kc-pic ${k}"><svg viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg><img src="assets/items/${PIC[k]}.png" alt="" onerror="this.previousElementSibling.style.visibility='visible';this.remove()"></span>`;
  return `<svg class="kc-ic ${k}" viewBox="0 0 24 24" aria-hidden="true">${I[k] || I.clear}</svg>`;
}

/* ============================================================
   THE BOARD: 21 by 21 plots, 100 units a plot, seen zoomed out and dragged round (the designer: "for now we will use a
   zoomed out view that can be scrolled"). The picture is painted on a canvas (47-kingdom-art.js); over it lies a
   see-through layer: a plot for each finger's tap, the ring round what is chosen, a flash on what was just built.
   ============================================================ */
const kcPlotPx = ()=> (window.innerWidth >= 700 ? 56 : 46);
function kcBoardHtml(K, sel){
  const C = K.city, W = KC_N * kcPlotPx(), [sx, sy, sw, sh] = kcSelRect(C, sel), U = KC_N * 100;
  const hits = C.cells.map((c, i)=>{ const [x, y] = kcXY(i); return `<rect class="kc-hit" data-i="${i}" x="${x * 100}" y="${y * 100}" width="100" height="100" fill="transparent"/>`; }).join('');
  /* where the walls will go, until they stand */
  const lo = (KC_C - 2) * 100, ring = !C.walls && kcRingClear(C) ? `<rect x="${lo}" y="${lo}" width="500" height="500" fill="none" stroke="rgba(255,248,230,.62)" stroke-width="4" stroke-dasharray="12 14" pointer-events="none"/>` : '';
  const pop = ui.kcPop != null && C.cells[ui.kcPop] ? (()=>{ const [x, y, w, h] = kcSelRect(C, ui.kcPop); return `<rect class="kc-pop" x="${x * 100 + 4}" y="${y * 100 + 4}" width="${w * 100 - 8}" height="${h * 100 - 8}" rx="12" pointer-events="none"/>`; })() : '';
  return `<div class="kc-scroll" id="kcScroll"><div class="kc-map" style="width:${W}px;height:${W}px">
    <canvas class="kc-cv" id="kcCv" width="${W}" height="${W}" aria-hidden="true"></canvas>
    <svg class="kc-svg" viewBox="0 0 ${U} ${U}" role="img" aria-label="The city and the land round it, ${KC_N} plots by ${KC_N}">
      ${ring}${C.walls ? `<g class="kc-walls" data-level="${C.walls}" pointer-events="none"></g>` : ''}${pop}${hits}
      <rect id="kcSel" x="${sx * 100 + 3}" y="${sy * 100 + 3}" width="${sw * 100 - 6}" height="${sh * 100 - 6}" rx="10" fill="none" stroke="#ffd34d" stroke-width="7" pointer-events="none"/>
    </svg></div></div>`;
}
/* the board's scroll, kept between visits; at first, the palace in the middle */
function kcBoardWire(){
  const sc = $('#kcScroll'); if(!sc) return;
  const px = kcPlotPx();
  if(ui.kcScroll){ sc.scrollLeft = ui.kcScroll[0]; sc.scrollTop = ui.kcScroll[1]; }
  else { sc.scrollLeft = Math.max(0, (KC_C + 0.5) * px - sc.clientWidth / 2); sc.scrollTop = Math.max(0, (KC_C + 0.5) * px - sc.clientHeight / 2); }
  sc.addEventListener('scroll', ()=>{ ui.kcScroll = [sc.scrollLeft, sc.scrollTop]; }, { passive:true });
}
/* paint the picture (kept between visits: drawn again only when the city has changed, or the board's size) */
function kcPaintBoard(){
  const cv = document.getElementById('kcCv');
  if(!cv || typeof KC_ART === 'undefined') return;
  try { KC_ART.paint(cv, kd()); } catch(e){ console.error('kingdom board:', e); }
}
let kcResizeT = 0;
window.addEventListener('resize', ()=>{ clearTimeout(kcResizeT); kcResizeT = setTimeout(()=>{ if(document.getElementById('kcCv') && ui.screen === 'kingdom') kcRerender(); }, 220); });

/* ============================================================
   THE LOOK (the city's)
   ============================================================ */
function kcCss(){
  if(document.getElementById('kcCss')) return;
  const st = document.createElement('style'); st.id = 'kcCss';
  st.textContent = `
  .kc-purse{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:4px 0 10px;}
  .kc-r{display:inline-flex;align-items:center;gap:5px;background:var(--paper-2);border:1px solid var(--line);border-radius:999px;padding:4px 11px 4px 6px;}
  .kc-r b{font:800 17px/1 'Baloo 2',cursive;font-variant-numeric:tabular-nums;}
  .kc-r b i{font-style:normal;font-size:12px;color:var(--ink-soft);font-weight:700;}
  .kc-r small{font:700 11px 'Nunito',sans-serif;color:var(--ink-soft);}
  .kc-r.day{margin-left:auto;background:#fdf3d6;}
  .kc-ic{width:20px;height:20px;flex:0 0 auto;}
  .kc-pic{position:relative;display:inline-block;vertical-align:middle;}
  .kc-pic svg{display:block;width:100%;height:100%;visibility:hidden;}
  .kc-pic img{position:absolute;left:-10%;top:-10%;width:120%;height:120%;image-rendering:pixelated;}
  .kc-main{display:grid;grid-template-columns:minmax(0, 1.25fr) minmax(0, 1fr);grid-template-areas:"board board" "left right";gap:14px;align-items:start;}
  .kc-boardwrap{grid-area:board;min-width:0;}
  .kc-left{grid-area:left;} .kc-right{grid-area:right;}
  .kc-right .kd-partner{flex-wrap:wrap;}
  .kc-right .kd-pic{width:92px;height:92px;}
  .kc-right .kd-pic .kd-mon{width:104px !important;height:104px !important;}
  .kc-right .kd-pinfo{min-width:150px;}
  .kc-right .kd-bar{grid-template-columns:64px 1fr auto;}
  .kc-left, .kc-right{display:flex;flex-direction:column;gap:10px;min-width:0;}
  .kc-board{position:relative;border-radius:16px;overflow:hidden;box-shadow:0 3px 10px var(--shadow), inset 0 0 0 1px var(--line);background:#2c5226;}
  .kc-scroll{height:min(600px, 64vh);overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;}
  .kc-map{position:relative;}
  .kc-cv{position:absolute;inset:0;display:block;width:100%;height:100%;}
  .kc-svg{position:absolute;inset:0;width:100%;height:100%;touch-action:pan-x pan-y;}
  .kc-boardnote{font:700 11.5px 'Nunito',sans-serif;color:var(--ink-soft);margin:5px 4px 0;}
  .kc-hit{cursor:pointer;}
  .kc-pop{fill:#fff6cf;animation:kcPop .9s ease-out forwards;}
  @keyframes kcPop{0%{opacity:.8;}100%{opacity:0;}}
  @media (prefers-reduced-motion:reduce){ .kc-pop{animation:none;opacity:0;} }
  .kc-plot{display:flex;flex-direction:column;gap:8px;}
  .kc-pt{display:flex;gap:10px;align-items:flex-start;}
  .kc-pt > .kc-ic{width:36px;height:36px;padding:4px;border-radius:10px;background:var(--paper);box-shadow:inset 0 0 0 1px var(--line);}
  .kc-pt b{font:800 16px/1.15 'Baloo 2',cursive;}
  .kc-pt small{display:block;font-size:12.5px;font-weight:600;color:var(--ink-soft);line-height:1.35;margin-top:2px;}
  .kc-acts{display:flex;flex-direction:column;gap:6px;}
  .kc-act{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;text-align:left;padding:9px 12px !important;}
  .kc-an{font:800 15px 'Baloo 2',cursive;}
  .kc-cost{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center;}
  .kc-c{display:inline-flex;align-items:center;gap:2px;font:800 13px 'Nunito',sans-serif;font-variant-numeric:tabular-nums;}
  .kc-c .kc-ic{width:16px;height:16px;}
  .kc-c.short{color:#b3261e;}
  .btn-primary .kc-c.short{color:#ffd0c8;}
  .kc-c.sums{background:rgba(35,32,25,.1);border-radius:999px;padding:1px 8px;}
  .btn-primary .kc-c.sums{background:rgba(255,255,255,.22);}
  .kc-why{flex-basis:100%;font-size:12px;font-weight:700;color:var(--ink-soft);}
  .btn-primary .kc-why{color:rgba(255,248,234,.85);}
  .kc-full{font-size:12.5px;font-weight:700;color:var(--ink-soft);}
  .kc-spells{display:flex;flex-wrap:wrap;gap:5px;align-items:center;font-size:12.5px;font-weight:700;color:var(--ink-soft);}
  .kc-spells b{color:var(--ink);font:800 14px 'Baloo 2',cursive;}
  .kc-sp{border-radius:999px;padding:2px 9px;font-weight:800;color:#fff;}
  .kc-sp em{font-style:normal;opacity:.85;margin-left:3px;}
  .kc-sp.fire{background:#d4643a;} .kc-sp.thunder{background:#c79a1d;} .kc-sp.frost{background:#3b7ea1;} .kc-sp.silence{background:#7b5bb8;}
  .kc-none{font-weight:600;}
  .kc-city{display:grid;grid-template-columns:1fr;gap:10px;}
  .kc-wall{display:flex;flex-direction:column;gap:8px;}
  .kc-army{display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--line);padding-top:8px;}
  .kc-row2{display:flex;flex-wrap:wrap;gap:6px;}
  .kc-row2 .kc-act{flex:1 1 180px;}
  .kc-raid.due{box-shadow:inset 0 0 0 2px #7b5bd6, 0 0 12px rgba(123,91,214,.35);}
  .kc-raidpips{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--ink-soft);}
  .kc-raidpips i{width:26px;height:10px;border-radius:999px;background:rgba(35,32,25,.13);}
  .kc-raidpips i.on{background:var(--jade);} .kc-raidpips i.next{background:#b9a6f0;animation:kdbPulse .7s ease-in-out infinite alternate;}
  .kc-raidpips i.fin{width:34px;box-shadow:inset 0 0 0 2px #8a6bd8;} .kc-raidpips i.fin.on{background:#6d4bd8;}   /* (4.77) the final raid */
  .kc-def{display:flex;flex-wrap:wrap;gap:6px 12px;font-size:12.5px;font-weight:700;color:var(--ink-soft);}
  .kc-def span{display:inline-flex;align-items:center;gap:4px;}
  .kc-def .kc-ic{width:17px;height:17px;}
  .kc-defend{background:#5b3f8f !important;color:#fff3dd !important;box-shadow:0 4px 0 #3d2862 !important;}
  .kc-defend:disabled{background:var(--paper-2) !important;color:var(--ink-soft) !important;box-shadow:inset 0 0 0 1px var(--line) !important;}
  .kc-day{display:flex;gap:8px;align-items:flex-start;font-size:13px;font-weight:600;color:var(--ink-soft);margin:4px 0;line-height:1.4;text-align:left;}
  .kc-day b{color:var(--ink);}
  .kd-partner{display:flex;gap:12px;align-items:center;}
  .kd-pinfo{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;}
  .kd-pname{font:800 20px/1.1 'Baloo 2',cursive;display:flex;flex-wrap:wrap;align-items:center;gap:6px;}
  .kd-forms{font-size:12px;font-weight:600;color:var(--ink-soft);display:flex;flex-wrap:wrap;gap:4px;align-items:center;}
  .kd-bar{display:grid;grid-template-columns:76px 1fr auto;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--ink-soft);}
  .kd-bar i{display:block;height:10px;border-radius:999px;background:rgba(35,32,25,.12);overflow:hidden;}
  .kd-bar b{display:block;height:100%;border-radius:999px;background:var(--jade);}
  .kd-bar.xp b{background:var(--gold);}
  .kd-bar em{font-style:normal;font-variant-numeric:tabular-nums;}
  .kd-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .kd-go{display:flex;align-items:center;justify-content:center;gap:10px;grid-column:1 / -1;font-size:19px;}
  .kd-go span{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1;}
  .kd-go small{font:700 12px/1.2 'Nunito',sans-serif;opacity:.9;}
  .kd-go .kd-ic{width:26px;height:26px;}
  .kd-boss{background:#5b3f8f;color:#fff3dd;box-shadow:0 4px 0 #3d2862;}
  .kd-rest{display:flex;flex-direction:column;align-items:center;font-size:15px;padding:10px 12px;}
  .kd-rest small{font:700 11px/1.2 'Nunito',sans-serif;color:var(--ink-soft);}
  .kd-tal.has{background:#fbf1d6;box-shadow:inset 0 0 0 2px var(--gold);}
  .kd-tal.has small{color:#8a6420;}
  .kd-next{grid-column:1 / -1;display:flex;flex-direction:column;gap:5px;}
  .kd-next b{font:800 15px 'Baloo 2',cursive;}
  .kd-next > small{font-size:12px;font-weight:600;color:var(--ink-soft);}
  .kd-need{display:grid;grid-template-columns:1fr auto;gap:2px 8px;font-size:12px;font-weight:700;color:var(--ink-soft);}
  .kd-need em{font-style:normal;font-variant-numeric:tabular-nums;}
  .kd-need i{grid-column:1 / -1;height:6px;border-radius:999px;background:rgba(35,32,25,.12);overflow:hidden;}
  .kd-need b{display:block;height:100%;background:#7d5bb8;}
  .kd-need.ok{color:var(--jade-dark);}
  .kd-need.ok b{background:var(--jade);}
  /* the builders' sums */
  .kcq-card{gap:8px;}
  .kcq-pips{display:flex;gap:5px;flex-wrap:wrap;}
  .kcq-pips i{width:22px;height:10px;border-radius:999px;background:rgba(35,32,25,.13);transition:background .2s;}
  .kcq-pips i.on{background:var(--jade);}
  .kcq-card .kdb-pad{max-width:420px;align-self:center;width:100%;}
  @media (max-width:700px){ .kc-main{grid-template-columns:minmax(0,1fr);grid-template-areas:"right" "board" "left";} .kc-scroll{height:min(430px, 58vh);} }
  @media (max-width:560px){ .kc-r{padding:3px 8px 3px 5px;} .kc-r small{display:none;} .kc-r b{font-size:15px;} .kd-acts{grid-template-columns:1fr;} .kcq-card .kdb-key{height:52px;} }
  `;
  document.head.appendChild(st);
}
