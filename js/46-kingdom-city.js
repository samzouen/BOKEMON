/* ==========================================================
   46-kingdom-city.js — (4.73) THE CITY: the kingdom built up plot by plot, and the screen it is all seen from.

   The designer: "Please also make the nation building a progressive area, not just a castle. Start with a 3x3 plot of
   land with fixed core buildings for healing, shopping, construction, food, and a palace. With the fire evolution
   skill, the player can clear up to 9x9 area. Farmlands outside of the city. City walls need to be built. Towers within
   walls in the city compound. Water enables farmlands to be irrigated for more food and a moat for greater defense
   (reduces damage taken by walls). Grass enables fertile growth, improving farmland yields. Players do not earn money
   from defeating monsters. They earn raw materials. The city needs to be managed with its farmlands to earn money.
   Upgrades require completing questions."

   · The board: nine by nine plots. The old town in the middle (three by three): the palace, the healer, the market,
     the builders' yard and the granary, fixed, and four empty plots. Round it the wild land.
   · The Fire form burns the wild back, a plot at a time, next to land already cleared (3 sums a plot).
   · Inside the walls (the middle five by five): houses, and towers once the walls stand. Outside: fields.
   · A day passes with every battle won (kcDay): the fields and the granary's garden grow food; each house eats its
     level in food and, fed, pays twice that in coins; the market sells the food to spare, a coin each, as much as its
     level allows; the granary holds what is left.
   · Building, repairing, raising, watering, making fertile: coins and materials (wood, stone, iron, from the
     battles), then the builders' sums (kcQuiz), with no timer.
   · The Water form: watered fields (half as much food again) and the moat (walls hurt less in the raids). The Grass
     form: fertile fields (half as much again). Walls, towers and the moat are ready for the raids, still to come.
   State: kd().city: { cells:[81 × { k, lv, irr, fer }], walls, moat, day, last }.
   ========================================================== */
