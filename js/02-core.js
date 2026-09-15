/* ==========================================================
   02-core.js
   State, saving, cloud sync, word list, medals, stones, stat maths.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   ========================================================== */
/* ---------- ASSET MANIFEST (hook for future art/audio) ----------
   Empty by design: every lookup falls back to the current text/CSS behaviour, so
   the game runs unchanged until real files are dropped in. Fill in paths as art
   becomes available, e.g. effects:{ 'Ember':'assets/fx/ember.png' }. */
const ASSETS = { sprites:{}, effects:{}, music:{}, sfx:{} };

/* ============================================================
   AUDIO ENGINE
   ------------------------------------------------------------
   Sounds are addressed by SEMANTIC EVENT NAME, never by filename, so one file
   can back many events — point a dozen events at 'hit_generic.mp3' now and
   split them later by editing this map alone, with no code changes.

   Everything degrades silently: a missing file is a no-op, so the game stays
   fully playable with zero audio present (same rule as the art layer).
   ============================================================ */
const SFX_DIR = 'assets/sfx/';
const BGM_DIR = 'assets/bgm/';

/* event name -> filename in assets/sfx/.  Reuse freely: several events may
   share one file. Set a value to null to deliberately silence an event. */
const SFX_MAP = {
  // combat
  hit_taken:        'hit_taken.mp3',      // the player's monster is struck
  hit_dealt:        'hit_dealt.mp3',      // a move connects with an enemy
  move_miss:        'move_miss.mp3',
  // quiz feedback
  answer_correct:   'answer_correct.mp3',
  answer_wrong:     'answer_wrong.mp3',
  // outcomes
  victory:          'victory.mp3',
  defeat:           'defeat.mp3',
  catch_success:    'catch_success.mp3',
  catch_miss:       'catch_miss.mp3',
  // progression
  level_up:         'level_up.mp3',
  protein_use:      'level_up.mp3',       // deliberately the same cue as levelling
  evolution:        'evolution.mp3',
  recovery_heal:    'recovery_heal.mp3',
  // skill stones — tier-specific fanfare, shared by "received" and "used"
  stone_roll:       'stone_roll.mp3',     // the spin itself
  stone_low:        'stone_low.mp3',
  stone_mid:        'stone_mid.mp3',
  stone_high:       'stone_high.mp3',
  stone_veryhigh:   'stone_veryhigh.mp3',
  stone_ultra:      'stone_ultra.mp3',
  // interface
  ui_click:         'ui_click.mp3',
};

/* music track name -> filename in assets/bgm/ */
/* Music files, resolved MOST SPECIFIC FIRST. Every lookup walks a ladder and
   falls through to the next candidate if a file is absent, so you can add a
   bespoke track for one zone without supplying the rest. */
/* Bump by 0.01 with every published change, so a glance at the home screen
   confirms which build is actually loaded. */
const GAME_VERSION = '1.38';

const BGM_MAP = {
  main_menu:      'main_menu.mp3',

  // region themes
  region:         'region.mp3',            // generic fallback
  region1:        'region1.mp3',
  region2:        'region2.mp3',
  region3:        'region3.mp3',
  region4:        'region4.mp3',

  // zone themes
  zone_tranquil_forest: 'zone_tranquil_forest.mp3',
  zone_sacred_grove:    'zone_sacred_grove.mp3',
  zone_rocky_caverns:   'zone_rocky_caverns.mp3',

  // battle themes
  battle_wild:    'battle_wild.mp3',       // generic fallback
  battle_boss:    'battle_boss.mp3',       // generic NPC boss
  battle_tranquil_forest: 'battle_tranquil_forest.mp3',
  battle_sacred_grove:    'battle_sacred_grove.mp3',
  battle_rocky_caverns:   'battle_rocky_caverns.mp3',

  // climactic encounters
  battle_legendary: 'battle_legendary.mp3',   // Phoenix, Forest Guardian, the Dragon
  battle_padrino:   'battle_padrino.mp3',     // Don Padrino
};

/* Try each track in turn; the first one that actually loads wins. */
/* Any key resolves to `<key>.mp3` unless the map overrides it, so a new region
   or zone needs no code — just drop the file in. */
function bgmFile(key){ return BGM_MAP[key] || (key ? key + '.mp3' : null); }

function playMusicChain(names, opts){
  const list = names.filter(n=>{
    const f = bgmFile(n);
    return f && !audio.missing[f];
  });
  if(list.length===0) return;
  playMusic(list[0], Object.assign({ chainFallback:list.slice(1) }, opts||{}));
}

const audio = {
  unlocked: false,
  sfxCache: {},          // event file -> {el, src, gain}
  musicEl: null,
  musicName: null,
  pendingChain: null,
  missing: {},
};

/* ---------- Web Audio volume control ----------
   iOS Safari IGNORES HTMLAudioElement.volume — it's read-only there, so every
   sound plays at full system volume no matter what the sliders say. Routing
   audio through a Web Audio GainNode is the only way to control level on iOS,
   and it also gives us smooth, click-free fades. */
let actx = null, musicGain = null, sfxGain = null;
function ensureAudioCtx(){
  if(actx) return actx;
  try{
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    actx = new AC();
    musicGain = actx.createGain(); musicGain.gain.value = musicVolume(); musicGain.connect(actx.destination);
    sfxGain   = actx.createGain(); sfxGain.gain.value   = sfxVolume();   sfxGain.connect(actx.destination);
  }catch(e){ actx = null; }
  return actx;
}
/* Attach an <audio> element to a gain bus. Each element may only ever be
   connected once, so the node is cached on the element itself. */
function routeAudio(el, bus){
  const ctx = ensureAudioCtx();
  if(!ctx || el._routed) return !!el._routed;
  try{
    const src = ctx.createMediaElementSource(el);
    src.connect(bus);
    el._routed = true;
    return true;
  }catch(e){ return false; }
}
function applyVolumes(){
  if(musicGain) musicGain.gain.value = musicVolume();
  if(sfxGain)   sfxGain.gain.value   = sfxVolume();
  // fallback for browsers without Web Audio (desktop mostly) — harmless on iOS
  if(!actx){
    if(audio.musicEl) audio.musicEl.volume = musicVolume();
  }
}
/* Ramp a gain node, used for fades. */
function rampGain(node, to, ms, onDone){
  if(!node || !actx){ if(onDone) onDone(); return; }
  try{
    const now = actx.currentTime;
    node.gain.cancelScheduledValues(now);
    node.gain.setValueAtTime(node.gain.value, now);
    node.gain.linearRampToValueAtTime(Math.max(0.0001, to), now + ms/1000);
  }catch(e){}
  if(onDone) setTimeout(onDone, ms);
}

function sfxVolume(){ return (state?.settings?.sfxVolume ?? 0.55); }
function musicVolume(){ return (state?.settings?.musicVolume ?? 0.10); }

function unlockAudio(){
  const ctx = ensureAudioCtx();
  if(ctx && ctx.state === 'suspended'){ try{ ctx.resume(); }catch(e){} }
  if(audio.unlocked) return;
  audio.unlocked = true;
  applyVolumes();
  if(audio.musicName && !audio.musicEl) playMusic(audio.musicName);
}
try{
  document.addEventListener('pointerdown', unlockAudio, { once:false, passive:true });
  document.addEventListener('keydown', unlockAudio, { passive:true });
  document.addEventListener('click', (e)=>{
    const el = e.target.closest('button, .menu-card, .region-card, .challenge-card, .mon-index-card, .party-head, .stone-card, .drawer-item');
    if(!el || el.disabled) return;
    if(el.closest('.write-box, .quiz-write')) return;
    playSfx('ui_click');
  }, true);
}catch(e){}

function playSfx(event){
  try{
    const file = SFX_MAP[event];
    if(!file || !audio.unlocked || audio.missing[file]) return null;
    const src = SFX_DIR + file;
    let entry = audio.sfxCache[file];
    if(!entry){
      const el = new Audio(src);
      el.addEventListener('error', ()=>{ audio.missing[file] = true; });
      entry = { el, gain:null };
      const ctx = ensureAudioCtx();
      if(ctx){
        try{
          const g = ctx.createGain();
          g.gain.value = 1;
          g.connect(sfxGain);
          const srcNode = ctx.createMediaElementSource(el);
          srcNode.connect(g);
          el._routed = true;
          entry.gain = g;
        }catch(e){}
      }
      audio.sfxCache[file] = entry;
    }
    /* A previous fadeOutSfx() SCHEDULED a gain ramp. Assigning .value does not
       cancel pending automation — the old ramp keeps winning and the sound
       plays silently forever after its first fade. Cancel, then set. */
    if(entry.gain){
      try{
        const now = (actx && actx.currentTime) || 0;
        entry.gain.gain.cancelScheduledValues(now);
        entry.gain.gain.setValueAtTime(1, now);
      }catch(e){ entry.gain.gain.value = 1; }
    } else {
      entry.el.volume = sfxVolume();               // non-Web-Audio fallback
    }
    entry._fadeTimer && clearTimeout(entry._fadeTimer);
    entry.el.currentTime = 0;
    const p = entry.el.play();
    if(p && p.catch) p.catch(()=>{});
    return entry;
  }catch(e){ return null; }
}
function playStoneSfx(tierId){ return playSfx('stone_'+tierId); }

/* Fade a specific sound effect out (used for the stone-roll spin). */
function fadeOutSfx(event, ms){
  try{
    const file = SFX_MAP[event];
    const entry = file && audio.sfxCache[file];
    if(!entry) return;
    const dur = ms || 500;
    if(entry.gain && actx){
      rampGain(entry.gain, 0.0001, dur, ()=>{
        try{
          entry.el.pause(); entry.el.currentTime = 0;
          // hand the gain back at full so the next play isn't silent
          const now = (actx && actx.currentTime) || 0;
          entry.gain.gain.cancelScheduledValues(now);
          entry.gain.gain.setValueAtTime(1, now);
        }catch(e){}
      });
    } else {
      const el = entry.el, start = el.volume || 1, steps = 12;
      let i = 0;
      const iv = setInterval(()=>{
        i++; try{ el.volume = Math.max(0, start*(1-i/steps)); }catch(e){}
        if(i>=steps){ clearInterval(iv); try{ el.pause(); el.currentTime = 0; }catch(e){} }
      }, dur/steps);
    }
  }catch(e){}
}

