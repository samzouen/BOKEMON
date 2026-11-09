/* ==========================================================
   27-assets.js
   The loading screen (4.09): the game's sounds and pictures
   fetched while a meter fills, before the first page.
   Part of 博刻MON. Loaded as a classic script: everything shares
   one global scope, exactly as when this was a single file.
   (Before 11-app.js, whose boot puts it up.)
   ========================================================== */
/* (4.09) The designer: "is it possible to have a loading screen like the random skill stone and a loading meter to
   buy time to pre-load assets when the game starts up or restarts? would that help with sfx and portraits for each
   region?" It does both. From the first moment of the boot, while the save comes down from the cloud:
     · the sounds are fetched, two at a time, the everyday ones first and the long defeat last, and kept as they come
       for the first tap, which then only has to turn them into sound (pumpSfxQueue, 02-core.js) — they used to be
       fetched one by one from that tap on, so the first minute of play could be missing some;
     · every picture the game has on GitHub (ASSET_LIST) — the monsters' portraits, the people's, the avatars, the
       icons — is fetched and held, so a portrait is there the moment a page asks for it (your team's first);
     · the region's backdrops are tried in turn as a page tries them (setScreenBg), so each page finds its picture at
       once — or knows at once to draw its sky, Region 6's skies drawn ready.
   Over the starry sky the ring of the twelve elements turns, as for a random stone, and (4.10) a silver bar fills
   under it, a bloom running through it — no name, no numbers, no words. The first page comes when the bar is full and
   the save is in, or after ASSET_LOAD.capMs; whatever is left goes on quietly, fewer at a time, behind it. A test's
   browser (navigator.webdriver) goes straight in, unless the test asks for the screen (force). */