const KC_N = 9;
const kcAt = (x, y)=> y * KC_N + x;
const kcXY = i=> [i % KC_N, Math.floor(i / KC_N)];
const kcCore = (x, y)=> x >= 3 && x <= 5 && y >= 3 && y <= 5;
const kcInside = (x, y)=> x >= 2 && x <= 6 && y >= 2 && y <= 6;            // within the walls
const kcRing = (x, y)=> kcInside(x, y) && !kcCore(x, y);
const KC_CORE_AT = { palace:[4, 4], healer:[4, 3], market:[5, 4], yard:[3, 4], granary:[4, 5] };
const KC_RES = ['coins', 'wood', 'stone', 'iron'];
/* each kind of building: its levels' costs [coins, wood, stone, iron] (the cost of reaching level 1, 2 …), what it does */
const KC_B = {
  palace: { name:'The palace', a:'the palace', start:1, max:5,
            cost:[null, [60, 16, 12, 2], [140, 24, 22, 6], [260, 34, 34, 12], [420, 46, 48, 20]],
            say:L=> `Your home, at level ${L}. ${L < 2 ? 'At level 2 the city walls can be built; at 3, towers.' : L < 3 ? 'At level 3, towers.' : 'Walls and towers can be raised to its level.'} The builders' yard can be raised as high as the palace.` },
  healer: { name:'The healer', a:'the healer', start:0, max:5,
            cost:[[10, 4, 0, 0], [25, 6, 4, 0], [50, 10, 8, 2], [90, 14, 12, 4], [150, 20, 18, 8]],
            say:L=> L ? `Rest here: your partner is healed in full.${L > 1 ? ` Its care makes your partner ${6 * (L - 1)}% tougher.` : ''}` : 'In ruins. Until it is repaired, resting heals only half.' },
  market: { name:'The market', a:'the market', start:0, max:5,
            cost:[[15, 6, 0, 0], [30, 8, 4, 0], [60, 12, 8, 2], [100, 16, 12, 4], [160, 22, 18, 8]],
            say:L=> L ? `Potions for battles: carry up to ${L + 1}, each healing ${35 + 5 * L}%. Each day it sells up to ${6 * L} spare food, a coin each.` : 'Empty stalls. Repaired, it sells potions, and the city\'s spare food for coins.' },
  yard:   { name:'The builders\' yard', a:'the builders\' yard', start:1, max:5,
            cost:[null, [30, 10, 6, 0], [70, 16, 12, 2], [120, 22, 18, 6], [200, 30, 26, 10]],
            say:L=> `The builders. Nothing else can be raised above its level (${L}).` },
  granary:{ name:'The granary', a:'the granary', start:0, max:5,
            cost:[[10, 6, 0, 0], [25, 10, 4, 0], [50, 14, 8, 0], [90, 18, 12, 4], [150, 24, 18, 8]],
            say:L=> L ? `Holds ${20 + 30 * L} food. Its kitchen garden grows 2 a day.` : 'In ruins: it holds only 20 food, and grows none. Repaired, its kitchen garden feeds a first house.' },
  house:  { name:'A house', a:'a house', max:5, cost:[[10, 5, 0, 0], [20, 6, 3, 0], [40, 8, 6, 1], [70, 10, 10, 3], [110, 14, 14, 6]],
            say:L=> `A family: it eats ${L} food a day and, fed, pays ${2 * L} coins.` },
  field:  { name:'A field', a:'a field', max:3, cost:[[5, 3, 0, 0], [15, 5, 2, 0], [35, 8, 4, 1]],
            say:(L, c)=> `Grows ${kcFieldFood(c)} food a day.${c && c.irr ? ' Watered.' : ''}${c && c.fer ? ' Fertile.' : ''}` },
  tower:  { name:'A tower', a:'a tower', max:5, cost:[[40, 6, 10, 4], [70, 8, 14, 6], [110, 10, 20, 9], [160, 14, 26, 12], [230, 18, 34, 16]],
            say:L=> `It will shoot at raiders when they come (the raids are still to come). Level ${L}.` },
};
const KC_WALLS = { max:5, cost:[[40, 30, 0, 0], [90, 10, 30, 0], [160, 14, 45, 6], [260, 18, 60, 12], [400, 24, 80, 20]] };
const KC_MOAT = { max:3, cost:[[30, 0, 10, 0], [70, 0, 20, 4], [130, 0, 30, 8]] };
const KC_WATER = [12, 2, 2, 0], KC_FERTILE = [12, 4, 0, 0];
const KD_POTION = 8;                                                // a potion at the market (coins)
const KC_FIELD = [3, 5, 7];
const kcFieldFood = c=> c ? Math.round(KC_FIELD[(c.lv || 1) - 1] * (c.irr ? 1.5 : 1) * (c.fer ? 1.5 : 1)) : KC_FIELD[0];
const kcSums = L=> 2 + 2 * L;                                        // the builders' sums for a level: 4, 6, 8, 10, 12

function kcEnsure(K){
  if(K.city && Array.isArray(K.city.cells) && K.city.cells.length === KC_N * KC_N) return K.city;
  const cells = Array.from({ length:KC_N * KC_N }, (_, i)=>{ const [x, y] = kcXY(i); return { k:kcCore(x, y) ? 'clear' : 'wild', lv:0 }; });
  Object.entries(KC_CORE_AT).forEach(([k, [x, y]])=>{ cells[kcAt(x, y)] = { k, lv:KC_B[k].start }; });
  K.city = { cells, walls:0, moat:0, day:1, last:null };
  return K.city;
}
/* a core building's level */
function kcLv(K, key){
  const C = K && K.city, at = KC_CORE_AT[key];
  if(!C || !at) return 0;
  const c = C.cells[kcAt(at[0], at[1])];
  return c && c.k === key ? c.lv : 0;
}
const kcFoodCap = K=> 20 + 30 * kcLv(K, 'granary');
const kcHave = (K, r)=> r === 'coins' ? K.coins : (K.mats[r] || 0);
const kcAfford = (K, cost)=> KC_RES.every((r, j)=> kcHave(K, r) >= ((cost && cost[j]) || 0));
function kcPay(K, cost){ KC_RES.forEach((r, j)=>{ const n = (cost && cost[j]) || 0; if(r === 'coins') K.coins -= n; else K.mats[r] -= n; }); }
const kcNextToCleared = (C, x, y)=> [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy])=>{ const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < KC_N && Y < KC_N && C.cells[kcAt(X, Y)].k !== 'wild'; });
const kcRingClear = C=> C.cells.every((c, i)=>{ const [x, y] = kcXY(i); return !kcRing(x, y) || c.k !== 'wild'; });
/* how high a building can go: the yard as high as the palace; the rest as high as the yard */
function kcCap(K, key){ return key === 'palace' ? 5 : key === 'yard' ? kcLv(K, 'palace') : kcLv(K, 'yard'); }
const kcCapWhy = (K, key)=> key === 'yard' ? 'Raise the palace first: the builders\' yard cannot go above it.' : `Raise the builders' yard first (it is at level ${kcLv(K, 'yard')}).`;