/* Music. Switching tracks NEVER cuts the old one — it always fades over 2s. */
const MUSIC_FADE_MS = 2000;
function playMusic(name, opts){
  opts = opts || {};
  try{
    /* bgmFile() derives `<key>.mp3` for anything not in the table — but this
       guard rejected those keys before it was ever consulted, so every derived
       track (zone_band_concert, battle_region3…) silently did nothing. */
    if(!bgmFile(name)) return;
    audio.musicName = name;
    if(!audio.unlocked) return;
    if(audio.musicEl && audio.musicEl.dataset.track === name && !opts.restart) return;

    // ease the outgoing track away instead of stopping it dead
    if(audio.musicEl) fadeOutMusic(MUSIC_FADE_MS);

    const file = bgmFile(name);
    if(audio.missing[file]) return;
    const el = new Audio(BGM_DIR + file);
    el.dataset.track = name;
    el.loop = opts.chainTo ? false : (opts.loop !== false);
    el.addEventListener('error', ()=>{
      audio.missing[file] = true;
      // fall through to the next candidate in the ladder
      if(opts.chainFallback && opts.chainFallback.length){
        const rest = opts.chainFallback;
        setTimeout(()=> playMusicChain(rest, Object.assign({}, opts, { chainFallback:null })), 0);
      }
    });

    const ctx = ensureAudioCtx();
    let gain = null;
    if(ctx){
      try{
        gain = ctx.createGain();
        gain.gain.value = (opts.silentMs || opts.fadeMs) ? 0.0001 : 1;
        gain.connect(musicGain);
        ctx.createMediaElementSource(el).connect(gain);
        el._routed = true;
      }catch(e){ gain = null; }
    }
    if(!gain) el.volume = (opts.silentMs || opts.fadeMs) ? 0 : musicVolume();

    el._gain = gain;
    audio.musicEl = el;

    if(opts.chainTo){
      audio.pendingChain = opts.chainTo;
      el.addEventListener('ended', ()=>{
        const next = audio.pendingChain; audio.pendingChain = null;
        if(next) playMusic(next, { loop:true });
      });
    }

    // optional silent lead-in, then fade up
    if(opts.silentMs || opts.fadeMs){
      const fadeMs = opts.fadeMs || 0;
      setTimeout(()=>{
        if(audio.musicEl !== el) return;
        if(gain) rampGain(gain, 1, Math.max(1, fadeMs));
        else {
          const target = musicVolume(), steps = 20;
          let i = 0;
          const iv = setInterval(()=>{
            if(audio.musicEl !== el){ clearInterval(iv); return; }
            i++; el.volume = Math.min(target, target*(i/steps));
            if(i>=steps) clearInterval(iv);
          }, Math.max(1, fadeMs)/steps);
        }
      }, opts.silentMs || 0);
    }

    const p = el.play();
    if(p && p.catch) p.catch(()=>{});
  }catch(e){}
}

/* Always a fade — never an abrupt stop. */
function fadeOutMusic(ms){
  const el = audio.musicEl;
  if(!el) return;
  audio.musicEl = null;          // detach immediately so a new track can start
  audio.pendingChain = null;
  const dur = ms || MUSIC_FADE_MS;
  const kill = ()=>{ try{ el.pause(); el.currentTime = 0; }catch(e){} };
  if(el._gain && actx){
    rampGain(el._gain, 0.0001, dur, kill);
  } else {
    const start = el.volume || musicVolume(), steps = 24;
    let i = 0;
    const iv = setInterval(()=>{
      i++; try{ el.volume = Math.max(0, start*(1-i/steps)); }catch(e){}
      if(i>=steps){ clearInterval(iv); kill(); }
    }, dur/steps);
  }
}
/* Kept for API compatibility — now always fades rather than cutting. */
function stopMusic(){ fadeOutMusic(MUSIC_FADE_MS); }

/* Battle entry: the fight's theme starts immediately — no intro sting.
   `silentIntro` is used when a wild fight is entered straight from "Explore
   again", so back-to-back battles don't restart the same music jarringly:
   3s of silence, then a 2s fade in. */
/* Battle music, most specific first:
     a climactic fight  ->  the zone's own battle theme  ->  the generic one */
function playBattleMusic(isBoss, opts){
  opts = opts || {};
  const b = ui.battle || {};
  /* A battle's own bgKey wins over ui.currentZone. Challenge fights (the band
     competition, the dojos) aren't in a zone at all, and the stale currentZone
     was leaking the wrong zone's battle theme into them. */
  const place = b.bgKey ? b.bgKey.replace(/^battle_/, '')
                        : ((ui.currentZone && ui.currentZone.id) || '');
  const chain = [];

  if(b.npcId === 'padrino') chain.push('battle_padrino');
  const legendary = (b.enemies||[]).some(e=>SPECIES[e.species] && SPECIES[e.species].tier==='legendary')
                 || b.guardianTrial || b.scriptedLoss;
  if(legendary) chain.push('battle_legendary');
  if(place) chain.push('battle_'+place);
  /* The Band Competition is the one place where the zone's own track carries
     into its fights — it's a concert, so the music IS the setting. Everywhere
     else falls through to the generic battle themes as usual. */
  if(b.concertFight) chain.push('zone_band_concert');
  chain.push('battle_region'+((state.progress||{}).currentRegion||1));
  chain.push(isBoss ? 'battle_boss' : 'battle_wild');
  chain.push('battle_wild');

  playMusicChain(chain, {
    loop:true,
    silentMs: opts.silentIntro ? 3000 : 0,
    fadeMs:   opts.silentIntro ? 2000 : 0,
  });
}

/* ---------- SHARED WORD LIST SOURCE ----------
   WORDS_URL points at a plain-text file (one phrase per line) sitting next to
   this page. Hosted on GitHub Pages you can edit words.txt directly on the
   GitHub website and every device picks up the change on next load.
   If the fetch fails (offline, or opened as a local file) the game falls back
   to the last synced copy, then to DEFAULT_MASTER_WORDS below. */
const WORDS_URL = 'words.txt';

const DEFAULT_MASTER_WORDS = ["夜市","踢足球","一座楼房","静悄悄","热闹","五颜六色","一排桌椅","电灯","除了","炒香肠","我也喜欢","吃炸鸡翅","你好","谢谢","朋友","老师","学校","合作","信箱","一二三","可口","人人喜爱","树木","泥土","七七八八","也是","不会","女儿","阿姨","娃娃","礼物","衣服","力气","禾苗","几个","去哪儿","哥哥","弟弟","姐姐","妹妹","起立","行李","日期","子孙","美满","车俩","只是","四十","巴士","车站","读书","紫色","彩虹","花朵","爬山","羊毛","国王","书架","作业","书本","告示牌","妈妈","爸爸","爷爷","奶奶","叔叔","舅舅","玩具","婆婆","公公","公园","早晨","中午","下午","傍晚","晚上","深夜","太阳","云朵","蓝天","早餐","午餐","晚餐","餐具","餐厅","校园","农田","菜刀","在哪","上学","下学","星期","星星","月亮","大笑","微笑","小时","来回","写字","跳舞","开始","救火车","关门","两只","长短","广阔","亮光","多少","刷牙","洗脸","洗澡","方便","快乐","图书馆","目的","挥手","本来","工作","开门","看见","又白又胖","点头","摇头","头脑","游泳","打篮球","功课","吹牛","贝壳","五六七","树枝","支持","八九十","什么","怎么","中文","文字","文件","服务","购物产","饭店","客厅","可爱","一起","游戏","熊猫","眼睛","纸巾","岁月","整天","水果","游泳池","水池","尺寸","正反","明白","古时","水壶","后面","左手","右边","中间","时间","画画","花草","回家","我的","同学","戴眼镜","个子","高大","豆腐","今天","白米饭","虫子","两元五角","饼干","肉包子","身体","健康","万事如意","云吞面","吃饭","偷吃","小贼","小猫","野狗","马上","起码","骑马","以后","下雨","一点","毛巾","要不要","需要","洗手","牙刷","牙齿","首先","东西","冲凉","厕所","皮鞋","还是","自己","放手","放工","放开","放好","放下","尺子","书包","文具","闹钟","时钟","手表","电话","手机","收拾","袜子","鞋子","汗衫","长裤","短裤","一双","足球","毛球","西瓜","果汁","新加坡","公民","好办法","观看","买卖","公斤","生日","教堂","耶稣","羡慕","嫉妒","保护","保持","抱抱","宝宝","香喷喷","吃草","父亲","母亲","大中小","打扫","你们","你呢","桌椅","牛奶","面包","鸡肉","钓鱼","炸鸡","干净","肮胀","肚子","脖子","肩膀","手脚","灵活","昨天","前天","后天","明天","名字","高兴","伤心","难过","操心","怀疑","开心","儿童","节日","庆祝","再见","起来","声音","大声","叫喊","爪子","尖刻","狮子","老虎","大象","长颈鹿","鸟儿","斑马","斑马线","动物","学习","来到","到达","跌倒","受伤","游乐场","捉迷藏","地铁","生活","家庭","厨房","煮菜","食物","汽水","气球","帮助","现在","对面","兄弟","合适","很大","出去","外公","外面","里面","进来","大桥","天桥","马路","天气","好热","好冷","冰箱","冰水","年级","开学","孩子","学生","男孩","女孩","孙子","孙女","关心","观赏","商店"];

/* ---------- SKILL TOKENS / SKILL STONES ----------
   Region 1 rollable types exclude Dragon/Steel/Fairy (unlocked in a later region
   via a separate token type). Tier odds and effects are fixed by design. */
/* The fantasy trio joins the pool once Emerald March opens — before that the
   nine elemental types are the whole world. */
const STONE_TYPES_BASE   = ['Fire','Water','Grass','Electric','Ground','Flying','Physical','Ghost','Psychic'];
const STONE_TYPES_FANTASY= ['Dragon','Steel','Fairy'];
function stoneTypePool(){
  const r = (state && state.progress && state.progress.currentRegion) || 1;
  return r >= 2 ? STONE_TYPES_BASE.concat(STONE_TYPES_FANTASY) : STONE_TYPES_BASE.slice();
}
const STONE_TYPES_REGION1 = STONE_TYPES_BASE;   // kept for older references
const TOKEN_LEVEL_ODDS = [ {min:1,max:10,chance:0.10}, {min:11,max:20,chance:0.20}, {min:21,max:30,chance:0.30} ];
const TOKENS_PER_ROLL = 5;

const STONE_TIERS = [
  { id:'low',      label:'Low',       odds:0.50, words:1,  mult:0.25, kind:'single' },
  { id:'mid',      label:'Mid',       odds:0.30, words:3,  mult:0.5,  kind:'single' },
  { id:'high',     label:'High',      odds:0.12, words:5,  mult:0.8,  kind:'multi2' },
  { id:'veryhigh', label:'Very High', odds:0.06, words:4,  mult:null, kind:'status' },
  { id:'ultra',    label:'Ultra',     odds:0.02, words:10, mult:0.5,  kind:'multihit' },
];
const RECYCLE_RETURN = { low:1, mid:2, high:4, veryhigh:7, ultra:15 };

const STONE_NAMES = {
  Fire:     { low:'Fireball',    mid:'Flame Wheel',  high:'Twin Blaze',   veryhigh:'Overheat',        ultra:'Fusion Flare' },
  Water:    { low:'Water Pulse', mid:'Aqua Jet',      high:'Twin Torrent', veryhigh:'Ice Tomb',        ultra:'Vortex Blast' },
  Grass:    { low:'Seed Bomb',   mid:'Power Whip',    high:'Twin Razor',   veryhigh:'Leech Seed',      ultra:'Verdant Nova' },
  Electric: { low:'Spark',       mid:'Volt Charge',   high:'Twin Bolt',    veryhigh:'Overcharge',      ultra:'Arc Explosion' },
  Ground:   { low:'Rock Throw',  mid:'Rock Blast',    high:'Twin Boulder', veryhigh:'Spike Armour',    ultra:'Tectonic Crush' },
  Flying:   { low:'Wing Attack', mid:'Drill Peck',    high:'Twin Gale',    veryhigh:'Mirage',          ultra:'Sonic Skydive' },
  Physical: { low:'Pummel',      mid:'Power Strike',  high:'Twin Strike',  veryhigh:'Counter',         ultra:'Devastate' },
  Ghost:    { low:'Astonish',    mid:'Nightmare',     high:'Twin Hex',     veryhigh:'Curse',           ultra:'Shadow Shred' },
  Psychic:  { low:'Confuse',     mid:'Psybeam',       high:'Twin Shock',   veryhigh:'Discombobulate',  ultra:'Mindstorm' },
  Dragon:   { low:'Dragonclaw',  mid:'Dragonbreath',  high:'Twin Breath',  veryhigh:'Dragon Dance',    ultra:'Draco Meteor' },
  Steel:    { low:'Iron Bolt',   mid:'Iron Strike',   high:'Twin Cannon',  veryhigh:'Steel Aegis',     ultra:'Gigaton Smash' },
  Fairy:    { low:'Dazzle',      mid:'Moonbeam',      high:'Twin Gleam',   veryhigh:'Diamond Dust',    ultra:'Astral Bloom' },
};
function stoneName(type, tierId){ return (STONE_NAMES[type]||{})[tierId] || tierId; }
function tokenChanceForLevel(level){
  if(level >= TOKEN_LEVEL_ODDS[TOKEN_LEVEL_ODDS.length-1].min){
    return TOKEN_LEVEL_ODDS[TOKEN_LEVEL_ODDS.length-1].chance; // 21+ keeps the top rate
  }
  const b = TOKEN_LEVEL_ODDS.find(b=>level>=b.min && level<=b.max);
  return b ? b.chance : 0;
}
function rollStoneTier(){
  const r = Math.random(); let acc=0;
  for(const t of STONE_TIERS){ acc+=t.odds; if(r<acc) return t; }
  return STONE_TIERS[0];
}
function rollStoneType(){ const p = stoneTypePool(); return p[Math.floor(Math.random()*p.length)]; }
function newMoveStone(){
  const tier = rollStoneTier();
  const type = rollStoneType();
  return { uid:'s'+Date.now()+Math.floor(Math.random()*1000), tier:tier.id, type, name:stoneName(type,tier.id) };
}
function stoneTierDef(id){ return STONE_TIERS.find(t=>t.id===id); }

