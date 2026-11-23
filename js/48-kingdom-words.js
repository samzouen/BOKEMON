/* ==========================================================
   48-kingdom-words.js — (4.74) PROBLEM SUMS: the kingdom's final difficulty level.
   The designer: "Final difficulty level: problem sums for a lot of energy or to unleash an ultra move (buys 15 seconds of
   time stop) (a few different formats): leg multiplications totals, differences, etc. numbers and names are permutated.
   Eg a water dragon has 4 legs and a monkey king has 2. How many legs would 15 water dragons and 5 monkey kings have? Or
   'if there are 7 monsters and 20 legs in total, how many water dragons are there?' Or 'if there are 8 water dragons and
   12 monkey kings, do the water dragons have more legs or fewer legs than the monkey kings? How many more or fewer?' The
   important thing is to have options available to permutate different items (legs, heads, wings, eggs, fruits, etc) and
   for the numbers to change each time."
   Five formats, each a key of its own (its box, as a fact's):
     wt  altogether      A has a, B has b: how many in nA of A and nB of B?            nA × a + nB × b
     we  each            nA of A have T: how many does each have?                       T ÷ nA
     wm  more or fewer   nA of A, nB of B: more or fewer, and by how many?              more | fewer, |nA × a − nB × b|
     wr  the others      nA of A and some of B have T: how many of B?                   (T − nA × a) ÷ b
     wc  how many of A   N of them, T altogether: how many of A?                        (T − N × b) ÷ (a − b)
   Pure, like the rest of the sums (45-kingdom.js): kqWord(f) makes one, kqItem('w' + f) asks for it.
   ========================================================== */
/* what is counted, and how a sentence says it ("a duck lays 6 eggs", "a basket holds 8 fruits") */
const KQW_ITEMS = {
  legs:   { one:'leg',    many:'legs',    has:'has',     have:'have' },
  heads:  { one:'head',   many:'heads',   has:'has',     have:'have' },
  wings:  { one:'wing',   many:'wings',   has:'has',     have:'have' },
  tails:  { one:'tail',   many:'tails',   has:'has',     have:'have' },
  eyes:   { one:'eye',    many:'eyes',    has:'has',     have:'have' },
  horns:  { one:'horn',   many:'horns',   has:'has',     have:'have' },
  eggs:   { one:'egg',    many:'eggs',    has:'lays',    have:'lay' },
  fruits: { one:'fruit',  many:'fruits',  has:'holds',   have:'hold' },
  stones: { one:'stone',  many:'stones',  has:'carries', have:'carry' },
  arrows: { one:'arrow',  many:'arrows',  has:'carries', have:'carry' },
  petals: { one:'petal',  many:'petals',  has:'has',     have:'have' },
  potions:{ one:'potion', many:'potions', has:'holds',   have:'hold' },
};
/* who is counted: its name and plural, its picture (a species of the game, or a thing drawn), the word for a crowd of
   them, and how many of each item one has */