/* A DAY IN THE KINGDOM (a battle won) */
function kcDay(K){
  const C = kcEnsure(K), cap = kcFoodCap(K);
  let grown = kcLv(K, 'granary') >= 1 ? 2 : 0;
  C.cells.forEach(c=>{ if(c.k === 'field') grown += kcFieldFood(c); });
  K.food += grown;
  const houses = C.cells.filter(c=> c.k === 'house'), need = houses.reduce((a, h)=> a + h.lv, 0);
  let fed = 0, eaten = 0, tax = 0;
  houses.forEach(h=>{ if(K.food >= h.lv){ K.food -= h.lv; eaten += h.lv; tax += 2 * h.lv; fed++; } });
  K.coins += tax;
  const mk = kcLv(K, 'market');
  const sold = mk ? Math.max(0, Math.min(6 * mk, K.food - need)) : 0;     // keeping tomorrow's meals
  K.food -= sold; K.coins += sold;
  const spoiled = Math.max(0, K.food - cap); K.food -= spoiled;
  const rep = { day:C.day, grown, eaten, fed, hungry:houses.length - fed, tax, sold, spoiled };
  C.day++; C.last = rep;
  return rep;
}
function kcDayHtml(r){
  const bits = [r.grown ? `the fields grew ${r.grown} food` : 'nothing grew (no fields yet)',
    r.fed ? `${r.fed} ${r.fed > 1 ? 'families' : 'family'} ate ${r.eaten} and paid ${r.tax} coins` : '',
    r.hungry ? `${r.hungry} went hungry and paid nothing` : '',
    r.sold ? `the market sold ${r.sold} food for ${r.sold} coins` : '', r.spoiled ? `${r.spoiled} spoiled: the granary was full` : ''].filter(Boolean);
  return `<p class="kc-day">${kcIcon('day')}<span><b>Day ${r.day} in the kingdom:</b> ${bits.join('; ')}.</span></p>`;
}

/* ============================================================
   WHAT CAN BE DONE ON A PLOT
   ============================================================ */