/* ASSET_LIST:BEGIN (tools/asset-list.js, from the repo at 2026-11-08) */
const ASSET_LIST = {
  sfx:"answer_correct|answer_wrong|answer_wrong_old|catch_miss|catch_success|core_blast|defeat|evolution|hit_dealt|hit_taken|level_up|pulsar_glare|recovery_heal|rift_ambush|stone_high|stone_low|stone_mid|stone_roll|stone_ultra|stone_veryhigh|ui_back|ui_click|victory|victory_old",
  ui:"crown|dragon_core|dragon_stone|electric_core|electric_stone|fairy_stone|fire_stone|flying_stone|ghost_stone|grass_stone|ground_stone|heaven_earth_stone|mind_body_stone|monkey_crown|monkey_king_core|nature_element_stone|physical_stone|psychic_stone|skill_token|steel_core|steel_stone|stone elements|universal_stone|void_stone|water_stone|whalelord_core",
  avatar:"f1|f2|f3|f4|f5|m1|m2|m3|m4|m5",
  mon:"alien_captain_humanoid|alien_cocoon_flying|alien_commander_octopus|alien_crocodilian_fire|alien_dolphin_water|alien_flower_grass|alien_golem_ground|alien_gremlin_fairy|alien_grimgate_psychic|alien_insect_physical|alien_magnet_electric|alien_plant_hydra_dragon|alien_robot_steel|alien_toxic_gas_ghost|ankylosaurus_back|ankylosaurus_c_back|ankylosaurus_c_front|ankylosaurus_front|anubis_c_back|anubis_c_front|bat1_back|bat1_front|bat2_back|bat2_front|bat_back|bat_front|battlecat_back|battlecat_c_back|battlecat_c_front|battlecat_front|bird1_back|bird1_front|bird2_back|bird2_front|bird_back|bird_front|bone_demon_back|bone_demon_front|bonedancer_back|bonedancer_front|boobybird1_back|boobybird1_front|boobybird2_back|boobybird2_front|boobybird_back|boobybird_front|boxer_back|boxer_front|bug_knight1_back|bug_knight1_front|bug_knight_back|bug_knight_front|caladrius_back|caladrius_c_back|caladrius_c_front|caladrius_front|chestnut_knight1_back|chestnut_knight1_front|chestnut_knight2_back|chestnut_knight2_c_back|chestnut_knight2_c_front|chestnut_knight2_front|chestnut_knight_back|chestnut_knight_front|choux_fairy1_back|choux_fairy1_front|choux_fairy_back|choux_fairy_front|cormorant_back|cormorant_front|cream_fairy1_back|cream_fairy1_c_back|cream_fairy1_c_front|cream_fairy1_front|cream_fairy_back|cream_fairy_front|crow1_back|crow1_front|crow_back|crow_front|cyborg_back|cyborg_front|cyborg_future_back|cyborg_future_front|cyborg_past_back|cyborg_past_front|cyborg_present_back|cyborg_present_front|cyclops1_back|cyclops1_front|cyclops2_back|cyclops2_front|cyclops_back|cyclops_front|deer1_back|deer1_front|deer_back|deer_front|diamond_fairy_back|diamond_fairy_c_back|diamond_fairy_c_front|diamond_fairy_front|dragon1_back|dragon1_front|dragon2_back|dragon2_c_back|dragon2_c_front|dragon2_front|dragon_back|dragon_egg|dragon_front|duck1_back|duck1_front|duck_back|duck_front|duck_knight1_back|duck_knight1_front|duck_knight2_back|duck_knight2_front|duck_knight_back|duck_knight_front|eagle1_back|eagle1_c_back|eagle1_c_front|eagle1_front|eagle_back|eagle_front|earth_fairy_back|earth_fairy_front|earth_snake1_back|earth_snake1_front|earth_snake2|earth_snake2_back|earth_snake2_front|earth_snake_back|earth_snake_front|earth_sprite_back|earth_sprite_front|electric_starter1_back|electric_starter1_front|electric_starter2_back|electric_starter2_c_back|electric_starter2_c_front|electric_starter2_front|electric_starter_back|electric_starter_front|fairy_dauphin2_back|fairy_dauphin2_front|fairy_king_altmount_c_back|fairy_king_altmount_c_front|fairy_king_c_back|fairy_king_c_front|fairy_king_mounted_c_back|fairy_king_mounted_c_front|fairy_knight_front|fairy_princess1_back|fairy_princess1_c_back|fairy_princess1_c_front|fairy_princess1_front|fairy_princess_back|fairy_princess_front|fairybird1_back|fairybird1_c_back|fairybird1_c_front|fairybird1_front|fairybird_back|fairybird_front|fairybunny1_back|fairybunny1_front|fairybunny_back|fairybunny_front|fighting_ape1_back|fighting_ape1_front|fighting_ape_back|fighting_ape_front|fire_sprite_back|fire_sprite_front|fire_starter1_back|fire_starter1_front|fire_starter2_back|fire_starter2_front|fire_starter_back|fire_starter_c_back|fire_starter_c_front|fire_starter_front|firefly1_back|firefly1_front|firefly_back|firefly_front|firefox1_back|firefox1_front|firefox2_back|firefox2_front|firefox_back|firefox_front|firehound1_back|firehound1_c_back|firehound1_c_front|firehound1_front|firehound_back|firehound_front|flying_starter1_back|flying_starter1_front|flying_starter2_back|flying_starter2_c_back|flying_starter2_c_front|flying_starter2_front|flying_starter_back|flying_starter_front|forest_fairy_back|forest_fairy_c_back|forest_fairy_c_exalted_back|forest_fairy_c_exalted_front|forest_fairy_c_front|forest_fairy_front|future_dragon|future_electric|future_fairy|future_fire|future_flying|future_ghost|future_grass|future_ground|future_physical|future_psychic|future_steel|future_water|ghost1_back|ghost1_front|ghost_back|ghost_flame_back|ghost_flame_front|ghost_front|ghost_guardian1_c_front|ghost_guardian1_front|ghost_guardian_front|ghost_phoenix_back|ghost_phoenix_front|ghost_starter1_back|ghost_starter1_front|ghost_starter2_back|ghost_starter2_c_back|ghost_starter2_c_front|ghost_starter2_front|ghost_starter_back|ghost_starter_front|giraffe1_back|giraffe1_front|giraffe2_back|giraffe2_c_back|giraffe2_c_front|giraffe2_front|giraffe_back|giraffe_front|goblin_back|goblin_c_back|goblin_c_front|goblin_front|goblin_knight1_back|goblin_knight1_front|goblin_knight2_back|goblin_knight2_c_back|goblin_knight2_c_front|goblin_knight2_front|goblin_knight_back|goblin_knight_front|golem1_back|golem1_front|golem2_back|golem2_front|golem_back|golem_front|grass_fairy1_back|grass_fairy1_front|grass_fairy_back|grass_fairy_front|grass_sprite_back|grass_sprite_front|grass_starter1_back|grass_starter1_front|grass_starter2_back|grass_starter2_c_back|grass_starter2_c_front|grass_starter2_front|grass_starter_back|grass_starter_front|ground_fairy_back|ground_fairy_c_back|ground_fairy_c_front|ground_fairy_front|ground_starter1_back|ground_starter1_front|ground_starter2_back|ground_starter2_c_back|ground_starter2_c_front|ground_starter2_front|ground_starter_back|ground_starter_front|hamster_back|hamster_front|hermit_sloth1_back|hermit_sloth1_front|hermit_sloth2_back|hermit_sloth2_c_back|hermit_sloth2_c_front|hermit_sloth2_front|hermit_sloth_back|hermit_sloth_front|horned_lynx_back|horned_lynx_c_back|horned_lynx_c_front|horned_lynx_front|howler1_back|howler1_c_back|howler1_c_front|howler1_front|howler_back|howler_front|hydra1_back|hydra1_front|hydra2_back|hydra2_c_back|hydra2_c_front|hydra2_front|hydra_back|hydra_front|judo_blue_back|judo_blue_front|judo_red_back|judo_red_front|kicker_back|kicker_front|ladybird1_back|ladybird1_front|ladybird2_back|ladybird2_c_back|ladybird2_c_front|ladybird2_front|ladybird_back|ladybird_front|lanternfish1_back|lanternfish1_front|lanternfish_back|lanternfish_front|leopard1_back|leopard1_front|leopard_back|leopard_front|lion_back|lion_c_back|lion_c_front|lion_front|lizardape1_back|lizardape1_front|lizardape2_back|lizardape2_c_back|lizardape2_c_front|lizardape2_front|lizardape_back|lizardape_front|loong1_back|loong1_c_back|loong1_c_front|loong1_front|loong_back|loong_c_back|loong_c_front|loong_front|lucesco_back|lucesco_c_back|lucesco_c_front|lucesco_front|magnet1_back|magnet1_front|magnet2_back|magnet2_front|magnet_back|magnet_front|mantaray1_back|mantaray1_front|mantaray_back|mantaray_front|mantis1_back|mantis1_front|mantis_back|mantis_front|melody_fairy_back|melody_fairy_front|mime1_back|mime1_front|mime2_back|mime2_c_back|mime2_c_front|mime2_front|mime_back|mime_front|mindcat_back|mindcat_c_back|mindcat_c_front|mindcat_front|monkey_king_back|monkey_king_c_back|monkey_king_c_front|monkey_king_front|moon_swan_back|moon_swan_c_back|moon_swan_c_front|moon_swan_front|moth1_back|moth1_front|moth_back|moth_front|nemesis_anubis_back|nemesis_anubis_front|nemesis_back|nemesis_front|nemesis_hand|nemesis_hand_back|nemesis_hand_front|nemesis_spirit_back|nemesis_spirit_front|nemesis_wadjet_back|nemesis_wadjet_front|newt_baby_back|newt_baby_front|newt_back|newt_c_back|newt_c_front|newt_front|ninja1_back|ninja1_front|ninja2_back|ninja2_c_back|ninja2_c_front|ninja2_front|ninja_back|ninja_front|nurse1_back|nurse1_front|nurse2_back|nurse2_front|nurse_back|nurse_front|otter1_back|otter1_front|otter2_back|otter2_c_back|otter2_c_front|otter2_front|otter_back|otter_front|painter_back|painter_front|pelican1_back|pelican1_front|pelican_back|pelican_front|phoenix_back|phoenix_c_back|phoenix_c_exalted_back|phoenix_c_exalted_front|phoenix_c_front|phoenix_front|physical_starter1_back|physical_starter1_front|physical_starter2_back|physical_starter2_c_back|physical_starter2_c_front|physical_starter2_front|physical_starter_back|physical_starter_front|plasma_manta_back|plasma_manta_c_back|plasma_manta_c_front|plasma_manta_front|plesiosaur_back|plesiosaur_c_back|plesiosaur_c_front|plesiosaur_front|polygon1_back|polygon1_front|polygon2_back|polygon2_front|polygon_back|polygon_front|psychic_starter1_back|psychic_starter1_front|psychic_starter2_back|psychic_starter2_c_back|psychic_starter2_c_front|psychic_starter2_front|psychic_starter_back|psychic_starter_front|puffball1_back|puffball1_front|puffball2_back|puffball2_front|puffball_back|puffball_front|puppet1_back|puppet1_c_back|puppet1_c_front|puppet1_front|puppet_back|puppet_front|quetzal1_back|quetzal1_front|quetzal_back|quetzal_front|ram1_back|ram1_front|ram_back|ram_front|rat1_back|rat1_front|rat_back|rat_front|sacred_seed|sacred_seed_back|sacred_seed_front|sarcophagus_back|sarcophagus_front|sea_turtle1_back|sea_turtle1_front|sea_turtle_back|sea_turtle_front|seadragon1_back|seadragon1_c_back|seadragon1_c_front|seadragon1_front|seadragon_back|seadragon_front|seahorse1_back|seahorse1_front|seahorse2_back|seahorse2_front|seahorse_back|seahorse_front|sealed_blade_earth_back|sealed_blade_earth_front|sealed_blade_fire_back|sealed_blade_fire_front|sealed_blade_grass_back|sealed_blade_grass_front|sealed_blade_water_back|sealed_blade_water_front|skeleton_dragon_back|skeleton_dragon_front|skeleton_dragon_transformed_back|skeleton_dragon_transformed_front|snail1_back|snail1_front|snail_back|snail_front|sparrow1_back|sparrow1_front|sparrow_back|sparrow_front|sphinx_back|sphinx_c_back|sphinx_c_front|sphinx_front|spinner_back|spinner_front|squid_back|squid_c_back|squid_c_front|squid_front|squirrel1_back|squirrel1_front|squirrel_back|squirrel_front|starfish1_back|starfish1_front|starfish_back|starfish_front|steelcrab1_back|steelcrab1_front|steelcrab2_back|steelcrab2_c_back|steelcrab2_c_front|steelcrab2_front|steelcrab_back|steelcrab_front|strongman1_back|strongman1_front|strongman2_back|strongman2_front|strongman_back|strongman_front|sumo_back|sumo_c_back|sumo_c_front|sumo_front|swan1_back|swan1_front|swan_back|swan_front|sylph1_back|sylph1_front|sylph2_back|sylph2_c_back|sylph2_c_front|sylph2_front|sylph_back|sylph_front|tailed_cat_back|tailed_cat_c_back|tailed_cat_c_front|tailed_cat_front|tapir1_back|tapir1_front|tapir_back|tapir_front|thundercat_back|thundercat_c_back|thundercat_c_front|thundercat_front|thunderdog1_back|thunderdog1_front|thunderdog_back|thunderdog_front|thunderhound1_back|thunderhound1_c_back|thunderhound1_c_front|thunderhound1_front|thunderhound_back|thunderhound_front|thunderlion1_back|thunderlion1_front|thunderlion_back|thunderlion_front|thundersquirrel_back|thundersquirrel_front|tiger1_back|tiger1_c_back|tiger1_c_front|tiger1_front|tiger_back|tiger_front|toad_back|toad_c_back|toad_c_front|toad_front|tribal_ancestor_earth_back|tribal_ancestor_earth_front|tribal_ancestor_fire_back|tribal_ancestor_fire_front|tribal_ancestor_grass_back|tribal_ancestor_grass_front|tribal_ancestor_water_back|tribal_ancestor_water_front|tribal_guardian_fire|tribal_guardian_grass|tribal_guardian_ground|tribal_guardian_water|tricerarmor1_back|tricerarmor1_front|tricerarmor2_back|tricerarmor2_c_back|tricerarmor2_c_front|tricerarmor2_front|tricerarmor_back|tricerarmor_front|unicorn1_back|unicorn1_front|unicorn_back|unicorn_front|vesper_back|vesper_front|wadjet_c_back|wadjet_c_front|water_dragon_back|water_dragon_c_back|water_dragon_c_front|water_dragon_front|water_dragon_nerfed_back|water_dragon_nerfed_c_back|water_dragon_nerfed_c_front|water_dragon_nerfed_front|water_fairy1_back|water_fairy1_front|water_fairy_back|water_fairy_front|water_sprite_back|water_sprite_front|water_starter1_back|water_starter1_front|water_starter2_back|water_starter2_c_back|water_starter2_c_front|water_starter2_front|water_starter_back|water_starter_front|weasel1_back|weasel1_front|weasel_back|weasel_front|whale1_back|whale1_front|whale_back|whale_c_back|whale_c_front|whale_front|whalelord_back|whalelord_c_back|whalelord_c_front|whalelord_corpse|whalelord_front|yoga1_back|yoga1_front|yoga2_back|yoga2_front|yoga_back|yoga_front|zebra1_back|zebra1_front|zebra_back|zebra_front",
  npc:"assistant1|assistant2|barber|barista|boatwright|capo_black|capo_purple|clown_1|clown_2|clown_3|clown_4|clown_5|clown_6|clown_7|clown_8|clown_boss|consigliere|cook|customs_clerk|diver1|diver2|dockhand|dragon_disciple1|dragon_disciple2|dragon_master|dragon_master_2|electric_disciple1|electric_disciple2|electric_disciple3|electric_disciple4|electric_master|electric_new_master1|electric_new_master2|electric_new_master3|engineer1|failstar1|failstar2|failstar3|failstar4|failstar5|fairy_disciple1|fairy_disciple2|fairy_disciple3|fairy_master|fighting_disciple4|fighting_disciple5|figlio|fire_disciple1|fire_disciple2|fire_disciple3|fire_master|first_mate|fisherman1|fisherman2|fisherman3|fisherman4|fisherman5|fishwife|flying_disciple1|flying_disciple2|flying_disciple3|flying_disciple4|flying_master|gelataio|ghost_child|ghost_disciple1|ghost_disciple2|ghost_disciple3|ghost_disciple4|ghost_disciple5|ghost_disciple6|ghost_master|grandpa|grass_disciple1|grass_disciple2|grass_disciple3|grass_disciple4|grass_master|guardian|lemon_farmer|lighthouse_keeper|madrina|maestro|net_mender|nonna|padrino|padrino2|padrino_brother|padrino_young|physical_disciple1|physical_disciple2|physical_disciple3|pippo|plant_boss|police1|police2|police5|post_clerk|psychic_disciple1|psychic_disciple2|psychic_disciple3|psychic_disciple4|psychic_disciple5|psychic_master|rival|rival_padrino|sailor1|sailor2|sailor3|sailor4|sailor5|scientist1|scientist2|scientist3|scientist4|scientist5|scientist6|scientist7|scientist8|scientist9|scientist_boss|scientist_good|scientist_supervisor|scientist_underboss|ship_captain|shipkeeper|shipwarden|shopkeeper|shopkeeper1|shopkeeper2|shopkeeper3|shopkeeper5|shopkeeper6|shopper|soldato1|soldato2|sottocapo|station_master|steel_disciple1|steel_disciple2|steel_disciple3|steel_disciple4|steel_master|steel_master_2|tailor|thug1|thug2|thug3|thug4|thug5|thug_boss|trattoria_cook|waiter|water_disciple1|water_disciple2|water_disciple3|water_master|whalelord_corpse|worker1|worker2|worker3|worker4|worker5|worker6|worker7|worker8|worker9",
};
/* ASSET_LIST:END */
const ASSET_LOAD = { pics:12, sounds:2, after:3, capMs:20000, minMs:1200, fadeMs:450, jobMs:15000, soundShare:0.35, fullHold:300 };
let _al = null;          // the load: its queues and counts, the overlay, and every picture it has fetched (held)