const KQW_THINGS = [
  { n:'water dragon',  p:'water dragons',  sp:'water_dragon',  g:'monsters', has:{ legs:4, tails:1, horns:2, eyes:2, heads:1 } },
  { n:'monkey king',   p:'monkey kings',   sp:'monkey_king',   g:'monsters', has:{ legs:2, tails:1, eyes:2, heads:1 } },
  { n:'mantis',        p:'mantises',       sp:'mantis',        g:'monsters', has:{ legs:6, wings:4, eyes:5, heads:1 } },
  { n:'ladybird',      p:'ladybirds',      sp:'ladybird',      g:'monsters', has:{ legs:6, wings:4, eyes:2 } },
  { n:'steelcrab',     p:'steelcrabs',     sp:'steelcrab',     g:'monsters', has:{ legs:8, eyes:2 } },
  { n:'hydra',         p:'hydras',         sp:'hydra',         g:'monsters', has:{ heads:3, legs:4, tails:1, eyes:6 } },
  { n:'tailed cat',    p:'tailed cats',    sp:'tailed_cat',    g:'monsters', has:{ legs:4, tails:2, eyes:2, heads:1 } },
  { n:'unicorn',       p:'unicorns',       sp:'unicorn',       g:'monsters', has:{ legs:4, horns:1, tails:1, heads:1 } },
  { n:'ram',           p:'rams',           sp:'ram',           g:'monsters', has:{ legs:4, horns:2, tails:1 } },
  { n:'tricerarmor',   p:'tricerarmors',   sp:'tricerarmor',   g:'monsters', has:{ legs:4, horns:3, tails:1 } },
  { n:'dragon',        p:'dragons',        sp:'dragon',        g:'monsters', has:{ legs:4, wings:2, horns:2, tails:1 } },
  { n:'moth',          p:'moths',          sp:'moth',          g:'monsters', has:{ legs:6, wings:4 } },
  { n:'firefly',       p:'fireflies',      sp:'firefly',       g:'monsters', has:{ legs:6, wings:4 } },
  { n:'zebra',         p:'zebras',         sp:'zebra',         g:'monsters', has:{ legs:4, tails:1, eyes:2 } },
  { n:'strongman',     p:'strongmen',      sp:'strongman',     g:'monsters', has:{ legs:2, heads:1, eyes:2 } },
  { n:'chestnut knight', p:'chestnut knights', sp:'chestnut_knight', g:'monsters', has:{ legs:2, heads:1 } },
  { n:'phoenix',       p:'phoenixes',      sp:'phoenix',       g:'birds',    has:{ eggs:3, wings:2, legs:2 } },
  { n:'eagle',         p:'eagles',         sp:'eagle',         g:'birds',    has:{ eggs:2, wings:2, legs:2 } },
  { n:'duck',          p:'ducks',          sp:'duck',          g:'birds',    has:{ eggs:6, wings:2, legs:2 } },
  { n:'swan',          p:'swans',          sp:'swan',          g:'birds',    has:{ eggs:4, wings:2, legs:2 } },
  { n:'pelican',       p:'pelicans',       sp:'pelican',       g:'birds',    has:{ eggs:3, wings:2, legs:2 } },
  { n:'basket of apples',  p:'baskets of apples',  draw:'apples',  fruit:'apple',   g:'baskets', has:{ fruits:8 } },
  { n:'basket of pears',   p:'baskets of pears',   draw:'pears',   fruit:'pear',    g:'baskets', has:{ fruits:6 } },
  { n:'basket of plums',   p:'baskets of plums',   draw:'plums',   fruit:'blue_plum', g:'baskets', has:{ fruits:12 } },   // (4.76) the blue plum: the designer's "plum" is a stone, not a fruit
  { n:'basket of peaches', p:'baskets of peaches', draw:'peaches', fruit:'peach',   g:'baskets', has:{ fruits:5 } },
  { n:'basket of oranges', p:'baskets of oranges', draw:'peaches', fruit:'orange',  g:'baskets', has:{ fruits:9 } },
  { n:'basket of lemons',  p:'baskets of lemons',  draw:'pears',   fruit:'lemon',   g:'baskets', has:{ fruits:7 } },
  { n:'small cart',    p:'small carts',    draw:'cart',    g:'carts',    has:{ stones:4 } },
  { n:'big cart',      p:'big carts',      draw:'bigcart', g:'carts',    has:{ stones:9 } },
  { n:'wagon',         p:'wagons',         draw:'wagon',   g:'carts',    has:{ stones:7 } },
  /* (4.75) the chestnut knight's three forms (`stage`): until 4.75 the soldier and the captain named pictures, not a
     monster (chestnut_knight1, chestnut_knight2), and the card for a sum of arrows never opened — the battle stood still
     under it; and the scout was pictured as the captain (the last form of the line) */
  { n:'soldier',       p:'soldiers',       sp:'chestnut_knight', stage:1, g:'archers', has:{ arrows:12 } },
  { n:'captain',       p:'captains',       sp:'chestnut_knight', stage:2, g:'archers', has:{ arrows:20 } },
  { n:'scout',         p:'scouts',         sp:'chestnut_knight', stage:0, g:'archers', has:{ arrows:8 } },
  { n:'rose',          p:'roses',          draw:'rose',    g:'flowers',  has:{ petals:5 } },
  { n:'lily',          p:'lilies',         draw:'lily',    g:'flowers',  has:{ petals:6 } },
  { n:'daisy',         p:'daisies',        draw:'daisy',   g:'flowers',  has:{ petals:9 } },
  { n:'potion box',    p:'potion boxes',   draw:'box',     g:'boxes',    has:{ potions:6 } },
  { n:'potion crate',  p:'potion crates',  draw:'crate',   g:'boxes',    has:{ potions:10 } },
  { n:'potion chest',  p:'potion chests',  draw:'chest',   g:'boxes',    has:{ potions:4 } },
];
const KQW_FORMATS = {
  t:{ name:'Altogether',             eg:'15 water dragons and 5 monkey kings: how many legs?' },
  e:{ name:'Each',                   eg:'9 mantises have 54 legs: how many each?' },
  m:{ name:'More or fewer',          eg:'8 water dragons, 12 monkey kings: who has more legs, by how many?' },
  r:{ name:'How many of the others', eg:'6 water dragons and some monkey kings: 34 legs' },
  c:{ name:'How many of one kind',   eg:'7 monsters, 20 legs: how many water dragons?' },
};
const KQW_ORDER = ['t', 'e', 'm', 'r', 'c'];                        // the order they open in
const KQW_ENERGY = 6, KQW_MS = 40000;
/* "A" or "An" */
const kqwA = s=> (/^[aeio]/i.test(s) || /^u(?!ni)/i.test(s)) ? 'An' : 'A';
const kqwa = s=> kqwA(s).toLowerCase();
const kqwPick = a=> a[kqInt(0, a.length - 1)];
/* two things of the same crowd with the same item, counts different (or one thing, for `each`) */
function kqwPair(diff){
  for(let i = 0; i < 200; i++){
    const A = kqwPick(KQW_THINGS), items = Object.keys(A.has);
    const item = kqwPick(items);
    const others = KQW_THINGS.filter(B=> B !== A && B.g === A.g && B.has[item] && (!diff || B.has[item] !== A.has[item]));
    if(!others.length) continue;
    return { A, B:kqwPick(others), item };
  }
  return { A:KQW_THINGS[0], B:KQW_THINGS[1], item:'legs' };
}
/* ONE PROBLEM SUM, of format f: { skill:'word', form:'w', key, fmt, story, ask, unit, view:[KQ_BL], sol, choices?, pick?,
   things:[{ thing, n?, count }], tags, e, ms, text } */
