import {S, load, hasSave, save} from './state.js';
import {generateWorld} from './content.js';
import {normalize, toFa} from './rng.js';
import * as A from './audio.js';
import {show, initExplorer} from './game.js';
import {initStation} from './station.js';

const $ = id => document.getElementById(id);

/* ---------- دکمه صدا ---------- */
let soundOn = true;
$('snd').onclick = () => {
  soundOn = !soundOn;
  A.setSound(soundOn);
  $('snd').textContent = soundOn ? '🔊' : '🔇';
  if (soundOn) A.sClick();
};

/* ---------- مقدمه → کد شب ---------- */
$('btn-to-seed').onclick = () => { A.sClick(); show('screen-seed'); };

/* ---------- ساخت کد تازه ---------- */
const SEED_WORDS = ['ریگ','کویر','قنات','تشنه','خاموش','سراب','شبگرد','چاه','بادگیر','کاهگل','لالایی','مهتاب'];
$('btn-gen-seed').onclick = () => {
  A.sClick();
  const w = SEED_WORDS[Math.floor(Math.random()*SEED_WORDS.length)];
  const n = Math.floor(100 + Math.random()*900);
  const code = w + toFa(n);
  $('seed-pill').textContent = code;
  $('gen-seed-out').style.display = 'block';
  $('in-seed').value = code;
  checkResume();
};

/* ---------- بررسی ذخیره ---------- */
function checkResume(){
  const sd = normalize($('in-seed').value);
  $('resume-box').style.display = (sd && hasSave(sd)) ? 'block' : 'none';
}
$('in-seed').addEventListener('input', checkResume);

/* ---------- ورود با کد ---------- */
$('btn-use-seed').onclick = () => {
  const sd = normalize($('in-seed').value);
  const fb = $('fb-seed');
  if (!sd || sd.length < 3) {
    fb.textContent = '✖ کد باید دست‌کم ۳ حرف باشد.';
    fb.className = 'feedback bad show';
    A.sErr();
    return;
  }
  A.sClick();
  S.seed = sd;
  S.W = generateWorld(sd);
  if (hasSave(sd)) load(sd);           // ادامه‌ی بازی ذخیره‌شده
  const hs = $('hud-seed'); if (hs) hs.textContent = '🔑 ' + sd;
  $('role-seed-note').textContent = 'کدِ شب: «' + sd + '» — هم‌بازی‌ات باید همین را وارد کند.';
  show('screen-role');
};
$('in-seed').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-use-seed').click(); });

/* ---------- انتخاب نقش ---------- */
$('btn-role-p1').onclick = () => {
  A.sClick();
  S.role = 'p1'; save();
  initExplorer();
};
$('btn-role-p2').onclick = () => {
  A.sClick();
  S.role = 'p2'; save();
  // مودال جزئیات برای رمزگشا هم باید بسته شود
  $('detail-close').onclick = () => $('detail-back').classList.remove('show');
  $('detail-back').onclick = e => { if (e.target.id === 'detail-back') $('detail-back').classList.remove('show'); };
  show('screen-station');
  initStation();
};

/* ---------- شروع ---------- */
show('screen-intro');