function alNames(key){ return String(ASSET_LIST[key] || '').split('|').filter(Boolean); }
function alUrl(dir, name, ext){ return 'assets/' + dir + '/' + encodeURIComponent(/\.[a-z0-9]{2,4}$/i.test(name) ? name : name + ext); }
function alSheet(){ return typeof ELEMENT_SHEET !== 'undefined' ? ELEMENT_SHEET.src : alUrl('ui', 'stone elements', '.png'); }
/* The sounds: those the game plays that are on GitHub, in the order the first tap would have asked for them. */
function alSounds(){
  if(typeof SFX_MAP === 'undefined') return [];
  const have = new Set(alNames('sfx').map(n=> /\.[a-z0-9]{2,4}$/i.test(n) ? n : n + '.mp3'));
  const order = (typeof SFX_PRELOAD_ORDER !== 'undefined' ? SFX_PRELOAD_ORDER : []).concat(Object.keys(SFX_MAP));
  const files = [];
  order.forEach(ev=>{ const f = SFX_MAP[ev]; if(f && have.has(f) && !files.includes(f)) files.push(f); });
  return files;
}
/* The pictures: the ring's own symbols first, then the icons, the avatars, the monsters, the people. */
function alPictures(){
  const out = [alSheet()];
  ['ui', 'avatar', 'mon', 'npc'].forEach(d=> alNames(d).forEach(n=> out.push(alUrl(d, n, '.png'))));
  return [...new Set(out)];
}
/* A region's backdrops: what its pages, its places and its fights ask setScreenBg for. */
function alBgKeys(rid){
  const keys = ['home', 'region' + rid, 'explore', 'challenge', 'recover', 'shop', 'battle'];
  ((typeof REGION_ZONES !== 'undefined' && REGION_ZONES[rid]) || []).forEach(z=> keys.push(z.id, 'battle_' + z.id));
  if(rid === 4) keys.push('sea', 'battle_cabin_deck', 'battle_laboratory_deck', 'battle_weather_deck', 'battle_diving');
  if(rid === 5) keys.push('catacombs', 'tear');
  if(rid === 6) keys.push('region6', 'tear', 'rift', 'battle_future', 'battle_tear', 'jungle', 'battle_jungle', 'palace', 'battle_palace');
  return [...new Set(keys)];
}
/* Your team's looks: each monster's own name, and the looks it may wear (fixedLook, crownedLook). */
function alTeamLooks(){
  if(typeof state === 'undefined' || !state || typeof SPECIES === 'undefined') return [];
  const mons = (state.party || []).slice();
  try { if(typeof bondedCompanions === 'function') mons.push(...bondedCompanions()); } catch(e){}
  const out = new Set();
  mons.forEach(m=>{
    const sp = m && SPECIES[m.species];
    if(!sp) return;
    out.add(m.species);
    if(sp.fixedLook) out.add(sp.fixedLook);
    if(sp.crownedLook) out.add(sp.crownedLook);
  });
  return [...out];
}
function alIsLook(url, looks){
  const m = /^assets\/mon\/(.+)\.png$/.exec(url);
  if(!m) return false;
  const f = decodeURIComponent(m[1]);
  return looks.some(p=> f === p || f.startsWith(p + '_') || (f.startsWith(p) && /^\d/.test(f.charAt(p.length))));
}