function kcActions(K, i){
  const C = K.city, c = C.cells[i], [x, y] = kcXY(i), P = K.partner, out = [];
  const has = f=> !!(P && P.forms.includes(f)), palace = kcLv(K, 'palace');
  if(c.k === 'wild'){
    const next = kcNextToCleared(C, x, y);
    const why = !has('fire') ? 'Needs the Fire form, from the meadow\'s guardian.' : !next ? 'Clear a plot next to it first.' : '';
    out.push({ id:'clear', label:'Burn back the wild', cost:[0, 0, 0, 0], sums:3, ok:!why, why, done:()=>{ c.k = 'clear'; c.lv = 0; }, said:'The wild land is burnt back.' });
    return out;
  }
  if(c.k === 'clear'){
    if(kcInside(x, y)){
      out.push(kcNewAct(K, c, 'house'));
      if(!kcCore(x, y)) out.push(kcNewAct(K, c, 'tower', !C.walls ? 'Needs the city walls first.' : palace < 3 ? 'Needs the palace at level 3.' : ''));
    } else out.push(kcNewAct(K, c, 'field'));
    return out;
  }
  const B = KC_B[c.k];
  if(c.lv < B.max){
    const L = c.lv + 1, cap = kcCap(K, c.k), why = L > cap ? kcCapWhy(K, c.k) : '';
    out.push({ id:'up', label:c.lv ? `Raise it to level ${L}` : 'Repair it', cost:B.cost[L - 1], sums:kcSums(L), ok:!why, why,
               done:()=>{ c.lv = L; }, said:c.lv ? `${B.name} is now level ${L}.` : `${B.name} is repaired!` });
  }
  if(c.k === 'field'){
    if(!c.irr) out.push({ id:'water', label:'Water it', cost:KC_WATER, sums:4, ok:has('water'), why:has('water') ? '' : 'Needs the Water form.',
                          done:()=>{ c.irr = true; }, said:'The field is watered: half as much food again.' });
    if(!c.fer) out.push({ id:'fertile', label:'Make it fertile', cost:KC_FERTILE, sums:4, ok:has('grass'), why:has('grass') ? '' : 'Needs the Grass form.',
                          done:()=>{ c.fer = true; }, said:'The field is fertile: half as much food again.' });
  }
  return out;
}
function kcNewAct(K, c, key, block){
  const B = KC_B[key];
  return { id:'new-' + key, label:`Build ${B.a}`, cost:B.cost[0], sums:kcSums(1), ok:!block, why:block || '',
           done:()=>{ c.k = key; c.lv = 1; c.irr = false; c.fer = false; }, said:`${B.name} is built!` };
}
function kcWallAct(K){
  const C = K.city, L = C.walls + 1, palace = kcLv(K, 'palace');
  if(C.walls >= KC_WALLS.max) return null;
  const why = !kcRingClear(C) ? 'First clear all the land inside them: the ring of plots round the old town.' : palace < 2 ? 'Needs the palace at level 2.' : L > palace ? `Raise the palace to level ${L} first.` : '';
  return { id:'walls', label:C.walls ? `Raise the walls to level ${L}` : 'Build the walls', cost:KC_WALLS.cost[L - 1], sums:kcSums(L), ok:!why, why,
           done:()=>{ C.walls = L; }, said:C.walls ? `The walls are now level ${L}.` : 'The city has walls!' };
}
function kcMoatAct(K){
  const C = K.city, L = C.moat + 1, P = K.partner, water = !!(P && P.forms.includes('water'));
  if(C.moat >= KC_MOAT.max) return null;
  const why = !water ? 'Needs the Water form.' : !C.walls ? 'Needs the walls first.' : L > C.walls ? `Raise the walls to level ${L} first.` : '';
  return { id:'moat', label:C.moat ? `Deepen the moat to level ${L}` : 'Dig the moat', cost:KC_MOAT.cost[L - 1], sums:kcSums(L), ok:!why, why,
           done:()=>{ C.moat = L; }, said:C.moat ? `The moat is now level ${L}.` : 'The moat is dug and filled!' };
}
const kcMoatSay = L=> L ? `The walls will take ${15 * L}% less damage in the raids.` : 'Water round the walls: they will take less damage in the raids.';
const kcWallSay = L=> L ? `${['', 'A wooden palisade', 'Stone walls', 'Thick stone walls', 'Great walls, iron-bound', 'The great walls, crowned'][L]}, round the city. Ready for the raids still to come.` : 'Not built yet. They go round the city: the old town and the ring of plots round it.';

/* DO IT: what it costs is checked; the builders' sums; then it is paid for and done */
function kcRun(K, act, title){
  if(!act || !act.ok) return;
  if(!kcAfford(K, act.cost)){ toast('Not enough yet: ' + kcShort(K, act.cost) + '.'); return; }
  kcQuiz(title || act.label, act.sums, async ()=>{
    if(!kcAfford(K, act.cost)){ toast('Not enough any more.'); return; }
    kcPay(K, act.cost); act.done();
    await saveProfile();
    ui.kcPop = ui.kcSel;
    kcRerender();
    toast(act.said);
  });
}
function kcShort(K, cost){ return KC_RES.map((r, j)=>{ const n = (cost[j] || 0) - kcHave(K, r); return n > 0 ? `${n} more ${r}` : ''; }).filter(Boolean).join(', '); }

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
    sum.innerHTML = kdQHtml(st.q, st.vals, st.cur) + (st.q.nb > 1 ? `<small class="kq-hint">✓ moves to the next blank</small>` : '');
    box.querySelectorAll('.kcq-pips i').forEach((p, i)=> p.classList.toggle('on', i < st.got));
  };
  const next = ()=>{ st.q = kqNext(K); st.vals = Array.from({ length:st.q.nb }, ()=> ''); st.cur = 0; st.at = performance.now(); draw(); };
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
   THE KINGDOM SCREEN (screen 'kingdom'): the city, the partner, what to do
   ============================================================ */