function kqWord(f, tables){
  f = KQW_FORMATS[f] ? f : 't';
  /* (4.74) the Ultra's: "a problem sum relevant to the current selected field (e.g. 3 and 4 times tables)": each
     multiplication in it has one of those tables in it (how many each has, or how many of them there are) */
  const TB = Array.isArray(tables) && tables.length ? tables : null;
  const fits = (n, c)=> !TB || TB.includes(n) || TB.includes(c);
  const nIn = (lo, hi, c)=>{ if(!TB || TB.includes(c)) return kqInt(lo, hi); const ok = TB.filter(t=> t >= lo && t <= hi); return ok.length && kqRand() < 0.85 ? kqwPick(ok) : kqInt(lo, hi); };
  let story = '', ask = '', unit = '', sol = 0, pick = null, show = [], terms = [];
  for(let tries = 0; tries < (TB ? 400 : 60); tries++){
    if(f === 'e'){
      const A = kqwPick(KQW_THINGS.filter(t=> Object.values(t.has).some(v=> v >= 2)));
      const item = kqwPick(Object.keys(A.has).filter(k=> A.has[k] >= 2)), I = KQW_ITEMS[item], a = A.has[item];
      const nA = nIn(3, 12, a), T = nA * a;
      if(!fits(nA, a)) continue;
      story = `${nA} ${A.p} ${I.have} ${T} ${I.many} altogether.`;
      ask = `How many ${I.many} ${I.has === 'has' ? 'does' : 'does'} each ${A.n} ${I.have}?`;
      unit = `${I.many} each`; sol = a; terms = [[nA, a]];
      show = [{ thing:A, count:'?', item }];
      break;
    }
    const { A, B, item } = kqwPair(f !== 't');
    const I = KQW_ITEMS[item], a = A.has[item], b = B.has[item];
    const say = `${kqwA(A.n)} ${A.n} ${I.has} ${a} ${a === 1 ? I.one : I.many} and ${kqwa(B.n)} ${B.n} ${I.has} ${b}.`;
    show = [{ thing:A, count:a, item }, { thing:B, count:b, item }];
    if(f === 't'){
      const nA = nIn(2, 15, a), nB = nIn(2, 15, b);
      if(nA * a + nB * b > 240 || !fits(nA, a) || !fits(nB, b)) continue;     // (sums a child can do on paper)
      story = say; ask = `How many ${I.many} do ${nA} ${A.p} and ${nB} ${B.p} ${I.have} altogether?`;
      unit = I.many; sol = nA * a + nB * b; terms = [[nA, a], [nB, b]];
      break;
    }
    if(f === 'm'){
      const nA = nIn(3, 15, a), nB = nIn(3, 15, b), tA = nA * a, tB = nB * b;
      if(tA === tB || tA > 240 || tB > 240 || !fits(nA, a) || !fits(nB, b)) continue;
      story = `${say} There are ${nA} ${A.p} and ${nB} ${B.p}.`;
      ask = `Do the ${A.p} ${I.have} more ${I.many} or fewer ${I.many} than the ${B.p}? How many more or fewer?`;
      unit = I.many; sol = Math.abs(tA - tB); pick = tA > tB ? 'more' : 'fewer'; terms = [[nA, a], [nB, b]];
      break;
    }
    if(f === 'r'){
      const nA = nIn(2, 12, a), nB = nIn(2, 12, b), T = nA * a + nB * b;
      if(!fits(nA, a) || !fits(nB, b)) continue;
      story = `${say} ${nA} ${A.p} and some ${B.p} ${I.have} ${T} ${I.many} altogether.`;
      ask = `How many ${B.p} are there?`;
      unit = B.p; sol = nB; terms = [[nA, a], [nB, b]];
      break;
    }
    /* c: N of them, T altogether; how many of A (the one with more: a > b) */
    const hi = a > b ? A : B, lo = a > b ? B : A, ah = Math.max(a, b), al = Math.min(a, b);
    const N = kqInt(5, 14), nH = nIn(1, N - 1, ah), T = nH * ah + (N - nH) * al;
    if(nH >= N || !fits(nH, ah) || !fits(N - nH, al)) continue;
    const sayHL = `${kqwA(hi.n)} ${hi.n} ${I.has} ${ah} ${ah === 1 ? I.one : I.many} and ${kqwa(lo.n)} ${lo.n} ${I.has} ${al}.`;
    story = `${sayHL} There are ${N} ${hi.g} ${I.has === 'has' ? 'with' : `that ${I.have}`} ${T} ${I.many} altogether.`;
    ask = `How many ${hi.p} are there?`;
    unit = hi.p; sol = nH; terms = [[nH, ah], [N - nH, al]];
    show = [{ thing:hi, count:ah, item }, { thing:lo, count:al, item }];
    break;
  }
  const tags = [...new Set(show.map(s=> s.count).filter(v=> typeof v === 'number' && v >= 2 && v <= 12))].sort((x, y)=> x - y);
  const q = { skill:'word', form:'w', key:'w' + f, fmt:f, story, ask, unit, view:[KQ_BL], sol:[sol], show, tags, e:KQW_ENERGY, ms:KQW_MS, tables:TB, terms };
  if(pick){ q.choices = ['more', 'fewer']; q.pick = pick; }
  q.nb = 1; q.text = `${story} ${ask}`;
  return q;
}
/* the formats open to him: adaptive, all at once once three-factor sums are known by heart (five of them); then altogether
   and each first, the others as the one before is known. A set: every one. */