/* ---------- the screen ---------- */
function alCss(){
  if(document.getElementById('alCss')) return;
  if(typeof stoneRevealCss === 'function') stoneRevealCss();          // the ring, and the starry sky's canvas
  const st = document.createElement('style');
  st.id = 'alCss';
  /* (4.10) The designer: "Please remove the main branding from the middle of the element and all details and words.
     Just have a silvery bar that fills up and which has a running bloom shimmer through it. I still want the ring of
     elements circling as before". The starry sky, the ring of the twelve turning, and under it a silver bar: its fill
     a silver gradient with a soft glow, a bright bloom running through it again and again. */
  st.textContent = `
  .al-ov{ position:fixed; inset:0; z-index:400; overflow:hidden; background:#06051a; display:flex; align-items:center; justify-content:center;
    transition:opacity ${ASSET_LOAD.fadeMs}ms ease; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
  .al-ov.out{ opacity:0; pointer-events:none; }
  .al-stage{ position:relative; z-index:3; display:flex; flex-direction:column; align-items:center; gap:26px; padding:0 16px; }
  .al-ring{ position:relative; width:min(86vw, 330px); height:min(86vw, 330px); }
  .al-ring .sr-ring{ opacity:0; transition:opacity .6s ease; }
  .al-ov.lit .al-ring .sr-ring{ opacity:1; }
  .al-meter{ position:relative; width:min(70vw, 300px); height:10px; border-radius:6px;
    background:rgba(214,222,255,.09); box-shadow:inset 0 0 0 1px rgba(222,229,255,.34), 0 0 18px rgba(0,0,0,.55); }
  .al-fill{ position:absolute; left:0; top:0; bottom:0; width:0; border-radius:6px; overflow:hidden; transition:width .35s ease;
    background:linear-gradient(90deg, #626b8c 0%, #a7b0d0 38%, #dfe5fa 78%, #ffffff 100%);
    box-shadow:0 0 8px rgba(232,238,255,.8), 0 0 22px rgba(190,205,255,.42); animation:alGlow 2.2s ease-in-out infinite; }
  .al-fill::after{ content:''; position:absolute; top:-40%; bottom:-40%; left:0; width:46%; border-radius:50%;
    background:radial-gradient(ellipse 50% 60% at 50% 50%, rgba(255,255,255,.98), rgba(255,255,255,.55) 38%, rgba(255,255,255,0) 72%);
    filter:blur(1.5px); mix-blend-mode:screen; animation:alBloom 1.7s cubic-bezier(.45,.05,.55,.95) infinite; }
  @keyframes alBloom{ from{ transform:translateX(-110%); } to{ transform:translateX(320%); } }
  @keyframes alGlow{ 0%,100%{ filter:brightness(1); } 50%{ filter:brightness(1.18); } }
  @media (prefers-reduced-motion: reduce){ .al-fill::after{ animation-duration:3.4s; } .al-fill{ animation:none; } }
  `;
  document.head.appendChild(st);
}
function alOverlay(){
  alCss();
  const ov = document.createElement('div');
  ov.className = 'al-ov';
  ov.id = 'alOv';
  ov.setAttribute('role', 'progressbar');
  ov.setAttribute('aria-label', 'Loading');
  ov.setAttribute('aria-valuemin', '0'); ov.setAttribute('aria-valuemax', '100'); ov.setAttribute('aria-valuenow', '0');
  const types = (typeof TYPE_COLORS !== 'undefined' && typeof ELEMENT_SYMBOLS !== 'undefined') ? Object.keys(TYPE_COLORS).filter(t=> ELEMENT_SYMBOLS[t]) : [];
  const n = types.length || 1;
  const ring = typeof elemIcon === 'function' ? types.map((t, i)=> `<span class="sr-sym" style="--a:${(360 / n * i).toFixed(2)}deg;"><span class="sr-up" style="--d:${(-(n - i) * 1.2 / n).toFixed(2)}s;">${elemIcon(t, 46, { title:false })}</span></span>`).join('') : '';
  /* (4.10) the ring and the bar, nothing else (no name, no numbers, no words) */
  ov.innerHTML = `<div class="al-stage">
      <div class="al-ring"><div class="sr-ring">${ring}</div></div>
      <div class="al-meter"><div class="al-fill"></div></div>
    </div>`;
  document.body.appendChild(ov);
  if(typeof cosmicSky === 'function') try { cosmicSky(ov); } catch(e){}
  return ov;
}
function alFrac(L){
  const s = L.nS ? Math.min(1, L.doneS / L.nS) : 1, p = L.nP ? Math.min(1, L.doneP / L.nP) : 1;
  return ASSET_LOAD.soundShare * s + (1 - ASSET_LOAD.soundShare) * p;
}
function alFull(L){ return L.doneS >= L.nS && L.doneP >= L.nP; }
function alMeter(){
  const L = _al;
  if(!L || !L.el || L.raf) return;
  const draw = ()=>{
    L.raf = 0;
    const el = L.el;
    if(!el) return;
    const f = alFrac(L), pct = Math.floor(f * 100 + 1e-9);
    const fill = el.querySelector('.al-fill'); if(fill) fill.style.width = (f * 100).toFixed(1) + '%';
    el.setAttribute('aria-valuenow', String(pct));                   // (4.10) no words on the screen: the bar alone
  };
  L.raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(draw) : (setTimeout(draw, 16), 1);
}

