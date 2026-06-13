import {S,save} from './state.js';
import {toFa,normalize} from './rng.js';
import * as A from './audio.js';
import {ORD} from './content.js';

const $=id=>document.getElementById(id);
const W=()=>S.W;

/* ================= ابزار نمایش ================= */
export function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(id).classList.add('active');window.scrollTo(0,0);
}
function toast(msg){
  const t=$('curse-toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2800);
}
function detail(title,html){
  $('detail-title').textContent=title;
  $('detail-body').innerHTML=html;
  $('detail-back').classList.add('show');
}
function choice(title,text,options){ // options: [{label,sub,fn}]
  $('choice-title').textContent=title;
  $('choice-text').innerHTML=text;
  const row=$('choice-row');row.innerHTML='';
  options.forEach(o=>{
    const b=document.createElement('button');b.className='choice-btn';
    b.innerHTML=`<b>${o.label}</b>${o.sub?`<span class="sub">${o.sub}</span>`:''}`;
    b.onclick=()=>{$('choice-back').classList.remove('show');o.fn();};
    row.appendChild(b);
  });
  $('choice-back').classList.add('show');
}

/* ================= منابع ================= */
function clampStats(){S.sanity=Math.max(0,Math.min(100,S.sanity));S.oil=Math.max(0,Math.min(100,S.oil));}
export function renderBars(){
  clampStats();
  ['','2'].forEach(sfx=>{
    const sf=$('sanity-fill'+sfx),of=$('oil-fill'+sfx);
    if(!sf)return;
    sf.style.width=S.sanity+'%';sf.classList.toggle('low',S.sanity<35);
    of.style.width=S.oil+'%';
    $('sanity-num'+sfx).textContent=toFa(S.sanity);
    $('oil-num'+sfx).textContent=toFa(S.oil);
  });
  document.body.classList.toggle('fear',S.sanity<35);
  if(S.sanity<=0)caught();
}
function dmg(n,msg){S.sanity-=n;if(msg)toast('🩸 '+msg+' (آرامش −'+toFa(n)+')');A.sErr();renderBars();save();}
function calm(n,msg){S.sanity+=n;if(msg)toast('🕊 '+msg);renderBars();save();}
function fuel(n){S.oil+=n;toast('🕯 نفت +'+toFa(n));A.sFound();renderBars();save();}

let tickId=null;
export function startTicks(){
  if(tickId)return;
  tickId=setInterval(()=>{
    if(S.ending)return;
    const inLoc=$('screen-loc').classList.contains('active');
    if(inLoc)S.oil--;
    if(S.oil<=0){S.sanity-=1;if(Math.random()<.3)A.sHeart();}
    renderBars();save();
  },15000);
}

/* ================= شکار ================= */
let huntId=null;
export function scheduleHunt(){
  clearTimeout(huntId);
  huntId=setTimeout(tryHunt,(140+Math.random()*160)*1000);
}
function tryHunt(){
  const visible=$('screen-hub').classList.contains('active')||$('screen-loc').classList.contains('active');
  const busy=document.querySelector('.modal-back.show');
  if(!visible||busy||S.ending){scheduleHunt();return;}
  A.sHeart();A.sWhisper();
  $('fb-hunt').textContent='';$('fb-hunt').className='feedback';
  $('hunt-back').classList.add('show');
  const btn=$('hold-btn');
  let done=false,t0=null,failT=setTimeout(()=>fail('ایستادی و نگاهش کردی...'),11000);
  const beat=setInterval(A.sHeart,1100);
  function cleanup(){clearTimeout(failT);clearInterval(beat);btn.onpointerdown=btn.onpointerup=btn.onpointerleave=null;}
  function pass(){
    if(done)return;done=true;cleanup();
    $('fb-hunt').textContent='...رفت. نفس بکش.';$('fb-hunt').className='feedback ok';
    A.sCreak();calm(0);
    setTimeout(()=>{$('hunt-back').classList.remove('show');btn.classList.remove('holding');},1100);
    scheduleHunt();
  }
  function fail(msg){
    if(done)return;done=true;cleanup();
    btn.classList.remove('holding');
    $('hunt-back').classList.remove('show');
    dmg(16,msg||'دیدت!');
    scheduleHunt();
  }
  btn.onpointerdown=()=>{btn.classList.add('holding');t0=setTimeout(pass,4000);A.sHeart();};
  const release=()=>{if(done)return;clearTimeout(t0);btn.classList.remove('holding');fail('دستت لرزید و چراغ تکان خورد!');};
  btn.onpointerup=release;btn.onpointerleave=release;
}
function caught(){
  if(caught._busy||S.ending)return;caught._busy=true;
  A.sWhisper();A.noise(1.2,.1,300);
  $('whisper-txt').textContent='...پیدایت کردم...';
  $('blackout').classList.add('show');
  setTimeout(()=>{
    $('blackout').classList.remove('show');
    S.sanity=50;S.oil=Math.max(10,S.oil-20);save();renderBars();
    detail('در تاریکی...','<div class="detail-visual"><p>سرما از پشتِ گردنت گذشت و دنیا سیاه شد. وقتی چشم باز می‌کنی، وسطِ میدانِ روستایی — قلبت هنوز می‌کوبد، نفتت نشت کرده، اما زنده‌ای. <b>او بازی می‌کند؛ نمی‌کُشد... هنوز.</b></p></div>');
    goHub();caught._busy=false;
  },2300);
}

/* ================= زمزمه‌های پس‌زمینه ================= */
const WHISPERS=['...اینجایی...','...صدایم را می‌شنوی؟...','...بیا پایین...','...چرا جواب نمی‌دهی؟...','...چراغ را خاموش کن...'];
let hauntId=null;
export function hauntLoop(){
  hauntId=setTimeout(()=>{
    const busy=document.querySelector('.modal-back.show');
    if(!busy&&!S.ending&&Math.random()<.7){
      A.sWhisper();
      $('whisper-txt').textContent=WHISPERS[Math.floor(Math.random()*WHISPERS.length)];
      $('blackout').classList.add('show');
      setTimeout(()=>$('blackout').classList.remove('show'),1700);
    }
    hauntLoop();
  },70000+Math.random()*70000);
}

/* ================= وسایل ================= */
const ITEM_DEFS={
  key1:{label:'🗝 کلیدِ مکتب‌خانه',t:'کلیدِ مکتب‌خانه',h:()=>`<div class="detail-visual"><p>کلیدی زمخت. روی دسته‌اش ریز حک شده:</p><p class="big">${W().cipher[W().missing[0]]} = ${W().missing[0]}</p></div>`},
  key2:{label:'🗝 کلیدِ دهانه‌ی قنات',t:'کلیدِ دهانه',h:()=>`<div class="detail-visual"><p>کلیدِ آهنیِ سنگین با حلقه‌ی زنگ‌زده. بوی نم می‌دهد.</p></div>`},
  map1:{label:'🗺 نیم‌نقشه‌ی چاه‌ها',t:'نیم‌نقشه‌ی چاه‌های قنات',h:()=>`<div class="detail-visual"><p>با جوهرِ سرخ، به ترتیبِ جریانِ آب:</p><p class="big" style="font-size:1.25rem">${W().wells.map(toFa).join(' ← ')}</p><p>و پشتِ کاغذ:</p><p class="big">${W().cipher[W().missing[1]]} = ${W().missing[1]}</p></div>`},
  note1:{label:'📄 برگه‌ی ۱ استاد',t:'برگه‌ی نخستِ دفترِ استاد',h:()=>`<div class="detail-visual"><p class="big" style="font-size:1rem;line-height:2.3">«به چاه‌سوخته رسیدم. درِ خانه‌ها باز است و سفره‌ها پهن.<br>امشب از قنات صدای آب می‌آمد — قناتی که چهل سال است خشک است.<br>فردا پایین می‌روم.»</p></div>`},
  paper1:{label:'🔖 کاغذِ کد ۱',t:'کاغذِ بایگانی',h:()=>`<div class="detail-visual"><p>دستخطِ استاد: «بایگانیِ ایستگاه —</p><p class="big">${toFa(W().code1)}</p><p>رمزگشا این را لازم دارد.»</p></div>`},
  paper2:{label:'🔖 کاغذِ کد ۲',t:'کاغذِ بایگانی',h:()=>`<div class="detail-visual"><p>روی کاغذِ دودگرفته: «بایگانی —</p><p class="big">${toFa(W().code2)}</p><p>راهِ آب را از مقنی‌باشی بپرس.»</p></div>`},
  paper3:{label:'🔖 کاغذِ کد ۳',t:'کاغذِ بایگانی',h:()=>`<div class="detail-visual"><p>کاغذی خیس، چسبیده به دیوارِ بن‌بست:</p><p class="big">${toFa(W().code3)}</p></div>`},
  paper4:{label:'🔖 کاغذِ کد ۴',t:'کاغذِ بایگانی',h:()=>`<div class="detail-visual"><p>لای کیسه‌های آرد: «واپسین برگه‌ی بایگانی —</p><p class="big">${toFa(W().code4)}</p><p>بدونِ این، شبِ سوم را شروع نکنید.»</p></div>`},
  reelLabel:{label:'🎞 برچسبِ ریل',t:'برچسبِ حلقه‌ی ریل',h:()=>{const r=W().reel;return `<div class="detail-visual"><p>حلقه‌ی نوارِ استاد اینجا نیست — اما برچسبش به میخ مانده:</p><p class="big" style="font-size:1.2rem">«ضبطِ آخر — دورِ ${toFa(r.speed)}، ${r.rev?'وارونه':'درست'} بشنوید»</p></div>`}},
  doll:{label:'🧸 عروسکِ نظرکرده',t:'عروسکِ نظرکرده',h:()=>`<div class="detail-visual"><p>عروسکی پارچه‌ای با چشم‌های دکمه‌ای — یکی‌اش کنده شده. دورِ گردنش نخِ سبزِ نذر بسته‌اند. <b>گرم است.</b></p></div>`},
};
export function addItem(k){
  if(S.items.includes(k))return;
  S.items.push(k);save();renderInv(true);
}
export function renderInv(isNew){
  const bar=$('inventory');if(!bar)return;bar.innerHTML='';
  S.items.forEach(k=>{
    const d=ITEM_DEFS[k];if(!d)return;
    const b=document.createElement('button');
    b.className='inv-item'+(isNew?' inv-new':'');
    b.textContent=d.label;
    b.onclick=()=>{A.sClick();detail(d.t,d.h());};
    bar.appendChild(b);
  });
  if(isNew)A.sFound();
  renderLetters();
}
export function renderLetters(){
  const bar=$('letters-bar');if(!bar)return;
  bar.innerHTML=S.letters.length?('حروفِ یافته (نامِ راستین؟): '+S.letters.map(l=>`<span class="glyph">${l}</span>`).join('')):'';
}
function giveLetter(){
  const next=W().nameLetters[S.letters.length];
  if(!next)return;
  S.letters.push(next);save();renderLetters();
  toast('✨ حرفی تازه بر دستبندت نقش بست: «'+next+'»');
}

/* ================= نقشه روستا ================= */
const LOCS=[
  {id:'kadkhoda', ic:'🏚', nm:'خانه‌ی کدخدا', night:1, st:()=>'بزرگ‌ترین خانه‌ی روستا'},
  {id:'ghahve',   ic:'🫖', nm:'قهوه‌خانه',     night:1, st:()=>'زنگوله‌ها هنوز آویزان‌اند'},
  {id:'school',   ic:'🏫', nm:'مکتب‌خانه',     night:1, need:'key1', st:()=>S.items.includes('key1')?'کلیدش را داری':'درش قفل است'},
  {id:'qanat',    ic:'⛲', nm:'دهانه‌ی قنات',  night:1, need:'key2', st:()=>S.items.includes('key2')?'کلیدِ دهانه را داری':'سنگش قفل است'},
  {id:'tunnel',   ic:'🕳', nm:'آب‌راهِ قنات',  night:2, st:()=>'تاریک و خیس'},
  {id:'mill',     ic:'🌀', nm:'آسیابِ بادی',   night:2, needDone:'tunnel', st:()=>S.done.tunnel?'از آب‌راه به آن رسیدی':'راهش از آب‌راه می‌گذرد'},
  {id:'emam',     ic:'🕌', nm:'امامزاده',      night:2, st:()=>'سقفش آینه‌کاری است'},
  {id:'grave',    ic:'🪦', nm:'قبرستانِ قدیمی', night:3, st:()=>'مقبره‌ای در میانه'},
];
const NIGHT_NAMES={1:'شبِ نخست — ردِ استاد',2:'شبِ دوم — راهِ آب',3:'شبِ سوم — نامِ راستین'};

export function goHub(){
  show('screen-hub');
  $('hud-night').textContent=NIGHT_NAMES[S.night];
  $('hud-seed').textContent='کدِ شب: '+S.seed;
  $('night-banner').textContent={1:'پیدا کن: ردِ استاد و راهی به قنات',2:'از آب‌راه بگذر و نشانه‌ها را جمع کن',3:'نامش را کامل کن و به مقبره برو'}[S.night];
  const g=$('hub-grid');g.innerHTML='';
  LOCS.forEach(L=>{
    const locked=L.night>S.night||(L.need&&!S.items.includes(L.need))||(L.needDone&&!S.done[L.needDone]);
    const card=document.createElement('button');
    card.className='loc-card'+(locked?' locked':'')+(S.done[L.id]?' done-loc':'');
    card.innerHTML=`<span class="ic">${L.ic}</span><span class="nm">${L.nm}</span><span class="st">${L.night>S.night?'در شب‌های بعد...':L.st()}</span>`;
    if(!locked)card.onclick=()=>{A.sClick();enterLoc(L.id);};
    g.appendChild(card);
  });
  renderInv();renderBars();save();
}
function enterLoc(id){
  show('screen-loc');
  $('loc-title').textContent=LOCS.find(l=>l.id===id).nm;
  renderBars();
  RENDER[id]();
}

/* ================= شب ۱: خانه کدخدا ================= */
function rKadkhoda(){
  $('loc-body').innerHTML=`
    <p class="room-desc">درِ خانه نیمه‌باز است و سفره هنوز پهن. چراغ‌قوه‌ات تنها نورِ توست — انگشتت را روی تاریکی بکش و هرچه دیدی برای رمزگشا بگو.</p>
    <div class="scene" id="scene-k">
      <div class="scene-bg" style="background:linear-gradient(180deg,#1a1326 0%,#0c0815 60%,#070510 100%)"></div>
      <button class="hotspot" style="top:8%;right:12%" id="hs-photo">🖼<span class="tag">قابِ عکس</span></button>
      <button class="hotspot" style="top:14%;left:14%" id="hs-lamp">🪔<span class="tag">گردسوز</span></button>
      <button class="hotspot" style="bottom:14%;right:38%" id="hs-rug">🧶<span class="tag">گلیم</span></button>
      <button class="hotspot" style="bottom:30%;left:10%" id="hs-chest">🗃<span class="tag">صندوقچه</span></button>
      <button class="hotspot" style="top:44%;right:6%" id="hs-beam">🪵<span class="tag">تیرک</span></button>
      <button class="hotspot" style="bottom:8%;left:42%" id="hs-rat">🐀<span class="tag">؟</span></button>
      <div class="darkness" id="dark-k"></div>
    </div>
    <p class="scene-hint">💡 نور را همه‌جا بچرخان؛ چیزهایی در گوشه‌ها پنهان‌اند</p>`;
  const sc=$('scene-k'),dark=$('dark-k');
  const move=e=>{
    const r=sc.getBoundingClientRect();
    const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
    const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
    dark.style.setProperty('--lx',x+'px');dark.style.setProperty('--ly',y+'px');
  };
  sc.addEventListener('pointermove',move);sc.addEventListener('touchmove',move,{passive:true});
  $('hs-photo').onclick=()=>{A.sClick();detail('قابِ عکسِ اهالی',`<div class="detail-visual"><p>عکسی سیاه‌وسفید از اهالی؛ صورتِ همه <b>خراشیده</b> شده. پشتِ قاب، با خطِ استاد:</p><p class="big" style="font-size:1rem;line-height:2.2">«به صدای آشنا اعتماد نکنید —<br>روی موجِ ۸۸۰ هرچه شنیدید، او بود، نه من. — ص»</p></div>`);};
  $('hs-lamp').onclick=()=>{A.sCreak();if(!S.done.lampScare){S.done.lampScare=1;dmg(2,'فتیله‌ی گردسوز هنوز گرم بود...');}detail('چراغِ گردسوز',`<div class="detail-visual"><p>نفتش چهل سال پیش باید خشک می‌شد... اما فتیله‌اش <b>گرم</b> است. کسی — یا چیزی — تازه خاموشش کرده.</p></div>`);};
  $('hs-rat').onclick=()=>{A.sCreak();if(!S.done.ratScare){S.done.ratScare=1;dmg(2,'موش! قلبت ریخت.');}detail('موشِ کویری',`<div class="detail-visual"><p>جیغ می‌کشد و می‌گریزد! 🐀 ...صبر کن. موش از روستای خالی نمی‌رود. این همه سال، از <b>چه</b> تغذیه کرده؟</p></div>`);};
  $('hs-rug').onclick=()=>{A.sClick();detail('گلیمِ کهنه',`<div class="detail-visual"><p>گلیم را کنار می‌زنی. روی کفِ کاهگلی با زغال نوشته‌اند:</p><p class="big" style="font-size:1.25rem">«${W().astroSym} را به خانه‌ی ${toFa(W().astroNum)} ببر»</p><p style="font-size:.82rem;color:#9a8cba;margin-top:8px">انگار دستورِ تنظیمِ دستگاهی است... رمزگشا اسطرلاب دارد.</p></div>`);};
  $('hs-beam').onclick=()=>{A.sClick();const t=W().tally;detail('تیرکِ چوبی',`<div class="detail-visual"><p>با چاقو، سه دسته شمارش بر تیرک کنده‌اند — از راست به چپ:</p><p class="scratch">${'|'.repeat(t[0])}&nbsp;&nbsp;&nbsp;${'|'.repeat(t[1])}&nbsp;&nbsp;&nbsp;${'|'.repeat(t[2])}</p><p style="font-size:.82rem;color:#9a8cba;margin-top:8px">${toFa(t[0])} خط، بعد ${toFa(t[1])} خط، بعد ${toFa(t[2])} خط</p></div>`);};
  $('hs-chest').onclick=()=>{A.sClick();openChest();};
}
let dial=[0,0,0];
function openChest(){
  if(S.done.kadkhoda){detail('صندوقچه‌ی مجری','<div class="detail-visual"><p>خالی است؛ هرچه داشت برداشته‌ای.</p></div>');return;}
  detail('صندوقچه‌ی مجری',`
    <div class="detail-visual"><p>صندوقچه‌ی خاتمِ کدخدا با سه چرخ‌دندانه. قفلش <b>تازه روغن خورده</b> — کسی پیش از تو اینجا بوده.</p></div>
    <div class="dial-lock">${[0,1,2].map(i=>`
      <div class="dial">
        <button data-d="${i}" data-v="1">▲</button>
        <div class="num" id="dial-${i}">${toFa(dial[i])}</div>
        <button data-d="${i}" data-v="-1">▼</button>
      </div>`).join('')}
    </div>
    <div style="text-align:center"><button class="btn btn-gold" id="btn-chest">کشیدنِ چفت</button></div>
    <div class="feedback" id="fb-chest"></div>`);
  document.querySelectorAll('[data-d]').forEach(b=>{
    b.onclick=()=>{A.sClick();const i=+b.dataset.d;dial[i]=(dial[i]+(+b.dataset.v)+10)%10;$('dial-'+i).textContent=toFa(dial[i]);};
  });
  $('btn-chest').onclick=()=>{
    if(dial.join('')===W().chestCode){
      A.sChime();S.done.kadkhoda=1;save();
      addItem('key1');addItem('note1');addItem('paper1');
      $('detail-body').innerHTML=`<div class="detail-visual"><p style="color:#8fe3b0;font-weight:700">✓ چفت با صدای خشکی باز شد!</p><p>درونش: <b>کلیدِ مکتب‌خانه</b>، <b>برگه‌ی نخستِ دفترِ استاد</b> و <b>کاغذی با کدِ بایگانی</b>. همه به وسایلت اضافه شد — وارسی‌شان کن و کد را برای رمزگشا بخوان.</p></div>`;
    }else{
      dmg(5,'چفت تکان نخورد.');
      const fb=$('fb-chest');fb.textContent='✖ چفت تکان نخورد.';fb.className='feedback bad';
    }
  };
}

/* ================= شب ۱: قهوه‌خانه ================= */
function rGhahve(){
  const w=W();
  $('loc-body').innerHTML=`
    <p class="room-desc">استکان‌ها هنوز روی تختِ چوبی چیده‌اند. هشت زنگوله‌ی شتر از سقف آویزان است و زیرشان دریچه‌ای به زیرِ زمین. ساربان‌ها رازشان را روی تخته می‌نوشتند...</p>
    <div class="scene" style="min-height:150px">
      <div class="scene-bg" style="background:linear-gradient(180deg,#231a38 0%,#120d20 70%)"></div>
      <button class="hotspot" style="top:14%;right:10%" id="hs-board">🪧<span class="tag">تخته‌ی قهوه‌خانه</span></button>
      <button class="hotspot" style="top:18%;left:12%" id="hs-samovar">🫖<span class="tag">سماور</span></button>
    </div>
    <div class="card">
      <p style="font-size:.88rem;color:#b9a8d4;text-align:center;margin-bottom:6px">زنگوله‌ها — از چپ شماره ۱ تا ۸</p>
      <div class="piano" id="bells"></div>
      <div class="seq-display" id="bell-seq"></div>
      <div class="feedback" id="fb-bells"></div>
    </div>`;
  $('hs-board').onclick=()=>{A.sClick();detail('تخته‌ی قهوه‌خانه',`<div class="detail-visual"><p>زیرِ حساب‌وکتابِ قهوه‌چی، با گچِ تازه نوشته‌اند:</p><p class="big" style="font-size:1.1rem;line-height:2.4">«بسامدِ نخست: ${w.freqRiddles[0]}<br>بسامدِ دوم: ${w.freqRiddles[1]}<br>بسامدِ سوم: ${w.freqRiddles[2]}<br>${w.orderText} — دریچه باز می‌شود.»</p></div>`);};
  $('hs-samovar').onclick=()=>{A.sCreak();if(!S.done.samScare){S.done.samScare=1;dmg(2,'از سماورِ سرد بخار بلند می‌شود...');}detail('سماورِ سرد',`<div class="detail-visual"><p>خاموش و سرد... اما از لوله‌اش بخارِ کم‌جانی بالا می‌رود. روی بدنه، با انگشت روی بخار نوشته‌اند: <b>«۸۸۰ — گوش نده»</b></p></div>`);};
  const NOTE=[262,294,330,349,392,440,494,523];let seq=[];
  const p=$('bells');
  for(let i=1;i<=8;i++){
    const k=document.createElement('button');k.className='pkey';k.textContent=toFa(i);
    k.onclick=()=>{
      A.tone(NOTE[i-1],.45,'triangle',.16);
      k.classList.add('lit');setTimeout(()=>k.classList.remove('lit'),250);
      if(S.done.ghahve)return;
      seq.push(i);$('bell-seq').textContent=seq.map(()=>'♪').join(' ');
      const idx=seq.length-1;
      if(seq[idx]!==w.bellAnswer[idx]){
        seq=[];dmg(5,'زنگوله‌ها درهم نالیدند.');
        const fb=$('fb-bells');fb.textContent='✖ زنگوله‌ها درهم نالیدند؛ از اول.';fb.className='feedback bad';
        setTimeout(()=>$('bell-seq').textContent='',600);return;
      }
      $('fb-bells').textContent='';
      if(seq.length===w.bellAnswer.length){
        A.sChime();S.done.ghahve=1;save();
        fuel(40);giveLetter();addItem('paper2');
        detail('دریچه باز شد!',`<div class="detail-visual"><p style="color:#8fe3b0;font-weight:700">✓ با آخرین زنگ، دریچه‌ی زیرِ زنگوله‌ها باز شد.</p><p>درونش: <b>پیتِ نفت</b> (چراغت پر شد)، <b>کاغذِ کدِ بایگانی</b>، و حرفی که با گچ بر چوبِ دریچه نوشته‌اند — بر دستبندت نقش بست.</p></div>`);
        goHubSoonMark();
      }
    };
    p.appendChild(k);
  }
}
function goHubSoonMark(){/* فقط برای تازه‌سازی کارت‌ها هنگام بازگشت */}

/* ================= شب ۱: مکتب‌خانه ================= */
function rSchool(){
  const w=W();
  if(S.done.school){
    $('loc-body').innerHTML='<p class="room-desc">گاوصندوقِ معلم باز و خالی است. تخته‌سیاه هنوز نشانه‌ها را نگه داشته.</p>'+inscrCard(w.inscr1);
    return;
  }
  $('loc-body').innerHTML=`
    <p class="room-desc">نیمکت‌های کوچک، خاک‌گرفته. روی تخته‌سیاه، ردیفی از نشانه‌های ناشناخته — و گاوصندوقِ کوچکِ معلم که به‌جای عدد، <b>واژه</b> می‌خواهد. دفترِ رمزگشا این خط را می‌داند... اما ناقص است؛ نشانه‌های گم‌شده روی وسایلِ توست.</p>
    ${inscrCard(w.inscr1)}
    <div class="answer-row">
      <input class="answer-input" id="in-word1" maxlength="8" placeholder="واژه‌ی تخته" autocomplete="off">
      <button class="btn btn-gold" id="btn-word1">گفتنِ واژه</button>
    </div>
    <div class="feedback" id="fb-word1"></div>`;
  $('btn-word1').onclick=()=>{
    if(normalize($('in-word1').value)===normalize(w.word1)){
      A.sChime();S.done.school=1;save();
      addItem('key2');addItem('map1');giveLetter();
      detail('گاوصندوق باز شد!',`<div class="detail-visual"><p style="color:#8fe3b0;font-weight:700">✓ واژه پذیرفته شد.</p><p>درون گاوصندوق: <b>کلیدِ دهانه‌ی قنات</b> و <b>نیم‌نقشه‌ی چاه‌ها</b> — و حرفی که با گچ کفِ صندوق نوشته‌اند، بر دستبندت نشست. پشتِ نیم‌نقشه را هم نگاه کن؛ به کارِ شبِ سوم می‌آید.</p></div>`);
      rSchool();
    }else{
      dmg(5,'گاوصندوق سرد ماند.');
      const fb=$('fb-word1');fb.textContent='✖ گاوصندوق سرد ماند.';fb.className='feedback bad';
    }
  };
  $('in-word1').onkeydown=e=>{if(e.key==='Enter')$('btn-word1').click();};
}
function inscrCard(glyphs){
  return `<div class="detail-visual"><p style="font-size:.85rem;color:#9a8cba;margin-bottom:6px">نشانه‌ها — از راست به چپ:</p><div class="big">${glyphs.join(' ')}</div></div>`;
}

/* ================= شب ۱: دهانه قنات ================= */
import {MONTHS} from './content.js';
let rings=[0,0,0,0];
function rQanat(){
  const w=W();
  if(S.done.qanat){
    $('loc-body').innerHTML='<p class="room-desc">سنگِ دهانه کنار رفته و پلکانِ تاریکِ آب‌راه پیشِ توست. (شبِ دوم از «آب‌راهِ قنات» وارد شو)</p>';
    return;
  }
  $('loc-body').innerHTML=`
    <p class="room-desc">کلیدِ آهنی، قفلِ زنجیر را باز می‌کند — اما سنگِ دهانه با چهار حلقه‌ی چرخان بسته است که نامِ <b>ماه‌های سال</b> رویشان حک شده: مُهرِ آب‌سالاران. نیم‌نقشه‌ات را بخوان و مختصات را به رمزگشا بده تا روی «نقشه‌ی قنات» پیاده کند. از تهِ تاریکی صدای چک‌چک می‌آید... <b>یا صدای پا؟</b></p>
    <div class="card">
      <p style="font-size:.88rem;color:#b9a8d4;text-align:center;margin-bottom:4px">حلقه‌های سنگ — از راست: یکم تا چهارم</p>
      <div class="rings" id="rings-w"></div>
      <div class="answer-row" style="justify-content:center"><button class="btn btn-gold" id="btn-rings">چرخاندنِ کلیدِ سنگی</button></div>
      <div class="feedback" id="fb-rings"></div>
    </div>`;
  const wrap=$('rings-w');wrap.innerHTML='';
  for(let i=0;i<4;i++){
    const d=document.createElement('div');d.className='ring';
    d.innerHTML=`<div class="face" id="ring-${i}">${MONTHS[rings[i]]}</div>
      <div class="rbtns"><button data-r="${i}" data-v="1">▶</button><button data-r="${i}" data-v="-1">◀</button></div>
      <span class="rlabel">حلقه‌ی ${ORD[i+1]}</span>`;
    wrap.appendChild(d);
  }
  document.querySelectorAll('[data-r]').forEach(b=>{
    b.onclick=()=>{A.sClick();const i=+b.dataset.r;rings[i]=(rings[i]+(+b.dataset.v)+12)%12;$('ring-'+i).textContent=MONTHS[rings[i]];};
  });
  $('btn-rings').onclick=()=>{
    const cur=rings.map(r=>MONTHS[r]);
    if(w.months4.every((m,i)=>m===cur[i])){
      A.sChime();S.done.qanat=1;save();
      night1End();
    }else dmg(6,'سنگ غرید اما نچرخید... و چیزی در عمق جابه‌جا شد.');
  };
}
function night1End(){
  A.noise(.8,.07,260);
  choice('صدایی از عمقِ قنات...',
    `سنگِ دهانه با غرشی کنار می‌رود. از تهِ سیاهیِ پلکان، <b>با صدای دکتر صالحی</b>، کسی صدایت می‌زند:<br>«تویی؟! خداروشکر... بیا پایین، پایم شکسته، نمی‌توانم بالا بیایم!»<br><br>اما برگه‌ی استاد چه نوشته بود؟ <i>«حتی با صدای من — پاسخ نده.»</i>`,
    [
      {label:'جواب می‌دهم: «استاد! آمدم!»',sub:'شاید واقعاً خودش باشد... شاید.',fn:()=>{
        S.flags.voice1=1;dmg(12,'سکوت شد. سکوتی که می‌خندید.');
        finishNight(1,'پاسخ دادی — و صدا قطع شد. هیچ پایی نشکسته بود؛ هیچ‌کس آن پایین منتظرت نبود. اما حالا <b>او صدای تو را هم دارد.</b> سپیده نزدیک است؛ به ایستگاهِ صحراییِ کنارِ روستا برگرد و تا شبِ بعد پنهان بمان.');
      }},
      {label:'سکوت می‌کنم و عقب می‌کشم',sub:'به هشدارِ استاد وفادار می‌مانم.',fn:()=>{
        calm(5,'درست تصمیم گرفتی.');
        finishNight(1,'لب‌هایت را بستی. صدا سه بار دیگر صدایت زد — بارِ سوم، دیگر شبیهِ استاد نبود. سپیده نزدیک است؛ به ایستگاهِ صحرایی برگرد. فردا شب، باید واردِ آب‌راه شوی.');
      }},
    ]);
}

/* ================= شب ۲: آب‌راه ================= */
let mazeJ=0;
function rTunnel(){
  const w=W();
  if(S.done.tunnel){
    $('loc-body').innerHTML='<p class="room-desc">آب‌راه را بلدی؛ از پایاب بیرون می‌آیی، کنارِ آسیاب.</p>';
    return;
  }
  renderJunction();
  function renderJunction(){
    if(mazeJ>=5){
      S.done.tunnel=1;save();A.sChime();
      $('loc-body').innerHTML='<p class="room-desc" style="color:#8fe3b0">✓ نورِ ماه! از پایاب بیرون می‌خزی — درست کنارِ آسیابِ بادی. (آسیاب روی نقشه باز شد)</p>';
      calm(4,'هوای تازه.');
      return;
    }
    const mark=w.mazeMarks[mazeJ];
    const voiceHere=(mazeJ===w.voiceJ&&!S.flags.voice2&&!S.done['v2seen']);
    $('loc-body').innerHTML=`
      <p class="room-desc">آب تا مچِ پایت است و سقف کوتاه. هر تاقچه‌ی چراغ، نشانی کنده دارد — مقنی‌ها با همین‌ها راه را می‌یافتند. نشان را به رمزگشا بگو؛ راهنمای مقنی‌باشی در بایگانیِ اوست.</p>
      <div class="tunnel">
        <div class="mark">نشانِ تاقچه‌ی این سه‌راه:<b>${mark}</b></div>
        ${voiceHere?`<p style="color:#ff9aa8;font-size:.9rem;margin-top:8px">از دهلیزِ <b>${w.voiceDir}</b>، با صدای استاد: «این‌طرف! منم! عجله کن...»</p>`:''}
        <div class="dir-row">
          ${['چپ','مستقیم','راست'].map(d=>`<button class="btn btn-ghost" data-dir="${d}">${d==='چپ'?'⬅':d==='راست'?'➡':'⬆'} ${d}</button>`).join('')}
        </div>
        <div class="tunnel-prog">سه‌راهِ ${toFa(mazeJ+1)} از ۵</div>
        <div class="feedback" id="fb-maze"></div>
      </div>`;
    if(voiceHere)S.done['v2seen']=1;
    document.querySelectorAll('[data-dir]').forEach(b=>{
      b.onclick=()=>{
        const d=b.dataset.dir;A.sClick();
        if(d===w.mazeDirs[mazeJ]){mazeJ++;A.sFound();renderJunction();return;}
        if(mazeJ===w.voiceJ&&d===w.voiceDir){
          S.flags.voice2=1;save();
          dmg(10,'صدا تا تهِ دهلیز کشاندت... و خاموش شد.');
          detail('دهلیزِ صدا','<div class="detail-visual"><p>دهلیز به دیواری گِلی می‌رسد. هیچ‌کس اینجا نیست — فقط روی دیوار، با ناخن، صدها بار نوشته‌اند: <b>«جواب داد، جواب داد، جواب داد»</b></p></div>');
          renderJunction();return;
        }
        if(mazeJ===w.mazeOilJ&&d===w.mazeOilDir){
          if(!S.done.oilCan){S.done.oilCan=1;save();fuel(35);
            detail('بن‌بست... اما!','<div class="detail-visual"><p>بن‌بست است — اما کنارِ دیوار، <b>پیتِ نفتِ مقنی‌ها</b> جا مانده! چراغت جان گرفت.</p></div>');}
          else toast('بن‌بست. قبلاً اینجا بوده‌ای.');
          renderJunction();return;
        }
        if(mazeJ===w.mazeCodeJ&&d===w.mazeCodeDir){
          if(!S.items.includes('paper3')){addItem('paper3');
            detail('بن‌بست... اما!','<div class="detail-visual"><p>بن‌بست — اما کاغذی خیس به دیوار چسبیده: <b>کدِ بایگانی!</b> آن را برای رمزگشا بخوان؛ وزن‌نامه‌ی آسیاب پشتِ همین کد است.</p></div>');}
          else toast('بن‌بست. کاغذش را برداشته‌ای.');
          renderJunction();return;
        }
        dmg(6,'راهِ کور — و صدای شلپِ پایی پشتِ سرت!');
        A.sHeart();
        const fb=$('fb-maze');if(fb){fb.textContent='✖ راهِ کور. به سه‌راه برگشتی.';fb.className='feedback bad';}
      };
    });
  }
}

/* ================= شب ۲: آسیاب ================= */
function rMill(){
  const w=W();
  if(S.done.mill){$('loc-body').innerHTML='<p class="room-desc">سنگِ آسیاب آرام می‌چرخد؛ کارَت اینجا تمام است.</p>';return;}
  let on=new Set();
  $('loc-body').innerHTML=`
    <p class="room-desc">پره‌های آسیاب در بادِ شب می‌نالند. سنگِ بالایی فقط با <b>بارِ درست</b> می‌چرخد و چیزی لای دوسنگ گیر کرده — کاغذی، شاید. کیسه‌ها را روی کفه بگذار؛ وزنِ درست را مقنی‌باشی در «وزن‌نامه» نوشته (بایگانی، کدِ آب‌راه).</p>
    <div class="card">
      <div class="bags" id="bags"></div>
      <div class="scale-read" id="scale-read">بار: ۰ مَن</div>
      <div class="answer-row" style="justify-content:center"><button class="btn btn-gold" id="btn-mill">چرخاندنِ سنگ</button></div>
      <div class="feedback" id="fb-mill"></div>
    </div>`;
  const wrap=$('bags');
  w.weights.forEach((wt,i)=>{
    const b=document.createElement('button');b.className='bag';b.textContent='🌾 '+toFa(wt)+' مَن';
    b.onclick=()=>{A.sClick();if(on.has(i)){on.delete(i);b.classList.remove('on');}else{on.add(i);b.classList.add('on');}
      const sum=[...on].reduce((s,x)=>s+w.weights[x],0);
      $('scale-read').textContent='بار: '+toFa(sum)+' مَن';};
    wrap.appendChild(b);
  });
  $('btn-mill').onclick=()=>{
    const sum=[...on].reduce((s,x)=>s+w.weights[x],0);
    if(sum===w.millTarget){
      A.sChime();S.done.mill=1;save();giveLetter();addItem('paper4');
      detail('سنگ چرخید!',`<div class="detail-visual"><p style="color:#8fe3b0;font-weight:700">✓ سنگ با ناله‌ای چرخید.</p><p>از لای دو سنگ، <b>واپسین کاغذِ بایگانی</b> بیرون افتاد — و حرفی که بر سنگِ زیرین کنده بودند، بر دستبندت نشست. <b>بدونِ این کد، شبِ سوم را شروع نکنید.</b></p></div>`);
      rMill();
    }else dmg(6,'سنگ نیم‌چرخی خورد و قفل شد.');
  };
}

/* ================= شب ۲: امامزاده ================= */
let candlesOn=[1,1,1,1,1],mirrorOpen=false;
function rEmam(){
  const w=W();
  if(S.done.emam){$('loc-body').innerHTML='<p class="room-desc">قابِ میانی شکسته و پشتش پلکانی به قبرستان پیداست. (شبِ سوم از «قبرستان» وارد شو)</p>';return;}
  $('loc-body').innerHTML=`
    <p class="room-desc">سقف، هزار تکه آینه است و <b>هیچ‌کدام تو را نشان نمی‌دهند.</b> زیرِ قابِ میانی، پنج شمعِ نذری می‌سوزد — چهل سال است، بی‌آنکه آب شوند. روی زمین برچسبِ حلقه‌ی ریلِ استاد افتاده؛ خودِ حلقه در ایستگاه است، دستِ رمزگشا.</p>
    <div class="scene" style="min-height:110px">
      <div class="scene-bg" style="background:linear-gradient(180deg,#1c1322 0%,#0d0813 70%)"></div>
      <button class="hotspot" style="top:18%;right:10%" id="hs-reel">🎞<span class="tag">برچسبِ ریل</span></button>
      <button class="hotspot" style="top:22%;left:10%" id="hs-cloth">🟢<span class="tag">پارچه‌های نذری</span></button>
    </div>
    <div class="mirrors">
      <div class="mirror"><span class="mtxt">سایه‌ها<br>دروغ<br>نمی‌گویند</span></div>
      <div class="mirror" id="mirror-mid">
        <span class="mtxt" id="mid-txt">او پشتِ<br>سرِ توست</span>
        <div class="mcandles" id="mcandles"></div>
        <div class="keypad" id="mid-keypad">
          <p style="font-size:.78rem;color:#8fa8c4">قابِ شکسته عددی می‌خواهد:</p>
          <div class="answer-row"><input class="answer-input" id="in-mirror" inputmode="numeric" maxlength="3" placeholder="● ● ●" autocomplete="off" style="font-size:1rem;padding:8px"></div>
          <button class="btn btn-gold btn-sm" style="margin-top:8px" id="btn-mirror">گفتنِ عدد</button>
        </div>
      </div>
      <div class="mirror"><span class="mtxt">نگاهش<br>نکن</span></div>
    </div>
    <div class="feedback" id="fb-m"></div>`;
  $('hs-reel').onclick=()=>{A.sClick();addItem('reelLabel');detail('برچسبِ ریل',ITEM_DEFS.reelLabel.h());};
  $('hs-cloth').onclick=()=>{A.sClick();detail('پارچه‌های نذری','<div class="detail-visual"><p>صدها گره‌ی سبزِ کهنه... جز یکی — <b>پارچه‌ای نو.</b> بازش می‌کنی؛ داخلش نوشته: «برگرد. هنوز وقت هست. — ص». استاد اینجا بوده، و هنوز امید داشته.</p></div>');};
  buildCandles();
  $('btn-mirror').onclick=checkMirror;
  $('in-mirror').onkeydown=e=>{if(e.key==='Enter')checkMirror();};
  function buildCandles(){
    const cw=$('mcandles');cw.innerHTML='';
    candlesOn.forEach((onv,i)=>{
      const b=document.createElement('button');b.className='mcandle'+(onv?'':' off');b.textContent='🕯';
      b.onclick=()=>snuff(i);cw.appendChild(b);
    });
  }
  function snuff(i){
    if(mirrorOpen)return;
    if(i===w.candleIdx-1){
      candlesOn[i]=0;buildCandles();mirrorOpen=true;
      A.sFound();A.noise(.6,.05,300);
      $('mirror-mid').classList.add('cracked');
      $('mid-txt').innerHTML='ترک خورد...';
      $('mid-keypad').classList.add('show');
    }else{
      candlesOn=[1,1,1,1,1];buildCandles();
      dmg(6,'شمعِ اشتباه! شعله‌ها دوباره جان گرفتند.');
    }
  }
  function checkMirror(){
    if(normalize($('in-mirror').value)===W().mirrorNum){
      A.sChime();giveLetter();
      choice('پشتِ آینه...',
        `قاب هزار تکه می‌شود. پشتش، تاقچه‌ای کوچک — و در آن، <b>عروسکی نظرکرده</b> با نخِ سبز دورِ گردنش. <b>گرم است.</b> روی تاقچه با خطِ پیرزنانه‌ای نوشته:<br><i>«تا این بسته است، او بسته است. آتش رهایش می‌کند؛ خاک آرامش.»</i>`,
        [
          {label:'عروسک را می‌سوزانم 🔥',sub:'هرچه هست، تمامش کن.',fn:()=>{
            S.flags.doll='burn';save();dmg(8,'شعله جیغ کشید — با صدای بچه.');
            doneEmam('شعله که گرفت، تمامِ آینه‌ها هم‌زمان لرزیدند و صدای جیغی از تهِ قنات آمد. <b>چیزی آزادتر شد... یا خشمگین‌تر.</b>');
          }},
          {label:'عروسک را زیرِ درختِ نظرکرده خاک می‌کنم 🪦',sub:'به رسمِ مادربزرگ‌ها احترام بگذار.',fn:()=>{
            S.flags.doll='bury';save();calm(6,'خاک، آرام بود.');
            doneEmam('خاک را که صاف کردی، بادِ داغ یک‌لحظه ایستاد — انگار روستا نفسی کشید. آینه‌ها برای یک آن، <b>تصویرت را نشان دادند.</b>');
          }},
        ]);
    }else dmg(5,'قاب سرد ماند.');
  }
  function doneEmam(txt){
    S.done.emam=1;save();
    finishNight(2,txt+'<br><br>پشتِ قاب، پلکانی به قبرستانِ قدیمی پیداست. سپیده نزدیک است — فردا شب، آخرین شب است: <b>شبِ نام.</b>');
  }
}

/* ================= شب ۳: قبرستان ================= */
let clockH=12,clockM=0;
function rGrave(){
  const w=W();
  if(S.ending){$('loc-body').innerHTML='<p class="room-desc">همه‌چیز تمام شده است.</p>';return;}
  const stage=S.done.graveWord?(S.done.graveClock?'final':'clock'):'word';
  if(stage==='word'){
    $('loc-body').innerHTML=`
      <p class="room-desc">قبرهای بی‌نام در ریگ، و در میانه، <b>مقبره‌ای سنگی که درش از داخل بسته شده.</b> از پشتِ سنگ صدای نفس می‌آید. روی در، سنگ‌نوشته‌ای به همان خطِ مکتب‌خانه و ردیفی حروفِ گلی. دو نشانه‌اش در دفترِ رمزگشا نیست — وسایلت را بگرد.</p>
      ${inscrCard(w.inscr2)}
      <div class="answer-row">
        <input class="answer-input" id="in-word2" maxlength="8" placeholder="واژه‌ی سنگ" autocomplete="off">
        <button class="btn btn-gold" id="btn-word2">خواندنِ واژه</button>
      </div>
      <div class="feedback" id="fb-word2"></div>`;
    $('btn-word2').onclick=()=>{
      if(normalize($('in-word2').value)===normalize(w.word2)){
        A.sChime();S.done.graveWord=1;save();giveLetter();
        toast('✨ واپسین حرف بر دستبندت نشست.');
        rGrave();
      }else dmg(6,'سنگ سرد ماند... و نفسِ پشتِ در ایستاد.');
    };
    $('in-word2').onkeydown=e=>{if(e.key==='Enter')$('btn-word2').click();};
  }
  else if(stage==='clock'){
    $('loc-body').innerHTML=`
      <p class="room-desc">حروفِ گلی فرو رفتند و از شکافِ سنگ، <b>ساعتِ جیبیِ استاد</b> بیرون افتاد — عقربه‌هایش آزادند. رمزگشا باید «سرودِ ساعت» را از بایگانی بخواند (واپسین کد): عقربه‌ها را به لحظه‌ی مرگِ روستا ببر.</p>
      <div class="card">
        <div class="clock-set">
          <div><div class="aclock"><div class="ahand h" id="hand-h"></div><div class="ahand m" id="hand-m"></div></div></div>
          <div class="tsetters">
            <div class="tset"><button id="h-up">▲</button><div class="num" id="t-h">۱۲</div><button id="h-dn">▼</button><span class="rlabel">ساعت</span></div>
            <div class="tset"><button id="m-up">▲</button><div class="num" id="t-m">۰۰</div><button id="m-dn">▼</button><span class="rlabel">دقیقه</span></div>
          </div>
        </div>
        <div class="answer-row" style="justify-content:center"><button class="btn btn-gold" id="btn-clock">کوبیدنِ در</button></div>
        <div class="feedback" id="fb-clock"></div>
      </div>`;
    const draw=()=>{
      $('t-h').textContent=toFa(clockH);
      $('t-m').textContent=toFa(String(clockM).padStart(2,'0'));
      $('hand-h').style.transform=`rotate(${(clockH%12)*30+clockM*.5}deg)`;
      $('hand-m').style.transform=`rotate(${clockM*6}deg)`;
    };
    $('h-up').onclick=()=>{A.sClick();clockH=(clockH%12)+1;draw();};
    $('h-dn').onclick=()=>{A.sClick();clockH=((clockH+10)%12)+1;draw();};
    $('m-up').onclick=()=>{A.sClick();clockM=(clockM+5)%60;draw();};
    $('m-dn').onclick=()=>{A.sClick();clockM=(clockM+55)%60;draw();};
    $('btn-clock').onclick=()=>{
      if(clockH===w.clockH&&clockM===w.clockM){
        A.sChime();A.noise(.7,.06,300);S.done.graveClock=1;save();rGrave();
      }else dmg(6,'در نلرزید. روستا در این لحظه نمرده است.');
    };
    draw();
  }
  else{
    $('loc-body').innerHTML=`
      <p class="room-desc" style="color:#8fe3b0">✓ عقربه‌ها ایستادند و چفتِ سنگ شکست... اما چیزی در را از پشت نگه داشته.</p>
      <div class="card">
        <p class="story" style="font-size:.95rem">از پشتِ سنگ — <b>با صدای استاد</b> — می‌گوید:<br>«باز کن... منم... زود باش، او دارد می‌آید...»<br><br>و از تهِ قبرستان، <b>با صدای خودت</b>، کسی جواب می‌دهد: «دارم می‌آیم استاد!»<br><br>حالا، انتخاب با توست — و رمزگشا.</p>
        <div class="letters-bar" id="final-letters" style="margin-top:8px"></div>
        <div class="choice-row" style="margin-top:14px">
          <button class="choice-btn" id="fc-open"><b>در را باز می‌کنم</b><span class="sub">شاید واقعاً خودش است. خطر می‌کنم.</span></button>
          <button class="choice-btn" id="fc-name"><b>نامِ راستینِ شب‌گرد را صدا می‌زنم</b><span class="sub">حروفِ دستبند + سرودِ بایگانیِ رمزگشا. نامِ درست، او را می‌بندد.</span></button>
          <button class="choice-btn" id="fc-run"><b>سنگ را با اهرم می‌شکنم و استاد را بیرون می‌کشم — فرار!</b><span class="sub">بی‌جنگ، بی‌نام. فقط نجاتش بده و برو.</span></button>
        </div>
        <div id="name-box" style="display:none;margin-top:12px">
          <div class="answer-row">
            <input class="answer-input" id="in-name" maxlength="6" placeholder="نامِ راستین" autocomplete="off">
            <button class="btn btn-gold" id="btn-name">صدا زدن</button>
          </div>
          <div class="feedback" id="fb-name"></div>
        </div>
      </div>`;
    $('final-letters').innerHTML='حروفِ یافته: '+S.letters.map(l=>`<span class="glyph">${l}</span>`).join('');
    $('fc-open').onclick=()=>{A.sCreak();endGame('fooled');};
    $('fc-run').onclick=()=>{A.sCreak();endGame('escape');};
    $('fc-name').onclick=()=>{$('name-box').style.display='block';$('in-name').focus();};
    $('btn-name').onclick=()=>{
      if(normalize($('in-name').value)===normalize(w.trueName)){
        const golden=S.flags.doll==='bury'&&!S.flags.voice1&&!S.flags.voice2&&S.sanity>=60;
        endGame(golden?'golden':'good');
      }else{
        dmg(8,'از پشتِ سنگ، با صدای استاد، خندید: «نه... این نامِ من نیست.»');
      }
    };
    $('in-name').onkeydown=e=>{if(e.key==='Enter')$('btn-name').click();};
  }
}

/* ================= پایان‌ها ================= */
const ENDINGS={
  fooled:{emoji:'🚪🌑',tag:'پایانِ ۱ از ۴ — فریب',title:'در باز شد...',
    t:()=>`سنگ کنار رفت و مقبره <b>خالی</b> بود — جز ساعتِ جیبی و دفترچه‌ای نیمه‌تمام. صدای استاد حالا از پشتِ سرت می‌آمد: «ممنون که در را باز کردی.» ${S.flags.voice1?'از همان شبِ اول که جوابش را دادی، صدایت را داشت؛ ':''}سپیده دمید و دو نفر از روستا بیرون آمدند — اما رمزگشا هرگز نفهمید کدام‌یک، واقعاً تو بودی.`},
  escape:{emoji:'🏃‍♂️🌅',tag:'پایانِ ۲ از ۴ — گریز',title:'فرار به سپیده',
    t:()=>`اهرم را که فشار دادی سنگ ترک خورد — و استاد، نحیف اما زنده، در آغوشت افتاد. ندویدید؛ <b>پرواز کردید.</b> پشتِ سرتان، چیزی تا لبه‌ی روستا آمد و ایستاد — او از چاه‌سوخته بیرون نمی‌آید. هنوز. استاد در راه فقط یک جمله گفت: «اسمش را... هیچ‌وقت نفهمیدم.» روستا خاموش ماند؛ و شب‌گرد، منتظرِ مسافرِ بعدی.`},
  good:{emoji:'⛓🌄',tag:'پایانِ ۳ از ۴ — بند',title:'نام، بند شد',
    t:()=>`نامش را که فریاد زدی، بادِ سیاه دورِ مقبره پیچید و <b>به درونِ قنات فرو کشیده شد</b> — زوزه‌کشان، نامش را پس می‌خواست. سنگ آزاد شد و استاد بیرون آمد. پشتِ سرتان، دهانه‌ی قنات خودبه‌خود با همان چهار حلقه قفل شد. او بند است — تا وقتی کسی نامش را از یاد نبرد. شما از یاد نمی‌برید.`},
  golden:{emoji:'💧🌅',tag:'پایانِ ۴ از ۴ — پایانِ طلایی',title:'و قنات، دوباره خواند',
    t:()=>`نامش را که صدا زدی، نه زوزه آمد، نه باد — فقط <b>سکوتی که تسلیم می‌شد.</b> چون هرگز پاسخش نداده بودی، دری نداشت؛ و چون عروسک را به خاک سپرده بودی، بندش از پیش محکم بود. استاد بیرون آمد، و وقتی سپیده زد، صدایی از عمقِ زمین آمد که چهل سال کسی نشنیده بود: <b>صدای آب در قنات.</b> چاه‌سوخته، آزاد شد.`},
};
function endGame(key){
  S.ending=key;save();
  const E=ENDINGS[key];
  $('end-emoji').textContent=E.emoji;
  $('end-title').textContent=E.title;
  $('end-tag').textContent=E.tag;
  $('end-text').innerHTML=E.t();
  $('end-stats').textContent=`آرامشِ پایانی: ${toFa(S.sanity)} — انتخاب‌ها: ${S.flags.voice1?'به صدا پاسخ دادی':'به صدا پاسخ ندادی'}${S.flags.voice2?'، در آب‌راه فریب خوردی':''}${S.flags.doll?('، عروسک را '+(S.flags.doll==='burn'?'سوزاندی':'خاک کردی')):''}`;
  (key==='golden'||key==='good')?A.sChime():A.sWhisper();
  show('screen-ending');
}

/* ================= گذارِ شب ================= */
function finishNight(n,text){
  S.night=Math.max(S.night,n+1);save();
  $('night-emoji').textContent={1:'🌒',2:'🌘'}[n]||'🌑';
  $('night-title').textContent='پایانِ '+NIGHT_NAMES[n].split(' — ')[0];
  $('night-text').innerHTML=text;
  $('btn-night-go').textContent='آغازِ '+NIGHT_NAMES[n+1].split(' — ')[0];
  $('btn-night-go').onclick=()=>{A.sClick();S.sanity=Math.min(100,S.sanity+25);S.oil=Math.min(100,S.oil+30);save();goHub();};
  show('screen-night');
}

/* ================= ثبت رندرها و راه‌اندازی ================= */
const RENDER={kadkhoda:rKadkhoda,ghahve:rGhahve,school:rSchool,qanat:rQanat,tunnel:rTunnel,mill:rMill,emam:rEmam,grave:rGrave};

export function initExplorer(){
  $('btn-back-hub').onclick=()=>{A.sClick();goHub();};
  $('detail-close').onclick=()=>$('detail-back').classList.remove('show');
  $('detail-back').onclick=e=>{if(e.target.id==='detail-back')$('detail-back').classList.remove('show');};
  A.startDrone();
  startTicks();scheduleHunt();hauntLoop();
  if(S.ending){endGame(S.ending);return;}
  goHub();
}
