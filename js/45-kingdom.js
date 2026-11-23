/* ==========================================================
   45-kingdom.js — THE KINGDOM BEYOND THE BOTTOM PORTAL: the sums, the partner, its forms and talents, sum battles.
   (The city, its board and its builders' sums, are in 46-kingdom-city.js.)

   (4.72) The designer: "I'm trying to get my sons, especially my older son, to learn times tables and mental arithmetic
   … opening the bottom portal of region 6 to a land where the player can't travel with his monsters, but in which they
   can control a monster which evolves … moves are executed with energy, but the energy can only be accumulated by
   answering questions correctly, and enemies attack on a timer, so being too slow to solve sums will lead you to lose
   instead of win." Answers on a number pad; the sums adaptive, or a set the parent chooses; the enemy's timer "a mix of
   adaptive and fixed. Enemy levels increase their speed and damage".

   (4.73) The designer, reworking it:
   · "3 types of questions for multiplication for a start. Tag these to X and Y as their times tables. X*Y=Z (put blanks
     on either X, Y or Z with Z blanks as the easiest level). Then, next level, give Z and 2 blanks, accepting all forms
     of the answer eg 24=8*3 or 3*8 or 6*4 or 4*6 … Then, as a final difficulty step, increase the number of blanks where
     appropriate eg 24=2*4*3 or 2*6*2 etc. accept all variations of the answer." "Keep your other questions too, we'll
     work out when to bring them in." (KQ below: five forms, z f p2 p3 p4.)
   · "Match energy requirements to words in the Chinese spelling. Energy gained per correct blank only if all blanks are
     correct. Have a basic attack and power1 that is gained from the start, with power1 requiring more energy but being
     more energy efficient. Power2 aoe and ultimate with single target strong damage. 2,4,8,8 word cost." Guard: one
     energy, one block. Change form: two energy. "Forms carry over across battles." (KD_SLOTS)
   · The forms, in order, no longer chosen: Physical at the start; then Fire (the first guardian's), Water, Grass,
     Electric, Flying, Psychic, Ghost, Fairy, a stronger Physical, "gained through much more difficulty later on"
     (KD_FORMS, KD_TRIALS).
   · Talents, a point a level: for every form, and for Fire, Water, Grass and Electric their own (KD_TALENTS).
   · "Players do not earn money from defeating monsters. They earn raw materials." (kdbWin: wood, stone, iron)

   State: state.progress.kingdom (kd()). The partner's own pictures, when the designer draws them:
   assets/mon/kingdom_<form>_front.png and _back.png (physical, fire, water, grass, electric, flying, psychic, ghost,
   fairy, physical2); until then a monster of that type from the game stands in (KD_FORMS[form].standIn).
   ========================================================== */

/* ============================================================
   THE SUMS (KQ). Pure: nothing here touches the page, so the tests run it on its own.
   ============================================================ */
let kqRand = Math.random;                                         // a test may put its own dice in
const kqInt = (a, b)=> a + Math.floor(kqRand() * (b - a + 1));
const KQ_TABLES = [2, 5, 10, 3, 4, 6, 7, 8, 9, 11, 12];          // the order the times tables are learnt in
const KQ_SKILLS = ['tables', 'divfacts', 'add', 'sub', 'mul', 'div'];
const KQ_NAME = { tables:'Times tables', divfacts:'Division facts', add:'Addition', sub:'Subtraction', mul:'Long multiplication', div:'Division' };
/* (4.73) THE TIMES TABLES IN FIVE FORMS, easiest first: its blanks (an energy each, when all of them are right), the
   time it should take when known (ms), the letter its keys start with */
const KQ_FORMS = {
  z: { nb:1, ms:4000,  pre:'m', name:'The answer',     eg:'7 × 8 = ?' },
  f: { nb:1, ms:5000,  pre:'f', name:'Missing number', eg:'7 × ? = 56' },
  p2:{ nb:2, ms:7000,  pre:'p', name:'Two factors',    eg:'56 = ? × ?' },
  p3:{ nb:3, ms:10000, pre:'q', name:'Three factors',  eg:'24 = ? × ? × ?' },
  p4:{ nb:4, ms:13000, pre:'r', name:'Four factors',   eg:'24 = ? × ? × ? × ?' },
};
const KQ_FORM_ORDER = ['z', 'f', 'p2', 'p3', 'p4'];
const KQ_PRE = { m:'z', f:'f', p:'p2', q:'p3', r:'p4' };
/* the other skills are kept for later: a parent can set them; the adaptive sums leave them out while this is false */
const KQ_ADAPTIVE_MORE = false;
/* each other skill's rungs, easiest first: what a sum is, its energy (e), and the time it should take when known (ms) */
const KQ_RUNGS = {
  add:[ { d:2, c:0, e:1, ms:8000,  say:'2-digit, no carrying' }, { d:2, c:1, e:1, ms:10000, say:'2-digit, carrying' },
        { d:3, c:0, e:2, ms:12000, say:'3-digit, no carrying' }, { d:3, c:1, e:2, ms:15000, say:'3-digit, one carry' },
        { d:3, c:2, e:2, ms:18000, say:'3-digit, two carries' } ],
  sub:[ { d:2, c:0, e:1, ms:8000,  say:'2-digit, no borrowing' }, { d:2, c:1, e:1, ms:11000, say:'2-digit, borrowing' },
        { d:3, c:0, e:2, ms:12000, say:'3-digit, no borrowing' }, { d:3, c:1, e:2, ms:16000, say:'3-digit, one borrow' },
        { d:3, c:2, e:2, ms:20000, say:'3-digit, two borrows' }, { d:3, z:1, e:2, ms:22000, say:'3-digit, borrowing across a zero' } ],
  mul:[ { k:'2x1', c:0, e:2, ms:10000, say:'2-digit × 1-digit, no carrying' }, { k:'2x1', c:1, e:2, ms:14000, say:'2-digit × 1-digit' },
        { k:'teen', e:3, ms:25000, say:'teen × teen' }, { k:'2x2', e:3, ms:40000, say:'2-digit × 2-digit' } ],
  div:[ { k:'2/1', e:2, ms:12000, say:'2-digit ÷ 1-digit' }, { k:'3/1', e:3, ms:22000, say:'3-digit ÷ 1-digit' } ],
};
const KQ_FACT = { divfacts:{ ms:5000 } };
const KQ_WEIGHT = { tables:4, divfacts:2, add:2, sub:2, mul:2, div:1.5 };

function kqCarries(a, b){ let n = 0, k = 0; while(a > 0 || b > 0){ const s = a % 10 + b % 10 + k; k = s >= 10 ? 1 : 0; n += k; a = Math.floor(a / 10); b = Math.floor(b / 10); } return n; }
function kqBorrows(a, b){ let n = 0, k = 0; while(a > 0 || b > 0){ const x = a % 10 - k, y = b % 10; k = x < y ? 1 : 0; n += k; a = Math.floor(a / 10); b = Math.floor(b / 10); } return n; }
/* one sum of another skill's rung: { a, b, op, ans } */
function kqMake(skill, r){
  if(skill === 'add'){
    const lo = r.d === 2 ? 10 : 100, hi = r.d === 2 ? 99 : 999;
    for(let i = 0; i < 2000; i++){ const a = kqInt(lo, hi), b = kqInt(lo, hi); if(kqCarries(a, b) === r.c) return { a, b, op:'+', ans:a + b }; }
    return { a:lo, b:lo, op:'+', ans:lo * 2 };
  }
  if(skill === 'sub'){
    if(r.z){                                                       // borrowing across a zero: 503 − 278
      const H = kqInt(2, 9), u = kqInt(0, 8), a = H * 100 + u;
      const h = kqInt(1, H - 1), t = kqInt(0, 9), v = kqInt(u + 1, 9), b = h * 100 + t * 10 + v;
      return { a, b, op:'−', ans:a - b };
    }
    const lo = r.d === 2 ? 10 : 100, hi = r.d === 2 ? 99 : 999;
    for(let i = 0; i < 2000; i++){ let a = kqInt(lo, hi), b = kqInt(lo, hi); if(a === b) continue; if(a < b){ const x = a; a = b; b = x; }
      if(kqBorrows(a, b) === r.c) return { a, b, op:'−', ans:a - b }; }
    return { a:hi, b:lo, op:'−', ans:hi - lo };
  }
  if(skill === 'mul'){
    if(r.k === '2x1'){
      for(let i = 0; i < 2000; i++){ const a = kqInt(11, 99), b = kqInt(2, 9), carry = (a % 10) * b >= 10 || Math.floor(a / 10) * b >= 10;
        if(a % 10 === 0) continue; if(!!carry === !!r.c) return { a, b, op:'×', ans:a * b }; }
      return { a:12, b:3, op:'×', ans:36 };
    }
    if(r.k === 'teen'){ const a = kqInt(11, 19), b = kqInt(11, 19); return { a, b, op:'×', ans:a * b }; }
    const a = kqInt(21, 99), b = kqInt(12, 49); return { a, b, op:'×', ans:a * b };
  }
  if(skill === 'div'){
    const d = kqInt(2, 9);
    if(r.k === '2/1'){ const q = kqInt(11, Math.floor(99 / d)); return { a:d * q, b:d, op:'÷', ans:q }; }
    const q = kqInt(Math.ceil(100 / d), Math.floor(999 / d)); return { a:d * q, b:d, op:'÷', ans:q };
  }
  return null;
}

/* ---------- a sum, as the child sees it: numbers, signs and blanks ---------- */
const KQ_BL = { blank:true };
/* q: { skill, form?, key?, view:[…], nb, sol:[a right filling], Z?, tags:[its times tables], e, ms, text } */
function kqDone(q){
  q.nb = q.view.filter(v=> v === KQ_BL).length;
  if(q.e == null) q.e = q.nb;                                       // an energy a blank
  q.text = q.view.map(v=> v === KQ_BL ? '?' : v).join(' ');
  return q;
}
function kqPrimes(n){ const out = []; for(let p = 2; p * p <= n; p++) while(n % p === 0){ out.push(p); n /= p; } if(n > 1) out.push(n); return out; }
const kqOmega = n=> kqPrimes(n).length;
/* n as k factors of 2 or more, smallest first (24, 3: 2 × 3 × 4), or null */
function kqSplit(n, k){
  const f = kqPrimes(n);
  if(f.length < k) return null;
  while(f.length > k){ f.sort((a, b)=> a - b); f.push(f.shift() * f.shift()); }
  return f.sort((a, b)=> a - b);
}
/* a right filling to show: two factors as a times-table fact (56: 7 × 8), more as primes put together */
function kqSolve(Z, k){
  if(k === 2) for(let t = Math.floor(Math.sqrt(Z)); t >= 2; t--) if(Z % t === 0 && Z / t <= 12) return [t, Z / t];
  return kqSplit(Z, k);
}
/* its times tables: a fact's two (the ×1s are none); a product's, every table it is in (24: 2, 3, 4, 6, 8, 12) */
const kqTagsAB = (a, b)=> [...new Set([a, b])].filter(t=> t >= 2 && t <= 12).sort((x, y)=> x - y);
function kqTagsZ(Z){ const out = []; for(let t = 2; t <= 12; t++) if(Z % t === 0 && Z / t >= 2 && Z / t <= 12) out.push(t); return out; }
/* THE SUM FOR A KEY: 'm7x8' 7 × 8 = ?; 'f7x8' 7 × ? = 56 or ? × 8 = 56; 'p56' 56 = ? × ?; 'q24' three factors;
   'r24' four; 'd56/7' 56 ÷ 7 = ? */
function kqItem(key){
  let m = /^([mf])(\d+)x(\d+)$/.exec(key);
  if(m){
    const a = +m[2], b = +m[3], sw = kqRand() < 0.5, x = sw ? b : a, y = sw ? a : b, Z = a * b;
    if(m[1] === 'm') return kqDone({ skill:'tables', form:'z', key, view:[x, '×', y, '=', KQ_BL], sol:[Z], Z, tags:kqTagsAB(a, b), ms:KQ_FORMS.z.ms });
    const left = kqRand() < 0.5;                                    // which of the two is missing
    return kqDone({ skill:'tables', form:'f', key, view:left ? [KQ_BL, '×', y, '=', Z] : [x, '×', KQ_BL, '=', Z], sol:[left ? x : y], Z,
                    tags:kqTagsAB(a, b), ms:KQ_FORMS.f.ms });
  }
  m = /^([pqr])(\d+)$/.exec(key);
  if(m){
    const form = KQ_PRE[m[1]], Z = +m[2], k = KQ_FORMS[form].nb, view = [Z, '='];
    for(let i = 0; i < k; i++){ if(i) view.push('×'); view.push(KQ_BL); }
    return kqDone({ skill:'tables', form, key, view, Z, sol:kqSolve(Z, k), tags:kqTagsZ(Z), ms:KQ_FORMS[form].ms });
  }
  m = /^d(\d+)\/(\d+)$/.exec(key);
  if(m){ const p = +m[1], t = +m[2]; return kqDone({ skill:'divfacts', key, view:[p, '÷', t, '=', KQ_BL], sol:[p / t], tags:[t], ms:KQ_FACT.divfacts.ms }); }
  return null;
}
/* a sum of another skill (`keep`: the same sum again, for one he got wrong) */
function kqOther(skill, r, rungAt, keep){
  const s = keep && keep.a != null ? keep : kqMake(skill, r);
  return kqDone({ skill, rung:r, rungAt:rungAt == null ? -1 : rungAt, a:s.a, b:s.b, op:s.op, view:[s.a, s.op, s.b, '=', KQ_BL], sol:[s.ans], tags:[], e:r.e, ms:r.ms });
}
/* HIS ANSWER, RIGHT OR NOT: every blank filled with a whole number; the factors, any of them in any order, 2 or more
   each ("accept all variations of the answer"; a 1 would answer every one of them), their product the number */
function kqCheck(q, vals){
  const v = (Array.isArray(vals) ? vals : [vals]).map(s=> String(s == null ? '' : s).trim());
  if(v.length !== q.nb || v.some(s=> !/^\d+$/.test(s))) return false;
  const n = v.map(Number);
  if(q.form === 'p2' || q.form === 'p3' || q.form === 'p4') return n.every(x=> x >= 2) && n.reduce((a, b)=> a * b, 1) === q.Z;
  return n.every((x, i)=> x === q.sol[i]);
}
/* a key in words, for the parent's report */
function kqKeyText(k){
  let m = /^([mf])(\d+)x(\d+)$/.exec(k);
  if(m) return m[1] === 'm' ? `${m[2]} × ${m[3]}` : `${m[2]} × ${m[3]} (missing number)`;
  m = /^([pqr])(\d+)$/.exec(k);
  if(m){ const n = KQ_FORMS[KQ_PRE[m[1]]].nb; return `${m[2]} = ${Array.from({ length:n }, ()=> '?').join(' × ')}`; }
  m = /^d(\d+)\/(\d+)$/.exec(k);
  return m ? `${m[1]} ÷ ${m[2]}` : k;
}