const CEDICT = {"一二三":"one, two, three","一双":"a pair","一座楼房":"a building","一排桌椅":"a row of tables and chairs","一点":"a bit; a little","一起":"in the same place; together","七七八八":"almost; nearing completion","万事如意":"to have all one's wishes; best wishes","上学":"to go to school; to attend school","下午":"afternoon; p.m.","下学":"to finish school; after school","下雨":"to rain","不会":"improbable; unlikely","东西":"thing; object","两元五角":"two yuan fifty cents","两只":"two (of animals/objects)","个子":"height; stature","中午":"noon; midday","中文":"Chinese language","中间":"between; intermediate","也是":"also is; likewise","书包":"schoolbag; satchel","书本":"book","书架":"bookshelf","买卖":"buying and selling; business","云吞面":"wonton noodles","云朵":"a cloud","五六七":"five, six, seven","五颜六色":"multi-colored; every color under the sun","亮光":"light; beam of light","人人喜爱":"loved by everyone","什么":"what?; something","今天":"today; at the present","以后":"after; later","伤心":"to grieve; to be broken-hearted","作业":"school assignment; homework","你们":"you (plural)","你呢":"and you?; what about you?","你好":"hello; hi","保护":"to protect; to defend","保持":"to keep; to maintain","信箱":"mailbox; post office box","健康":"health; healthy","偷吃":"to eat on the sly; to pilfer food","傍晚":"in the evening; when night falls","儿童":"child","兄弟":"brothers; younger brother","八九十":"eight, nine, ten","公公":"grandpa; husband’s father","公园":"park (for public recreation)","公斤":"kilogram (kg)","公民":"citizen","关心":"to be concerned about; to care about","关门":"to close a door; to lock a door","再见":"goodbye; see you again later","写字":"to write characters","农田":"farmland; cultivated land","冰水":"iced water","冰箱":"icebox; freezer cabinet","冲凉":"to take a shower","几个":"a few; several","出去":"to go out","到达":"to reach; to arrive","刷牙":"to brush one's teeth","前天":"the day before yesterday","力气":"strength","功课":"homework; assignment","动物":"animal","午餐":"lunch; luncheon","厕所":"toilet; lavatory","厨房":"kitchen","去哪儿":"where to go","又白又胖":"fair-skinned and chubby","叔叔":"uncle (father’s younger brother)","受伤":"to be hurt; to be injured","古时":"ancient times","只是":"merely; simply","叫喊":"exclamation; outcry","可口":"tasty; to taste good","可爱":"adorable; cute","右边":"right side; right, to the right","吃炸鸡翅":"to eat fried chicken wings","吃草":"to graze; to eat grass","吃饭":"to have a meal; to eat","合作":"to cooperate; to collaborate","合适":"suitable; just right","同学":"to study at the same school; fellow student","名字":"name (of a person or thing)","后天":"the day after tomorrow; acquired (not innate)","后面":"rear; back","吹牛":"to talk big; to shoot off one's mouth","告示牌":"notice; placard","哥哥":"older brother","商店":"store; shop","四十":"forty; 40","回家":"to return home","国王":"king","图书馆":"library","在哪":"where; where at","地铁":"subway; metro","声音":"voice; sound","外公":"grandpa (mother’s father)","外面":"outside; surface","多少":"number; amount","夜市":"night market","大中小":"large, medium, small","大声":"loud voice; in a loud voice","大桥":"large bridge","大笑":"to laugh heartily; a belly laugh","大象":"elephant","天桥":"overhead bridge; footbridge","天气":"weather","太阳":"sun","头脑":"brains; mind","女儿":"daughter","女孩":"girl; lass","奶奶":"grandma (father’s mother)","好冷":"very cold","好办法":"a good method/idea","好热":"very hot","妈妈":"mama; mommy","妹妹":"younger sister; young woman","姐姐":"older sister","娃娃":"baby; small child","婆婆":"grandma; husband’s mother","嫉妒":"to be jealous","子孙":"children and grandchildren; descendants","孙女":"son's daughter; granddaughter","孙子":"grandson; son's son","学习":"to learn; to study","学校":"school","学生":"student; schoolchild","孩子":"child","宝宝":"darling; baby","客厅":"drawing room (room for arriving guests); living room","家庭":"family; household","对面":"opposite side; across from","小时":"hour","小猫":"kitten","小贼":"little thief","尖刻":"sharp; biting","尺子":"rule; ruler (measuring instrument)","尺寸":"size; dimension","岁月":"years; the passing of time","工作":"to work; (of a machine) to operate","左手":"left hand; left-hand side","巴士":"bus (loanword); motor coach","帮助":"assistance; aid","干净":"clean; neat","年级":"grade; year (in school, college etc)","广阔":"wide; vast","庆祝":"to celebrate","开始":"to begin; beginning","开学":"school term begins","开心":"to feel happy; to rejoice","开门":"to open a door; to open for business","弟弟":"younger brother","彩虹":"rainbow","很大":"very big","微笑":"smile; to smile","快乐":"happy; merry","怀疑":"to doubt; to suspect","怎么":"how?; what?","我也喜欢":"I like it too","我的":"my; mine","戴眼镜":"to wear glasses","手机":"cell phone; mobile phone","手脚":"hand and foot; movement of limbs","手表":"wrist watch","打扫":"to clean; to sweep","打篮球":"to play basketball","抱抱":"to hug; to embrace","挥手":"to wave (one's hand)","捉迷藏":"to play hide-and-seek","摇头":"to shake one's head","操心":"to worry about","支持":"to support","收拾":"to put in order; to tidy up","放下":"to lay down; to put down","放好":"to put away properly","放工":"to knock off work for the day","放开":"to let go; to release","放手":"to let go one's hold; to give up","救火车":"fire engine","教堂":"church; chapel","整天":"all day","文件":"document; file","文具":"stationery","文字":"character; script","斑马":"zebra","斑马线":"crosswalk; zebra crossing","新加坡":"Singapore","方便":"convenient; suitable","日期":"date","早晨":"early morning","早餐":"breakfast","时钟":"clock","时间":"time; period","明天":"tomorrow","明白":"clear; obvious","星星":"star in the sky","星期":"week; day of the week","昨天":"yesterday","晚上":"evening; night","晚餐":"evening meal; dinner","月亮":"the moon","朋友":"friend","服务":"to serve; service","本来":"originally; at first","来到":"to come; to arrive","来回":"back and forth; a round trip","果汁":"fruit juice","树木":"tree","树枝":"branch; twig","校园":"campus","桌椅":"tables and chairs; furniture","正反":"front and back; pros and cons","母亲":"mother","毛巾":"towel","毛球":"fuzzy ball; lint ball","气球":"balloon","水壶":"kettle; canteen","水果":"fruit","水池":"pond; pool","汗衫":"vest; undershirt","汽水":"soda; pop","泥土":"earth; soil","洗手":"to wash one's hands; to go to the toilet","洗澡":"to bathe; to take a shower","洗脸":"to wash your face","深夜":"very late at night","游乐场":"playground","游戏":"game; to play","游泳":"swimming; to swim","游泳池":"swimming pool","灵活":"nimble; flexible","炒香肠":"fried sausage","炸鸡":"fried chicken","点头":"to nod","热闹":"bustling with noise and excitement; lively","煮菜":"to cook (dishes)","熊猫":"panda","爪子":"(animal's) claw","爬山":"to climb a mountain; to mountaineer","父亲":"father","爷爷":"father's father; paternal grandfather","爸爸":"father","牙刷":"toothbrush","牙齿":"tooth; dental","牛奶":"cow's milk","狮子":"lion","玩具":"plaything; toy","现在":"now; at present","生日":"birthday","生活":"life; activity","电灯":"electric light","电话":"telephone; phone call","男孩":"boy","画画":"to draw; to paint","白米饭":"plain cooked white rice","皮鞋":"leather shoes","目的":"purpose; goal","看见":"to see; to catch sight of","眼睛":"eye","短裤":"short pants; shorts","礼物":"gift; present","禾苗":"rice seedling","紫色":"purple; violet (color)","纸巾":"paper towel; napkin","羊毛":"fleece; wool","美满":"happy; blissful","羡慕":"to admire; to envy","老师":"teacher","老虎":"tiger","耶稣":"Jesus","肉包子":"steamed meat bun","肚子":"belly; abdomen","肩膀":"shoulder","肮胀":"dirty; filthy","脖子":"neck","自己":"oneself; one's own","舅舅":"uncle (mother’s brother)","节日":"holiday; festival","花朵":"flower","花草":"flowers and plants","菜刀":"vegetable knife; kitchen knife","蓝天":"blue sky","虫子":"insect; bug","行李":"luggage","衣服":"clothes","袜子":"socks; stockings","西瓜":"watermelon","要不要":"do you want (it) or not","观看":"to watch; to view","观赏":"to admire; to enjoy looking at","读书":"to read a book; to study","谢谢":"to thank; thanks","豆腐":"tofu; bean curd","贝壳":"shell; conch","购物产":"shopping","起来":"to stand up; to get up","起码":"at the very least","起立":"to stand; Stand up!","足球":"soccer ball; a football","跌倒":"to trip and fall","跳舞":"to dance","踢足球":"to play football/soccer","身体":"the body; one's health","车俩":"car; vehicle","车站":"rail station; bus stop","还是":"or; still","进来":"to come in","里面":"inside; interior","野狗":"wild dog; feral dog","钓鱼":"to fish (with line and hook); to dupe","长短":"length","长裤":"trousers","长颈鹿":"giraffe","闹钟":"alarm clock","阿姨":"auntie","除了":"besides; apart from (... also...)","难过":"to feel sad; to feel unwell","需要":"to need; to want","静悄悄":"extremely quiet","面包":"bread","鞋子":"shoe","食物":"food","餐具":"tableware; dinner service","餐厅":"dining hall; dining room","饭店":"restaurant; hotel","饼干":"biscuit; cracker","首先":"first (of all); in the first place","香喷喷":"delicious; savory","马上":"at once; right away","马路":"street; road","骑马":"to ride a horse","高兴":"happy; glad","高大":"tall; lofty","鸟儿":"bird","鸡肉":"chicken (meat)","汽车":"car; automobile","烤香肠":"grilled sausage","参观学校":"to visit a school","国家":"country; nation","市区":"city area; downtown","打扫干净":"to sweep clean","跑步":"to jog; to run","发现":"to discover; to find out","东海岸":"east coast","风景优美":"beautiful scenery","到处都是":"to be everywhere","花草树木":"flowers and trees; greenery","经过":"to pass by","过来":"to come over","方块":"a square; a block","冰块":"ice cube","跟着":"to follow along","很多":"very many; a lot","布娃娃":"rag doll","青蛙":"frog","最好":"best","最后":"last; finally","取得":"to obtain; to achieve","图画":"a picture; a drawing","图片":"a picture; an image","冬天":"winter","更加努力":"to try even harder","跳绳":"to skip rope","跳高":"high jump","逃跑":"to run away; to flee","永远年轻":"forever young","运动":"exercise; sport","一百分":"full marks; 100 marks","白色":"the colour white","身体健康":"to be in good health","建造":"to build; to construct","吹泡泡":"to blow bubbles","喜欢":"to like","收到礼物":"to receive a present","补习":"tuition; extra lessons","听写":"spelling dictation","泻药":"laxative medicine","这些":"these","一些":"some; a few","从此":"from then on","宝贝":"treasure; darling","宝石":"gemstone","年岁":"age; years","岁数":"age (in years)","想出办法":"to think up a way","相信":"to believe","总是":"always","总结":"to sum up; a summary","忘记":"to forget","医生":"doctor","医院":"hospital","乱丢垃圾":"to litter","过去":"the past; to go past","夜晚":"night-time","做梦":"to dream","美梦":"a lovely dream","那里":"there","哪里":"where","觉得高兴":"to feel happy","很久以前":"a long time ago","剪刀":"scissors","相亲相爱":"to love one another dearly","解决难题":"to solve a hard problem","准备":"to prepare","轻易":"easily; lightly","容易":"easy","争吵不休":"to quarrel endlessly","应该":"should; ought to","立刻":"immediately","感到伤心":"to feel sad","知错能改":"to admit a mistake and mend it","分工合作":"to divide the work and cooperate","油炸":"to deep-fry","脸红":"to blush","笑脸":"a smiling face","捡拾":"to pick up","扁豆":"flat bean; lentil","扁担":"carrying pole","遍地":"all over the ground","苦瓜":"bitter gourd","南瓜":"pumpkin","比较高低":"to compare which is higher","就要":"about to; going to","吃惊":"to be startled","拔腿就跑":"to take to one's heels","拨打":"to dial (a number)","哇哇大哭":"to cry loudly; to wail","机器":"machine","黑夜":"dark night","思考问题":"to think over a problem","烤肉":"roast meat; barbecue","香甜可口":"sweet and tasty","舌头":"tongue","耳朵":"ear","下棋":"to play chess","搭乘巴士":"to take the bus","乖巧懂事":"well-behaved and sensible","积水":"pooled water","乌云密布":"dark clouds gathering","电器":"electrical appliance","许多":"many; a great deal","捏着鼻子":"to hold one's nose","拼图":"jigsaw puzzle","老鹰":"eagle","你追我跑":"you chase and I run","轻声说话":"to speak softly","救命":"help! save me!","生活幸福":"to live happily","实现愿望":"to make a wish come true","蛋糕":"cake","电影院":"cinema","门票":"entrance ticket","庆祝活动":"a celebration","奇怪":"strange; odd","睡觉":"to sleep","羽毛球":"badminton","聪明":"clever; bright","金色":"gold (colour)","漂亮":"pretty; beautiful","呕吐":"to vomit","宠物":"pet","欺负":"to bully","围观":"to crowd round and watch","认识朋友":"to get to know a friend","迎接":"to welcome; to greet","提醒":"to remind","粗心大意":"careless; not paying attention","仔细":"careful; attentive","争抢":"to scramble for; to grab","推倒":"to push over","讨厌":"to dislike; annoying","弄破书本":"to tear a book","捉弄同学":"to play tricks on a classmate","破坏公物":"to damage public property","横冲直撞":"to barge about recklessly","亮晶晶":"glittering; sparkling","明白道理":"to understand the reason","茄子":"aubergine; eggplant","豆芽":"bean sprout","大伯":"uncle (father's elder brother)","胡萝卜":"carrot","煮饭":"to cook rice; to cook a meal","老鼠":"mouse; rat","或者":"or","猪肉":"pork","牛肉":"beef","采摘瓜果":"to pick fruit","挖地洞":"to dig a hole in the ground","诚实":"honest","一张纸":"a sheet of paper","一张卡片":"a card","一支笔":"a pen","一只鸡":"a chicken","一只猫":"a cat","一只狗":"a dog","一只兔子":"a rabbit","一只小船":"a little boat","一根树枝":"a branch","一根绳子":"a rope","一根黄瓜":"a cucumber","一棵白菜":"a cabbage","一碗汤":"a bowl of soup","一粒玉米":"a kernel of corn","一片草地":"a stretch of grass","一头大象":"an elephant","一首歌":"a song","一座岛":"an island","一道彩虹":"a rainbow","一番话":"a remark; something said","一块石头":"a stone","一架飞机":"an aeroplane","远近":"far ↔ near","轻重":"light ↔ heavy","早晚":"early ↔ late","前后":"front ↔ back","爱恨":"love ↔ hate","粗细":"thick ↔ thin","推拉":"push ↔ pull","哭笑":"cry ↔ laugh","黑白":"black ↔ white","难易":"hard ↔ easy","先苦后甜":"bitter first ↔ sweet after","难过开心":"sad ↔ happy","争吵和好":"to quarrel ↔ to make up","争抢礼让":"to grab ↔ to give way","讨厌喜欢":"to dislike ↔ to like"};