function renderKingdom(){
  kdCss();
  document.querySelectorAll('.kd-over').forEach(b=> b.remove());
  $('#brandSub').textContent = 'The Kingdom';
  const K = kd();
  if(!K.partner) return kdNameRender();
  const P = K.partner, F = KD_FORMS[P.form], max = kdMaxHp(P, K);
  if(P.hp == null || P.hp > max) P.hp = Math.min(max, P.hp == null ? max : P.hp);
  const C = K.city, sel = ui.kcSel != null ? ui.kcSel : kcAt(4, 4);
  ui.kcSel = sel;
  const tr = kdTrial(K), pts = kdTalPoints(P), heal = kcLv(K, 'healer'), mk = kcLv(K, 'market'), potMax = mk ? mk + 1 : 0;
  const wall = kcWallAct(K), moat = kcMoatAct(K);
  screenEl.innerHTML = `
    <button class="back-link" id="backBtn">← The Time Rift</button>
    ${kcPurseHtml(K)}
    <div class="kc-main">
      <div class="kc-left">
        <div class="kc-board" id="kcBoard">${kcBoardHtml(K, sel)}</div>
        <div class="kd-card kc-plot" id="kcPlot">${kcPlotHtml(K, sel)}</div>
        <div class="kc-city">
          <div class="kd-card kc-wall">
            <div class="kc-pt">${kcIcon('wall')}<div><b>The city walls</b> <span class="kd-lv">${C.walls ? 'Level ' + C.walls : 'Not built'}</span><small>${kcWallSay(C.walls)}</small></div></div>
            ${wall ? kcActBtn(K, wall) : ''}
          </div>
          ${P.forms.includes('water') || C.moat ? `<div class="kd-card kc-wall">
            <div class="kc-pt">${kcIcon('moat')}<div><b>The moat</b> <span class="kd-lv">${C.moat ? 'Level ' + C.moat : 'Not dug'}</span><small>${kcMoatSay(C.moat)}</small></div></div>
            ${moat ? kcActBtn(K, moat) : ''}
          </div>` : ''}
          ${C.last ? `<div class="kd-card kc-last">${kcDayHtml(C.last)}</div>` : `<div class="kd-card kc-last"><p class="kc-day">${kcIcon('day')}<span>Every battle you win is a day in the kingdom: the fields grow, the families pay their taxes, the market sells.</span></p></div>`}
        </div>
      </div>
      <div class="kc-right">
        <div class="kd-card kd-partner">
          <div class="kd-pic">${kdPartnerArt(P.form, 'front', 124)}</div>
          <div class="kd-pinfo">
            <div class="kd-pname">${escapeHtml(P.name)} ${kdTypeBadge(F.type)} <span class="kd-lv">Lv ${P.level}</span></div>
            ${kdBar('Health', P.hp, max, 'hp')}
            ${kdBar('Experience', P.xp, kdNeed(P.level), 'xp')}
            <div class="kd-forms">${P.forms.length > 1 ? `Forms: ${P.forms.map(f=> kdTypeBadge(KD_FORMS[f].name === 'Stronger Physical' ? 'Physical+' : KD_FORMS[f].type)).join(' ')}` : 'Its first new form comes from the meadow\'s guardian.'}</div>
          </div>
        </div>
        <div class="kd-acts">
          <button class="btn btn-primary kd-go" id="kdMeadow">${kdIcon('sword')}<span>Into the meadow<small>Battle the wild monsters</small></span></button>
          ${tr ? (tr.ready ? `<button class="btn kd-go kd-boss" id="kdTrial">${kdIcon('sword')}<span>${escapeHtml(tr.T.name)}<small>Beat it for the ${KD_FORMS[tr.T.form].name} form</small></span></button>`
            : `<div class="kd-card kd-next"><b>Next form: ${KD_FORMS[tr.T.form].name}</b><small>${escapeHtml(tr.T.name)} comes out to fight once:</small>
                ${tr.needs.map(n=> `<div class="kd-need ${n.ok ? 'ok' : ''}"><span>${n.say}</span><em>${n.have} / ${n.want}</em><i><b style="width:${Math.round(n.have * 100 / n.want)}%"></b></i></div>`).join('')}</div>`) : ''}
          <button class="btn btn-ghost kd-rest" id="kdRest" ${P.hp >= max ? 'disabled' : ''}>${heal ? 'Rest at the healer' : 'Rest'}<small>${P.hp >= max ? 'Fully healed' : heal ? 'Heals in full' : 'Heals to half (repair the healer for more)'}</small></button>
          ${potMax ? `<button class="btn btn-ghost kd-rest" id="kdPotion" ${K.potions >= potMax || K.coins < KD_POTION ? 'disabled' : ''}>Buy a potion<small>${K.potions} of ${potMax} · ${KD_POTION} coins</small></button>` : ''}
          <button class="btn kd-rest kd-tal ${pts ? 'has' : ''}" id="kdTal">Talents<small>${pts ? `${pts} point${pts > 1 ? 's' : ''} to spend` : 'A point every level'}</small></button>
        </div>
      </div>
    </div>
    <div class="kd-foot">
      <button class="btn btn-ghost pill" id="kdGrown">For grown-ups: the sums</button>
      <span>${K.stats.won} won · ${K.stats.lost} lost</span>
    </div>`;
  $('#backBtn').addEventListener('click', ()=>{ ui.walkFresh = false; go('r6_rift'); });
  $('#kdMeadow').addEventListener('click', ()=> kdBattleStart(kdWild()));
  const t = $('#kdTrial'); if(t) t.addEventListener('click', ()=>{ const T = tr.T; kdBattleStart([kdFoe(T.sp, P.level + T.lv, { boss:true, hp:T.hp, name:T.name })], T); });
  $('#kdRest').addEventListener('click', async ()=>{ const m = kdMaxHp(P, K); P.hp = heal ? m : Math.max(P.hp, Math.round(m / 2)); await saveProfile(); kcRerender(); });
  const pt = $('#kdPotion'); if(pt) pt.addEventListener('click', async ()=>{ if(K.coins < KD_POTION || K.potions >= potMax) return; K.coins -= KD_POTION; K.potions++; await saveProfile(); kcRerender(); });
  $('#kdTal').addEventListener('click', ()=> go('kdTalents'));
  $('#kdGrown').addEventListener('click', ()=> kdGrownUps());
  $('#kcBoard').addEventListener('click', e=>{ const g = e.target.closest('[data-i]'); if(!g) return; kcSelect(+g.dataset.i); });
  screenEl.querySelectorAll('.kc-wall [data-act]').forEach(b=> b.addEventListener('click', ()=>{ const a = b.dataset.act === 'walls' ? kcWallAct(K) : kcMoatAct(K); kcRun(K, a, a && a.label); }));
  kcPlotWire(K, sel);
  kcPaintBoard();
  ui.kcPop = null;
  if(!K.met && !ui.kdTalk) setTimeout(kdWelcome, 300);
}
/* drawn again where it was (the page does not jump to the top) */
function kcRerender(){ const y = window.scrollY; renderKingdom(); window.scrollTo(0, y); }
function kcSelect(i){
  const K = kd(); ui.kcSel = i;
  const r = $('#kcSel'), [x, y] = kcXY(i);
  if(r){ r.setAttribute('x', x * 100 + 3); r.setAttribute('y', y * 100 + 3); }
  const p = $('#kcPlot'); if(p){ p.innerHTML = kcPlotHtml(K, i); kcPlotWire(K, i); }
}
function kcPlotWire(K, i){
  screenEl.querySelectorAll('#kcPlot [data-act]').forEach(b=> b.addEventListener('click', ()=>{
    const a = kcActions(K, i).find(x=> x.id === b.dataset.act);
    kcRun(K, a, a && kcJobTitle(K, i, a));
  }));
}
function kcJobTitle(K, i, a){ const c = K.city.cells[i]; return a.id === 'clear' ? 'Burning back the wild' : a.id.startsWith('new-') ? `Building ${KC_B[a.id.slice(4)].a}` : `${KC_B[c.k] ? KC_B[c.k].name : 'It'}: ${a.label.toLowerCase()}`; }
function kcPlotName(c, x, y){
  if(c.k === 'wild') return kcInside(x, y) ? 'Wild land, inside where the walls will go' : 'Wild land';
  if(c.k === 'clear') return kcInside(x, y) ? 'An empty plot in the city' : 'An empty plot outside the city';
  return KC_B[c.k].name;
}
function kcPlotHtml(K, i){
  const c = K.city.cells[i], [x, y] = kcXY(i), B = KC_B[c.k];
  const say = c.k === 'wild' ? 'Brambles and trees. Burnt back, it can be built on.'
    : c.k === 'clear' ? (kcInside(x, y) ? 'Inside the walls: for houses, and towers once the walls stand.' : 'Outside the walls: for fields.')
    : B.say(c.lv, c);
  const acts = kcActions(K, i);
  return `<div class="kc-pt">${kcIcon(B ? c.k : c.k === 'wild' ? 'wild' : 'clear')}<div><b>${kcPlotName(c, x, y)}</b>${B ? ` <span class="kd-lv">${c.lv ? 'Level ' + c.lv : 'In ruins'}</span>` : ''}<small>${say}</small></div></div>
    ${acts.length ? `<div class="kc-acts">${acts.map(a=> kcActBtn(K, a)).join('')}</div>` : `<small class="kc-full">As good as it can be.</small>`}`;
}
function kcActBtn(K, a){
  const enough = kcAfford(K, a.cost);
  const cost = KC_RES.map((r, j)=> (a.cost[j] || 0) ? `<span class="kc-c ${kcHave(K, r) >= a.cost[j] ? '' : 'short'}">${kcIcon(r)}${a.cost[j]}</span>` : '').join('');
  return `<button class="btn kc-act ${a.ok && enough ? 'btn-primary' : 'btn-ghost'}" data-act="${a.id}" ${a.ok ? '' : 'disabled'}>
    <span class="kc-an">${a.label}</span>
    <span class="kc-cost">${cost}<span class="kc-c sums">${a.sums} sums</span></span>
    ${a.why ? `<small class="kc-why">${a.why}</small>` : ''}</button>`;
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
    tower:'<path d="M7 21V9H5V4h3v2h2V4h4v2h2V4h3v5h-2v12z" fill="#b3ab9b" stroke="#5f5a52" stroke-width="1.3" stroke-linejoin="round"/><path d="M11 21v-4h2v4" fill="#4a3a2a"/>',
    palace:'<path d="M3 20V10h3V7h2v3h2V5l2-2 2 2v5h2V7h2v3h3v10z" fill="#e9dfc8" stroke="#6b5b45" stroke-width="1.3" stroke-linejoin="round"/><path d="M10.5 20v-4a1.5 1.5 0 0 1 3 0v4" fill="#3e5f9a"/>',
    healer:'<rect x="5" y="9" width="14" height="11" fill="#f3efe6" stroke="#6b7a5a" stroke-width="1.3"/><path d="M3.5 10L12 4l8.5 6" fill="#4f9a6a" stroke="#2f6a45" stroke-width="1.3" stroke-linejoin="round"/><path d="M12 12c-2.5 1-2.5 4 0 5.5 2.5-1.5 2.5-4.5 0-5.5z" fill="#5fb07a"/>',
    market:'<path d="M3 9l2-4h14l2 4z" fill="#c8463c" stroke="#7a2a22" stroke-width="1.2"/><path d="M7 5l-1 4M11 5v4M15 5l1 4" stroke="#f6eee0" stroke-width="1.6"/><rect x="5" y="9" width="14" height="10" fill="#e9d7b0" stroke="#8a6d4b" stroke-width="1.2"/><rect x="8" y="13" width="3" height="3" fill="#a8743f"/><rect x="13" y="13" width="3" height="3" fill="#6fb34a"/>',
    yard:'<path d="M5 20V6h2v14M17 20V9h2v11M4 8h16" stroke="#8a5a2b" stroke-width="1.8" fill="none"/><path d="M12 8v5" stroke="#5f5a52" stroke-width="1.2"/><rect x="10" y="13" width="4" height="3" fill="#a9a49a" stroke="#5f5a52"/><rect x="3" y="18" width="18" height="2.5" rx="1.2" fill="#b07a45"/>',
    granary:'<path d="M4 20V10l8-6 8 6v10z" fill="#a5462f" stroke="#5f2418" stroke-width="1.3" stroke-linejoin="round"/><path d="M9 20v-6h6v6M9 14l6 6M15 14l-6 6" stroke="#f3e6d0" stroke-width="1.2" fill="none"/>',
    wall:'<path d="M3 20V9h3V7h3v2h2V7h2v2h2V7h3v2h3v11z" fill="#b3ab9b" stroke="#5f5a52" stroke-width="1.3" stroke-linejoin="round"/><path d="M10 20v-4a2 2 0 0 1 4 0v4" fill="#4a3a2a"/>',
    moat:'<path d="M2 14c2.5-2 5-2 7.5 0s5 2 7.5 0 3-2 5 0v6H2z" fill="#5aa9e0" stroke="#2b6f9e" stroke-width="1.3"/><path d="M4 17c2-1 4-1 6 0" stroke="#d8efff" stroke-width="1.2" fill="none"/>',
  };
  return `<svg class="kc-ic ${k}" viewBox="0 0 24 24" aria-hidden="true">${I[k] || I.clear}</svg>`;
}