/* ---------- each child's own record ---------- */
function kqBlank(){
  return { boxes:{}, open:[2, 5, 10], dopen:[], rung:{ add:0, sub:0, mul:0, div:0 }, win:{ add:[], sub:[], mul:[], div:[] },
           seen:{ add:0, sub:0, mul:0, div:0 }, streak:[], retry:[], n:0 };
}
function kqSt(K){
  const S = K.sk || (K.sk = kqBlank()), b = kqBlank();
  for(const k in b) if(S[k] == null) S[k] = b[k];
  ['rung', 'win', 'seen'].forEach(k=> ['add', 'sub', 'mul', 'div'].forEach(s=>{ if(S[k][s] == null) S[k][s] = b[k][s]; }));
  return S;
}
/* the default set a parent starts from: the 2, 5 and 10 times tables, the answer only */
function kqDefaultSet(){ return { tables:[2, 5, 10], forms:['z'], divfacts:[], add:0, sub:0, mul:[], div:[] }; }
const KQ_BOX_W = [10, 5, 2.2, 0.9, 0.35];                         // a missed or new one far more often than a known one
const kqBox = (S, k)=> S.boxes[k] ? S.boxes[k].b : -1;
/* THE TIMES-TABLE SUMS OF THESE TABLES IN THESE FORMS. Adaptive, each form opens fact by fact once the one before it is
   known (box 2: right, in time): the missing number once the answer is; two factors once the missing number is; three
   once two are (if it has three: 24 does, 22 = 2 × 11 does not); four once three are. A set: all of them at once. */
function kqMulKeys(S, tables, forms, adaptive){
  const out = new Set(), has = f=> forms.includes(f);
  tables.forEach(t=>{
    for(let n = 1; n <= 12; n++){
      const lo = Math.min(t, n), hi = Math.max(t, n), mk = `m${lo}x${hi}`;
      if(has('z')) out.add(mk);
      if(n < 2 || t < 2) continue;
      const fk = `f${lo}x${hi}`, Z = t * n, om = kqOmega(Z);
      if(has('f') && (!adaptive || kqBox(S, mk) >= 2)) out.add(fk);
      if(has('p2') && (!adaptive || kqBox(S, fk) >= 2)) out.add(`p${Z}`);
      if(has('p3') && om >= 3 && (!adaptive || kqBox(S, `p${Z}`) >= 2)) out.add(`q${Z}`);
      if(has('p4') && om >= 4 && (!adaptive || kqBox(S, `q${Z}`) >= 2)) out.add(`r${Z}`);
    }
  });
  return [...out];
}
const kqDivKeys = tables=> tables.flatMap(t=> Array.from({ length:11 }, (_, i)=> `d${t * (i + 2)}/${t}`));
/* one of them, by its box (one waiting to come back, or the one just asked, is not drawn: it comes back when its turn is due) */
function kqPickKey(S, keys){
  if(!keys.length) return null;
  const waiting = new Set(S.retry.map(r=> r.q.key).filter(Boolean));
  let w = keys.map(k=> S.last === k || waiting.has(k) ? 0 : KQ_BOX_W[Math.max(0, kqBox(S, k))]);
  if(!w.some(x=> x > 0)) w = w.map(()=> 1);
  let r = kqRand() * w.reduce((a, b)=> a + b, 0), i = 0;
  for(; i < w.length - 1; i++){ r -= w[i]; if(r <= 0) break; }
  return keys[i];
}
function kqWeighted(list){ let r = kqRand() * list.reduce((a, x)=> a + x.w, 0); for(const x of list){ r -= x.w; if(r <= 0) return x; } return list[list.length - 1]; }
/* the parent's set, as items to draw from */
function kqSetItems(set){
  if(!set) return [];
  const out = [], tb = (set.tables || []).filter(t=> t >= 2 && t <= 12), dv = (set.divfacts || []).filter(t=> t >= 2 && t <= 12);
  const fm = (set.forms && set.forms.length ? set.forms : ['z']).filter(f=> KQ_FORMS[f]);
  if(tb.length && fm.length) out.push({ skill:'tables', tables:tb, forms:fm });
  if(dv.length) out.push({ skill:'divfacts', tables:dv });
  /* addition and subtraction: 0 off, else the rung chosen (its index in KQ_RUNGS + 1) */
  if(set.add) out.push({ skill:'add', r:KQ_RUNGS.add[set.add - 1] });
  if(set.sub) out.push({ skill:'sub', r:KQ_RUNGS.sub[set.sub - 1] });
  (set.mul || []).forEach(i=> KQ_RUNGS.mul[i] && out.push({ skill:'mul', r:KQ_RUNGS.mul[i] }));
  (set.div || []).forEach(i=> KQ_RUNGS.div[i] && out.push({ skill:'div', r:KQ_RUNGS.div[i] }));
  return out;
}
/* the other skills open to him, were they mixed in (KQ_ADAPTIVE_MORE) */
function kqOpenSkills(S){
  const open = { tables:true, divfacts:S.dopen.length > 0, add:true, sub:true, mul:S.open.length >= 5, div:S.dopen.length >= 3 };
  return KQ_SKILLS.filter(k=> open[k]);
}
/* THE NEXT SUM. K.sums: { mode:'adaptive' | 'set', set } */
function kqNext(K){
  const S = kqSt(K), set = K.sums && K.sums.mode === 'set' ? kqSetItems(K.sums.set) : null;
  S.n++;
  /* a sum he got wrong comes back two to four sums later */
  const due = S.retry.findIndex(r=> r.at <= S.n);
  if(due >= 0){
    const r = S.retry.splice(due, 1)[0], q = r.q.key ? kqItem(r.q.key) : kqOther(r.q.skill, r.q.rung, -1, r.q);
    if(q){ q.again = true; S.last = q.key || null; return q; }
  }
  let q = null;
  if(set && set.length){
    const it = kqWeighted(set.map(x=> ({ w:1, x }))).x;
    if(it.skill === 'tables') q = kqItem(kqPickKey(S, kqMulKeys(S, it.tables, it.forms, false)));
    else if(it.skill === 'divfacts') q = kqItem(kqPickKey(S, kqDivKeys(it.tables)));
    else q = kqOther(it.skill, it.r, -1);
  } else if(KQ_ADAPTIVE_MORE){
    const open = kqOpenSkills(S), last2 = S.streak.slice(-2);
    const pick = kqWeighted(open.map(k=> ({ k, w:KQ_WEIGHT[k] * (last2.length === 2 && last2[0] === k && last2[1] === k ? 0.25 : 1) }))).k;
    if(pick === 'divfacts') q = kqItem(kqPickKey(S, kqDivKeys(S.dopen)));
    else if(pick !== 'tables'){
      /* now and then a sum from the rung below, to keep it fresh; it does not move him up or down */
      const at = S.rung[pick], review = at > 0 && kqRand() < 0.2, ri = review ? at - 1 : at;
      q = kqOther(pick, KQ_RUNGS[pick][ri], review ? -1 : ri);
    }
  }
  if(!q) q = kqItem(kqPickKey(S, kqMulKeys(S, S.open, KQ_FORM_ORDER, true)));
  S.streak.push(q.skill); if(S.streak.length > 4) S.streak.shift();
  S.last = q.key || null;
  return q;
}
/* HIS ANSWER. Records it, moves the boxes and the rungs, and says what it earns: { ok, quick, energy }. Quick: in the
   time the sum should take. `src`: 'fight', or 'build' (the builders' sums: no enemy waiting, so not counted in his pace) */
function kqAnswer(K, q, vals, ms, src){
  const S = kqSt(K);
  vals = (Array.isArray(vals) ? vals : [vals]).map(v=> String(v == null ? '' : v).trim());
  const ok = kqCheck(q, vals), quick = ok && ms <= q.ms;
  (K.log || (K.log = [])).push({ t:Date.now(), s:q.skill, f:q.form || null, q:q.text, a:q.sol.join(' × '), g:vals.join(' × '), ok,
                                 ms:Math.round(ms), tm:q.ms, src:src || 'fight' });
  if(K.log.length > 400) K.log.splice(0, K.log.length - 400);
  /* wrong: it comes back two to four sums later (once: a sum already waiting to come back is not queued twice) */
  if(!ok && !S.retry.some(r=> q.key ? r.q.key === q.key : r.q.a === q.a && r.q.b === q.b && r.q.op === q.op) && S.retry.length < 6)
    S.retry.push({ q:{ key:q.key, skill:q.skill, a:q.a, b:q.b, op:q.op, ans:q.sol[0], rung:q.rung }, at:S.n + kqInt(2, 4) });
  if(q.key){
    /* right and in time, a box up (straight to known the first time); right but slow, at least seen; wrong, back to the start */
    const bx = S.boxes[q.key] || (S.boxes[q.key] = { b:0, n:0, w:0 }), first = bx.n === 0;
    bx.n++;
    if(!ok){ bx.w++; bx.b = 0; }
    else if(quick) bx.b = Math.min(4, first ? 2 : bx.b + 1);
    else bx.b = Math.max(bx.b, 1);
    if(q.form === 'z' && (!K.sums || K.sums.mode !== 'set')) kqOpenTables(S, ok && quick);
  } else if(q.rungAt >= 0 && (!K.sums || K.sums.mode !== 'set')){
    kqClimb(S, q.skill, ok, quick);
  }
  return { ok, quick, energy:ok ? q.e : 0 };
}
/* the facts of a table, 2 × 1 … 2 × 12 */
const kqTableFacts = t=> Array.from({ length:12 }, (_, i)=>{ const n = i + 1; return `m${Math.min(t, n)}x${Math.max(t, n)}`; });
/* the next table, once most of those in play are known (or at once, for a run of eight right and in time); a table's
   division facts once all its facts are (kept, for when division comes) */
function kqOpenTables(S, good){
  S.tRun = good ? (S.tRun || 0) + 1 : 0;
  const keys = [...new Set(S.open.flatMap(kqTableFacts))];
  const known = keys.filter(k=> kqBox(S, k) >= 2).length;
  const next = KQ_TABLES.find(t=> !S.open.includes(t));
  if(next && (known >= keys.length * 0.8 || S.tRun >= 8)){ S.open.push(next); S.tRun = 0; }
  S.open.forEach(t=>{ if(!S.dopen.includes(t) && kqTableFacts(t).every(k=> kqBox(S, k) >= 2)) S.dopen.push(t); });
}
/* a rung up for 9 of his last 10 right and 7 in time (or, starting out, his first 3 right and in time); down for 6 or fewer of 10 */
function kqClimb(S, skill, ok, inTime){
  const w = S.win[skill], top = KQ_RUNGS[skill].length - 1;
  S.seen[skill]++;
  w.push({ ok, inTime }); if(w.length > 10) w.shift();
  const up = ()=>{ if(S.rung[skill] < top){ S.rung[skill]++; } S.win[skill] = []; };
  const down = ()=>{ if(S.rung[skill] > 0){ S.rung[skill]--; } S.win[skill] = []; };
  if(S.seen[skill] <= 12 && w.length >= 3 && w.slice(-3).every(x=> x.ok && x.inTime)) return up();
  if(w.length < 10) return;
  const right = w.filter(x=> x.ok).length, fast = w.filter(x=> x.inTime).length;
  if(right >= 9 && fast >= 7) up();
  else if(right <= 6) down();
}
/* FOR THE PARENT: each table, form by form (known: right and in time), each form's accuracy and usual time over its last
   50, the other skills, and what is still weak */
function kqReport(K){
  const S = kqSt(K), log = K.log || [];
  const tables = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(t=>{
    const by = {}; KQ_FORM_ORDER.forEach(f=> by[f] = { n:0, known:0 });
    kqMulKeys(S, [t], KQ_FORM_ORDER, false).forEach(k=>{ const f = KQ_PRE[k[0]]; by[f].n++; if(kqBox(S, k) >= 2) by[f].known++; });
    return { t, open:S.open.includes(t), by };
  });
  const stat = xs=>{ const right = xs.filter(x=> x.ok).length, ms = xs.map(x=> x.ms).sort((a, b)=> a - b);
    return { n:xs.length, pct:xs.length ? Math.round(right * 100 / xs.length) : null, mid:ms.length ? ms[Math.floor(ms.length / 2)] : null }; };
  const forms = KQ_FORM_ORDER.map(f=> Object.assign({ f, name:KQ_FORMS[f].name, eg:KQ_FORMS[f].eg }, stat(log.filter(x=> x.f === f).slice(-50))));
  const skills = KQ_SKILLS.filter(k=> k !== 'tables').map(k=> Object.assign({ k, name:KQ_NAME[k],
    at:k === 'divfacts' ? (S.dopen.length ? 'tables ' + S.dopen.join(', ') : 'not yet') : KQ_RUNGS[k][S.rung[k]].say }, stat(log.filter(x=> x.s === k).slice(-50))));
  const weak = Object.entries(S.boxes).filter(([k, b])=> b.b <= 1 && b.w >= 1).sort((a, b)=> b[1].w - a[1].w).slice(0, 16).map(([k])=> kqKeyText(k));
  return { tables, forms, skills, weak, open:S.open.slice(), total:log.length, right:log.filter(x=> x.ok).length };
}
/* how many he knows by heart (box 3 or more: right and in time, again and again), form by form */
function kqMastery(K){
  const S = kqSt(K), c = { z:0, f:0, p2:0, p3:0, p4:0 };
  for(const k in S.boxes){ const f = KQ_PRE[k[0]]; if(f && S.boxes[k].b >= 3) c[f]++; }
  return c;
}
/* his pace, for the enemies' timers: the middle of his last ten answers in a fight, kept between 0.6 and 1.5 times what
   those sums should take (so a slow day still meets a timer, and a quick one is not run off his feet) */
function kqPace(K){
  const xs = (K.log || []).filter(x=> x.src !== 'build').slice(-10);
  if(xs.length < 3) return 8000;
  const ms = xs.map(x=> x.ms).sort((a, b)=> a - b), mid = ms[Math.floor(ms.length / 2)];
  const tgt = xs.map(x=> x.tm || 6000).sort((a, b)=> a - b)[Math.floor(xs.length / 2)];
  return Math.max(tgt * 0.6, Math.min(tgt * 1.5, mid));
}

/* ============================================================
   THE KINGDOM: its state, the partner, its forms and talents
   ============================================================ */