/* ---------- STAT COMPUTATION ----------
   Locked formula: stat(level) = (rate/5) * level  + evolutionBonus + supplementBonus
   - rate is per-5-levels (unnerfed for owned monsters)
   - evolution bonus = one 5-level tier (= rate) per evolution stage reached
     (ASSUMPTION for twice-evolving mons: each evolution adds another +rate;
      flagged to user, easy to change here)
   - each protein supplement = one level's worth of a stat = rate/5
   ATK and HP share the same value in this design. */
function evolutionStage(species, level){
  const evo = SPECIES[species].evo || [];
  let stage = 0;
  for(const lv of evo){ if(level >= lv) stage++; }
  return stage;
}
/* A monster caught ABOVE its evolution thresholds shouldn't leap several forms
   at once. `evoFloor` pins the form it was caught in; it then climbs one stage
   per level gained until it catches up with its level. */
function monStageOf(m){
  const full = evolutionStage(m.species, m.level);
  if(m.evoFloor == null) return full;
  const gained = Math.max(0, m.level - (m.evoFloorLevel || m.level));
  return Math.max(0, Math.min(full, m.evoFloor + gained));
}
/* ---------- THE FOREST CROWN ----------
   A starter or elite is promoted to LEGENDARY growth (rate 13) and gains the
   legendary protein cap. A legendary can't be promoted further, so it gains
   three extra evolution stages' worth of stats instead — keeping crowned
   legendaries about 2.5 stages ahead of crowned starters.
   Requires: final evolution, protein maxed, level 65+. */
const CROWN_MIN_LEVEL = 60;
const CROWN_LEGENDARY_STAGES = 3;

function isCrowned(m){ return !!(m && m.crowned); }
function baseTier(species){ return (SPECIES[species]||{}).tier; }

/* ------------------------------------------------------------
   STOLEN CORES
   Monkey King, the Water Dragon, Thunder Newt — and the Whalelord to come —
   are legendaries running on a hole where their core should be. Until it is
   returned they are ELITE in every respect: elite growth rate AND the elite
   protein cap. The player can never crown them; the story does it, and the
   moment it does they become legendary in both at once.
   ------------------------------------------------------------ */
function coreStolen(m, fallbackSpecies){
  const sp = SPECIES[(m && m.species) || fallbackSpecies] || {};
  return !!sp.nerfedUntilCrowned && !isCrowned(m);
}
/* The tier a monster actually behaves as, once crowning is taken into account. */
function effectiveTier(m, fallbackSpecies){
  const t = baseTier((m && m.species) || fallbackSpecies);
  // a legendary without its core behaves as an elite, protein cap included
  if(coreStolen(m, fallbackSpecies)) return 'elite';
  if(isCrowned(m) && (t==='starter' || t==='elite' || t==='special')) return 'legendary';
  return t;
}
function effectiveRate(m){
  const sp = SPECIES[m.species];
  if(sp.nerfedUntilCrowned && !isCrowned(m)) return 11;   // diminished until the story restores him
  if(isCrowned(m) && effectiveTier(m)==='legendary' && sp.tier!=='legendary') return 13;
  return sp.rate;
}
/* Protein Supplement caps by tier — crowning raises the ceiling too. */
function proteinCap(species, mon){
  const t = mon ? effectiveTier(mon, species) : SPECIES[species].tier;
  return t==='legendary' ? 10 : (t==='elite' ? 8 : 6);
}
function atFinalEvolution(m){
  const evo = SPECIES[m.species].evo || [];
  return evo.length === 0 || m.level >= evo[evo.length-1];
}
function crownEligible(m){
  if(!m || isSeed(m) || isEgg(m) || isCrowned(m)) return false;
  if(SPECIES[m.species].storyCrownOnly) return false;   // his crown is a story beat, not a purchase
  if(m.level < CROWN_MIN_LEVEL) return false;
  if(!atFinalEvolution(m)) return false;
  return (m.supplements||0) >= proteinCap(m.species, m);
}
function crownBlockReason(m){
  if(isCrowned(m)) return 'Already crowned.';
  if(SPECIES[m.species].storyCrownOnly) return 'His crown must be recovered, not bought.';
  if(!atFinalEvolution(m)) return 'Must be in its final evolution.';
  if(m.level < CROWN_MIN_LEVEL) return `Must be at least level ${CROWN_MIN_LEVEL}.`;
  if((m.supplements||0) < proteinCap(m.species, m)) return 'Protein must be maxed first.';
  return '';
}
/* The FINAL supplement counts TRIPLE, so filling the bar is worth chasing
   rather than stopping partway:
     normal    5 + (3) =  8 levels' worth of stats
     elite     7 + (3) = 10
     legendary 9 + (3) = 12                                          */
function effectiveSupplements(species, supplements, mon){
  const n = supplements||0;
  return n >= proteinCap(species, mon) ? n + 2 : n;
}
/* From level 31, HP (not ATK) scales up so fights last longer as moves get
   stronger — otherwise high-tier skills one-shot everything. Piecewise linear,
   anchored every ten levels; the final band jumps to 3.0 rather than 2.75. */
const HP_SCALE_ANCHORS = [[30,1.00],[40,1.25],[50,1.50],[60,1.75],[70,2.00],[80,2.25],[90,2.50],[100,3.00]];
function hpScale(level){
  if(level <= 30) return 1;
  for(let i=1;i<HP_SCALE_ANCHORS.length;i++){
    const [l0,m0] = HP_SCALE_ANCHORS[i-1], [l1,m1] = HP_SCALE_ANCHORS[i];
    if(level <= l1) return m0 + (level-l0)*(m1-m0)/(l1-l0);
  }
  return HP_SCALE_ANCHORS[HP_SCALE_ANCHORS.length-1][1];
}
/* ATK is the raw stat; HP is that stat with the level scaling applied. */
function computeMaxHp(species, level, supplements, mon){
  const sp = SPECIES[species];
  if(sp && (sp.isSeed || sp.isEgg || sp.isBaby)) return 1;   // passengers are always 1 HP
  return Math.ceil(computeMaxStat(species, level, supplements, mon) * hpScale(level));
}