function kqWordOpen(S){ return Object.keys(S.boxes).filter(k=> k[0] === 'q' && S.boxes[k].b >= 2).length >= 5; }
function kqWordKeys(S, adaptive){
  if(!adaptive) return KQW_ORDER.map(f=> 'w' + f);
  if(!kqWordOpen(S)) return [];
  const out = ['wt', 'we'];
  if(kqBox(S, 'wt') >= 2) out.push('wm');
  if(kqBox(S, 'wm') >= 2) out.push('wr');
  if(kqBox(S, 'wr') >= 2) out.push('wc');
  return out;
}
/* is it his answer? the number, and for more-or-fewer the word chosen too ([pick, number]) */
function kqWordCheck(q, v){
  if(q.choices){ if(v.length !== 2 || v[0] !== q.pick || !/^\d+$/.test(v[1])) return false; return +v[1] === q.sol[0]; }
  return v.length === 1 && /^\d+$/.test(v[0]) && +v[0] === q.sol[0];
}

/* ---------- ON SCREEN: the two of them pictured, the story, the question, the answer to fill ---------- */
const KQW_DRAWN = {
  apples:'<circle cx="9" cy="10" r="3.2" fill="#d6332e"/><circle cx="15" cy="10" r="3.2" fill="#e04a3a"/><circle cx="12" cy="7.5" r="3.2" fill="#c92a26"/>',
  pears:'<path d="M9 6c-2 2-3 5-1 7s5 1 5-2-1-4-4-5z" fill="#c9cf4a"/><path d="M15 6c-2 2-3 5-1 7s5 1 5-2-1-4-4-5z" fill="#b8c23a"/>',
  plums:'<circle cx="8.5" cy="10" r="2.8" fill="#6b3b8f"/><circle cx="12" cy="8" r="2.8" fill="#7b46a3"/><circle cx="15.5" cy="10" r="2.8" fill="#5f3480"/>',
  peaches:'<circle cx="9.5" cy="9.5" r="3.3" fill="#f2a36b"/><circle cx="14.5" cy="9.5" r="3.3" fill="#f5b27e"/>',
  cart:'<rect x="4" y="9" width="16" height="6" rx="1" fill="#a9733f"/><circle cx="8" cy="17" r="2.2" fill="#5b3a1e"/><circle cx="16" cy="17" r="2.2" fill="#5b3a1e"/><rect x="7" y="6" width="4" height="3" fill="#a9a49a"/><rect x="12" y="6.5" width="4" height="2.5" fill="#bdb8ad"/>',
  bigcart:'<rect x="2" y="8" width="20" height="7" rx="1" fill="#8a5a2b"/><circle cx="6" cy="17" r="2.4" fill="#4a2f18"/><circle cx="18" cy="17" r="2.4" fill="#4a2f18"/><rect x="4" y="4.5" width="5" height="3.5" fill="#a9a49a"/><rect x="10" y="4" width="5" height="4" fill="#bdb8ad"/><rect x="16" y="5" width="4" height="3" fill="#9c978c"/>',
  wagon:'<path d="M3 9h18l-2 6H5z" fill="#9a6a3a"/><circle cx="7" cy="17" r="2.3" fill="#4a2f18"/><circle cx="17" cy="17" r="2.3" fill="#4a2f18"/><rect x="6" y="5.5" width="5" height="3.5" fill="#a9a49a"/><rect x="12" y="5" width="5" height="4" fill="#bdb8ad"/>',
  rose:'<path d="M12 21V12" stroke="#3f8a3a" stroke-width="1.6"/><circle cx="12" cy="9" r="4.5" fill="#d6334a"/><path d="M12 6.5a2.5 2.5 0 1 0 2.4 3.2" stroke="#9e1f33" stroke-width="1" fill="none"/>',
  lily:'<path d="M12 21V12" stroke="#3f8a3a" stroke-width="1.6"/><path d="M12 12c-4-1-6-4-6-7 3 0 5 2 6 4 1-2 3-4 6-4 0 3-2 6-6 7z" fill="#f6eef7"/><path d="M12 12c-1-3 0-6 0-8 0 2 1 5 0 8z" fill="#efd7f0"/>',
  daisy:'<path d="M12 21V13" stroke="#3f8a3a" stroke-width="1.6"/><g fill="#fffdf4" stroke="#d9d2c2" stroke-width=".5"><ellipse cx="12" cy="5.5" rx="1.6" ry="3"/><ellipse cx="12" cy="13.5" rx="1.6" ry="3"/><ellipse cx="8" cy="9.5" rx="3" ry="1.6"/><ellipse cx="16" cy="9.5" rx="3" ry="1.6"/></g><circle cx="12" cy="9.5" r="2.2" fill="#f2c23a"/>',
  box:'<rect x="5" y="9" width="14" height="10" rx="1.5" fill="#b9874f"/><rect x="7" y="5" width="3" height="5" rx="1" fill="#e2585a"/><rect x="11" y="4.5" width="3" height="5.5" rx="1" fill="#5aa9e0"/><rect x="15" y="5.5" width="2.5" height="4.5" rx="1" fill="#6fbf5a"/>',
  crate:'<rect x="3" y="8" width="18" height="12" rx="1" fill="#9a6a3a"/><path d="M3 8l18 12M21 8L3 20" stroke="#6b4426" stroke-width="1.2"/><rect x="6" y="4" width="3" height="5" rx="1" fill="#e2585a"/><rect x="11" y="3.5" width="3" height="5.5" rx="1" fill="#5aa9e0"/><rect x="16" y="4.5" width="3" height="4.5" rx="1" fill="#6fbf5a"/>',
  chest:'<rect x="5" y="10" width="14" height="9" rx="1.5" fill="#8a5a2b"/><path d="M5 10a7 4 0 0 1 14 0z" fill="#a8743f"/><rect x="11" y="11" width="2" height="3" fill="#e0b84a"/>',
};
/* (4.74) the designer: "please use the highest evolutions of the line so that the hydra heads work out (the hydra basic
   form only has one head)": each creature pictured in the last form of its line (its counts are that form's) */