/* ---------- the fetching ---------- */
/* One picture, held once it has come: 'ok', 'err' (none there), or 'slow' (given up waiting; it may still come).
   `L`: the load it is for (its own, kept to the end, whatever has become of _al since). */
function alImage(src, L){
  L = L || _al;
  if(!L) return Promise.resolve('slow');
  if(L.img.has(src)) return L.img.get(src);
  const p = new Promise(res=>{
    const im = new Image();
    let t = setTimeout(()=>{ t = 0; res('slow'); }, ASSET_LOAD.jobMs);
    im.onload = ()=>{ if(t) clearTimeout(t); L.keep.push(im); res('ok'); };
    im.onerror = ()=>{ if(t) clearTimeout(t); res('err'); };
    try { im.decoding = 'async'; } catch(e){}
    im.src = src;
  });
  L.img.set(src, p);
  return p;
}
/* A backdrop as setScreenBg finds it: its pictures in turn until one comes, each missing one noted (bgMissing) as a
   page would note it. A drawn one (the rift's skies) is ready the moment it is asked for — and asking draws it. */
function alBackdrop(key, L){
  let cands = [];
  try { cands = typeof bgCandidates === 'function' ? bgCandidates(key) : []; } catch(e){ cands = []; }
  return new Promise(done=>{
    let i = 0;
    const next = ()=>{
      while(i < cands.length && typeof bgMissing !== 'undefined' && bgMissing[cands[i]]) i++;
      if(i >= cands.length) return done();
      const src = cands[i++];
      if(/^data:/.test(src)) return done();
      alImage(src, L).then(r=>{ if(r === 'err'){ if(typeof bgMissing !== 'undefined') bgMissing[src] = true; next(); } else done(); });
    };
    next();
  });
}
/* One sound's bytes, kept for the first tap (audio.sfxPre). Not one the tap has begun already. */
function alSound(file){
  if(typeof audio === 'undefined' || typeof fetch !== 'function') return Promise.resolve();
  if(!audio.sfxPre) audio.sfxPre = {};
  if(audio.sfxPre[file] || (typeof sfxWanted === 'function' && !sfxWanted(file))) return Promise.resolve();
  const p = fetch(SFX_DIR + file)
    .then(r=>{ if(r.status === 404) audio.missing[file] = true; return r.ok ? r.arrayBuffer() : null; })
    .catch(()=> null);
  audio.sfxPre[file] = p;
  return new Promise(res=>{ const t = setTimeout(res, ASSET_LOAD.jobMs); p.then(()=>{ clearTimeout(t); res(); }); });
}
function alRun(job, L){
  if(typeof job === 'string') return alImage(job, L).then(r=>{ if(r === 'ok' && job === alSheet() && L.el) L.el.classList.add('lit'); });
  if(job && job.bg) return alBackdrop(job.bg, L);
  return Promise.resolve();
}
/* Two lanes: the pictures, twelve at a time (three once the game has begun), and the sounds, two (then one). */
function alPump(){
  const L = _al;
  if(!L) return;
  const pc = L.closed ? ASSET_LOAD.after : ASSET_LOAD.pics, sc = L.closed ? 1 : ASSET_LOAD.sounds;
  while(L.busyP < pc && L.q.length){
    const job = L.q.shift();
    L.busyP++;
    alRun(job, L).catch(()=>{}).then(()=>{ L.busyP--; L.doneP++; if(_al === L){ alMeter(); alPump(); } });
  }
  while(L.busyS < sc && L.sq.length){
    const f = L.sq.shift();
    L.busyS++;
    alSound(f).catch(()=>{}).then(()=>{ L.busyS--; L.doneS++; if(_al === L){ alMeter(); alPump(); } });
  }
}