function computeMaxStat(species, level, supplements, mon){
  const s = SPECIES[species];
  const crowned = mon && mon.crowned;
  let rate = (crowned && s.tier!=='legendary') ? 13 : s.rate;
  if(s.nerfedUntilCrowned && !crowned) rate = 11;   // Monkey King without his crown
  let stat = Math.ceil((rate/5) * level);
  const stages = evolutionStage(species, level) + (s.bonusStages||0);
  stat += Math.ceil(stages * rate * (s.evoMult||1));
  /* A crowned legendary can't change tier, so it deepens instead. These stages
     are added at FLAT rate — they are already "three evolutions' worth", so
     applying evoMult on top would double-count and overshoot. */
  if(crowned && s.tier==='legendary') stat += CROWN_LEGENDARY_STAGES * rate;
  stat += Math.ceil((rate/5) * effectiveSupplements(species, supplements, mon));
  return stat;
}

/* ---------- CLOUD SYNC (Firebase) ----------
   The cloud is the SOURCE OF TRUTH. On boot, every device signs in anonymously
   (no login screen — one silent identity per device) and pulls its saved
   profiles, overwriting whatever's cached locally. localStorage from here on
   is just a fast offline cache, not the record of truth — so editing it by
   hand in dev tools stops sticking the moment the next sync happens.

   Anonymous auth ties the cloud identity to THIS BROWSER's local storage. If
   that's ever cleared, the link is lost even though the cloud data survives —
   the JSON backup file remains the manual safety net for that case. */
const firebaseConfig = {
  apiKey: "AIzaSyBEg78ygTrSF7RPnfxrjcZ_Bg_2DQ4FrD0",
  authDomain: "b0kemon.firebaseapp.com",
  projectId: "b0kemon",
  storageBucket: "b0kemon.firebasestorage.app",
  messagingSenderId: "91724853668",
  appId: "1:91724853668:web:6d22831d0da10717189131"
};
const CLOUD_COLLECTION = 'saves';
let cloudUid = null;
let cloudReady = false;

async function initCloud(){
  try{
    if(typeof firebase === 'undefined') return; // CDN blocked/offline — game still works locally
    firebase.initializeApp(firebaseConfig);
    await new Promise((resolve)=>{
      let settled = false;
      const done = ()=>{ if(!settled){ settled = true; resolve(); } };
      firebase.auth().onAuthStateChanged(user=>{
        if(user){ cloudUid = user.uid; cloudReady = true; done(); }
      });
      firebase.auth().signInAnonymously().catch(()=> done());
      setTimeout(done, 4000); // never block boot indefinitely if the network is down
    });
  }catch(e){ cloudReady = false; }
}
function cloudDocRef(){
  if(!cloudReady || !cloudUid) return null;
  try{ return firebase.firestore().collection(CLOUD_COLLECTION).doc(cloudUid); }
  catch(e){ return null; }
}

/* Pull every profile this device's identity owns, overwriting local caches.
   Returns true only if real cloud data was found and applied. */
async function cloudPullAll(){
  const ref = cloudDocRef();
  if(!ref) return false;
  try{
    const snap = await ref.get();
    if(!snap.exists) return false;
    const data = snap.data() || {};
    const profiles = data.profiles || {};
    const idx = [];
    for(const pid in profiles){
      const p = normalizeProfile(profiles[pid]);
      await store.set(profileStorageKey(pid), JSON.stringify(p));
      idx.push({ id:p.id, name:p.name, starterSpecies:p.starterSpecies, avatar:p.avatar||null, isDev:!!p.isDev, isDev:!!p.isDev, level:(p.party[0]?p.party[0].level:1), updatedAt:p.updatedAt||Date.now() });
    }
    if(idx.length){ await saveProfileIndex(idx); }
    if(data.lastProfile){ try{ await store.set(LAST_PROFILE_KEY, data.lastProfile); }catch(e){} }
    return idx.length > 0;
  }catch(e){ return false; }
}

/* Firestore rejects `undefined` anywhere in a document, and a single stray one
   fails the whole write. A JSON round-trip drops them safely. */
function sanitizeForCloud(obj){
  try{ return JSON.parse(JSON.stringify(obj)); }catch(e){ return null; }
}

/* Push one profile up.
   NOTE: uses a NESTED object, not a dotted key. Firestore's set() treats a key
   containing dots as a literal field name — only update() parses dot-paths —
   so `{'profiles.p1': …}` would create a field called "profiles.p1" that
   cloudPullAll could never read. set() with merge:true deep-merges nested maps,
   so writing {profiles:{[id]:p}} updates only this profile and leaves siblings
   (e.g. a second child on the same iPad) untouched. */
async function cloudPushProfile(p){
  const ref = cloudDocRef();
  if(!ref) return false;
  try{
    p.updatedAt = Date.now();
    const clean = sanitizeForCloud(p);
    if(!clean) return false;
    await ref.set({
      profiles: { [p.id]: clean },
      lastProfile: p.id,
      updatedAt: Date.now(),
    }, { merge:true });
    return true;
  }catch(e){ return false; }
}

/* Background saves happen constantly during battle (every hit, every HP tick).
   Pushing each one would burn the free write quota and add pointless latency,
   so ordinary saves are coalesced into one write every few seconds, with a
   flush when the page is hidden or closed. Economy actions bypass this and
   commit immediately (see saveProfile's awaitCloud option). */
const CLOUD_PUSH_INTERVAL = 6000;
let _cloudPushTimer = null;
let _cloudPushPending = false;

function scheduleCloudPush(){
  _cloudPushPending = true;
  if(_cloudPushTimer) return;
  _cloudPushTimer = setTimeout(async ()=>{
    _cloudPushTimer = null;
    if(!_cloudPushPending || !state) return;
    _cloudPushPending = false;
    await cloudPushProfile(state);
  }, CLOUD_PUSH_INTERVAL);
}
async function flushCloudPush(){
  if(_cloudPushTimer){ clearTimeout(_cloudPushTimer); _cloudPushTimer = null; }
  if(_cloudPushPending && state){
    _cloudPushPending = false;
    await cloudPushProfile(state);
  }
}
try{
  document.addEventListener('visibilitychange', ()=>{
    if(!document.hidden) setTimeout(unstickBattle, 400); if(document.visibilityState==='hidden') flushCloudPush(); });
  window.addEventListener('pagehide', flushCloudPush);
}catch(e){}

/* ---------- SAVE MODEL ----------
   Uses the browser's own localStorage, so saves work anywhere the game is
   hosted (not just inside claude.ai). Wrapped in the same async get/set shape
   as before, so nothing else in the code had to change. */
const store = {
  async get(key){
    try{ const v = localStorage.getItem(key); return v ? { value: v } : null; }
    catch(e){ return null; }
  },
  async set(key, value){
    try{ localStorage.setItem(key, value); return true; }
    catch(e){ return null; } // e.g. storage full or blocked (private browsing)
  },
};
const PROFILE_INDEX_KEY = 'wc_profile_index';  // lightweight list for the picker screen
const LAST_PROFILE_KEY  = 'wc_last_profile';    // id of the profile to auto-continue as
function profileStorageKey(id){ return 'wc_profile_'+id; }

let state = null;      // the live profile object
let ui = { screen:'boot', drawerOpen:false };

function newProfileId(){ return 'p'+Date.now()+Math.floor(Math.random()*10000); }

function newMonster(species, level){
  return {
    uid: 'm'+Date.now()+Math.floor(Math.random()*1000),
    species,
    nickname:null,
    level,
    xpFights:0,
    supplements:0,
    currentHp: computeMaxHp(species, level, 0),
    renamedInRegion:null,
  };
}

function blankProfile(name, starterSpecies){
  const starter = newMonster(starterSpecies, 5);
  return {
    id: newProfileId(),
    name,
    starterSpecies,
    avatar: null,
    party:[starter],
    storage:[],
    caughtSpecies:[starterSpecies],
    encounteredSpecies:[starterSpecies],
    inventory:{ protein:0, strangeKey:false, tokens:0, eliteTokens:0 },
    moveStones:[],
    /* Mastery: how many times each phrase has been completed in a SCORED
       context (battle / catch / recovery). Practice never counts. */
    wordMastery:{},
    masteryAwarded:{ bronze:0, silver:0, gold:0 },   // 10-word milestones already paid out
    medals:{ bronze:0, silver:0, gold:0 },
    progress:{
      currentRegion:1,
      region1:{ guardianCleared:false, rivalCleared:false, thugsCleared:[], thugBossCleared:false, investigateProtein:0, dojoCleared:[] },
      region3:{ monkeyMet:false, monkeyChoice:null, plantIntro:false, helped:{}, helpCount:0,
                powerStone:false, powerStoneUsed:false, engineerDone:0 },
      region2:{ courage:0, trialDone:false, seedGranted:false, challengeDone:false, rivalCleared:false, waterDojo:[], paths:{}, uniform:false, password:false, cavernDone:false },
    },
    settings:{ volume:0.8, sfxVolume:0.55, musicVolume:0.10, focusMode:false, password:null, xpMode:'default', leftHanded:false, leniency:1.0, eyeBreakEvery:10, eyeBreakMins:5 },
    recentWrong:[],
    /* Each son's own checkmarks against the SHARED word list (see the Word List
       Module below). Keyed by word text. A word with no entry here defaults to
       {priority:false, regular:true} — i.e. new shared words start active for
       everyone, matching how "Add words" always worked before profiles split. */
    wordFlags:{},
    createdAt: Date.now(),
  };
}

/* ---------- Profile index (the picker list) ---------- */
async function loadProfileIndex(){
  try{ const r = await store.get(PROFILE_INDEX_KEY); return r ? JSON.parse(r.value) : []; }
  catch(e){ return []; }
}
async function saveProfileIndex(idx){
  try{ await store.set(PROFILE_INDEX_KEY, JSON.stringify(idx)); }catch(e){}
}
async function upsertProfileIndexEntry(p){
  const idx = await loadProfileIndex();
  const entry = { id:p.id, name:p.name, starterSpecies:p.starterSpecies, avatar:p.avatar||null, isDev:!!p.isDev, isDev:!!p.isDev, level:(p.party[0]?p.party[0].level:1), updatedAt:Date.now() };
  const i = idx.findIndex(e=>e.id===p.id);
  if(i>=0) idx[i]=entry; else idx.push(entry);
  await saveProfileIndex(idx);
}

/* opts.awaitCloud: true blocks until the cloud write is confirmed, and
   returns false on failure — used only for "economy" actions (spins, shop,
   recycle, spending currency) where a reload-before-sync could be exploited
   to keep a result while getting the cost back. Everything else fires the
   cloud write in the background so ordinary play never waits on network. */
async function saveProfile(opts){
  if(!state) return true;
  opts = opts || {};
  try{ await store.set(profileStorageKey(state.id), JSON.stringify(state)); }catch(e){}
  await upsertProfileIndexEntry(state);
  try{ await store.set(LAST_PROFILE_KEY, state.id); }catch(e){}
  if(opts.awaitCloud){
    if(_cloudPushTimer){ clearTimeout(_cloudPushTimer); _cloudPushTimer = null; }
    _cloudPushPending = false;
    return await cloudPushProfile(state);
  }
  scheduleCloudPush();   // coalesced background write
  return true;
}
async function loadProfileById(id){
  try{
    const r = await store.get(profileStorageKey(id));
    if(!r) return null;
    const p = normalizeProfile(JSON.parse(r.value));
    const prev = state; state = p;
    if(p._needsMasteryReconcile){ delete p._needsMasteryReconcile; reconcileMastery(); }
    state = prev;
    return p;
  }catch(e){ return null; }
}
async function createAndSaveProfile(name, starterSpecies){
  const p = blankProfile(name, starterSpecies);
  state = p;
  await saveProfile();
  return p;
}