const kqwStage = sp=>{ const S = typeof SPECIES !== 'undefined' && SPECIES[sp]; return S && !S.oneLook && !S.fixedLook && Array.isArray(S.evo) ? S.evo.length : 0; };
const KQW_BASKET = '<path d="M3 11h18l-2.2 9.2a1.5 1.5 0 0 1-1.5 1.1H6.7a1.5 1.5 0 0 1-1.5-1.1z" fill="#b9874f"/><path d="M4.4 14h15.2M5.1 17h13.8" stroke="#8a5a2b" stroke-width="1"/><path d="M7 11V9.5a5 5 0 0 1 10 0V11" fill="none" stroke="#8a5a2b" stroke-width="1.4"/>';
function kqwPic(t, px){
  if(t.sp && typeof monPortrait === 'function' && typeof SPECIES !== 'undefined' && SPECIES[t.sp]) return monPortrait(t.sp, px, { view:'front', bare:true, stage:t.stage != null ? t.stage : kqwStage(t.sp) });
  if(t.fruit) return `<span class="kqw-basket" style="width:${px}px;height:${px}px"><svg viewBox="0 0 24 24" width="${px}" height="${px}" aria-hidden="true">${KQW_BASKET}</svg>`
    + `<img src="assets/items/fruit_${t.fruit}.png" alt="" style="left:${px * 0.26}px;top:${px * 0.04}px;width:${px * 0.48}px;height:${px * 0.48}px" onerror="this.remove()"></span>`;
  return `<svg class="kqw-drawn" viewBox="0 0 24 24" width="${px}" height="${px}" aria-hidden="true">${KQW_DRAWN[t.draw] || KQW_DRAWN.box}</svg>`;
}
/* ============================================================
   WORKING IT OUT (the designer: "for the problem sums, i want there to be equation making functionality. please allow my
   son to put in numbers and operators so he can visualise the equation. please then also allow him to 'send' working
   steps to be put up visually so he can look at it before he continues with more equation steps. the final answer is
   only sent in when he presses 'final answer', which will prompt him to highlight one of the numbers in his list of
   equations as the final answer for grading.")
   A card over everything (the battle waits behind it: its loop stops while a .kd-over is up): the two of them pictured,
   the story and the question; his working, a line at a time (numbers and + − × ÷ ( ) =), each line sent up to the list;
   then Final answer: he taps one of the numbers in his working (more-or-fewer: and chooses More or Fewer). Marked: right,
   or the answer shown, with each line of his working checked (✓ where its sides are equal, ✗ where not).
   kqwOpen(q, { title, grade(vals, ms) → { ok, … }, right(text) }) → a Promise of { ok, vals, ms, lines }.
   ============================================================ */