/* ---------- the boot's three calls (11-app.js) ---------- */
/* Up at once, fetching while the save comes down. */
function assetLoadStart(opts){
  opts = opts || {};
  if(_al && !_al.closed) return _al;
  if(!opts.force && typeof navigator !== 'undefined' && navigator.webdriver) return null;
  if(typeof document === 'undefined' || !document.body) return null;
  const L = _al = { t0:performance.now(), q:alPictures(), sq:alSounds(), busyP:0, busyS:0, nP:0, nS:0, doneP:0, doneS:0,
                    keep:[], img:new Map(), ready:false, closed:false, skipped:false, rid:null, el:null, raf:0, fullAt:0 };
  L.nP = L.q.length; L.nS = L.sq.length;
  try { L.el = alOverlay(); } catch(e){ console.error('loading screen:', e); }
  alMeter(); alPump();
  return L;
}
/* The save is in: this region's backdrops, then your team's portraits, go to the front of the queue. */
function assetLoadProfile(){
  const L = _al;
  if(!L || typeof state === 'undefined' || !state) return;
  const looks = alTeamLooks();
  if(looks.length){
    const mine = [], rest = [];
    L.q.forEach(j=> (typeof j === 'string' && alIsLook(j, looks) ? mine : rest).push(j));
    L.q = mine.concat(rest);
  }
  const rid = (state.progress && state.progress.currentRegion) || 1;
  L.rid = rid;
  const bg = alBgKeys(rid).map(k=> ({ bg:k }));
  L.q = bg.concat(L.q);
  L.nP += bg.length;
  alMeter(); alPump();
}
/* Until the bar is full (and has shown it), or capMs. (`skipped` is kept for a test to end it early; 4.10 has no Skip button.) */
function assetLoadWait(){
  const L = _al;
  if(!L) return Promise.resolve();
  L.ready = true;
  alMeter();
  return new Promise(res=>{
    const check = ()=>{
      const t = performance.now() - L.t0;
      if(alFull(L) && !L.fullAt) L.fullAt = t;
      if(L.skipped || t >= ASSET_LOAD.capMs || (L.fullAt && t - L.fullAt >= ASSET_LOAD.fullHold && t >= ASSET_LOAD.minMs)) return res();
      setTimeout(check, 100);
    };
    check();
  });
}
/* The first page is drawn: the screen fades off it. What is left goes on behind, fewer at a time. */
function assetLoadEnd(){
  const L = _al;
  if(!L || L.closed) return;
  L.closed = true;
  const el = L.el;
  L.el = null;
  if(el){ el.classList.add('out'); setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, ASSET_LOAD.fadeMs + 60); }
  alPump();
}
/* (from go()) A region come to since: its backdrops, quietly. */
function assetRegionCheck(){
  const L = _al;
  if(!L || !L.closed || typeof state === 'undefined' || !state || !state.progress) return;
  const rid = state.progress.currentRegion || 1;
  if(L.rid === rid) return;
  L.rid = rid;
  const bg = alBgKeys(rid).map(k=> ({ bg:k }));
  L.q = bg.concat(L.q);
  L.nP += bg.length;
  alPump();
}