/* ---------- One-time migration from the old single-profile save ---------- */
const LEGACY_SAVE_KEY = 'wc_profile';
async function migrateLegacyProfile(){
  try{
    const r = await store.get(LEGACY_SAVE_KEY);
    if(!r) return null;
    const p = normalizeProfile(JSON.parse(r.value));
    if(!p.id) p.id = newProfileId();
  if(p.avatar===undefined) p.avatar = null;   // older saves: prompt to choose
    // legacy saves had priority/regular baked into the shared wordlist itself —
    // carry those over as THIS profile's own flags before the shared list is
    // flattened to plain text (see loadWordlist's own legacy path too).
    state = p;
    await saveProfile();
    return p;
  }catch(e){ return null; }
}

/* One-time corrections applied to a profile. Called whenever a profile is
   loaded — at boot OR from the picker. Doing this only in boot() meant anyone
   who chose a profile by hand never got their back-payments. */
async function runProfileMigrations(){
  if(!state) return;
  let changed = false;

  // Skill Tokens now come TWO per Bronze Medal; settle the difference once.
  if(!state._tokenRateToppedUp){
    state._tokenRateToppedUp = true;
    const earned = (state.masteryAwarded && state.masteryAwarded.bronze || 0)
                 + (state.overmasteryAwarded && state.overmasteryAwarded.bronze || 0);
    const spent = Math.max(0, earned - (state.medals.bronze||0));
    if(spent > 0){
      state.inventory.tokens = (state.inventory.tokens||0) + spent;
      setTimeout(()=>toast(`🎟️ ${spent} extra Skill Tokens — Bronze now buys two apiece.`), 2600);
    }
    changed = true;
  }
  // The earlier 3-Bronze-per-token era: two thirds of that spend came back.
  if(!state._bronzeRefunded){
    state._bronzeRefunded = true;
    const earned = (state.masteryAwarded && state.masteryAwarded.bronze || 0)
                 + (state.overmasteryAwarded && state.overmasteryAwarded.bronze || 0);
    const spent = Math.max(0, earned - (state.medals.bronze||0));
    const refund = Math.round(spent * 2/3);
    if(refund > 0){
      state.medals.bronze = (state.medals.bronze||0) + refund;
      setTimeout(()=>toast(`🥉 ${refund} Bronze Medals refunded from the old token price.`), 3600);
    }
    changed = true;
  }
  if(changed) await saveProfile();
}

function normalizeProfile(p){
  // backfill fields introduced in later phases so older saves keep working
  if(!p.id) p.id = newProfileId();
  p.wordFlags = p.wordFlags || {};
  p.storage = p.storage || [];
  p.caughtSpecies = p.caughtSpecies || [];
  p.encounteredSpecies = p.encounteredSpecies || [];
  p.recentWrong = p.recentWrong || [];
  p.inventory = p.inventory || {};
  if(p.inventory.dragonStone===undefined)   p.inventory.dragonStone = false;
  if(p.inventory.electricStone===undefined) p.inventory.electricStone = false;
  if(p.inventory.electricStoneOn===undefined) p.inventory.electricStoneOn = null;
  if(p.inventory.dragonStoneOn===undefined) p.inventory.dragonStoneOn = null;
  if(p.inventory.protein===undefined) p.inventory.protein = 0;
  if(p.inventory.strangeKey===undefined) p.inventory.strangeKey = false;
  if(p.inventory.tokens===undefined) p.inventory.tokens = 0;
  if(p.inventory.eliteTokens===undefined) p.inventory.eliteTokens = 0;
  p.wordMastery = p.wordMastery || {};
  p.wordAttempts = p.wordAttempts || {};
  p.daily = p.daily || { day:null, count:0, step:0, done:false };
  p.dailyWeeks = p.dailyWeeks || [];   // a record of every completed six-day cycle
  p.isDev = !!p.isDev;
  // passengers always sit at exactly 1 HP; a stray 0 makes them look fainted
  (p.party||[]).forEach(m=>{ const sp=SPECIES[m.species]; if(sp && (sp.isSeed||sp.isEgg)) m.currentHp = 1; });
  p.masteryAwarded = p.masteryAwarded || {};
  ['bronze','silver','gold'].forEach(k=>{ if(p.masteryAwarded[k]===undefined) p.masteryAwarded[k] = 0; });
  p.overmasteryAwarded = p.overmasteryAwarded || { bronze:0, silver:0, gold:0 };
  p.medals = p.medals || {};
  ['bronze','silver','gold'].forEach(k=>{ if(p.medals[k]===undefined) p.medals[k] = 0; });
  p._needsMasteryReconcile = true;
  if(!Array.isArray(p.settings.wordLists)) p.settings.wordLists = null;   // null = all lists
  if(p.lanternGranted===undefined) p.lanternGranted = false;
  p._needsLanternCheck = true;
  /* One-time repair. Earlier builds grew current HP by the unscaled stat delta,
     so monsters sat permanently below their real maximum — it looked like
     something was quietly damaging the party. Anyone at or above the old
     unscaled figure was actually at full, so top them up. */
  if(!p._hpRepaired){
    p._hpRepaired = true;
    (p.party||[]).concat(p.storage||[]).forEach(m=>{
      const sp = SPECIES[m.species];
      if(!sp || sp.isSeed || sp.isEgg) return;
      const raw = computeMaxStat(m.species, m.level, m.supplements, m);
      const max = computeMaxHp(m.species, m.level, m.supplements, m);
      if(m.currentHp >= raw && m.currentHp < max) m.currentHp = max;
      if(m.currentHp > max) m.currentHp = max;
    });
  }
  p.moveStones = p.moveStones || [];
  /* Giga Drain became the Forest Guardian's signature move; the Grass Very High
     stone is now Leech Seed. Rename anything already owned or equipped so old
     saves don't keep a move that no longer exists. */
  const renameStone = (st)=>{
    if(st && st.tier==='veryhigh' && st.type==='Grass' && st.name==='Giga Drain') st.name = 'Leech Seed';
    return st;
  };
  p.moveStones.forEach(renameStone);
  (p.party||[]).concat(p.storage||[]).forEach(m=>{
    if(m.equippedStone) renameStone(m.equippedStone);
    if(m.ultraStone)    renameStone(m.ultraStone);
  });
  p.progress = p.progress || { currentRegion:1 };
  const r1 = p.progress.region1 = p.progress.region1 || {};
  r1.guardianCleared = !!r1.guardianCleared;
  r1.rivalCleared = !!r1.rivalCleared;
  r1.thugsCleared = r1.thugsCleared || [];
  r1.dojoCleared = r1.dojoCleared || [];
  r1.thugBossCleared = !!r1.thugBossCleared;
  r1.investigateProtein = r1.investigateProtein || 0;
  const r2 = p.progress.region2 = p.progress.region2 || {};
  r2.courage = r2.courage || 0;
  r2.trialDone = !!r2.trialDone;
  r2.seedGranted = !!r2.seedGranted;
  r2.challengeDone = !!r2.challengeDone;
  r2.rivalCleared = !!r2.rivalCleared;
  r2.paths = r2.paths || {};
  r2.uniform = !!r2.uniform;
  r2.password = !!r2.password;
  r2.cavernDone = !!r2.cavernDone;
  r2.eggGranted = !!r2.eggGranted;
  r2.crownGranted = !!r2.crownGranted;
  const r3 = p.progress.region3 = p.progress.region3 || {};
  r3.monkeyMet = !!r3.monkeyMet;
  r3.plantIntro = !!r3.plantIntro;
  r3.helped = r3.helped || {};
  r3.helpCount = r3.helpCount || 0;
  r3.powerStone = !!r3.powerStone;
  r3.powerStoneUsed = !!r3.powerStoneUsed;
  r3.engineerDone = r3.engineerDone || 0;
  r3.ankylo = r3.ankylo || { refusals:0, agreed:false, seen:false };
  r3.vaneShearSeen = !!r3.vaneShearSeen;
  r3.dojoOpen = !!r3.dojoOpen;
  r3.concert = r3.concert || { seen:false, sailors:[], bandCleared:false, stage:0 };
  r3.concert.failstars = r3.concert.failstars || [];
  r3.concert.figlio = !!r3.concert.figlio;
  r3.shipPass = !!r3.shipPass;
  p._needsEggDedupe = true;
  /* Skill Tokens used to cost 3 Bronze; they now cost 1. Refund two-thirds of
     everything already spent so nobody is punished for buying early. */


  r2.waterDojo = r2.waterDojo || [];
  p.settings = p.settings || {};
  if(p.settings.volume===undefined) p.settings.volume = 0.8;
  if(p.settings.focusMode===undefined) p.settings.focusMode = false;
  if(p.settings.password===undefined) p.settings.password = null;
  if(!XP_MODES[p.settings.xpMode]) p.settings.xpMode = 'default';
  if(p.settings.leftHanded===undefined) p.settings.leftHanded = false;
  if(p.settings.leniency===undefined) p.settings.leniency = 1.0;
  if(p.settings.eyeBreakEvery===undefined) p.settings.eyeBreakEvery = 10;
  if(p.settings.eyeBreakMins===undefined) p.settings.eyeBreakMins = 5;
  if(p.battlesSinceBreak===undefined) p.battlesSinceBreak = 0;
  if(p.eyeBreakUntil===undefined) p.eyeBreakUntil = 0;
  if(p.settings.sfxVolume===undefined) p.settings.sfxVolume = 0.55;
  if(p.settings.musicVolume===undefined) p.settings.musicVolume = 0.10;
  return p;
}
function recordWrong(word){
  if(!state) return;
  state.recentWrong = (state.recentWrong||[]).filter(w=>w!==word);
  state.recentWrong.unshift(word);
  if(state.recentWrong.length>60) state.recentWrong.length = 60;
}

/* ---------- helpers ---------- */
const $ = (sel)=>document.querySelector(sel);
const screenEl = $('#screen');

function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._h);
  toast._h = setTimeout(()=>t.classList.remove('show'), 2000);
}

/* reusable yes/no confirmation modal */
function confirmDialog(message, onYes){
  const scrim = document.createElement('div');
  scrim.style.cssText = 'position:fixed;inset:0;background:rgba(35,32,25,0.55);z-index:70;display:flex;align-items:center;justify-content:center;padding:24px;';
  scrim.innerHTML = `
    <div style="background:var(--paper);border-radius:18px;padding:22px;max-width:340px;width:100%;box-shadow:0 12px 40px var(--shadow);">
      <div style="font-family:'Baloo 2',cursive;font-weight:700;font-size:17px;margin-bottom:16px;line-height:1.35;">${escapeHtml(message)}</div>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-ghost" id="cdNo" style="flex:1;">Cancel</button>
        <button class="btn btn-primary" id="cdYes" style="flex:1;">Delete</button>
      </div>
    </div>`;
  document.body.appendChild(scrim);
  const close = ()=>document.body.removeChild(scrim);
  scrim.querySelector('#cdNo').addEventListener('click', close);
  scrim.addEventListener('click', e=>{ if(e.target===scrim) close(); });
  scrim.querySelector('#cdYes').addEventListener('click', ()=>{ close(); onYes(); });
}