const KQW_KEYS = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '(', ')', '+', 'del', '=', 'send'];
const KQW_OPS = { '+':1, '−':1, '×':1, '÷':1, '=':1, '(':1, ')':1 };
/* a line of working, split into numbers and signs */
function kqwTokens(line){ return (String(line).match(/\d+|[+−×÷=()]/g) || []); }
/* its value (numbers, + − × ÷ and brackets), or null if it does not make sense */
function kqwEval(tokens){
  let i = 0;
  const num = ()=>{
    const t = tokens[i];
    if(t === '('){ i++; const v = sum(); if(tokens[i] !== ')') throw 0; i++; return v; }
    if(t === '−'){ i++; return -num(); }
    if(/^\d+$/.test(t || '')){ i++; return +t; }
    throw 0;
  };
  const prod = ()=>{ let v = num(); while(tokens[i] === '×' || tokens[i] === '÷'){ const op = tokens[i++], r = num(); if(op === '÷'){ if(r === 0) throw 0; v /= r; } else v *= r; } return v; };
  const sum = ()=>{ let v = prod(); while(tokens[i] === '+' || tokens[i] === '−'){ const op = tokens[i++], r = prod(); v = op === '+' ? v + r : v - r; } return v; };
  try { const v = sum(); return i === tokens.length ? v : null; } catch(e){ return null; }
}
/* a line with "=": every side the same value? (true, false, or null: not an equation, or not all of it makes sense) */
function kqwLineOk(line){
  const t = kqwTokens(line);
  if(!t.includes('=')) return null;
  const sides = []; let cur = [];
  t.forEach(x=>{ if(x === '='){ sides.push(cur); cur = []; } else cur.push(x); });
  sides.push(cur);
  if(sides.some(s=> !s.length)) return null;
  const v = sides.map(kqwEval);
  if(v.some(x=> x == null)) return null;
  return v.every(x=> Math.abs(x - v[0]) < 1e-9);
}
function kqwOpen(q, opts){
  opts = opts || {};
  return new Promise(resolve=>{
    kdCss();
    const st = { lines:[], cur:'', pick:null, choosing:false, done:false, at:performance.now() };
    const I = q.show[0] && KQW_ITEMS[q.show[0].item];
    const box = document.createElement('div');
    box.className = 'kd-over kqw-over';
    box.innerHTML = `<div class="kd-card kd-overcard kqw-card">
      <div class="kqw-head"><b>${opts.title || 'A problem sum'}</b><small>${opts.sub || 'The monsters wait while you work it out'}</small></div>
      <div class="kqw-top">
        <div class="kqw-pics">${q.show.map(s=> `<figure class="kqw-fig">${kqwPic(s.thing, 78)}<figcaption>${kqwA(s.thing.n)} ${s.thing.n}<b>${s.count} ${s.count === 1 ? I.one : I.many}</b></figcaption></figure>`).join('')}</div>
        <div class="kqw-text"><p>${q.story}</p><p class="kqw-ask">${q.ask}</p></div>
      </div>
      ${q.choices ? `<div class="kqw-picks" id="kqwPicks"><span>The ${q.show[0].thing.p} have</span>${q.choices.map(c=> `<button type="button" class="kqw-pick" data-pick="${c}">${c === 'more' ? 'More' : 'Fewer'}</button>`).join('')}<span>${I.many}</span></div>` : ''}
      <div class="kqw-work" id="kqwWork" aria-live="polite"></div>
      <div class="kqw-line" id="kqwLine"></div>
      <div class="kqw-say" id="kqwSay">Write your working a line at a time, and Send each line. Then Final answer.</div>
      <div class="kqw-pad" id="kqwPad">${KQW_KEYS.map(k=> `<button type="button" class="kqw-key ${KQW_OPS[k] ? 'op' : ''} ${k === 'send' ? 'send' : k === 'del' ? 'del' : ''}" data-k="${k}" aria-label="${k === 'send' ? 'Send this line' : k === 'del' ? 'Delete' : k}">${k === 'send' ? 'Send' : k === 'del' ? '⌫' : k}</button>`).join('')}
        <button type="button" class="kqw-key final" data-k="final">Final answer</button></div>
    </div>`;
    document.body.appendChild(box);
    const $w = box.querySelector('#kqwWork'), $l = box.querySelector('#kqwLine'), $s = box.querySelector('#kqwSay');
    const lineHtml = (line, i, mark)=> kqwTokens(line).map((t, ti)=> /^\d+$/.test(t) ? `<button type="button" class="kqw-num ${st.chosen && st.chosen[0] === i && st.chosen[1] === ti ? 'chosen' : ''}" data-line="${i}" data-ti="${ti}" data-v="${t}">${t}</button>` : `<span class="kqw-op">${t}</span>`).join('') +
      (mark === true ? '<em class="kqw-mark ok" aria-label="right">✓</em>' : mark === false ? '<em class="kqw-mark no" aria-label="not right">✗</em>' : '');
    const draw = ()=>{
      $w.innerHTML = st.lines.length ? st.lines.map((ln, i)=> `<div class="kqw-row ${st.marks && st.marks[i] === false ? 'bad' : ''}"><span class="kqw-n">${i + 1}</span><span class="kqw-eq">${lineHtml(ln, i, st.marks ? st.marks[i] : null)}</span>${st.done || st.choosing ? '' : `<button type="button" class="kqw-x" data-x="${i}" aria-label="Take this line away">×</button>`}</div>`).join('')
                                 : '<div class="kqw-empty">Your working goes here.</div>';
      $l.innerHTML = st.cur ? lineHtml(st.cur, -1) : '<span class="kqw-ph">Type a line: 15 × 4 = 60</span>';
      $l.classList.toggle('on', !st.choosing && !st.done);
      box.classList.toggle('choosing', st.choosing);
      box.querySelectorAll('.kqw-pick').forEach(b=> b.classList.toggle('on', b.dataset.pick === st.pick));
      const pk = box.querySelector('#kqwPicks'); if(pk) pk.classList.toggle('need', !!(st.choosing && !st.pick));
    };
    const say = html=>{ $s.innerHTML = html; };
    const send = ()=>{ const t = st.cur.trim(); if(!t) return false; st.lines.push(t); st.cur = ''; draw(); $w.scrollTop = $w.scrollHeight; return true; };
    const key = k=>{
      if(st.done) return;
      if(k === 'final'){
        if(st.choosing){ st.choosing = false; say('Write your working a line at a time, and Send each line. Then Final answer.'); draw(); return; }
        send();
        if(!st.lines.some(ln=> /\d/.test(ln))){ say('<b>Write your working first</b>, then Send it.'); return; }
        st.choosing = true;
        say(q.choices ? `<b>Choose More or Fewer, then tap the number in your working that is your answer.</b>` : '<b>Tap the number in your working that is your answer.</b> (Final answer again to go back.)');
        draw(); return;
      }
      if(st.choosing) return;
      if(k === 'send'){ if(!send()) say('Type a line first, then Send it.'); return; }
      if(k === 'del'){ st.cur = st.cur.slice(0, -1); draw(); return; }
      if(st.cur.length >= 40) return;
      st.cur += k; draw();
    };
    const finish = async (value)=>{
      if(q.choices && !st.pick){ say('<b>Choose More or Fewer first.</b>'); return; }
      st.done = true; st.choosing = false;
      const vals = q.choices ? [st.pick, String(value)] : [String(value)], ms = performance.now() - st.at;
      const r = opts.grade ? opts.grade(vals, ms) : { ok:kqCheck(q, vals) };
      st.marks = st.lines.map(kqwLineOk);
      draw();
      const ans = `${q.pick ? (q.pick === 'more' ? 'More, by ' : 'Fewer, by ') : ''}${q.sol[0]} ${q.unit}`;
      box.querySelector('.kqw-card').classList.add(r.ok ? 'right' : 'wrong');
      const pad = box.querySelector('#kqwPad');
      pad.innerHTML = `<button type="button" class="btn btn-primary kqw-go" id="kqwGo">${r.ok ? (opts.rightBtn || 'Onwards!') : 'Back to it'}</button>`;
      say(r.ok ? `<b class="kqw-yes">Right! ${ans}.</b> ${opts.right ? opts.right(r) : ''}`
               : `<b class="kqw-no">Not quite.</b> The answer: <b>${ans}</b>.${st.marks.some(m=> m === false) ? ' A line marked ✗ does not add up: look at it again.' : ''}`);
      const go2 = ()=>{ removeEventListener('keydown', onKeyDown, true); box.remove(); resolve(Object.assign({ vals, ms, lines:st.lines.slice() }, r)); };
      box.querySelector('#kqwGo').addEventListener('click', go2);
      setTimeout(()=>{ const b = box.querySelector('#kqwGo'); if(b) b.focus(); }, 40);
    };
    box.addEventListener('click', e=>{
      const k = e.target.closest('.kqw-key'); if(k){ key(k.dataset.k); return; }
      const pk = e.target.closest('.kqw-pick'); if(pk && !st.done){ st.pick = pk.dataset.pick; draw(); return; }
      const x = e.target.closest('[data-x]'); if(x && !st.choosing && !st.done){ st.lines.splice(+x.dataset.x, 1); draw(); return; }
      const n = e.target.closest('.kqw-num');
      if(n && st.choosing && !st.done){ st.chosen = [+n.dataset.line, +n.dataset.ti]; finish(+n.dataset.v); return; }
      if(n && !st.choosing && !st.done && +n.dataset.line >= 0){ st.cur += n.dataset.v; draw(); }      // a number of his working, into the line he is writing
    });
    const onKeyDown = e=>{
      if(!box.isConnected) return removeEventListener('keydown', onKeyDown, true);
      if(st.done){ if(e.key === 'Enter'){ const b = box.querySelector('#kqwGo'); if(b){ b.click(); e.preventDefault(); } } return; }
      const map = { '*':'×', 'x':'×', 'X':'×', '/':'÷', '-':'−', '+':'+', '=':'=', '(':'(', ')':')' };
      if(/^\d$/.test(e.key)) key(e.key);
      else if(map[e.key]) key(map[e.key]);
      else if(e.key === 'Backspace') key('del');
      else if(e.key === 'Enter') key('send');
      else return;
      e.preventDefault(); e.stopPropagation();
    };
    addEventListener('keydown', onKeyDown, true);
    /* (4.74) the battle's hold on it: a word on the top line (how long the monsters wait); closed from outside */
    if(opts.signal){
      opts.signal.note = t=>{ const sm = box.querySelector('.kqw-head small'); if(sm) sm.textContent = t; };
      opts.signal.close = why=>{ if(!box.isConnected) return; st.done = true; removeEventListener('keydown', onKeyDown, true); box.remove(); resolve({ ok:false, aborted:why || true, vals:[], ms:performance.now() - st.at, lines:st.lines.slice() }); };
    }
    draw();
  });
}