function kdFresh(){
  return { v:2, met:false, partner:null, coins:30, food:10, mats:{ wood:10, stone:5, iron:0 }, potions:0, wins:0, trials:0,
           sums:{ mode:'adaptive', set:kqDefaultSet() }, log:[], stats:{ battles:0, won:0, lost:0 }, city:null };
}
function kd(){
  const p = state.progress;
  if(!p.kingdom || typeof p.kingdom !== 'object') p.kingdom = kdFresh();
  const K = p.kingdom;
  if(K.v !== 2) kdUpgradeSave(K);
  if(!K.sums) K.sums = { mode:'adaptive', set:kqDefaultSet() };
  if(!K.sums.set) K.sums.set = kqDefaultSet();
  if(!K.sums.set.forms) K.sums.set.forms = ['z'];
  if(!K.stats) K.stats = { battles:0, won:0, lost:0 };
  if(!K.log) K.log = [];
  if(!K.mats) K.mats = { wood:0, stone:0, iron:0 };
  ['coins', 'food', 'potions', 'wins', 'trials'].forEach(k=>{ if(typeof K[k] !== 'number') K[k] = 0; });
  if(typeof kcEnsure === 'function') kcEnsure(K);
  if(K.partner){
    const P = K.partner;
    if(!P.tal) P.tal = {};
    if(!P.forms || !P.forms.length) P.forms = ['physical'];
    if(!KD_FORMS[P.form]) P.form = P.forms[0];
    if(typeof P.hp !== 'number') P.hp = kdMaxHp(P, K);              // (a partner from a 4.72 save: in full health)
  }
  return K;
}
/* (4.73) a 4.72 kingdom (on no iPad: 4.72 was not uploaded): its partner kept, as the Physical form; its crowns as coins */
function kdUpgradeSave(K){
  const old = Object.assign({}, K);
  Object.keys(K).forEach(k=> delete K[k]);
  Object.assign(K, kdFresh(), { met:!!old.met, coins:30 + (old.crowns || 0), potions:old.potions || 0, wins:old.wins || 0,
    sums:old.sums || { mode:'adaptive', set:kqDefaultSet() }, sk:old.sk, log:old.log || [], stats:old.stats || { battles:0, won:0, lost:0 } });
  if(old.sk) Object.values(old.sk.boxes || {}).forEach(()=>{});   // the boxes keep their keys: 'm7x8' is still 7 × 8
  if(old.partner) K.partner = { name:old.partner.name || 'Partner', form:'physical', forms:['physical'], level:old.partner.level || 1, xp:old.partner.xp || 0, hp:null, tal:{} };
  if(old.guardian && K.partner){ K.partner.forms.push('fire'); K.trials = 1; }
}
/* the bottom portal is awake once Region 6 is open (18-rift.js asks) */
function kdPortalAwake(){ return typeof r6Met === 'function' && r6Met(); }
function kdHeir(){ return (typeof AVATARS !== 'undefined' && AVATARS.female.includes(state.avatar)) ? 'princess' : 'prince'; }

/* THE PARTNER'S FORMS, in the order they are earned. Each: its type, the monster standing in for it until the designer's
   pictures come, its four moves' names, what it does for the city */
const KD_FORMS = {
  physical: { type:'Physical', standIn:'physical_starter',  name:'Physical', moves:['Bash', 'Power Charge', 'Ground Stomp', 'Titan Fist'] },
  fire:     { type:'Fire',     standIn:'fire_starter1',     name:'Fire',     moves:['Flame Flick', 'Fire Burst', 'Fire Wave', 'Inferno'],
              city:'it burns back the wild land round the city, a plot at a time, out to nine by nine.' },
  water:    { type:'Water',    standIn:'water_starter1',    name:'Water',    moves:['Splash Shot', 'Tidal Crash', 'Whirlpool', 'Tsunami'],
              city:'it waters the fields (half as much food again) and fills a moat round the walls.' },
  grass:    { type:'Grass',    standIn:'grass_starter1',    name:'Grass',    moves:['Vine Lash', 'Thorn Burst', 'Petal Storm', 'Root Spear'],
              city:'it makes the fields fertile: half as much food again.' },
  electric: { type:'Electric', standIn:'electric_starter1', name:'Electric', moves:['Spark', 'Thunder Jolt', 'Storm Field', 'Lightning Spear'] },
  flying:   { type:'Flying',   standIn:'flying_starter1',   name:'Flying',   moves:['Peck', 'Wing Slash', 'Gale', 'Sky Dive'] },
  psychic:  { type:'Psychic',  standIn:'psychic_starter1',  name:'Psychic',  moves:['Mind Poke', 'Mind Beam', 'Mind Wave', 'Psy Lance'] },
  ghost:    { type:'Ghost',    standIn:'ghost_starter1',    name:'Ghost',    moves:['Spook', 'Shadow Swipe', 'Night Wail', 'Soul Rend'] },
  fairy:    { type:'Fairy',    standIn:'fairybunny',        name:'Fairy',    moves:['Sparkle', 'Moon Beam', 'Star Shower', 'Wish Lance'] },
  physical2:{ type:'Physical', standIn:'physical_starter2', name:'Stronger Physical', boost:1.25, moves:['Crush', 'Mega Slam', 'Quake Stomp', 'Titan Strike'] },
};
const KD_FORM_ORDER = ['physical', 'fire', 'water', 'grass', 'electric', 'flying', 'psychic', 'ghost', 'fairy', 'physical2'];
/* THE MOVES, the same four for every form ("2,4,8,8 word cost"): power × its attack; Power 1 a fifth more for each
   energy than the basic attack, Power 2 every enemy at once, the Ultimate the strongest blow for its energy */
const KD_SLOTS = [
  { key:'basic', label:'Basic',    cost:2, pow:2.0, at:1 },
  { key:'p1',    label:'Power 1',  cost:4, pow:4.8, at:1 },
  { key:'p2',    label:'Power 2',  cost:8, pow:4.0, at:4, aoe:true },
  { key:'ult',   label:'Ultimate', cost:8, pow:12,  at:7 },
];
const KD_GUARD = 1, KD_CHANGE = 2, KD_ENERGY_MAX = 10;
const kdTal = (P, k)=> (P && P.tal && P.tal[k]) || 0;
const kdAtk = P=> (8 + 2 * P.level) * (1 + 0.05 * kdTal(P, 'atk'));
function kdMaxHp(P, K){
  K = K || (state.progress && state.progress.kingdom) || {};
  const heal = typeof kcLv === 'function' ? kcLv(K, 'healer') : 0;
  return Math.round((60 + 12 * P.level) * (1 + 0.08 * kdTal(P, 'hp')) * (1 + 0.06 * Math.max(0, heal - 1)));
}
/* a block holds off up to this much of one blow (a same-level enemy's blow and a half); Absorption halves it */
const kdBlockValue = (P, form)=> Math.round((9 + 3 * P.level) * (form === 'grass' && kdTal(P, 'absorb') ? 0.5 : 1));
const kdNeed = L=> 20 + 10 * L;
function kdPartnerArt(form, view, px, cls){
  const F = KD_FORMS[form] || KD_FORMS.physical;
  /* the designer's picture first; the stand-in until it is there */
  return `<img class="kd-mon ${cls || ''}" src="assets/mon/kingdom_${form}_${view}.png" alt="" style="width:${px}px;height:${px}px"
    onerror="this.onerror=null;this.src='assets/mon/${F.standIn}_${view}.png'">`;
}
const kdTypeBadge = t=> `<span class="type-badge" style="background:${TYPE_COLORS[t] || '#888'}">${t}</span>`;

/* THE TALENTS: a point for every level after the first. Those of a form work only while the partner is in that form */
const kdTideLow = r=> +(1 - 0.05 * (r + 1)).toFixed(2), kdTideHigh = r=> +(1 + 0.1 * r).toFixed(2);
const KD_TALENTS = {
  all:[
    { k:'ready',  name:'Ready stance',    max:1, say:()=> 'Start every battle with a block already up.' },
    { k:'atk',    name:'Strength',        max:5, say:r=> `Attack +${5 * r}%.` },
    { k:'dmg',    name:'Fury',            max:5, say:r=> `Damage dealt +${5 * r}%.` },
    { k:'dr',     name:'Thick hide',      max:5, say:r=> `Damage taken −${4 * r}%.` },
    { k:'hp',     name:'Vigour',          max:5, say:r=> `Health +${8 * r}%.` },
  ],
  fire:[
    { k:'burn',   name:'Burning',         max:5, say:r=> `Every hit sets it burning for 3 s: ${6 * r}% of your attack each second.` },
    { k:'splash', name:'Splash',          max:5, say:r=> `A hit on one splashes every other enemy for ${10 * r}% of it.` },
    { k:'pierce', name:'Armour piercing', max:5, say:r=> `Attacks in a row, before an enemy strikes, each hit ${6 * r}% harder than the one before: ×${(1 + 0.06 * r).toFixed(2)}, ×${Math.pow(1 + 0.06 * r, 2).toFixed(2)}, ×${Math.pow(1 + 0.06 * r, 3).toFixed(2)} … (up to five).` },
  ],
  water:[
    { k:'current', name:'Strong currents', max:5, say:r=> `Each hit slows its attack timer by ${6 * r}% for 6 s. Slows add up, to 60%.` },
    { k:'tide',    name:'Tides',           max:5, say:r=> `Low and high tide take turns, 10 s each, starting low: your attacks ×${kdTideLow(r)} at low tide, ×${kdTideHigh(r)} at high tide.` },
  ],
  grass:[
    { k:'growth', name:'Rapid growth',    max:5, say:r=> `Each hit you deal or take (unless fully blocked) adds 5% attack for the battle, up to +${20 * r}%.` },
    { k:'absorb', name:'Absorption',      max:5, say:r=> `Your blocks hold half as much, but each attack heals you ${15 * r}% of your attack.` },
    { k:'sap',    name:'Poison sap',      max:5, say:r=> `When you are hurt, every enemy is poisoned for 5 s: ${4 * r}% of your attack each second.` },
  ],
  electric:[
    { k:'quick',  name:'Quick charge',    max:1, say:()=> 'Two right answers in a row, each in time, give an energy more.' },
    { k:'dodge',  name:'Dodge',           max:5, say:r=> `Guard less than ${(0.4 + 0.2 * r).toFixed(1)} s before a blow lands: no damage, and your block stays.` },
    { k:'stun',   name:'Stun',            max:5, say:r=> `Each hit stops its attack timer for ${(0.3 * r).toFixed(1)} s.` },
  ],
};
const kdTalSpent = P=> Object.values(P.tal || {}).reduce((a, b)=> a + b, 0);
const kdTalPoints = P=> Math.max(0, P.level - 1 - kdTalSpent(P));
/* a form's own talent, only in that form */
const kdFormTal = (B, P, form, k)=> B.form === form ? kdTal(P, k) : 0;

/* THE TRIALS: each earns the next form. The first, the meadow's guardian, comes soon; the rest ask for levels and for sums
   known by heart (box 3 or more), more and harder each time */
const KD_TRIALS = [
  { form:'fire',      sp:'deer',           name:'The meadow\'s guardian', need:{ wins:5 },            lv:1, hp:1.5 },
  { form:'water',     sp:'whale',          name:'The river\'s guardian',  need:{ level:8,  z:30 },    lv:2, hp:2 },
  { form:'grass',     sp:'mantis',         name:'The forest\'s guardian', need:{ level:12, f:25 },    lv:2, hp:2 },
  { form:'electric',  sp:'thunderlion',    name:'The storm\'s guardian',  need:{ level:16, p2:20 },   lv:2, hp:2 },
  { form:'flying',    sp:'eagle',          name:'The cliffs\' guardian',  need:{ level:20, tables:11, p2:40 }, lv:2, hp:2 },
  { form:'psychic',   sp:'unicorn',        name:'The dreaming guardian',  need:{ level:24, p3:15 },   lv:3, hp:2.2 },
  { form:'ghost',     sp:'ghost_guardian', name:'The barrow\'s guardian', need:{ level:28, p3:30 },   lv:3, hp:2.2 },
  { form:'fairy',     sp:'horned_lynx',    name:'The glade\'s guardian',  need:{ level:32, p4:10 },   lv:3, hp:2.4 },
  { form:'physical2', sp:'fighting_ape',   name:'The mountain\'s guardian', need:{ level:36, p4:20, z:120 }, lv:4, hp:2.6 },
];
const KD_NEED_SAY = { wins:n=> `${n} meadow battles won`, level:n=> `Level ${n}`, tables:n=> `All ${n} times tables open`,
  z:n=> `${n} times-table answers known by heart`, f:n=> `${n} missing numbers known by heart`, p2:n=> `${n} two-factor sums known by heart`,
  p3:n=> `${n} three-factor sums known by heart`, p4:n=> `${n} four-factor sums known by heart` };
function kdTrial(K){
  const T = KD_TRIALS[K.trials || 0];
  if(!T || !K.partner) return null;
  const P = K.partner, m = kqMastery(K), S = kqSt(K);
  const have = { wins:K.wins, level:P.level, tables:S.open.length, z:m.z, f:m.f, p2:m.p2, p3:m.p3, p4:m.p4 };
  const needs = Object.entries(T.need).map(([k, n])=> ({ say:KD_NEED_SAY[k](n), have:Math.min(have[k], n), want:n, ok:have[k] >= n }));
  return { T, needs, ready:needs.every(x=> x.ok) };
}

/* THE WILDS: who lives in the meadow; what each type leaves behind ("raw materials") */
const KD_MEADOW = ['thundersquirrel', 'magnet', 'zebra', 'starfish', 'duck', 'seahorse', 'snail', 'firefly', 'boobybird', 'moth', 'bird',
                   'sparrow', 'rat', 'squirrel', 'earth_snake', 'golem', 'puffball', 'tapir', 'ghost', 'puppet', 'kicker', 'weasel'];
const KD_MAT = { Grass:'wood', Flying:'wood', Fairy:'wood', Water:'wood', Ground:'stone', Physical:'stone', Ghost:'stone', Dragon:'stone',
                 Steel:'iron', Electric:'iron', Fire:'iron', Psychic:'iron' };
const KD_MAT_NAME = { wood:'wood', stone:'stone', iron:'iron' };
function kdFoe(sp, E, opt){
  opt = opt || {};
  const S = SPECIES[sp] || {}, pack = opt.pack || 1, hp = Math.round((60 + 20 * E) * (opt.hp || 1) * (pack > 1 ? 0.6 : 1));
  const types = (S.types || ['Physical']).slice();
  return { sp, name:opt.name || S.name || sp, types, level:E, hp, maxHp:hp, boss:!!opt.boss, pack,
           dmg:(6 + 2 * E) * (opt.boss ? 1.25 : 1) * (pack > 2 ? 0.45 : pack > 1 ? 0.65 : 1), mat:KD_MAT[types[0]] || 'stone',
           acc:0, interval:8000, slows:[], stunUntil:0, burn:null, poison:[], pNext:0, down:false };
}
/* a meadow battle: one wild monster near the partner's level; from Power 2 on, sometimes two or three, each a little weaker */
function kdWild(){
  const P = kd().partner, lv = ()=> Math.max(1, Math.min(60, P.level - 1 + kqInt(0, 2))), sp = ()=> KD_MEADOW[kqInt(0, KD_MEADOW.length - 1)];
  const r = kqRand(), n = P.level >= KD_SLOTS[2].at ? (r < 0.15 ? 3 : r < 0.5 ? 2 : 1) : 1;
  return Array.from({ length:n }, ()=> kdFoe(sp(), n > 1 ? Math.max(1, lv() - 1) : lv(), { pack:n }));
}

/* ============================================================
   THROUGH THE PORTAL: the steward, and the partner
   ============================================================ */