/* Sprite lookup with a three-step fallback chain, so art can be added piecemeal:
     1. assets/mon/<species>_back.png   (player side — rear view, facing away)
        assets/mon/<species>_front.png  (enemy side — facing the player)
     2. assets/mon/<species>.png        (generic, used everywhere else)
     3. the coloured placeholder tile   (nothing uploaded yet)
   `view` is 'back' | 'front' | 'icon'. `breathe` is 'normal' | 'weak' | null. */
function monPortrait(species, size, opts){
  opts = opts || {};
  const s = SPECIES[species];
  const px = size||76;
  const view = opts.view || 'icon';
  const stage = opts.stage || 0;              // 0 = base form, 1 = first evolution, 2 = second
  const radius = Math.round(px*0.21);
  const cls = 'mon-portrait mon-sprite'
    + (opts.breathe ? ' breathe-'+opts.breathe : '')
    + (opts.crowned ? ' crowned-aura' : '');
  const crowned = !!opts.crowned;
  const override = (typeof ASSETS!=='undefined' && ASSETS.sprites)
    ? (ASSETS.sprites[spriteKey(species,stage,crowned)+'_'+view] || ASSETS.sprites[spriteKey(species,stage,crowned)]) : null;
  // the icon view starts at _front, so only _front and _back need supplying
  const cacheKey = spriteCacheKey(species, stage, view, crowned);
  const cached = spriteResolved[cacheKey];
  const primary = override
    || (cached !== undefined && cached !== null ? cached
        : spritePath(species, stage, view==='icon' ? 'front' : view, crowned));
  // hidden until it actually loads, so a 404 never flashes a broken image
  const startHidden = (cached === undefined);
  const bg = opts.bare ? 'transparent' : s.color;
  const wrapOpen  = opts.crowned ? `<span class="crowned-wrap" style="width:${px}px;height:${px}px;">${crownSparkles(px)}` : '';
  const wrapClose = opts.crowned ? '</span>' : '';
  return wrapOpen + `<img src="${primary}" alt="${escapeHtml(s.name)}" class="${cls}"
    data-species="${species}" data-px="${px}" data-view="${view}" data-stage-n="${stage}" data-crowned="${crowned?1:0}" data-try="0"
    style="width:${px}px;height:${px}px;border-radius:${radius}px;object-fit:contain;background:${bg};${startHidden?'visibility:hidden;':''}"
    onload="spriteLoaded(this)" onerror="spriteFallback(this)">` + wrapClose;
}

/* Rising motes for a crowned monster — the same idea as the Ultra button,
   sized down and gold. */
/* `px` is the sprite's rendered size, so the motes can be told in PIXELS how
   far to climb — a percentage would be measured against the mote itself. */
function crownSparkles(px){
  const h = px || 96;
  let out = '<span class="crown-fizz">';
  for(let i=0;i<16;i++){
    const near = Math.random();                 // 0 = far/small/slow, 1 = near/big/fast
    const size = 2 + near*5;
    const rise = h * (0.85 + near*0.45);        // clears the top of the sprite
    const drift = (Math.random()*10 - 5).toFixed(1);
    const tw = Math.random() < 0.35 ? ' tw' : '';
    out += `<i class="${tw.trim()}" style="left:${6+Math.random()*88}%;`
         + `width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;`
         + `--rise:${rise.toFixed(0)}px;--drift:${drift}px;`
         + `opacity:${(0.5+near*0.5).toFixed(2)};`
         + `animation-duration:${(3.4-near*1.5).toFixed(2)}s;`
         + `animation-delay:${(Math.random()*3.4).toFixed(2)}s;"></i>`;
  }
  return out + '</span>';
}

/* Evolution stages get a number appended to the species id:
     water_starter        base form
     water_starter1       first evolution
     water_starter2       second evolution
   combined with the view suffix, e.g. water_starter1_front.png */
function spriteKey(species, stage, crowned){
  return species + (stage ? String(stage) : '') + (crowned ? '_c' : '');
}
function spritePath(species, stage, view, crowned){
  const key = spriteKey(species, stage, crowned);
  return 'assets/mon/' + key + (view && view!=='icon' ? '_'+view : '') + '.png';
}
/* Convenience: the sprite stage a given owned monster is currently at. */
function monStage(m){ return monStageOf(m); }

/* The Sacred Seed rides along in a seventh slot: it levels, but it cannot
   fight, be switched to, be taught skills, or take protein — and it never
   counts toward winning or losing a battle. */
function isSeed(m){ return !!(m && SPECIES[m.species] && SPECIES[m.species].isSeed); }
function isEgg(m){ return !!(m && SPECIES[m.species] && SPECIES[m.species].isEgg); }
function isBaby(m){ return !!(m && SPECIES[m.species] && SPECIES[m.species].isBaby); }
function isPassenger(m){ return isSeed(m) || isEgg(m) || isBaby(m); }
function battleParty(){ return state.party.filter(m=>!isPassenger(m)); }
function hasSeed(){ return state.party.some(isSeed); }
function grantSacredSeed(){
  if(hasSeed()) return null;
  const seed = newMonster('sacred_seed', 1);
  seed.currentHp = 1;
  state.party.push(seed);            // occupies the extra 7th slot
  if(!state.caughtSpecies.includes('sacred_seed')) state.caughtSpecies.push('sacred_seed');
  if(!state.encounteredSpecies.includes('sacred_seed')) state.encounteredSpecies.push('sacred_seed');
  return seed;
}

/* Fallback ladder, tried in order until one loads:
     stage+view  ->  stage generic  ->  lower stage+view  ->  ... ->  base
     ->  coloured placeholder tile
   So an unevolved sprite stands in for a missing evolved one rather than
   breaking, and art can be added one stage at a time. */
/* Once a sprite path resolves, remember it. Forest Fairy and the Water Dragon
   are declared at stage 1 but their art lives at the base name, so EVERY render
   walked the 404 ladder again — and each failed attempt flashed the browser's
   broken-image placeholder. Caching plus hide-until-loaded removes both. */
const spriteResolved = {};
function spriteCacheKey(species, stage, view, crowned){
  return species+'|'+stage+'|'+view+'|'+(crowned?1:0);
}

function spriteLoaded(img){
  try{
    const key = spriteCacheKey(img.dataset.species, +(img.dataset.stageN||0),
                               img.dataset.view||'icon', img.dataset.crowned==='1');
    spriteResolved[key] = img.getAttribute('src');
    img.style.visibility = 'visible';
  }catch(e){}
}

function spriteFallback(img){
  try{
    const species = img.dataset.species;
    const view = img.dataset.view || 'icon';
    let stage = +(img.dataset.stageN||0);
    let attempt = +(img.dataset.try||0);

    /* Fallback ladder. Note the icon view tries <species>_front FIRST, so you
       only ever need to supply _front and _back — a separate <species>.png is
       an optional override, not a requirement. */
    const crowned = img.dataset.crowned === '1';
    const chain = [];
    const views = view === 'icon' ? ['front','icon'] : [view, 'front', 'icon'];
    for(const cr of (crowned ? [true,false] : [false])){
      for(let st = stage; st >= 0; st--){
        for(const v of views) chain.push(spritePath(species, st, v==='icon'?'icon':v, cr));
      }
    }
    attempt++;
    img.dataset.try = String(attempt);
    if(attempt < chain.length){ img.src = chain[attempt]; return; }
    // nothing in the ladder exists — remember that too, and draw the tile
    spriteResolved[spriteCacheKey(species, stage, view, crowned)] = null;
    img.outerHTML = monPortraitFallback(species, +img.dataset.px);
  }catch(e){}
}
function monPortraitFallback(species, px){
  const s = SPECIES[species];
  if(!s) return '';
  const fs = Math.round(px*0.4);
  const radius = Math.round(px*0.21);
  return `<div class="mon-portrait" style="width:${px}px;height:${px}px;background:${s.color};font-size:${fs}px;border-radius:${radius}px;">${s.glyph}</div>`;
}

/* NPC trainer portraits: assets/npc/<id>.png, falling back to the emoji badge. */
function npcPortrait(npcId, emoji, size, bg){
  const px = size||50;
  if(!npcId) return `<div class="cc-emoji" style="background:${bg||'var(--paper-3)'};width:${px}px;height:${px}px;font-size:${Math.round(px*0.52)}px;">${emoji||'❓'}</div>`;
  return `<img src="assets/npc/${npcId}.png" alt="" class="npc-portrait"
    data-emoji="${escapeHtml(emoji||'❓')}" data-px="${px}" data-bg="${bg||'var(--paper-3)'}"
    style="width:${px}px;height:${px}px;border-radius:13px;object-fit:contain;background:${bg||'var(--paper-3)'};"
    onerror="npcFallback(this)">`;
}
function npcFallback(img){
  try{
    const px = +img.dataset.px, emoji = img.dataset.emoji, bg = img.dataset.bg;
    img.outerHTML = `<div class="cc-emoji" style="background:${bg};width:${px}px;height:${px}px;font-size:${Math.round(px*0.52)}px;">${emoji}</div>`;
  }catch(e){}
}
function typeBadges(species){
  return SPECIES[species].types.map(t =>
    `<span class="type-badge" style="background:${TYPE_COLORS[t]||'#888'}">${t}</span>`
  ).join(' ');
}
/* The ✦ marks a crowned monster without ever touching its nickname. */
function crownMark(m){ return isCrowned(m) ? crownIcon(15, 'crown-mark') : ''; }
/* assets/ui/crown.png, glowing; falls back to the emoji until art exists. */
/* assets/ui/skill_token.png, with the old emoji as a fallback. */
function tokenIcon(px){
  px = px || 18;
  return `<img src="assets/ui/skill_token.png" alt="" class="ui-icon" style="width:${px}px;height:${px}px;"
    onerror="this.outerHTML='🎫'">`;
}
/* Any file in assets/ui/ can be dropped in by name; the emoji is the fallback. */
function uiIcon(name, px, fallback){
  px = px || 20;
  return `<img src="assets/ui/${name}.png" alt="" class="ui-icon" style="width:${px}px;height:${px}px;"
    onerror="this.outerHTML='${fallback||'❔'}'">`;
}
function voidIcon(px){
  px = px || 20;
  return `<img src="assets/ui/void_stone.png" alt="" class="ui-icon" style="width:${px}px;height:${px}px;"
    onerror="this.outerHTML='🕳️'">`;
}
function crownIcon(px, cls){
  px = px || 20;
  return `<img src="assets/ui/crown.png" alt="Crown" class="crown-icon ${cls||''}"
    style="width:${px}px;height:${px}px;" data-px="${px}" data-cls="${cls||''}"
    onerror="crownIconFallback(this)">`;
}
/* Kept as a named function: the previous inline handler nested three levels of
   quotes and produced invalid markup. */
function crownIconFallback(img){
  try{
    const px = +img.dataset.px || 20;
    const cls = img.dataset.cls || '';
    img.outerHTML = `<span class="crown-icon-fb ${cls}" style="font-size:${px}px;">👑</span>`;
  }catch(e){}
}
function displayName(mon){
  return mon.nickname || SPECIES[mon.species].name;
}

/* ---------- WORD LIST MODULE ----------
   THREE layers combine into the shared family vocabulary:
     1. remoteWords  — fetched from words.txt (editable on GitHub, syncs to all
                       devices). Falls back to the last synced copy, then to the
                       bundled DEFAULT_MASTER_WORDS.
     2. localWords   — phrases added in-app on this device.
     3. hiddenWords  — phrases deleted in-app (so a remote word can be hidden
                       without editing GitHub).
   masterWords = (remote + local) - hidden, deduped, order preserved.

   The WORDS are shared by everyone on the device. Which words are switched on
   for a given son — his Priority/Regular checkmarks — lives on HIS profile
   (state.wordFlags), so the family studies one list but each child marks it up
   independently. */
