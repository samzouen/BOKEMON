#!/usr/bin/env python3
"""Makes the spoken words: one short clip for every phrase in the word lists, so the game plays a clip instead of
asking the phone's own speech (which an iPhone is slow, quiet or forgetful with).

Run from the repository's top folder:  python .github/word-audio/make_word_audio.py [--prune]
GitHub runs it by itself whenever a word list changes (.github/workflows/word-audio.yml).

What it reads:
  words/lists.txt        the lists, as the game reads them (and words.txt, the old single list)
  words/fixes.txt        spelling fixes ("wrong > right"), as the game applies them
  words/pinyin.txt       how a word is to be read, where the voice gets it wrong (yours to edit)
What it writes, in words/audio/:
  index.json             phrase -> clip, read by the game
  <12 hex>.mp3           the clips. A clip's name comes from the voice, the phrase and its reading, so a word whose
                         reading changes gets a new clip, and an old one is never played from a phone's cache
  readings.txt           every phrase with the pinyin it was read with: skim it, and put any that are wrong in
                         words/pinyin.txt
--prune removes clips no phrase uses any more.

The voice: Matcha-TTS trained on Data Baker's Mandarin corpus (one female speaker), run offline with sherpa-onnx; no
account or key. Data Baker's corpus is for non-commercial use only, which a family game is.
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tarfile, time, unicodedata, urllib.request
from pathlib import Path

VOICE = 'baker1'                       # in every clip's name: a new voice (or a new way of making them) means new clips
SPEED = 0.9                            # a little slower than the voice's own pace, for young ears
RATE = 22050
MODEL_URL = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/matcha-icefall-zh-baker.tar.bz2'
VOCODER_URL = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/vocoder-models/vocos-22khz-univ.onnx'
ROOT = Path.cwd()
WORDS = ROOT / 'words'
OUT = WORDS / 'audio'
CACHE = Path(os.environ.get('BOKEMON_VOICE_CACHE', Path.home() / '.cache' / 'bokemon-voice'))

# ---------- the phrases, exactly as the game keys them (02-core.js: phraseCanon, phraseFixed) ----------
def canon(raw):
    s = unicodedata.normalize('NFKC', str(raw or ''))
    s = re.sub(r'[\s​-‍⁠﻿]', '', s)
    return ''.join(c for c in s if not unicodedata.category(c).startswith(('P', 'S')))

def read_fixes():
    fixes = {}
    core = ROOT / 'js' / '02-core.js'                 # the game's own fixes (PHRASE_FIXES)
    if core.exists():
        m = re.search(r'const PHRASE_FIXES\s*=\s*\{(.*?)\};', core.read_text(encoding='utf-8'), re.S)
        if m:
            for a, b in re.findall(r"'([^']+)'\s*:\s*'([^']+)'", m.group(1)):
                fixes[canon(a)] = canon(b)
    f = WORDS / 'fixes.txt'
    if f.exists():
        for line in f.read_text(encoding='utf-8').splitlines():
            l = re.sub(r'#.*$', '', line).strip()
            if not l:
                continue
            parts = [p for p in re.split(r'\s*(?:->|=>|→|⇒|➔|>|＞|\||｜|=|＝)\s*', l) if p.strip()]
            if len(parts) != 2:
                parts = [p for p in re.split(r'[\t ,，、]+', l) if p]
            if len(parts) != 2:
                continue
            a, b = canon(parts[0]), canon(parts[1])
            if a and b and a != b:
                fixes[a] = b
    return fixes

def fixed(k, fixes):
    for _ in range(6):
        n = fixes.get(k)
        if not n or n == k:
            break
        k = n
    return k

def phrases():
    fixes = read_fixes()
    files = []
    manifest = WORDS / 'lists.txt'
    if manifest.exists():
        for line in manifest.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if line and not line.startswith('#'):
                files.append(WORDS / line.split('|')[0].strip())
    files.append(ROOT / 'words.txt')
    seen, out = set(), []
    for f in files:
        if not f.exists():
            continue
        for line in f.read_text(encoding='utf-8').splitlines():
            k = canon(line)
            k = fixed(k, fixes) if k else k
            if k and k not in seen:
                seen.add(k); out.append(k)
    return out

# ---------- the reading: pinyin, with the tone changes spoken Mandarin makes ----------
# pypinyin gives each character's pinyin; PaddleSpeech's tone rules (tone_sandhi.py, beside this file, Apache 2.0) turn
# it into what is spoken: 你好 ní hǎo, 一座 yí zuò, 不会 bú huì, and the light tones (妈妈 mā ma, 谢谢 xiè xie).
sys.path.insert(0, str(Path(__file__).resolve().parent))
import jieba, jieba.posseg as psg
from pypinyin import lazy_pinyin, Style
from pypinyin.contrib.tone_convert import to_tone3, tone3_to_tone
from tone_sandhi import ToneSandhi
_TS = ToneSandhi()

def rules_reading(phrase):
    seg = _TS.pre_merge_for_modify([(w, pos) for w, pos in psg.lcut(phrase)])
    out = []
    for word, pos in seg:
        full = lazy_pinyin(word, style=Style.TONE3, neutral_tone_with_five=True)
        fin = _TS.modified_tone(word, pos, lazy_pinyin(word, style=Style.FINALS_TONE3, neutral_tone_with_five=True))
        syl = [f[:-1] + g[-1] if g and g[-1].isdigit() else f for f, g in zip(full, fin)]
        if word.endswith('地') and syl and syl[-1].startswith('di'):
            # 地 after an adverb is the particle, de (迅速地 xùn sù de); in a word it is the ground (草地 cǎo dì)
            syl[-1] = 'de5' if (word == '地' or pos in ('d', 'ad', 'z', 'uv')) else 'di4'
        out += syl
    return out

def read_overrides():
    out, bad = {}, []
    f = WORDS / 'pinyin.txt'
    if not f.exists():
        return out, bad
    for n, line in enumerate(f.read_text(encoding='utf-8').splitlines(), 1):
        l = re.sub(r'#.*$', '', line).strip()
        if not l:
            continue
        m = re.match(r'^(\S+?)\s*[:=]?\s+(.+)$', l)
        if not m:
            bad.append(f'line {n}: {line}'); continue
        phrase = canon(m.group(1))
        syl = []
        for x in re.split(r'[\s,，、\'’]+', m.group(2).strip().lower()):
            if not x:
                continue
            x = x.replace('ü', 'v').replace('u:', 'v')
            if not re.search(r'\d$', x):
                x = to_tone3(x, neutral_tone_with_five=True)
                if not re.search(r'\d$', x):
                    x += '5'                                # no mark: a light tone
            syl.append(x.replace('ü', 'v'))
        if len(syl) != len(phrase):
            bad.append(f'line {n}: {phrase} has {len(phrase)} characters but {len(syl)} syllables'); continue
        out[phrase] = syl
    return out, bad

def reading(phrase, overrides):
    if phrase in overrides:
        return overrides[phrase], True
    syl = rules_reading(phrase)
    return (syl, False) if len(syl) == len(phrase) else (None, False)

def marks(syl):
    return ' '.join(tone3_to_tone(s if not s.endswith('5') else s[:-1]) for s in syl)

# ---------- the voice ----------
def fetch(url, dest):
    if dest.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    print('  fetching', url, flush=True)
    tmp = dest.with_suffix(dest.suffix + '.part')
    with urllib.request.urlopen(url, timeout=600) as r, open(tmp, 'wb') as f:
        shutil.copyfileobj(r, f)
    tmp.rename(dest)

def voice(readings):
    """The model, with every phrase given its own reading: added whole to the voice's lexicon, and to the word list
    its segmenter uses, so each is read as one word with the pinyin worked out above."""
    import sherpa_onnx
    md = CACHE / 'matcha-icefall-zh-baker'
    if not (md / 'model-steps-3.onnx').exists():
        arch = CACHE / 'matcha-icefall-zh-baker.tar.bz2'
        fetch(MODEL_URL, arch)
        with tarfile.open(arch) as t:
            t.extractall(CACHE)
        arch.unlink()
    voc = CACHE / 'vocos-22khz-univ.onnx'
    fetch(VOCODER_URL, voc)
    tokens = set(l.split()[0] for l in (md / 'tokens.txt').read_text(encoding='utf-8').splitlines() if l.strip())
    work = CACHE / 'work'
    if work.exists():
        shutil.rmtree(work)
    shutil.copytree(md / 'dict', work / 'dict')
    lex, user, skipped = [], [], []
    for phrase, syl in readings.items():
        phones = [x[:-1] if x.endswith('5') else x for x in syl]       # the voice writes a light tone with no number
        if not all(p in tokens for p in phones):
            skipped.append(phrase); continue
        lex.append(f'{phrase} {" ".join(phones)}')
        user.append(f'{phrase} 100000 n')
    ours = set(readings)
    base = [l for l in (md / 'lexicon.txt').read_text(encoding='utf-8').splitlines() if l.split(' ', 1)[0] not in ours]
    (work / 'lexicon.txt').write_text('\n'.join(lex + base) + '\n', encoding='utf-8')
    with open(work / 'dict' / 'user.dict.utf8', 'a', encoding='utf-8') as f:
        f.write('\n'.join(user) + '\n')
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            matcha=sherpa_onnx.OfflineTtsMatchaModelConfig(
                acoustic_model=str(md / 'model-steps-3.onnx'), vocoder=str(voc),
                lexicon=str(work / 'lexicon.txt'), tokens=str(md / 'tokens.txt'), dict_dir=str(work / 'dict')),
            num_threads=max(1, min(4, os.cpu_count() or 1))),
        rule_fsts=','.join(str(md / f) for f in ('phone.fst', 'date.fst', 'number.fst')),
        max_num_sentences=1)
    return sherpa_onnx.OfflineTts(cfg), skipped

def clip_bytes(samples):
    """Trimmed to the voice, a short lead-in (so a phone's speaker is awake before the first sound) and tail, levelled,
    and made an MP3."""
    import numpy as np
    s = np.asarray(samples, dtype=np.float32)
    loud = np.nonzero(np.abs(s) > 10 ** (-40 / 20))[0]
    if len(loud):
        s = s[max(0, loud[0] - int(RATE * 0.04)): loud[-1] + int(RATE * 0.06)]
    rms = float(np.sqrt(np.mean(s ** 2))) if len(s) else 0
    if rms > 0:
        s = s * min(10 ** (-18 / 20) / rms, 10 ** (-1 / 20) / max(1e-9, float(np.max(np.abs(s)))))
    s = np.concatenate([np.zeros(int(RATE * 0.10), np.float32), s, np.zeros(int(RATE * 0.15), np.float32)])
    pcm = (np.clip(s, -1, 1) * 32767).astype('<i2').tobytes()
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 's16le', '-ar', str(RATE), '-ac', '1', '-i', 'pipe:0',
                        '-codec:a', 'libmp3lame', '-b:a', '48k', '-f', 'mp3', 'pipe:1'],
                       input=pcm, stdout=subprocess.PIPE, check=True)
    return r.stdout

def name_for(phrase, syl):
    return hashlib.sha1(f'{VOICE}|{SPEED}|{phrase}|{" ".join(syl)}'.encode('utf-8')).hexdigest()[:12] + '.mp3'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--prune', action='store_true', help='remove clips no phrase uses any more')
    args = ap.parse_args()
    t0 = time.time()
    plist = phrases()
    overrides, bad = read_overrides()
    for b in bad:
        print('  words/pinyin.txt, not used:', b)
    readings, review, missing = {}, [], []
    for p in plist:
        syl, mine = reading(p, overrides)
        if not syl:
            missing.append(p); continue
        readings[p] = syl
        review.append(f'{p}\t{marks(syl)}{"   (words/pinyin.txt)" if mine else ""}')
    OUT.mkdir(parents=True, exist_ok=True)
    index_path = OUT / 'index.json'
    old = json.loads(index_path.read_text(encoding='utf-8')).get('clips', {}) if index_path.exists() else {}
    want = {p: name_for(p, syl) for p, syl in readings.items()}
    todo = [p for p in readings if not (OUT / want[p]).exists()]
    print(f'{len(plist)} phrases; {len(todo)} clips to make', flush=True)
    skipped = []
    if todo:
        tts, skipped = voice({p: readings[p] for p in todo})
        for n, p in enumerate(todo, 1):
            if p in skipped:
                continue
            a = tts.generate(p, sid=0, speed=SPEED)
            (OUT / want[p]).write_bytes(clip_bytes(a.samples))
            if n % 50 == 0 or n == len(todo):
                print(f'  {n}/{len(todo)} made ({time.time() - t0:.0f} s)', flush=True)
    clips = {p: want[p] for p in plist if p in want and p not in skipped and (OUT / want[p]).exists()}
    index_path.write_text(json.dumps({'v': 1, 'voice': VOICE, 'speed': SPEED, 'clips': dict(sorted(clips.items()))},
                                     ensure_ascii=False, indent=0) + '\n', encoding='utf-8')
    (OUT / 'readings.txt').write_text(
        '# Every phrase, with the pinyin the clip was made from. Any that is wrong: put it in words/pinyin.txt.\n'
        + '\n'.join(review) + '\n', encoding='utf-8')
    removed = 0
    if args.prune:
        used = set(clips.values())
        for f in OUT.glob('*.mp3'):
            if f.name not in used:
                f.unlink(); removed += 1
    for p in missing + skipped:
        print('  no clip for', p, '(the phone will say it)')
    print(f'done: {len(clips)} clips in the index, {len(todo) - len(skipped)} new, {removed} removed, '
          f'{time.time() - t0:.0f} s')

if __name__ == '__main__':
    main()