async function kdRiftPortal(){
  if(ui.riftTalk) return;
  walkTeardown();
  go('kingdom');
}
function kdSay(html, button){ return sceneSay([faceNpc('grandpa', '')], 'The steward', html, button); }
async function kdWelcome(){
  const K = kd(), heir = kdHeir();
  ui.kdTalk = true;
  try {
    await kdSay(`Your Highness! The ${heir} has come home at last.`);
    await kdSay('Look at what is left of the kingdom: the palace, and the few old buildings round it. Everything beyond is wild land, and monsters come out of it.');
    await kdSay('Your own monsters could not follow you: that portal lets only people through. But a young monster of the kingdom is waiting to meet you. It is plain and small now. It grows: beat the guardians of the wilds, and it learns new forms.');
    await kdSay('It grows strong on sums. Answer well and quickly, and it fights well. Answer too slowly, and the enemy strikes first.');
  } finally { ui.kdTalk = false; }
  K.met = true; await saveProfile();
  if(ui.screen === 'kingdom') renderKingdom();
}
/* the partner, named: plain Physical to start */
function kdNameRender(){
  kdCss();
  const K = kd();
  $('#brandSub').textContent = 'The Kingdom';
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← The Time Rift</button>
    <div class="screen-title">Your partner</div>
    <div class="screen-sub">It will fight beside you in the kingdom, and learn new forms as you go.</div>
    <div class="kd-card kd-meet">
      <div class="kd-pic big">${kdPartnerArt('physical', 'front', 150)}</div>
      <div class="kd-name">
        ${kdTypeBadge('Physical')}
        <label for="kdNameIn">Give it a name</label>
        <input id="kdNameIn" maxlength="14" autocomplete="off" value="">
        <button class="btn btn-primary" id="kdNameGo">That's its name</button>
      </div>
    </div>`;
  $('#backBtn').addEventListener('click', ()=>{ ui.walkFresh = false; go('r6_rift'); });
  const done = async ()=>{
    const name = ($('#kdNameIn').value || '').trim().slice(0, 14) || 'Pip';
    K.partner = { name, form:'physical', forms:['physical'], level:1, xp:0, hp:null, tal:{} };
    K.partner.hp = kdMaxHp(K.partner, K);
    await saveProfile();
    renderKingdom();
    ui.kdTalk = true;
    try {
      await kdSay(`${escapeHtml(name)} it is! Take it out to the meadow beyond the gate. The monsters there carry no coins, but they leave wood, stone and iron behind: what the city is built from.`);
      await kdSay('Coins come from the city itself: its fields and its people. Repair the granary and build a house to start. Every battle you win is a day in the kingdom.');
    } finally { ui.kdTalk = false; }
  };
  $('#kdNameGo').addEventListener('click', done);
  $('#kdNameIn').addEventListener('keydown', e=>{ if(e.key === 'Enter') done(); });
  if(!K.met && !ui.kdTalk) setTimeout(kdWelcome, 300);
  else setTimeout(()=>{ const i = $('#kdNameIn'); if(i) i.focus(); }, 60);
}
/* a new form (already the partner's, kdbWin): it glows and changes */
function kdEvolve(form, was){
  return new Promise(res=>{
    const K = kd(), P = K.partner, F = KD_FORMS[form];
    was = was && was !== form ? was : 'physical';
    const box = document.createElement('div');
    box.className = 'kd-over kd-evo';
    box.innerHTML = `<div class="kd-card kd-overcard">
      <div class="kd-h">${escapeHtml(P.name)} is changing!</div>
      <div class="kd-evo-pics"><div class="was">${kdPartnerArt(was, 'front', 110)}</div><div class="arrow" aria-hidden="true">→</div><div class="now">${kdPartnerArt(form, 'front', 140)}</div></div>
      <p class="kd-gain">${kdTypeBadge(F.type)} ${escapeHtml(P.name)} can now take its ${F.name} form.</p>
      ${F.city ? `<p class="kd-sub2">In the city: ${F.city}</p>` : ''}
      <p class="kd-sub2">It keeps this form from battle to battle. In a battle, Change form (2 energy) turns it into any form it knows.</p>
      <div class="kd-row"><button class="btn btn-primary" id="kdEvoOk">Wonderful!</button></div></div>`;
    document.body.appendChild(box);
    box.querySelector('#kdEvoOk').addEventListener('click', ()=>{ box.remove(); res(); });
    setTimeout(()=>{ const b = box.querySelector('#kdEvoOk'); if(b) b.focus(); }, 40);
  });
}

/* ============================================================
   THE SUM ON SCREEN: numbers, signs and blanks; the number pad fills the blank that is lit; ✓ moves to the next blank,
   then checks. Shared by the battles and the builders (46-kingdom-city.js).
   ============================================================ */
function kdQHtml(q, vals, cur, show){
  let bi = 0;
  return q.view.map(v=>{
    if(v !== KQ_BL) return `<span class="kq-t ${typeof v === 'number' ? 'n' : 'op'}">${v}</span>`;
    const i = bi++, val = vals[i] || '';
    if(show) return `<span class="kq-bl shown">${val !== '' && String(val) !== String(show[i]) ? `<s>${escapeHtml(val)}</s>` : ''}${show[i]}</span>`;
    return `<span class="kq-bl ${i === cur && q.nb > 1 ? 'cur' : ''} ${val !== '' ? 'full' : ''}" data-bi="${i}">${val !== '' ? escapeHtml(val) : '&nbsp;'}</span>`;
  }).join('');
}
/* a key on a sum: { q, vals, cur }. 'submit' when it is to be checked */
function kdQKey(st, k){
  const nb = st.q.nb;
  if(k === 'ok'){
    if(st.vals[st.cur] === '') { const e = st.vals.findIndex(v=> v === ''); if(e >= 0 && e !== st.cur){ st.cur = e; } return null; }
    const empty = st.vals.findIndex(v=> v === '');
    if(empty < 0) return 'submit';
    st.cur = st.cur < nb - 1 && st.vals[st.cur + 1] === '' ? st.cur + 1 : empty;
    return null;
  }
  if(k === 'next'){ st.cur = (st.cur + 1) % nb; return null; }
  if(k === 'del'){
    if(st.vals[st.cur] !== '') st.vals[st.cur] = st.vals[st.cur].slice(0, -1);
    else if(st.cur > 0){ st.cur--; st.vals[st.cur] = st.vals[st.cur].slice(0, -1); }
    return null;
  }
  if(/^\d$/.test(k)){ const v = st.vals[st.cur]; if(v.length < (nb > 1 ? 3 : 5)) st.vals[st.cur] = (v === '0' ? '' : v) + k; }
  return null;
}
const KD_PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
function kdPadHtml(id){
  return `<div class="kdb-pad" id="${id}">${KD_PAD.map(k=> `<button class="kdb-key ${k === 'ok' ? 'ok' : k === 'del' ? 'del' : ''}" data-k="${k}" data-sfx="none" aria-label="${k === 'ok' ? 'Enter' : k === 'del' ? 'Delete' : k}">${k === 'ok' ? '✓' : k === 'del' ? '⌫' : k}</button>`).join('')}</div>`;
}
/* the pad's keys, and the blanks a finger can choose */
function kdPadWire(root, onKey){
  root.querySelectorAll('.kdb-key').forEach(b=>{
    b.addEventListener('pointerdown', e=>{ e.preventDefault(); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); onKey(b.dataset.k); });
    b.addEventListener('click', e=>{ if(e.detail === 0) onKey(b.dataset.k); });
  });
}

/* ============================================================
   SUM BATTLES (screen 'kdBattle'). ui.kdB: the battle.
   ============================================================ */
/* (4.72) The designer: "Mix of adaptive and fixed. Enemy levels increase their speed and damage." (4.73) "Please reduce
   enemy attack timers to 5-7seconds or less, make it more of a challenge to build automaticity." His pace (kqPace: the
   middle of his last ten answers in a fight) × 1.3, held between 5 and 7 s; then 2% quicker for every level of the
   enemy's, never under 3 s. */
const KD_TIMER = { lo:5000, hi:7000, pace:1.3, floor:3000 };
function kdTimerMs(K, foe){
  const base = Math.max(KD_TIMER.lo, Math.min(KD_TIMER.hi, kqPace(K) * KD_TIMER.pace));
  return Math.round(Math.max(KD_TIMER.floor, base * Math.max(0.5, 1 - 0.02 * foe.level)));
}
/* `foes`: one or more (kdFoe); `trial`: the trial being fought */
function kdBattleStart(foes, trial){
  const K = kd(), P = K.partner;
  if(!P) return;
  if(P.hp <= 0){ toast(`${P.name} is worn out. Rest first.`); return; }
  foes = Array.isArray(foes) ? foes : [foes];
  const n = foes.length;
  /* two or three at once: each its own timer, as quick as one alone (their blows lighter, kdFoe), and they do not all
     strike together */
  foes.forEach((f, i)=>{ f.interval = kdTimerMs(K, f); f.acc = -Math.round(i * f.interval / n); });
  ui.kdB = { foes, target:0, trial:trial || null, form:P.form, energy:0, blocks:kdTal(P, 'ready') ? 1 : 0,
             q:null, vals:[''], cur:0, qAt:0, t:0, last:0, paused:true, started:false, over:false, reveal:false, busy:false,
             chain:0, grow:0, quickRun:0, lastGuard:-1e9, asked:0, right:0, quick:0 };
  go('kdBattle');
}
const kdbAlive = B=> B.foes.filter(f=> !f.down);
function kdbTarget(B){
  let f = B.foes[B.target];
  if(!f || f.down){ const a = kdbAlive(B)[0]; B.target = a ? B.foes.indexOf(a) : 0; f = a || null; }
  return f;
}
/* the tide (Water's Tides): low first, 10 s each */
function kdTide(B, P){
  const r = kdFormTal(B, P, 'water', 'tide');
  if(!r) return null;
  const high = Math.floor(B.t / 10000) % 2 === 1, left = 10000 - (B.t % 10000);
  return { high, m:high ? kdTideHigh(r) : kdTideLow(r), left };
}
function kdBattleRender(){
  kdCss();
  const B = ui.kdB, K = kd(), P = K && K.partner;
  if(!B || !P){ go('kingdom'); return; }
  $('#brandSub').textContent = B.trial ? B.trial.name : 'The meadow';
  const F = KD_FORMS[B.form], n = B.foes.length, px = n === 1 ? (B.trial ? 300 : 280) : n === 2 ? 200 : 150;   // (a sprite's creature fills about 40% of its picture)
  screenEl.innerHTML = `
    <div class="kdb ${B.trial ? 'boss' : ''}">
      <div class="kdb-top">
        <button class="back-link" id="kdRun">← Run back to the city</button>
        <div class="kdb-tide" id="kdbTide" hidden></div>
        <div class="kdb-energy" id="kdbEnergy" role="img" aria-label="Energy">${Array.from({ length:KD_ENERGY_MAX }, ()=> '<i></i>').join('')}<span>Energy</span></div>
      </div>
      <div class="kdb-arena n${n}">
        <div class="kdb-foes">${B.foes.map((f, i)=> `
          <button class="kdb-foe ${f.down ? 'down' : ''}" data-foe="${i}" aria-label="${escapeHtml(f.name)}: target it">
            <div class="kdb-tag"><b>${escapeHtml(f.name)}</b> <span class="kd-lv">Lv ${f.level}</span> ${f.types.map(kdTypeBadge).join(' ')}
              <div class="kdb-hp"><i><b></b></i><em></em></div>
              <div class="kdb-meter"><i><b></b></i><em></em></div>
              <div class="kdb-st"></div></div>
            <div class="kdb-foepic">${monPortrait(f.sp, px, { view:'front', bare:true })}</div>
          </button>`).join('')}</div>
        <div class="kdb-me">
          <div class="kdb-mepic" id="kdbMePic">${kdPartnerArt(B.form, 'back', n > 1 ? 250 : 290)}</div>
          <div class="kdb-tag"><b>${escapeHtml(P.name)}</b> <span class="kd-lv">Lv ${P.level}</span> ${kdTypeBadge(F.type)}
            <div class="kdb-hp me" id="kdbMeHp"><i><b></b></i><em></em></div>
            <div class="kdb-blocks" id="kdbBlocks"></div></div>
        </div>
        <div class="kdb-fx" id="kdbFx" aria-live="polite"></div>
      </div>
      <div class="kdb-sum" id="kdbSum"></div>
      <div class="kdb-ctrl">
        ${kdPadHtml('kdbPad')}
        <div class="kdb-moves" id="kdbMoves">${KD_SLOTS.map((s, i)=> `
          <button class="kdb-move s${i}" data-mv="${i}"><b>${P.level >= s.at ? F.moves[i] : s.label}</b><span class="kdb-cost">${Array.from({ length:s.cost }, ()=> '<i></i>').join('')}</span><small>${P.level >= s.at ? `${s.label} · ${s.cost}${s.aoe ? ' · hits all' : ''}` : `Learnt at level ${s.at}`}</small></button>`).join('')}
          <button class="kdb-move guard" data-act="guard"><b>Guard</b><span class="kdb-cost"><i></i></span><small>1 · a block</small></button>
          <button class="kdb-move change" data-act="change" ${P.forms.length > 1 ? '' : 'hidden'}><b>Change<span class="kdb-long"> form</span></b><span class="kdb-cost"><i></i><i></i></span><small>2 · any form it knows</small></button>
          <button class="kdb-move potion" data-act="potion"><b>Potion</b><small></small></button></div>
      </div>
    </div>`;
  $('#kdRun').addEventListener('click', ()=> kdBattleLeave());
  kdPadWire(screenEl, kdbKey);
  screenEl.querySelectorAll('[data-mv]').forEach(b=> b.addEventListener('click', ()=> kdbMove(+b.dataset.mv)));
  screenEl.querySelector('[data-act="guard"]').addEventListener('click', kdbGuard);
  screenEl.querySelector('[data-act="change"]').addEventListener('click', kdbChangeForm);
  screenEl.querySelector('[data-act="potion"]').addEventListener('click', kdbPotion);
  screenEl.querySelectorAll('[data-foe]').forEach(b=> b.addEventListener('click', ()=>{ const i = +b.dataset.foe; if(!B.foes[i].down){ B.target = i; kdbDraw(); } }));
  $('#kdbSum').addEventListener('click', e=>{ const bl = e.target.closest('[data-bi]'); if(bl && !B.reveal){ B.cur = +bl.dataset.bi; kdbDraw(); } });
  kdbKeysWire();
  if(!B.q) kdbNextQ();
  kdbDraw();
  if(!B.started){ B.started = true; B.paused = false; B.last = performance.now(); B.qAt = performance.now(); }
  cancelAnimationFrame(kdbTick._raf); kdbTick._raf = requestAnimationFrame(kdbTick);
}
function kdbNextQ(){ const B = ui.kdB; B.q = kqNext(kd()); B.vals = Array.from({ length:B.q.nb }, ()=> ''); B.cur = 0; B.qAt = performance.now(); kdbDraw(); }
function kdbKey(k){
  const B = ui.kdB;
  if(!B || B.over || B.reveal || !B.started || document.querySelector('.kd-over')) return;
  if(kdQKey(B, k) === 'submit') return kdbSubmit();
  kdbDraw();
}
function kdbKeysWire(){
  if(kdbKeysWire.on) return; kdbKeysWire.on = true;
  addEventListener('keydown', e=>{
    if(ui.screen !== 'kdBattle' || document.querySelector('.kd-over, .scene-say')) return;
    if(/^\d$/.test(e.key)){ kdbKey(e.key); e.preventDefault(); }
    else if(e.key === 'Backspace'){ kdbKey('del'); e.preventDefault(); }
    else if(e.key === 'Enter'){ kdbKey('ok'); e.preventDefault(); }
    else if(e.key === 'Tab' || e.key === 'x' || e.key === '*'){ kdbKey('next'); e.preventDefault(); }
  });
}
function kdbSubmit(){
  const B = ui.kdB, K = kd(), P = K.partner;
  const r = kqAnswer(K, B.q, B.vals, performance.now() - B.qAt, 'fight');
  B.asked++;
  const sum = $('#kdbSum');
  if(r.ok){
    B.right++;
    let gain = r.energy, bonus = false;
    if(r.quick){ B.quick++; B.quickRun++; } else B.quickRun = 0;
    /* Quick charge (Electric): two in a row, each in time, an energy more */
    if(kdFormTal(B, P, 'electric', 'quick') && B.quickRun >= 2){ gain++; bonus = true; B.quickRun = 0; }
    const before = B.energy; B.energy = Math.min(KD_ENERGY_MAX, B.energy + gain);
    if(sum){ sum.classList.remove('right', 'wrong'); void sum.offsetWidth; sum.classList.add('right'); }
    kdbFloat(B.energy > before ? `+${B.energy - before}${bonus ? ' quick charge!' : ''}` : 'Energy full!', 'energy');
    kdbNextQ();
  } else {
    /* wrong: a right answer for a moment (the enemies wait while it is shown), then the next sum */
    B.quickRun = 0; B.reveal = true; B.paused = true;
    if(sum){ sum.classList.remove('right', 'wrong'); void sum.offsetWidth; sum.classList.add('wrong'); sum.innerHTML = kdQHtml(B.q, B.vals, -1, B.q.sol); }
    setTimeout(()=>{ if(ui.kdB !== B) return; B.reveal = false; B.paused = false; B.last = performance.now(); if(sum) sum.classList.remove('wrong'); kdbNextQ(); }, 1700);
  }
  kdbDraw();
}
const kdbCan = B=> B && !B.over && B.started && !B.busy && !B.reveal;
/* A MOVE: on the enemy chosen (Power 2: on all of them); then what the form's talents add */
function kdbMove(i){
  const B = ui.kdB, K = kd(), P = K.partner, sl = KD_SLOTS[i];
  if(!kdbCan(B) || P.level < sl.at || B.energy < sl.cost) return;
  const tgt = kdbTarget(B); if(!tgt) return;
  B.energy -= sl.cost; B.busy = true;
  const me = $('#kdbMePic'); if(me){ me.classList.remove('lunge'); void me.offsetWidth; me.classList.add('lunge'); }
  setTimeout(()=>{
    if(ui.kdB !== B || B.over) return;
    const F = KD_FORMS[B.form], atk = kdAtk(P) * (1 + 0.05 * B.grow * (B.form === 'grass' ? 1 : 0));
    const tide = kdTide(B, P), pierce = kdFormTal(B, P, 'fire', 'pierce');
    let mult = sl.pow * (F.boost || 1) * (1 + 0.05 * kdTal(P, 'dmg')) * (tide ? tide.m : 1) * (pierce ? Math.pow(1 + 0.06 * pierce, Math.min(5, B.chain)) : 1);
    const hitOne = f=>{
      const type = typeMultiplier([F.type], f.types), dmg = Math.max(1, Math.round(atk * mult * type * (0.9 + kqRand() * 0.2)));
      f.hp = Math.max(0, f.hp - dmg);
      kdbFloatOn(f, `−${dmg}`, type > 1 ? 'big' : '');
      kdbAfterHit(B, P, f, atk);
      return { f, dmg, type };
    };
    const hits = sl.aoe ? kdbAlive(B).map(hitOne) : [hitOne(tgt)];
    /* Splash (Fire): a hit on one, a share of it on every other */
    const sp = kdFormTal(B, P, 'fire', 'splash');
    if(sp && !sl.aoe) kdbAlive(B).filter(f=> f !== tgt).forEach(f=>{ const d = Math.max(1, Math.round(hits[0].dmg * 0.1 * sp)); f.hp = Math.max(0, f.hp - d); kdbFloatOn(f, `−${d}`, 'splash'); });
    /* Absorption (Grass): healed by each attack; Rapid growth: stronger for it */
    const ab = kdFormTal(B, P, 'grass', 'absorb');
    if(ab){ const h = Math.round(atk * 0.15 * ab), mx = kdMaxHp(P, K); if(P.hp < mx){ P.hp = Math.min(mx, P.hp + h); kdbFloat(`+${h}`, 'me heal'); } }
    kdbGrow(B, P);
    if(pierce) B.chain++;
    const best = Math.max(...hits.map(h=> h.type));
    const eff = typeof effectivenessLabel === 'function' ? effectivenessLabel(best) : '';
    kdbSay([`${escapeHtml(P.name)} uses <b>${F.moves[i]}</b>!`, eff, tide ? (tide.high ? 'High tide!' : '') : '', pierce && B.chain > 1 ? `Piercing ×${Math.pow(1 + 0.06 * pierce, Math.min(5, B.chain - 1)).toFixed(2)}` : ''].filter(Boolean).join(' '));
    const fp = screenEl.querySelectorAll('.kdb-foe');
    hits.forEach(h=>{ const el = fp[B.foes.indexOf(h.f)]; const pic = el && el.querySelector('.kdb-foepic'); if(pic){ pic.classList.remove('hurt'); void pic.offsetWidth; pic.classList.add('hurt'); } });
    B.busy = false;
    kdbCheckDown(B);
    kdbDraw();
  }, 260);
  kdbDraw();
}
/* what a hit sets off on the one it hits, by the form's talents */
function kdbAfterHit(B, P, f, atk){
  const burn = kdFormTal(B, P, 'fire', 'burn'), cur = kdFormTal(B, P, 'water', 'current'), stun = kdFormTal(B, P, 'electric', 'stun');
  if(burn) f.burn = { until:B.t + 3000, next:B.t + 1000, dps:Math.max(1, Math.round(atk * 0.06 * burn)) };
  if(cur) f.slows.push({ pct:0.06 * cur, until:B.t + 6000 });
  if(stun) f.stunUntil = Math.max(f.stunUntil || 0, B.t + 300 * stun);
}
/* Rapid growth (Grass): a stack for a hit dealt or taken */
function kdbGrow(B, P){ const g = kdFormTal(B, P, 'grass', 'growth'); if(g) B.grow = Math.min(4 * g, B.grow + 1); }
function kdbGuard(){
  const B = ui.kdB;
  if(!kdbCan(B) || B.energy < KD_GUARD) return;
  B.energy -= KD_GUARD; B.blocks++; B.lastGuard = B.t;
  kdbFloat('Block up', 'block');
  kdbDraw();
}
/* CHANGE FORM: two energy, and any form it knows. The enemies wait while it is chosen. */
function kdbChangeForm(){
  const B = ui.kdB, P = kd().partner;
  if(!kdbCan(B) || B.energy < KD_CHANGE || P.forms.length < 2) return;
  document.querySelectorAll('#kdbFormPick').forEach(x=> x.remove());
  const tgt = kdbTarget(B);
  const box = document.createElement('div');
  box.className = 'kd-over'; box.id = 'kdbFormPick';
  box.innerHTML = `<div class="kd-card kd-overcard"><div class="kd-h">Change form (2 energy)</div>
    ${tgt ? `<div class="kd-sub2">${escapeHtml(tgt.name)} is ${tgt.types.join(' and ')}.</div>` : ''}
    <div class="kd-choose">${P.forms.filter(f=> f !== B.form).map(f=>{ const F = KD_FORMS[f], at = tgt ? typeMultiplier([F.type], tgt.types) : 1, df = tgt ? typeMultiplier(tgt.types, [F.type]) : 1;
      const hint = [at > 1 ? 'Strong against it' : at < 1 ? 'Weak against it' : '', df > 1 ? 'It hits this form hard' : df < 1 ? 'Its blows do less' : ''].filter(Boolean).join(' · ') || 'Even';
      return `<button class="kd-card kd-pick ${at > 1 ? 'good' : at < 1 ? 'bad' : ''}" data-f="${f}">${kdPartnerArt(f, 'front', 72)}${kdTypeBadge(F.type)}<b>${F.name}</b><small>${hint}</small></button>`; }).join('')}</div>
    <div class="kd-row"><button class="btn btn-ghost" id="kdbFormNo">Keep this form</button></div></div>`;
  document.body.appendChild(box);
  box.querySelector('#kdbFormNo').addEventListener('click', ()=>{ box.remove(); B.last = performance.now(); });
  box.querySelectorAll('[data-f]').forEach(b=> b.addEventListener('click', async ()=>{
    box.remove();
    if(B.over || B.energy < KD_CHANGE) return;
    B.energy -= KD_CHANGE; B.form = b.dataset.f; P.form = B.form; B.last = performance.now();
    await saveProfile();
    kdBattleRender();
    kdbSay(`${escapeHtml(P.name)} takes its ${KD_FORMS[B.form].name} form!`);
  }));
}
function kdbPotion(){
  const B = ui.kdB, K = kd(), P = K.partner, mx = kdMaxHp(P, K), mk = typeof kcLv === 'function' ? kcLv(K, 'market') : 0;
  if(!B || B.over || !B.started || !K.potions || P.hp >= mx) return;
  K.potions--; P.hp = Math.min(mx, P.hp + Math.round(mx * (35 + 5 * Math.max(1, mk)) / 100));
  kdbSay(`${escapeHtml(P.name)} drinks a potion.`); kdbDraw();
}
function kdbTick(now){
  const B = ui.kdB;
  if(ui.screen !== 'kdBattle' || !B) return;
  kdbTick._raf = requestAnimationFrame(kdbTick);
  const dt = Math.min(250, now - (B.last || now)); B.last = now;
  if(B.over || B.paused || !B.started || document.hidden || document.querySelector('.kd-over, .scene-say')) return kdbDrawLive();
  B.t += dt;
  const P = kd().partner;
  for(const f of B.foes){
    if(f.down) continue;
    /* burning (Fire) and poison (Grass), a tick a second */
    if(f.burn && B.t >= f.burn.next){ f.burn.next += 1000; f.hp = Math.max(0, f.hp - f.burn.dps); kdbFloatOn(f, `−${f.burn.dps}`, 'burn'); if(B.t >= f.burn.until) f.burn = null; }
    f.poison = f.poison.filter(p=> p.until > B.t);
    if(f.poison.length && B.t >= f.pNext){ f.pNext = B.t + 1000; const d = f.poison.reduce((a, p)=> a + p.dps, 0); f.hp = Math.max(0, f.hp - d); kdbFloatOn(f, `−${d}`, 'poison'); }
    if(f.hp <= 0){ kdbCheckDown(B); if(B.over) return; continue; }
    /* its timer: stopped while stunned (Electric), slower while slowed (Water's currents, added up, to 60%) */
    if(B.t < (f.stunUntil || 0)) continue;
    f.slows = f.slows.filter(s=> s.until > B.t);
    const slow = Math.min(0.6, f.slows.reduce((a, s)=> a + s.pct, 0));
    f.acc += dt * (1 - slow);
    if(f.acc >= f.interval){ f.acc = 0; kdbFoeAttack(f); if(P.hp <= 0) return kdbLose(); }
  }
  kdbDrawLive();
}
/* AN ENEMY STRIKES: dodged (Electric: a guard just before), else a block takes what it can, then the rest */
function kdbFoeAttack(f){
  const B = ui.kdB, K = kd(), P = K.partner, F = KD_FORMS[B.form];
  const mult = typeMultiplier(f.types, [F.type]);
  let dmg = Math.max(1, Math.round(f.dmg * mult * (0.9 + kqRand() * 0.2) * (1 - 0.04 * kdTal(P, 'dr'))));
  const el = screenEl.querySelectorAll('.kdb-foe')[B.foes.indexOf(f)], pic = el && el.querySelector('.kdb-foepic');
  if(pic){ pic.classList.remove('strike'); void pic.offsetWidth; pic.classList.add('strike'); }
  B.chain = 0;                                                     // Armour piercing: the run is broken
  const dg = kdFormTal(B, P, 'electric', 'dodge');
  if(dg && B.t - B.lastGuard <= 400 + 200 * dg){
    B.lastGuard = -1e9;
    kdbFloat('Dodged!', 'me dodge'); kdbSay(`${escapeHtml(P.name)} dodges ${escapeHtml(f.name)}'s blow!`); kdbDraw(); return;
  }
  let held = 0;
  if(B.blocks > 0){ B.blocks--; held = Math.min(dmg, kdBlockValue(P, B.form)); dmg -= held; }
  const me = $('#kdbMePic');
  if(dmg > 0){
    P.hp = Math.max(0, P.hp - dmg);
    if(me){ me.classList.remove('hurt'); void me.offsetWidth; me.classList.add('hurt'); }
    kdbFloat(`−${dmg}`, 'me');
    kdbGrow(B, P);
    /* Poison sap (Grass): hurt, and every enemy poisoned */
    const sap = kdFormTal(B, P, 'grass', 'sap');
    if(sap){ const d = Math.max(1, Math.round(kdAtk(P) * 0.04 * sap)); kdbAlive(B).forEach(x=>{ x.poison.push({ dps:d, until:B.t + 5000 }); if(!x.pNext || x.pNext < B.t) x.pNext = B.t + 1000; }); }
  }
  if(held) kdbFloat(dmg > 0 ? `Blocked ${held}` : 'Blocked!', 'block');
  kdbSay(`${escapeHtml(f.name)} attacks!${dmg === 0 ? ' The block holds.' : mult > 1 ? ' It hits hard.' : mult < 1 ? ' It does little.' : ''}`);
  kdbDraw();
}
/* any down? the next one is chosen; all down, the battle is won */
function kdbCheckDown(B){
  B.foes.forEach((f, i)=>{
    if(f.down || f.hp > 0) return;
    f.down = true;
    const el = screenEl.querySelectorAll('.kdb-foe')[i]; if(el) el.classList.add('down');
  });
  kdbTarget(B);
  if(!kdbAlive(B).length) kdbWin();
}
function kdbDraw(){
  const B = ui.kdB, K = kd(), P = K.partner;
  if(!B || ui.screen !== 'kdBattle') return;
  const mx = kdMaxHp(P, K);
  const hp = (el, v, m)=>{ if(!el) return; const pct = Math.max(0, v * 100 / m); el.querySelector('b').style.width = pct + '%'; el.querySelector('em').textContent = `${v} / ${m}`; el.classList.toggle('low', pct <= 25); };
  screenEl.querySelectorAll('.kdb-foe').forEach((el, i)=>{
    const f = B.foes[i]; hp(el.querySelector('.kdb-hp'), f.hp, f.maxHp);
    el.classList.toggle('tgt', i === B.target && !f.down && kdbAlive(B).length > 1);
    el.classList.toggle('down', f.down);
  });
  hp($('#kdbMeHp'), P.hp, mx);
  const bl = $('#kdbBlocks'); if(bl) bl.innerHTML = B.blocks ? `<span class="kdb-shield" aria-label="${B.blocks} blocks">${kdShield()}<b>×${B.blocks}</b></span>` : '';
  const en = $('#kdbEnergy'); if(en){ en.querySelectorAll('i').forEach((p, i)=> p.classList.toggle('on', i < B.energy)); en.setAttribute('aria-label', `Energy ${B.energy} of ${KD_ENERGY_MAX}`); }
  const sum = $('#kdbSum'); if(sum && B.q && !B.reveal) sum.innerHTML = kdQHtml(B.q, B.vals, B.cur) + (B.q.nb > 1 ? `<small class="kq-hint">✓ moves to the next blank</small>` : '');
  const can = kdbCan(B);
  screenEl.querySelectorAll('[data-mv]').forEach(b=>{ const s = KD_SLOTS[+b.dataset.mv], ok = can && P.level >= s.at && B.energy >= s.cost;
    b.classList.toggle('ready', ok); b.classList.toggle('locked', P.level < s.at); b.disabled = !ok;
    b.querySelectorAll('.kdb-cost i').forEach((p, i)=> p.classList.toggle('on', i < B.energy)); });
  const g = screenEl.querySelector('[data-act="guard"]'); if(g){ const ok = can && B.energy >= KD_GUARD; g.classList.toggle('ready', ok); g.disabled = !ok; g.querySelectorAll('.kdb-cost i').forEach((p, i)=> p.classList.toggle('on', i < B.energy)); }
  const c = screenEl.querySelector('[data-act="change"]'); if(c){ const ok = can && B.energy >= KD_CHANGE && P.forms.length > 1; c.classList.toggle('ready', ok); c.disabled = !ok; c.querySelectorAll('.kdb-cost i').forEach((p, i)=> p.classList.toggle('on', i < B.energy)); }
  const pb = screenEl.querySelector('[data-act="potion"]'); if(pb){ const mk = typeof kcLv === 'function' ? kcLv(K, 'market') : 0; pb.hidden = !K.potions; pb.disabled = !K.potions || P.hp >= mx || B.over; pb.querySelector('small').textContent = `${K.potions} left · heals ${35 + 5 * Math.max(1, mk)}%`; }
  kdbDrawLive();
}
/* what moves every frame: the enemies' timers, their burning, poison, slows and stuns, the tide */
function kdbDrawLive(){
  const B = ui.kdB;
  if(!B || ui.screen !== 'kdBattle') return;
  screenEl.querySelectorAll('.kdb-foe').forEach((el, i)=>{
    const f = B.foes[i], m = el.querySelector('.kdb-meter');
    if(m){ const frac = f.down ? 0 : Math.max(0, Math.min(1, f.acc / f.interval)); m.querySelector('b').style.width = (frac * 100).toFixed(1) + '%';
      m.querySelector('em').textContent = f.down ? '' : Math.max(0, (f.interval - Math.max(0, f.acc)) / 1000).toFixed(1) + ' s'; m.classList.toggle('near', frac > 0.75); }
    const st = el.querySelector('.kdb-st');
    if(st){ const slow = Math.min(0.6, f.slows.filter(s=> s.until > B.t).reduce((a, s)=> a + s.pct, 0));
      const html = [f.burn ? '<span class="burn">Burning</span>' : '', f.poison.length ? '<span class="poison">Poisoned</span>' : '',
        slow > 0 ? `<span class="slow">Slowed ${Math.round(slow * 100)}%</span>` : '', B.t < (f.stunUntil || 0) ? '<span class="stun">Stunned</span>' : ''].join('');
      if(st._h !== html){ st._h = html; st.innerHTML = html; } }
  });
  const td = $('#kdbTide'), P = kd().partner, tide = kdTide(B, P);
  if(td){ td.hidden = !tide; if(tide){ td.className = 'kdb-tide ' + (tide.high ? 'high' : 'low'); td.textContent = `${tide.high ? 'High' : 'Low'} tide ×${tide.m} · ${Math.ceil(tide.left / 1000)} s`; } }
}
const kdShield = ()=> '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/></svg>';
function kdbFloat(text, where){
  const fx = $('#kdbFx'); if(!fx) return;
  const e = document.createElement('div'); e.className = 'kdb-float ' + where; e.textContent = text;
  fx.appendChild(e); setTimeout(()=> e.remove(), 1100);
}
/* a number over one enemy */
function kdbFloatOn(f, text, cls){
  const B = ui.kdB, el = screenEl.querySelectorAll('.kdb-foe')[B.foes.indexOf(f)];
  if(!el) return;
  const e = document.createElement('div'); e.className = 'kdb-float foe ' + (cls || ''); e.textContent = text;
  el.appendChild(e); setTimeout(()=> e.remove(), 1100);
}
function kdbSay(html){
  const fx = $('#kdbFx'); if(!fx) return;
  let s = fx.querySelector('.kdb-say'); if(!s){ s = document.createElement('div'); s.className = 'kdb-say'; fx.appendChild(s); }
  s.innerHTML = html; s.classList.remove('on'); void s.offsetWidth; s.classList.add('on');
  clearTimeout(kdbSay._t); kdbSay._t = setTimeout(()=> s.classList.remove('on'), 2200);
}
/* WON: experience, the materials they leave, a talent point a level, a new form for a trial; and a day passes in the city */
async function kdbWin(){
  const B = ui.kdB, K = kd(), P = K.partner;
  if(B.over) return; B.over = true;
  const got = { wood:0, stone:0, iron:0 };
  let xp = 0;
  B.foes.forEach(f=>{
    xp += Math.round((8 + 4 * f.level) * (f.pack > 1 ? 0.7 : 1)) + (f.boss ? 30 : 0);
    got[f.mat] += 1 + Math.floor(f.level / 3) + (f.boss ? 6 : 0);
    if(kqRand() < 0.3){ const other = ['wood', 'stone', 'iron'].filter(m=> m !== f.mat)[kqInt(0, 1)]; got[other]++; }
  });
  Object.keys(got).forEach(m=> K.mats[m] += got[m]);
  P.xp += xp; K.stats.battles++; K.stats.won++;
  const ups = [];
  while(P.xp >= kdNeed(P.level)){ P.xp -= kdNeed(P.level); P.level++; ups.push(P.level); }
  if(ups.length) P.hp = Math.min(kdMaxHp(P, K), P.hp + 12 * ups.length);
  if(!B.trial) K.wins++;
  const day = typeof kcDay === 'function' ? kcDay(K) : null;
  /* a trial: its form is the partner's now (the change itself is shown back in the city) */
  const form = B.trial ? B.trial.form : null, was = P.form;
  if(B.trial){ K.trials = (K.trials || 0) + 1; if(!P.forms.includes(form)) P.forms.push(form); P.form = form; }
  await saveProfile();
  const mats = Object.entries(got).filter(([, n])=> n).map(([m, n])=> `${typeof kcIcon === 'function' ? kcIcon(m) : ''}+${n} ${KD_MAT_NAME[m]}`).join(' · ');
  const learnt = KD_SLOTS.filter(s=> ups.includes(s.at));
  kdbEnd(`<div class="kd-h">${B.trial ? `${escapeHtml(B.trial.name)} is beaten!` : 'You won!'}</div>
    <p class="kd-gain">${mats}</p>
    <p class="kd-sub2">+${xp} experience${ups.length ? ` · <b>${escapeHtml(P.name)} grew to level ${P.level}!</b> ${ups.length > 1 ? ups.length + ' talent points' : 'A talent point'} to spend.` : ''}</p>
    ${learnt.map(s=> `<p class="kd-sub2"><b>New move: ${KD_FORMS[P.form].moves[KD_SLOTS.indexOf(s)]}</b> (${s.label}, ${s.cost} energy${s.aoe ? ', hits every enemy' : ''}).</p>`).join('')}
    ${day && typeof kcDayHtml === 'function' ? kcDayHtml(day) : ''}
    <p class="kd-sub2">${B.right} of ${B.asked} sums right${B.quick ? `, ${B.quick} of them in time` : ''}.</p>`,
    B.trial ? [['On to the city', async ()=>{ go('kingdom'); await kdEvolve(form, was); if(ui.screen === 'kingdom') renderKingdom(); }]]
            : [['Battle on', ()=> kdBattleStart(kdWild())], ['Back to the city', ()=> go('kingdom'), true]]);
}
async function kdbLose(){
  const B = ui.kdB, K = kd(), P = K.partner;
  if(B.over) return; B.over = true;
  K.stats.battles++; K.stats.lost++;
  P.hp = Math.max(1, Math.round(kdMaxHp(P, K) * 0.25));
  await saveProfile();
  const me = $('#kdbMePic'); if(me) me.classList.add('down');
  kdbEnd(`<div class="kd-h">${escapeHtml(P.name)} is worn out</div>
    <p>The steward's people carry you both back to the city. Nothing is lost but time.</p>
    <p class="kd-sub2">${B.right} of ${B.asked} sums right. Guard (1 energy) holds off a blow; quicker answers charge more energy before they strike.</p>`,
    [['Back to the city', ()=> go('kingdom')]]);
}
function kdbEnd(html, buttons){
  setTimeout(()=>{
    if(ui.screen !== 'kdBattle') return;
    const box = document.createElement('div'); box.className = 'kd-over';
    box.innerHTML = `<div class="kd-card kd-overcard">${html}<div class="kd-row"></div></div>`;
    const row = box.querySelector('.kd-row');
    buttons.forEach(([label, fn, alt])=>{ const b = document.createElement('button'); b.className = 'btn ' + (alt ? 'btn-ghost' : 'btn-primary'); b.textContent = label;
      b.addEventListener('click', ()=>{ box.remove(); fn(); }); row.appendChild(b); });
    document.body.appendChild(box);
    setTimeout(()=>{ const b = row.querySelector('button'); if(b) b.focus(); }, 30);
  }, 650);
}
async function kdBattleLeave(){
  const B = ui.kdB;
  document.querySelectorAll('.kd-over').forEach(b=> b.remove());
  if(B && !B.over){ B.over = true; await saveProfile(); }
  go('kingdom');
}
/* leaving the battle screen any other way (the menu): its loop and its windows go with it */
function kdTeardown(){ document.querySelectorAll('.kd-over').forEach(b=> b.remove()); if(ui.kdB && !ui.kdB.over) ui.kdB.over = true; }