const REMOTE_CACHE_KEY = 'wc_remote_words';
const LISTS_CACHE_KEY  = 'wc_lists_cache';
const LOCAL_WORDS_KEY  = 'wc_local_words';
const HIDDEN_WORDS_KEY = 'wc_hidden_words';

/* Multiple word-list files live in words/, one per level+set, e.g.
     words/K1_01.txt   words/P1_01.txt   words/P2_03.txt
   words/lists.txt is a manifest naming them (the browser can't list a folder):
     P1_01.txt | Primary 1 · Set 1
   Each profile chooses which lists apply to that child, so an older sibling can
   revise P1 alongside P2 while the younger one only sees K1. */
const WORDS_DIR      = 'words/';
const WORDS_MANIFEST = 'words/lists.txt';

let availableLists = [];   // [{key,file,label,level}]
let listWords      = {};   // key -> [words]
let remoteWords    = [];   // union of the lists this profile has selected
let localWords     = [];
let hiddenWords    = [];
let masterWords    = [];
let wordSyncNote   = '';

function selectedListKeys(){
  const sel = state?.settings?.wordLists;
  if(!Array.isArray(sel)) return availableLists.map(l=>l.key);   // default: everything
  return sel;
}
function levelOf(key){ const m = String(key).match(/^([A-Za-z]+\d*)/); return m ? m[1].toUpperCase() : 'OTHER'; }

function rebuildRemote(){
  const keys = selectedListKeys();
  const seen = new Set();
  remoteWords = [];
  keys.forEach(k=>{
    (listWords[k]||[]).forEach(w=>{ if(w && !seen.has(w)){ seen.add(w); remoteWords.push(w); } });
  });
  rebuildMaster();
}
function rebuildMaster(){
  const hidden = new Set(hiddenWords);
  const seen = new Set();
  masterWords = [];
  [...remoteWords, ...localWords].forEach(w=>{
    if(!w || hidden.has(w) || seen.has(w)) return;
    seen.add(w); masterWords.push(w);
  });
}

async function loadWordlist(){
  try{ const r = await store.get(LOCAL_WORDS_KEY);  localWords  = r ? JSON.parse(r.value) : []; }catch(e){ localWords  = []; }
  try{ const r = await store.get(HIDDEN_WORDS_KEY); hiddenWords = r ? JSON.parse(r.value) : []; }catch(e){ hiddenWords = []; }
  try{
    const r = await store.get(LISTS_CACHE_KEY);
    if(r){ const c = JSON.parse(r.value); availableLists = c.lists||[]; listWords = c.words||{}; }
  }catch(e){}

  if(availableLists.length === 0 && Object.keys(listWords).length === 0){
    // nothing cached yet — fall back to the bundled list so play can start
    availableLists = [{ key:'builtin', file:null, label:'Built-in starter list', level:'BUILT-IN' }];
    listWords = { builtin: DEFAULT_MASTER_WORDS.slice() };
  }
  rebuildRemote();
  syncRemoteWords();
}

/* Fetch the manifest, then every list it names. Falls back to the older
   single words.txt, then to the bundled list. Never blocks play. */
async function syncRemoteWords(){
  const notALIst = t => /<\s*html/i.test(t);
  try{
    const res = await fetch(WORDS_MANIFEST, { cache:'no-store' });
    if(!res.ok) throw new Error('no manifest');
    const text = await res.text();
    if(notALIst(text)) throw new Error('404 page');
    const entries = text.split('\n').map(l=>l.trim()).filter(l=>l && !l.startsWith('#')).map(line=>{
      const [fileRaw, labelRaw] = line.split('|').map(x=>(x||'').trim());
      const file = fileRaw;
      const key  = file.replace(/\.txt$/i,'');
      return { key, file, label: labelRaw || key, level: levelOf(key) };
    });
    if(entries.length===0) throw new Error('empty manifest');

    const fetched = {};
    for(const e of entries){
      try{
        const r = await fetch(WORDS_DIR + e.file, { cache:'no-store' });
        if(!r.ok) continue;
        const t = await r.text();
        if(notALIst(t)) continue;
        const words = t.split('\n').map(x=>x.trim()).filter(Boolean);
        if(words.length) fetched[e.key] = words;
      }catch(err){}
    }
    const got = entries.filter(e=>fetched[e.key]);
    if(got.length===0) throw new Error('no lists loaded');

    availableLists = got;
    listWords = fetched;
    await store.set(LISTS_CACHE_KEY, JSON.stringify({ lists:availableLists, words:listWords }));
    rebuildRemote();
    const total = new Set(Object.values(fetched).flat()).size;
    wordSyncNote = `Synced ${got.length} list${got.length===1?'':'s'} · ${total} words`;
  }catch(e){
    // legacy single-file mode
    try{
      const r = await fetch('words.txt', { cache:'no-store' });
      if(r.ok){
        const t = await r.text();
        if(!notALIst(t)){
          const words = t.split('\n').map(x=>x.trim()).filter(Boolean);
          if(words.length){
            availableLists = [{ key:'words', file:'words.txt', label:'Word list', level:'ALL' }];
            listWords = { words };
            await store.set(LISTS_CACHE_KEY, JSON.stringify({ lists:availableLists, words:listWords }));
            rebuildRemote();
            wordSyncNote = `Synced ${words.length} words from words.txt`;
            if(ui.screen==='spelling' && ui.spellingUnlocked) renderSpellingManage();
            if(ui.screen==='spellingIndex') renderSpellingIndex();
            return;
          }
        }
      }
    }catch(err){}
    if(remoteWords.length===0){
      availableLists = [{ key:'builtin', file:null, label:'Built-in starter list', level:'BUILT-IN' }];
      listWords = { builtin: DEFAULT_MASTER_WORDS.slice() };
      rebuildRemote();
    }
    wordSyncNote = 'Using the built-in list (words/ not reachable)';
  }
  if(ui.screen==='spelling' && ui.spellingUnlocked) renderSpellingManage();
  if(ui.screen==='spellingIndex') renderSpellingIndex();
}

async function saveWordlist(){
  try{
    await store.set(LOCAL_WORDS_KEY,  JSON.stringify(localWords));
    await store.set(HIDDEN_WORDS_KEY, JSON.stringify(hiddenWords));
  }catch(e){}
  rebuildMaster();
}

function addWords(lines){
  const existing = new Set(masterWords);
  const added = [], skipped = [];
  lines.forEach(t=>{
    if(existing.has(t) || added.includes(t)) skipped.push(t);
    else added.push(t);
  });
  added.forEach(t=>{
    hiddenWords = hiddenWords.filter(h=>h!==t);   // un-hide if it was deleted before
    if(!localWords.includes(t) && !remoteWords.includes(t)) localWords.push(t);
  });
  rebuildMaster();
  return { added:added.length, skipped:skipped.length };
}

function removeWord(text){
  localWords = localWords.filter(w=>w!==text);
  if(remoteWords.includes(text) && !hiddenWords.includes(text)) hiddenWords.push(text);
  rebuildMaster();
}

/* ---- per-profile checkmarks over the shared list ----
   No stored entry = default {priority:false, regular:true}, so a word newly
   added to words.txt is automatically active for every son. */
function wordFlags(text){
  const f = state && state.wordFlags && state.wordFlags[text];
  return f ? { priority:!!f.priority, regular:f.regular!==false } : { priority:false, regular:true };
}
function setWordFlag(text, key, value){
  if(!state) return;
  state.wordFlags = state.wordFlags || {};
  const cur = state.wordFlags[text] || { priority:false, regular:true };
  cur[key] = value;
  state.wordFlags[text] = cur;
}
function wordRows(){
  return masterWords.map(text => {
    const f = wordFlags(text);
    return { text, priority:f.priority, regular:f.regular, isRemote: remoteWords.includes(text) };
  });
}
function activePool(){
  const rows = wordRows();
  if(state?.settings?.focusMode) return rows.filter(w=>w.priority);
  return rows.filter(w=>w.priority || w.regular);
}
function definitionFor(text){
  return CEDICT[text] || null;
}


/* ---------- WORD MASTERY & MILESTONE REWARDS ----------
   Every time a phrase is completed in a SCORED context (battle, catch, recovery)
   its mastery count ticks up. Practice mode never counts — that keeps practice a
   safe place to learn without it becoming the efficient way to farm rewards.

   Checkpoints per phrase: 15 and 40 completions.
   Rewards are paid per TEN phrases reaching a checkpoint:
     - every 10 phrases at 15+  ->  1 Protein Supplement
     - every 10 phrases at 40+  ->  1 Elite Skill Token
   `masteryAwarded` remembers how many milestones have already paid out, so
   rewards are never granted twice. */
/* Three mastery tiers, each paying a medal per TEN words that reach it:
     5 completions  -> Bronze   (rename a monster · 3 = 1 Skill Token)
    15 completions  -> Silver   (10 = 1 Protein Supplement)
    25 completions  -> Gold     (elite stones and hand-picked skills)
   Medals are spent in the Shop, so a long grind converts into a deliberate
   choice rather than a random drop. */
const MASTERY_CHECKPOINTS = { bronze:5, silver:15, gold:25 };
/* EVERY tier pays one medal PER WORD that reaches its threshold. Grouping by
   ten made the cheap currency cost more practice than the premium one — a
   bronze medal would have taken 10 words x 5 reps = 50 practices, against 25
   for a gold. Per-word keeps the ladder honest: 5 / 15 / 25 reps per medal.

   Tiers are CUMULATIVE: a word at 25 reps has also passed 15 and 5, so it pays
   a bronze, a silver AND a gold. */
const MASTERY_GROUP_BY_TIER = { bronze:1, silver:1, gold:1 };
const MASTERY_GROUP = 1;

/* Attempts are counted per phrase, in every scored context. */
/* Hanzi Writer treats 0 as "no hint", and an immediate outline would block
   input anyway — so the gentlest setting is after a single miss. */
const HINT_CURVE = [1, 1, 2, 2, 3];      // attempt 1..5 → misses needed before a hint
function attemptsOf(text){ return (state && state.wordAttempts && state.wordAttempts[text]) || 0; }
function hintScheduleFor(text){
  const n = attemptsOf(text);
  return n < HINT_CURVE.length ? HINT_CURVE[n] : false;   // false = no hint at all
}
function noteAttempt(text){
  if(!state) return;
  state.wordAttempts = state.wordAttempts || {};
  state.wordAttempts[text] = (state.wordAttempts[text] || 0) + 1;
}

function masteryOf(text){ return (state.wordMastery && state.wordMastery[text]) || 0; }
function masteryTier(n){
  if(n >= MASTERY_CHECKPOINTS.gold)   return 'gold';
  if(n >= MASTERY_CHECKPOINTS.silver) return 'silver';
  if(n >= MASTERY_CHECKPOINTS.bronze) return 'bronze';
  return null;
}
function masteryCounts(){
  const vals = Object.values(state.wordMastery || {});
  return {
    bronze: vals.filter(v=>v>=MASTERY_CHECKPOINTS.bronze).length,
    silver: vals.filter(v=>v>=MASTERY_CHECKPOINTS.silver).length,
    gold:   vals.filter(v=>v>=MASTERY_CHECKPOINTS.gold).length,
  };
}

function recordMastery(text){
  if(!state) return null;
  state.wordMastery = state.wordMastery || {};
  state.wordMastery[text] = (state.wordMastery[text] || 0) + 1;
  return checkMasteryRewards();
}
/* Medals are granted as words cross a tier, but progress made BEFORE medals
   existed (or before a tier's threshold changed) would otherwise never pay out.
   This reconciles the ledger against the actual mastery counts on load. */