/* ============================================================
   THE BOARD: nine by nine plots, 100 units a plot. (4.73) The picture is painted on a canvas (47-kingdom-art.js: the
   forest, the fields, the buildings, the walls); over it lies a see-through layer: a plot for each finger's tap, the
   ring round the chosen plot, a flash on what was just built.
   ============================================================ */
function kcBoardHtml(K, sel){
  const C = K.city, [sx, sy] = kcXY(sel);
  const hits = C.cells.map((c, i)=>{ const [x, y] = kcXY(i); return `<rect class="kc-hit" data-i="${i}" x="${x * 100}" y="${y * 100}" width="100" height="100" fill="transparent"/>`; }).join('');
  /* where the walls will go, until they stand */
  const ring = !C.walls && kcRingClear(C) ? `<rect x="200" y="200" width="500" height="500" fill="none" stroke="rgba(255,248,230,.62)" stroke-width="3" stroke-dasharray="10 12" pointer-events="none"/>` : '';
  const pop = ui.kcPop != null ? (()=>{ const [x, y] = kcXY(ui.kcPop); return `<rect class="kc-pop" x="${x * 100 + 4}" y="${y * 100 + 4}" width="92" height="92" rx="12" pointer-events="none"/>`; })() : '';
  return `<canvas class="kc-cv" id="kcCv" width="900" height="900" aria-hidden="true"></canvas>
    <svg class="kc-svg" viewBox="0 0 900 900" role="img" aria-label="The city, nine plots by nine">
      ${ring}${C.walls ? `<g class="kc-walls" data-level="${C.walls}" pointer-events="none"></g>` : ''}${pop}${hits}
      <rect id="kcSel" x="${sx * 100 + 3}" y="${sy * 100 + 3}" width="94" height="94" rx="10" fill="none" stroke="#ffd34d" stroke-width="7" pointer-events="none"/>
    </svg>`;
}
/* paint the picture (kept between visits: drawn again only when the city has changed, or the board's size) */
function kcPaintBoard(){
  const cv = document.getElementById('kcCv');
  if(!cv || typeof KC_ART === 'undefined') return;
  try { KC_ART.paint(cv, kd()); } catch(e){ console.error('kingdom board:', e); }
}
let kcResizeT = 0;
window.addEventListener('resize', ()=>{ clearTimeout(kcResizeT); kcResizeT = setTimeout(()=>{ if(document.getElementById('kcCv')) kcPaintBoard(); }, 180); });

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
  .kc-main{display:grid;grid-template-columns:minmax(0, 1.4fr) minmax(0, 1fr);gap:14px;align-items:start;}
  .kc-right .kd-partner{flex-wrap:wrap;}
  .kc-right .kd-pic{width:92px;height:92px;}
  .kc-right .kd-pic .kd-mon{width:104px !important;height:104px !important;}
  .kc-right .kd-pinfo{min-width:150px;}
  .kc-right .kd-bar{grid-template-columns:64px 1fr auto;}
  .kc-left, .kc-right{display:flex;flex-direction:column;gap:10px;min-width:0;}
  .kc-board{position:relative;border-radius:16px;overflow:hidden;box-shadow:0 3px 10px var(--shadow), inset 0 0 0 1px var(--line);background:#4d8638;}
  .kc-cv{display:block;width:100%;height:auto;aspect-ratio:1 / 1;}
  .kc-svg{position:absolute;inset:0;width:100%;height:100%;touch-action:manipulation;}
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
  .kc-full{font-size:12.5px;font-weight:700;color:var(--ink-soft);}
  .kc-city{display:grid;grid-template-columns:1fr;gap:10px;}
  .kc-wall{display:flex;flex-direction:column;gap:8px;}
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
  @media (max-width:700px){ .kc-main{grid-template-columns:minmax(0,1fr);} .kc-right{order:-1;} }
  @media (max-width:560px){ .kc-r{padding:3px 8px 3px 5px;} .kc-r small{display:none;} .kc-r b{font-size:15px;} .kd-acts{grid-template-columns:1fr;} .kcq-card .kdb-key{height:52px;} }
  `;
  document.head.appendChild(st);
}