/* ============================================================
   THE TALENTS (screen 'kdTalents')
   ============================================================ */
function kdTalentsRender(){
  kdCss();
  const K = kd(), P = K.partner;
  if(!P){ go('kingdom'); return; }
  $('#brandSub').textContent = 'Talents';
  const pts = kdTalPoints(P);
  const sec = (key, title, open, note)=> `
    <div class="kd-card kdt-sec ${open ? '' : 'shut'}">
      <div class="kdt-head">${key === 'all' ? '' : kdPartnerArt(key, 'front', 40)}<div><div class="kd-h">${title}</div>${note ? `<div class="kd-sub2">${note}</div>` : ''}</div></div>
      ${open ? KD_TALENTS[key].map(t=>{ const r = kdTal(P, t.k), can = pts > 0 && r < t.max;
        return `<div class="kdt">
          <div class="kdt-words"><b>${t.name}</b> <span class="kdt-pips">${Array.from({ length:t.max }, (_, i)=> `<i class="${i < r ? 'on' : ''}"></i>`).join('')}</span>
            <small>${r ? t.say(r) : 'Not learnt yet.'}${r < t.max ? `<span class="kdt-next">${r ? 'Next' : 'First point'}: ${t.say(r + 1)}</span>` : ''}</small></div>
          <button class="btn ${can ? 'btn-primary' : 'btn-ghost'} pill" data-tal="${t.k}" ${can ? '' : 'disabled'}>${r >= t.max ? 'Full' : '+ Learn'}</button></div>`; }).join('') : ''}
    </div>`;
  const later = KD_FORM_ORDER.slice(5);
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← The city</button>
    <div class="screen-title">${escapeHtml(P.name)}'s talents</div>
    <div class="screen-sub">A point for every level. <b>${pts} to spend.</b> A form's own talents work only while ${escapeHtml(P.name)} is in that form.</div>
    ${sec('all', 'Every form', true)}
    ${['fire', 'water', 'grass', 'electric'].map(f=> sec(f, `${KD_FORMS[f].name} form`, P.forms.includes(f), P.forms.includes(f) ? '' : 'Learnt once it has earned this form.')).join('')}
    <div class="kd-card kdt-sec shut"><div class="kd-sub2">${later.map(f=> KD_FORMS[f].name).join(', ')}: their talents are still to come.</div></div>
    <div class="kd-foot"><button class="btn btn-ghost pill" id="kdtReset" ${kdTalSpent(P) ? '' : 'disabled'}>Take back every point</button><span>${kdTalSpent(P)} spent</span></div>`;
  $('#backBtn').addEventListener('click', ()=> go('kingdom'));
  screenEl.querySelectorAll('[data-tal]').forEach(b=> b.addEventListener('click', async ()=>{
    const k = b.dataset.tal, t = Object.values(KD_TALENTS).flat().find(x=> x.k === k);
    if(!t || kdTalPoints(P) <= 0 || kdTal(P, k) >= t.max) return;
    P.tal[k] = kdTal(P, k) + 1;
    if(k === 'hp') P.hp = Math.min(kdMaxHp(P, K), P.hp + Math.round((60 + 12 * P.level) * 0.08));
    await saveProfile(); kdTalentsRender();
  }));
  $('#kdtReset').addEventListener('click', ()=>{
    const run = async ()=>{ P.tal = {}; P.hp = Math.min(P.hp, kdMaxHp(P, K)); await saveProfile(); kdTalentsRender(); };
    if(typeof confirmDialog === 'function') confirmDialog('Take back every talent point, to spend them again?', run); else run();
  });
}

/* ============================================================
   FOR GROWN-UPS: the sums (behind the parent password), and how he is doing
   ============================================================ */
function kdGrownUps(){
  const box = document.createElement('div');
  box.className = 'kd-over';
  box.innerHTML = `<div class="kd-card kd-overcard"><div class="kd-h">Grown-ups only</div>
    <p class="kd-sub2">Enter the password to choose the sums.</p>
    <input type="password" id="kdPw" inputmode="numeric" autocomplete="off" placeholder="Password">
    <div class="kd-row"><button class="btn btn-primary" id="kdPwGo">Unlock</button><button class="btn btn-ghost" id="kdPwNo">Cancel</button></div></div>`;
  document.body.appendChild(box);
  const go2 = ()=>{ const v = box.querySelector('#kdPw').value.trim();
    if(typeof passOk === 'function' && passOk(v)){ box.remove(); ui.kdSumsOk = true; go('kdSums'); } else toast('Incorrect password.'); };
  box.querySelector('#kdPwGo').addEventListener('click', go2);
  box.querySelector('#kdPw').addEventListener('keydown', e=>{ if(e.key === 'Enter') go2(); });
  box.querySelector('#kdPwNo').addEventListener('click', ()=> box.remove());
  setTimeout(()=> box.querySelector('#kdPw').focus(), 30);
}
function kdSumsRender(){
  kdCss();
  if(!ui.kdSumsOk){ go('kingdom'); return; }
  $('#brandSub').textContent = 'The sums';
  const K = kd(), set = K.sums.set, R = kqReport(K), adaptive = K.sums.mode !== 'set';
  const chips = (key, list)=> [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(t=> `<button class="btn pill kds-chip ${list.includes(t) ? 'sel' : ''}" data-${key}="${t}">${t}</button>`).join('');
  const ladder = (key, on)=> `<button class="btn pill kds-chip ${!on ? 'sel' : ''}" data-${key}="0">Off</button>` +
    KQ_RUNGS[key].map((r, i)=> `<button class="btn pill kds-chip ${on === i + 1 ? 'sel' : ''}" data-${key}="${i + 1}">${r.say}</button>`).join('');
  const toggles = (key, list)=> KQ_RUNGS[key].map((r, i)=> `<button class="btn pill kds-chip ${list.includes(i) ? 'sel' : ''}" data-${key}="${i}">${r.say}</button>`).join('');
  const ms = v=> v == null ? '–' : (v / 1000).toFixed(1) + ' s';
  const forms = set.forms || ['z'];
  const used = R.skills.filter(s=> s.n);
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← The city</button>
    <div class="screen-title">The sums in the kingdom</div>
    <div class="screen-sub">${escapeHtml(state.name || '')}'s own: what his battles and his builders ask, and how he is doing.</div>
    <div class="kd-card kds">
      <div class="kd-h">What to ask</div>
      <div class="kds-mode">
        <button class="kds-m ${adaptive ? 'on' : ''}" data-mode="adaptive"><b>Adaptive</b><small>The times tables, 2, 5 and 10 first, a table more as he knows them. Each fact moves on as he knows it: the answer, then the missing number, then two, three and four factors. Missed sums come back soon.</small></button>
        <button class="kds-m ${adaptive ? '' : 'on'}" data-mode="set"><b>A set you choose</b><small>Only what you pick below. Missed sums still come back soon.</small></button>
      </div>
      <div class="kds-set" ${adaptive ? 'hidden' : ''}>
        <div class="kds-row"><span>Times tables</span><div>${chips('t', set.tables || [])}</div></div>
        <div class="kds-row"><span>Asked as</span><div>${KQ_FORM_ORDER.map(f=> `<button class="btn pill kds-chip ${forms.includes(f) ? 'sel' : ''}" data-fm="${f}">${KQ_FORMS[f].name} <small>${KQ_FORMS[f].eg}</small></button>`).join('')}</div></div>
        <details class="kds-more"><summary>Other sums, kept for later</summary>
          <div class="kds-row"><span>Division facts</span><div>${chips('d', set.divfacts || [])}</div></div>
          <div class="kds-row"><span>Addition</span><div>${ladder('add', set.add || 0)}</div></div>
          <div class="kds-row"><span>Subtraction</span><div>${ladder('sub', set.sub || 0)}</div></div>
          <div class="kds-row"><span>Long multiplication</span><div>${toggles('mul', set.mul || [])}</div></div>
          <div class="kds-row"><span>Division</span><div>${toggles('div', set.div || [])}</div></div>
        </details>
        ${kqSetItems(set).length ? '' : '<p class="kds-warn">Nothing chosen yet: until something is, the sums stay adaptive.</p>'}
      </div>
      <p class="kd-sub2">Two to four factors: any factors of 2 or more count, in any order (56 = 7 × 8, 8 × 7, 2 × 28 …). An energy for each blank, only when all of them are right.</p>
    </div>
    <div class="kd-card kds">
      <div class="kd-h">How he is doing</div>
      <p class="kd-sub2">${R.total ? `${R.right} of ${R.total} sums right so far.` : 'No sums answered yet.'} Known: right, in the time it should take.</p>
      <table class="kds-table kds-tables"><thead><tr><th>Table</th>${KQ_FORM_ORDER.map(f=> `<th>${KQ_FORMS[f].name}</th>`).join('')}</tr></thead>
        <tbody>${R.tables.map(r=> `<tr class="${r.open ? 'open' : ''}"><td><b>${r.t}</b>${r.open ? '' : ' <small>not yet</small>'}</td>${KQ_FORM_ORDER.map(f=>{ const x = r.by[f]; return `<td>${x.n ? `${x.known} / ${x.n}` : '–'}</td>`; }).join('')}</tr>`).join('')}</tbody></table>
      <table class="kds-table"><thead><tr><th>Asked as</th><th>Asked</th><th>Right</th><th>Usual time</th></tr></thead>
        <tbody>${R.forms.map(s=> `<tr><td>${s.name} <small>${s.eg}</small></td><td>${s.n}</td><td>${s.pct == null ? '–' : s.pct + '%'}</td><td>${ms(s.mid)}</td></tr>`).join('')}
        ${used.map(s=> `<tr><td>${s.name}</td><td>${s.n}</td><td>${s.pct == null ? '–' : s.pct + '%'}</td><td>${ms(s.mid)}</td></tr>`).join('')}</tbody></table>
      <p class="kd-sub2">${R.weak.length ? `Still weak: <b>${R.weak.join(', ')}</b>` : 'No weak facts yet.'}</p>
      <button class="btn btn-ghost pill" id="kdsReset">Start his record again</button>
    </div>`;
  $('#backBtn').addEventListener('click', ()=>{ ui.kdSumsOk = false; go('kingdom'); });
  const save = async ()=>{ await saveProfile(); kdSumsRender(); };
  screenEl.querySelectorAll('[data-mode]').forEach(b=> b.addEventListener('click', ()=>{ K.sums.mode = b.dataset.mode; save(); }));
  const flip = (arr, v)=>{ const i = arr.indexOf(v); if(i >= 0) arr.splice(i, 1); else arr.push(v); arr.sort((a, b)=> a - b); };
  screenEl.querySelectorAll('[data-t]').forEach(b=> b.addEventListener('click', ()=>{ flip(set.tables || (set.tables = []), +b.dataset.t); save(); }));
  screenEl.querySelectorAll('[data-fm]').forEach(b=> b.addEventListener('click', ()=>{ const a = set.forms || (set.forms = []), f = b.dataset.fm, i = a.indexOf(f);
    if(i >= 0) a.splice(i, 1); else a.push(f); a.sort((x, y)=> KQ_FORM_ORDER.indexOf(x) - KQ_FORM_ORDER.indexOf(y)); save(); }));
  screenEl.querySelectorAll('[data-d]').forEach(b=> b.addEventListener('click', ()=>{ flip(set.divfacts || (set.divfacts = []), +b.dataset.d); save(); }));
  screenEl.querySelectorAll('[data-add]').forEach(b=> b.addEventListener('click', ()=>{ set.add = +b.dataset.add; save(); }));
  screenEl.querySelectorAll('[data-sub]').forEach(b=> b.addEventListener('click', ()=>{ set.sub = +b.dataset.sub; save(); }));
  screenEl.querySelectorAll('[data-mul]').forEach(b=> b.addEventListener('click', ()=>{ flip(set.mul || (set.mul = []), +b.dataset.mul); save(); }));
  screenEl.querySelectorAll('[data-div]').forEach(b=> b.addEventListener('click', ()=>{ flip(set.div || (set.div = []), +b.dataset.div); save(); }));
  const more = screenEl.querySelector('.kds-more'); if(more && (set.divfacts || []).length + (set.add || 0) + (set.sub || 0) + (set.mul || []).length + (set.div || []).length) more.open = true;
  $('#kdsReset').addEventListener('click', ()=>{
    const run = async ()=>{ K.sk = kqBlank(); K.log = []; await saveProfile(); kdSumsRender(); toast('His sums record starts again.'); };
    if(typeof confirmDialog === 'function') confirmDialog('Start his sums record again? Every answer so far is forgotten, and the adaptive sums start from the beginning.', run); else run();
  });
}

/* ============================================================
   THE LOOK (the battles, the talents, the grown-ups; the city's own is kcCss, 46-kingdom-city.js)
   ============================================================ */
function kdCss(){
  if(typeof kcCss === 'function') kcCss();
  if(document.getElementById('kdCss')) return;
  const st = document.createElement('style'); st.id = 'kdCss';
  st.textContent = `
  .kd-ic{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto;}
  .kd-ic.sm{width:15px;height:15px;vertical-align:-3px;}
  .kd-card{background:var(--paper-2);border:1px solid var(--line);border-radius:14px;padding:12px 14px;}
  .kd-pic{flex:0 0 auto;width:108px;height:108px;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:visible;
    background:radial-gradient(circle at 50% 60%, #fff8e6 0 40%, var(--paper-3) 100%);box-shadow:inset 0 0 0 2px rgba(201,154,63,.45);}
  .kd-pic.big{width:170px;height:170px;}
  .kd-mon{object-fit:contain;image-rendering:pixelated;display:block;}
  .kd-lv{font:700 13px/1 'Nunito',sans-serif;color:var(--ink-soft);}
  .kd-h{font:800 18px/1.15 'Baloo 2',cursive;margin:2px 0 8px;}
  .kd-sub2{font-size:13px;font-weight:600;color:var(--ink-soft);margin:4px 0;}
  .kd-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;font-weight:700;color:var(--ink-soft);margin:10px 0 20px;}
  .kd-meet{display:flex;gap:16px;align-items:center;flex-wrap:wrap;justify-content:center;}
  .kd-name{display:flex;flex-direction:column;gap:8px;align-items:flex-start;min-width:220px;}
  .kd-name label{font:800 16px 'Baloo 2',cursive;}
  .kd-name input, .kd-overcard input{font:700 20px 'Nunito',sans-serif;padding:10px 12px;border:2px solid var(--line);border-radius:10px;background:#fff9ec;}
  .kd-choose{display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;margin:8px 0 12px;}
  .kd-pick{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;cursor:pointer;font:inherit;color:var(--ink);}
  .kd-pick b{font:800 17px/1 'Baloo 2',cursive;}
  .kd-pick small{font-size:12.5px;font-weight:600;color:var(--ink-soft);line-height:1.35;}
  .kd-pick.good{box-shadow:inset 0 0 0 2px var(--jade);}
  .kd-pick.bad{opacity:.85;}
  .kd-over{position:fixed;inset:0;z-index:900;background:rgba(20,14,8,.55);display:flex;align-items:center;justify-content:center;padding:16px;}
  .kd-overcard{max-width:540px;width:100%;max-height:calc(100vh - 32px);overflow:auto;box-shadow:0 12px 34px rgba(0,0,0,.45);background:var(--paper);display:flex;flex-direction:column;gap:6px;}
  .kd-row{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;}
  .kd-gain{font:800 17px 'Baloo 2',cursive;display:flex;align-items:center;flex-wrap:wrap;gap:6px;color:#8a6420;margin:2px 0;}
  .kd-evo-pics{display:flex;align-items:center;justify-content:center;gap:14px;margin:6px 0;}
  .kd-evo-pics .was{opacity:.6;filter:grayscale(.4);}
  .kd-evo-pics .arrow{font:800 30px 'Baloo 2',cursive;color:var(--gold);}
  .kd-evo-pics .now{animation:kdEvo 1.4s ease-out;filter:drop-shadow(0 0 16px rgba(255,214,120,.9));}
  @keyframes kdEvo{0%{opacity:0;transform:scale(.6);filter:brightness(4) drop-shadow(0 0 30px #fff);}60%{opacity:1;transform:scale(1.12);}100%{transform:none;}}
  /* the battle */
  .kdb{display:flex;flex-direction:column;gap:10px;padding-bottom:16px;}
  .kdb-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
  .kdb-top .back-link{margin:0;}
  .kdb-energy{display:flex;align-items:center;gap:4px;margin-left:auto;}
  .kdb-energy i{width:16px;height:22px;border-radius:5px;background:rgba(35,32,25,.13);box-shadow:inset 0 0 0 1px var(--line);transition:background .15s, transform .15s;}
  .kdb-energy i.on{background:linear-gradient(#ffe48a, #f0b531);box-shadow:0 0 6px rgba(240,181,49,.65);transform:translateY(-1px);}
  .kdb-energy span{font:800 12px 'Nunito',sans-serif;color:var(--ink-soft);margin-left:4px;}
  .kdb-tide{font:800 12.5px 'Nunito',sans-serif;border-radius:999px;padding:4px 10px;}
  .kdb-tide.low{background:#dbe7ef;color:#3c5d78;}
  .kdb-tide.high{background:#2f7bb8;color:#f2f9ff;box-shadow:0 0 10px rgba(47,123,184,.55);}
  .kdb-arena{position:relative;height:350px;border-radius:16px;overflow:hidden;
    background:linear-gradient(#9fd0ef 0%, #cfe9f4 44%, #9fca72 44.2%, #7fb35a 100%);box-shadow:inset 0 0 0 1px var(--line);}
  .kdb.boss .kdb-arena{background:linear-gradient(#5d4c8c 0%, #b98bb0 44%, #7b9c58 44.2%, #5d8442 100%);}
  .kdb-foes{position:absolute;right:2%;top:6px;left:34%;display:flex;justify-content:flex-end;align-items:flex-start;gap:6px;}
  .kdb-foe{position:relative;display:flex;flex-direction:column;align-items:center;gap:0;background:none;border:0;padding:0;cursor:pointer;font:inherit;color:inherit;border-radius:14px;}
  .kdb-foe .kdb-tag{min-width:0;width:100%;max-width:230px;}
  .kdb-arena.n1 .kdb-foe .kdb-tag{min-width:200px;}
  .kdb-foe.tgt .kdb-tag{box-shadow:0 0 0 3px var(--cinnabar), 0 2px 6px rgba(0,0,0,.18);}
  .kdb-foe.tgt::after{content:'';position:absolute;left:50%;bottom:-4px;width:0;height:0;border:9px solid transparent;border-bottom-color:var(--cinnabar);transform:translateX(-50%);}
  .kdb-foe.down{pointer-events:none;}
  .kdb-foe.down .kdb-foepic{transition:opacity .6s, transform .6s;opacity:0;transform:translateY(18px) scale(.9);}
  .kdb-foe.down .kdb-tag{opacity:.45;}
  .kdb-me{position:absolute;left:3%;bottom:8px;width:62%;display:flex;align-items:flex-end;gap:8px;pointer-events:none;}
  .kdb-tag{background:rgba(244,236,216,.94);border-radius:12px;padding:6px 10px;font-size:13px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.18);min-width:190px;text-align:left;}
  .kdb-tag b{font:800 16px 'Baloo 2',cursive;}
  .kdb-hp, .kdb-meter{display:flex;align-items:center;gap:6px;margin-top:4px;}
  .kdb-hp i, .kdb-meter i{flex:1;height:9px;border-radius:999px;background:rgba(35,32,25,.14);overflow:hidden;}
  .kdb-hp b{display:block;height:100%;border-radius:999px;background:var(--jade);transition:width .35s;}
  .kdb-hp.low b{background:var(--cinnabar);}
  .kdb-meter i{height:6px;}
  .kdb-meter b{display:block;height:100%;width:0;border-radius:999px;background:#e0553c;}
  .kdb-meter.near b{background:#c8251a;animation:kdbPulse .5s ease-in-out infinite alternate;}
  .kdb-hp em, .kdb-meter em{font-style:normal;font-size:11.5px;font-variant-numeric:tabular-nums;color:var(--ink-soft);min-width:3.4em;text-align:right;}
  .kdb-meter em{color:#9e2f27;}
  @keyframes kdbPulse{to{opacity:.55;}}
  .kdb-st{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px;}
  .kdb-st:empty{display:none;}
  .kdb-st span{font-size:10.5px;font-weight:800;border-radius:999px;padding:1px 7px;}
  .kdb-st .burn{background:#ffd9b8;color:#a0400f;} .kdb-st .poison{background:#dcefc9;color:#3f6b1d;}
  .kdb-st .slow{background:#d6e8f6;color:#2c5d86;} .kdb-st .stun{background:#fff0a8;color:#7a5a00;}
  .kdb-foepic{margin:-48px 0 -60px;pointer-events:none;filter:drop-shadow(0 6px 4px rgba(0,0,0,.25));}
  .kdb-foepic .mon-portrait{background:none !important;}
  .kdb-foepic .mon-portrait, .kdb-mepic .kd-mon{image-rendering:pixelated;}
  .kdb-mepic{flex:0 0 auto;margin:0 -60px -34px -56px;filter:drop-shadow(0 6px 4px rgba(0,0,0,.25));}
  .kdb-blocks{margin-top:4px;min-height:0;}
  .kdb-shield{display:inline-flex;align-items:center;gap:3px;color:#2f6f9e;font:800 14px 'Baloo 2',cursive;}
  .kdb-shield svg{width:18px;height:18px;fill:#9cc8ea;stroke:#2f6f9e;stroke-width:1.6;}
  .kdb-fx{position:absolute;inset:0;pointer-events:none;}
  .kdb-float{position:absolute;font:800 24px 'Baloo 2',cursive;text-shadow:0 2px 0 rgba(0,0,0,.25);animation:kdbFloat 1.1s ease-out forwards;pointer-events:none;z-index:3;}
  .kdb-foe .kdb-float.foe{left:50%;top:44%;transform:translateX(-50%);color:#fff;-webkit-text-stroke:1px #9e2f27;}
  .kdb-float.foe.big{font-size:30px;color:#ffe07a;}
  .kdb-float.foe.burn{color:#ffb35a;font-size:19px;top:58%;}
  .kdb-float.foe.poison{color:#b9ef8f;font-size:19px;top:62%;-webkit-text-stroke:1px #3f6b1d;}
  .kdb-float.foe.splash{color:#ffd2a6;font-size:20px;top:30%;}
  .kdb-float.me{left:16%;bottom:46%;color:#fff;-webkit-text-stroke:1px #9e2f27;}
  .kdb-float.me.heal{color:#c8f7c0;-webkit-text-stroke:1px #2f7a40;bottom:56%;}
  .kdb-float.me.dodge{color:#fff7a8;-webkit-text-stroke:1px #8a6a00;}
  .kdb-float.block{left:22%;bottom:58%;color:#d8ecff;-webkit-text-stroke:1px #2f6f9e;font-size:20px;}
  .kdb-float.energy{right:4%;top:6px;color:#fff3c4;-webkit-text-stroke:1px #a5741c;font-size:20px;}
  @keyframes kdbFloat{0%{opacity:0;translate:0 8px;scale:.8;}15%{opacity:1;translate:0 0;scale:1;}100%{opacity:0;translate:0 -34px;}}
  .kdb-say{position:absolute;left:50%;top:50%;transform:translate(-50%, 8px);background:rgba(28,22,14,.84);color:#fff6e4;border-radius:10px;padding:6px 12px;
    font-weight:700;font-size:14px;white-space:nowrap;max-width:94%;overflow:hidden;text-overflow:ellipsis;opacity:0;transition:opacity .18s, transform .18s;}
  .kdb-say.on{opacity:1;transform:translate(-50%, 0);}
  .kdb-mepic.lunge{animation:kdbLunge .32s ease-out;}
  @keyframes kdbLunge{50%{transform:translate(22px,-14px) scale(1.05);}}
  .kdb-foepic.hurt, .kdb-mepic.hurt{animation:kdbHurt .4s;}
  @keyframes kdbHurt{20%{transform:translateX(-7px);filter:brightness(1.8) sepia(1) saturate(5) hue-rotate(-40deg);}40%{transform:translateX(6px);}60%{transform:translateX(-4px);}}
  .kdb-foepic.strike{animation:kdbStrike .35s ease-out;}
  @keyframes kdbStrike{50%{transform:translate(-22px,12px) scale(1.06);}}
  .kdb-mepic.down{transition:opacity .6s, transform .6s;opacity:0;transform:translateY(18px) scale(.9);}
  /* the sum */
  .kdb-sum, .kcq-sum{position:relative;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px;background:#fffaf0;border:2px solid var(--line);border-radius:16px;padding:10px 14px 14px;
    font:800 clamp(28px, 6.4vw, 44px)/1.1 'Baloo 2',cursive;font-variant-numeric:tabular-nums;transition:background .2s, border-color .2s;min-height:74px;}
  .kq-t.op{color:var(--ink-soft);}
  .kq-bl{min-width:2.4ch;padding:0 8px;border-bottom:4px solid var(--ink);text-align:center;color:var(--sky);cursor:pointer;border-radius:6px 6px 0 0;}
  .kq-bl.cur{background:#fff0c8;border-bottom-color:var(--cinnabar);}
  .kq-bl.shown{color:var(--jade-dark);cursor:default;}
  .kq-bl s{color:var(--cinnabar);text-decoration-thickness:3px;margin-right:6px;}
  .kq-hint{position:absolute;right:12px;bottom:2px;font:700 11px 'Nunito',sans-serif;color:var(--ink-soft);}
  .kdb-sum.right, .kcq-sum.right{animation:kdbRight .45s;}
  @keyframes kdbRight{30%{background:#d9f3e6;border-color:var(--jade);}}
  .kdb-sum.wrong, .kcq-sum.wrong{background:#fde7e2;border-color:var(--cinnabar);animation:kdbWrong .35s;}
  @keyframes kdbWrong{25%{transform:translateX(-6px);}50%{transform:translateX(6px);}75%{transform:translateX(-3px);}}
  .kdb-ctrl{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:12px;align-items:start;}
  .kdb-pad{display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;}
  .kdb-key{height:62px;border:0;border-radius:14px;background:var(--paper-2);box-shadow:0 3px 0 var(--paper-3), inset 0 0 0 1px var(--line);
    font:800 30px/1 'Baloo 2',cursive;color:var(--ink);cursor:pointer;touch-action:manipulation;}
  .kdb-key.del{font-size:24px;color:var(--ink-soft);}
  .kdb-key.ok{background:var(--jade);color:#fff;box-shadow:0 3px 0 var(--jade-dark);}
  .kdb-key.hit{animation:kdbKey .14s;}
  @keyframes kdbKey{50%{transform:translateY(2px);box-shadow:0 1px 0 var(--paper-3), inset 0 0 0 1px var(--line);filter:brightness(.95);}}
  .kdb-moves{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .kdb-move{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:8px 10px;border:0;border-radius:14px;cursor:pointer;text-align:left;min-width:0;
    background:var(--paper-2);color:var(--ink-soft);box-shadow:inset 0 0 0 1px var(--line);font:inherit;transition:background .15s, color .15s, transform .08s;}
  .kdb-move b{font:800 16px/1.1 'Baloo 2',cursive;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .kdb-move small{font-size:11px;font-weight:700;opacity:.85;}
  .kdb-cost{display:flex;gap:3px;}
  .kdb-cost i{width:8px;height:11px;border-radius:3px;background:rgba(35,32,25,.15);}
  .kdb-cost i.on{background:#f0b531;}
  .kdb-move.locked{opacity:.55;}
  .kdb-move.ready{background:var(--cinnabar);color:#fff8ea;box-shadow:0 4px 0 var(--cinnabar-dark);}
  .kdb-move.ready.s1{background:#b4561f;box-shadow:0 4px 0 #84390f;}
  .kdb-move.ready.s2{background:#6a3fb0;box-shadow:0 4px 0 #46267d;}
  .kdb-move.ready.s3{background:#9b1f4e;box-shadow:0 4px 0 #6a1133;}
  .kdb-move.ready.guard{background:#2f6f9e;box-shadow:0 4px 0 #1d4a6c;}
  .kdb-move.ready.change{background:#3f7d5a;box-shadow:0 4px 0 #285539;}
  .kdb-move.ready .kdb-cost i{background:#ffe48a;}
  .kdb-move.ready:active{transform:translateY(2px);}
  .kdb-move:disabled{cursor:default;}
  .kdb-move.potion{grid-column:1 / -1;flex-direction:row;align-items:center;gap:8px;padding:7px 12px;}
  .kdb-move[hidden]{display:none;}
  .kdb-move.potion:not(:disabled){background:#e3f1e9;color:var(--jade-dark);box-shadow:inset 0 0 0 2px var(--jade);}
  @media (max-width:560px){
    .kdb-arena{height:272px;}
    .kdb-foes{left:30%;}
    .kdb-arena.n1 .kdb-foe .kdb-tag{min-width:0;}
    .kdb-arena.n1 .kdb-foepic .mon-portrait{width:210px !important;height:210px !important;}
    .kdb-arena.n2 .kdb-foepic .mon-portrait{width:150px !important;height:150px !important;}
    .kdb-arena.n3 .kdb-foepic .mon-portrait{width:112px !important;height:112px !important;}
    .kdb-foepic{margin:-34px 0 -44px;}
    .kdb-arena.n3 .kdb-foes{left:4%;}
    .kdb-arena.n3 .kdb-tag{padding:4px 6px;font-size:11px;}
    .kdb-arena.n3 .kdb-tag b{font-size:13px;}
    .kdb-arena.n3 .kdb-tag .type-badge{display:none;}
    .kdb-mepic .kd-mon{width:210px !important;height:210px !important;}
    .kdb-mepic{margin:0 -44px -26px -40px;}
    .kdb-cost i{width:5px;height:9px;border-radius:2px;}
    .kdb-cost{gap:2px;}
    .kdb-energy i{width:11px;height:18px;}
    .kdb-energy span{display:none;}
    .kdb-tag{min-width:0;font-size:12px;padding:5px 8px;}
    .kdb-ctrl{grid-template-columns:minmax(0,1fr);}
    .kdb-moves{order:-1;grid-template-columns:repeat(4, minmax(0,1fr));}
    .kdb-move{padding:7px 6px;}
    .kdb-move b{font-size:13.5px;}
    .kdb-move small{display:none;}
    .kdb-move.guard, .kdb-move.change{grid-column:span 1;}
    .kdb-move.potion{grid-column:span 2;padding:7px 8px;}
    .kdb-long{display:none;}
    .kdb-key{height:50px;}
    .kq-hint{display:none;}
  }
  @media (prefers-reduced-motion:reduce){ .kdb-meter.near b, .kdb-float, .kdb-mepic.lunge, .kdb-foepic.hurt, .kdb-mepic.hurt, .kdb-foepic.strike, .kd-evo-pics .now{animation:none !important;} }
  /* the talents */
  .kdt-sec{margin-bottom:12px;display:flex;flex-direction:column;gap:8px;}
  .kdt-sec.shut{opacity:.78;}
  .kdt-head{display:flex;align-items:center;gap:10px;}
  .kdt-head .kd-h{margin:0;}
  .kdt{display:flex;align-items:center;gap:10px;justify-content:space-between;border-top:1px solid var(--line);padding-top:8px;}
  .kdt-words{display:flex;flex-direction:column;gap:2px;min-width:0;}
  .kdt-words b{font:800 15.5px 'Baloo 2',cursive;}
  .kdt-words small{font-size:12.5px;font-weight:600;color:var(--ink-soft);line-height:1.35;}
  .kdt-next{display:block;color:#8a6420;}
  .kdt-pips{display:inline-flex;gap:3px;vertical-align:1px;margin-left:4px;}
  .kdt-pips i{width:9px;height:9px;border-radius:50%;background:rgba(35,32,25,.15);}
  .kdt-pips i.on{background:var(--gold);box-shadow:0 0 4px rgba(201,154,63,.7);}
  /* for grown-ups */
  .kds{margin-bottom:12px;}
  .kds-mode{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .kds-m{display:flex;flex-direction:column;gap:4px;align-items:flex-start;text-align:left;padding:12px;border-radius:12px;border:0;cursor:pointer;
    background:var(--paper);box-shadow:inset 0 0 0 1px var(--line);font:inherit;color:var(--ink);}
  .kds-m b{font:800 16px 'Baloo 2',cursive;}
  .kds-m small{font-size:12px;font-weight:600;color:var(--ink-soft);line-height:1.35;}
  .kds-m.on{box-shadow:inset 0 0 0 3px var(--cinnabar);background:#fff7ea;}
  .kds-set{margin-top:12px;display:flex;flex-direction:column;gap:10px;}
  .kds-row{display:grid;grid-template-columns:118px 1fr;gap:8px;align-items:start;}
  .kds-row > span{font:800 14px 'Baloo 2',cursive;padding-top:6px;}
  .kds-row > div{display:flex;flex-wrap:wrap;gap:6px;}
  .kds-chip{font-size:12.5px !important;padding:7px 11px !important;}
  .kds-chip small{font-weight:600;opacity:.75;margin-left:3px;}
  .kds-more summary{font:800 14px 'Baloo 2',cursive;cursor:pointer;color:var(--ink-soft);margin-bottom:8px;}
  .kds-more{display:flex;flex-direction:column;gap:10px;}
  .kds-warn{font-size:12.5px;font-weight:700;color:var(--cinnabar-dark);}
  .kds-table{width:100%;border-collapse:collapse;font-size:12.5px;margin:6px 0 10px;}
  .kds-table th{text-align:left;font-weight:800;color:var(--ink-soft);border-bottom:1px solid var(--line);padding:5px 4px;}
  .kds-table td{border-bottom:1px solid var(--line);padding:6px 4px;font-weight:600;font-variant-numeric:tabular-nums;}
  .kds-table small{color:var(--ink-soft);font-weight:600;}
  .kds-tables tr:not(.open) td{color:var(--ink-soft);}
  @media (max-width:560px){ .kds-mode{grid-template-columns:1fr;} .kds-row{grid-template-columns:1fr;} .kds-table{font-size:11px;} }
  /* the portal, awake: gold */
  .rift-portal.kd-awake{filter:hue-rotate(-28deg) saturate(1.5) brightness(1.08) drop-shadow(0 0 10px rgba(255,205,110,.7));}
  .rift-portal.kd-awake .rp-swirl{opacity:.85 !important;animation-duration:10s !important;}
  .rift-portal.kd-awake .rp-sleep{animation:none !important;opacity:1 !important;}
  `;
  document.head.appendChild(st);
}
