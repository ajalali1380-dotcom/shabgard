import {S,save} from './state.js';
import {toFa,normalize} from './rng.js';
import * as A from './audio.js';
import {SYMBOLS,ORD,lorePages} from './content.js';

const $=id=>document.getElementById(id);
let wheelRot=0;

export function initStation(){
  const tabs=[
    ['🧭 اسطرلاب',astro],['📡 بی‌سیم',radio],['🕳 نقشه‌ی قنات',qmap],
    ['🎞 ریل‌خوان',reel],['📖 دفترِ استاد',book],['🗄 بایگانی',archive]
  ];
  const tw=$('station-tabs');tw.innerHTML='';
  tabs.forEach(([nm,fn],i)=>{
    const b=document.createElement('button');
    b.className='tab-btn'+(i===0?' active':'');b.textContent=nm;
    b.onclick=()=>{A.sClick();tw.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');fn();};
    tw.appendChild(b);
  });
  astro();
}
const body=h=>{$('station-body').innerHTML=h;};

/* ============ اسطرلاب ============ */
function astro(){
  const W=S.W;
  body(`<div class="card">
    <p class="story" style="font-size:.9rem">اسطرلابِ کهنه‌ی استاد؛ پشتش حک شده «از چاه‌سوخته». حلقه‌ی درونی را بچرخان و روی <b>هم‌ترازیِ درست</b> تثبیت کن تا رازش را بگوید — هم‌ترازیِ درست را فقط کاوشگر جایی در روستا می‌یابد.</p>
    <div class="wheel-wrap">
      <div class="wheel-pointer">▼</div>
      <div class="wheel" id="wheel-outer"></div>
      <div class="wheel inner" id="wheel-inner"></div>
    </div>
    <div class="wheel-controls">
      <button class="btn btn-ghost" id="w-l">⟲ چرخش</button>
      <button class="btn btn-gold" id="w-lock">تثبیت</button>
      <button class="btn btn-ghost" id="w-r">چرخش ⟳</button>
    </div>
    <div class="align-readout" id="align-readout"></div>
    <div class="secret-msg" id="wheel-secret">${W.ruleText}</div>
    <div class="feedback" id="fb-wheel"></div>
  </div>`);
  SYMBOLS.forEach((sym,i)=>{
    const sp=document.createElement('span');
    sp.style.transform=`rotate(${i*30}deg)`;sp.textContent=sym;
    $('wheel-outer').appendChild(sp);
  });
  for(let n=1;n<=12;n++){
    const sp=document.createElement('span');
    sp.style.transform=`rotate(${(n-1)*30}deg)`;sp.textContent=toFa(n);
    $('wheel-inner').appendChild(sp);
  }
  const si=SYMBOLS.indexOf(W.astroSym);
  const aligned=()=>((si-wheelRot+12)%12)+1;
  const read=()=>{$('align-readout').innerHTML=`هم‌ترازیِ کنونی: ${W.astroSym} روبه‌رویِ عدد <b style="color:var(--brass)">${toFa(aligned())}</b>`;};
  const spin=d=>{A.sClick();wheelRot=(wheelRot+d+12)%12;$('wheel-inner').style.transform=`rotate(${wheelRot*30}deg)`;read();$('wheel-secret').classList.remove('show');};
  $('w-l').onclick=()=>spin(-1);$('w-r').onclick=()=>spin(1);
  $('w-lock').onclick=()=>{
    if(aligned()===W.astroNum){A.sChime();$('wheel-secret').classList.add('show');$('fb-wheel').textContent='';}
    else{A.sErr();$('wheel-secret').classList.remove('show');const fb=$('fb-wheel');fb.textContent='حلقه لرزید و درجا برگشت... هم‌ترازی درست نیست.';fb.className='feedback bad';}
  };
  read();
}

/* ============ بی‌سیم ============ */
function radio(){
  const W=S.W;
  const lines=W.freqs.map(f=>`<p class="tuner-line" data-f="${f}">📻 ${toFa(f)} هرتز — صدای پیرزنی لابه‌لای خش‌خش: «زنگوله‌ی ${ORD[W.freqBell[f]]}...»</p>`).join('');
  body(`<div class="card">
    <p class="story" style="font-size:.9rem">بی‌سیمِ صحراییِ ایستگاه. فقط بسامدهای خاصی روی این ریگزار چیزی می‌گیرند — کدام‌ها؟ کاوشگر باید بگوید. و یادت باشد: <b>روی این موج‌ها، هر صدایی استاد نیست.</b></p>
    <div class="tuner">
      <div class="freq-display"><span id="freq-val">500</span> Hz</div>
      <input type="range" id="freq-slider" min="110" max="990" step="5" value="500">
      <div style="display:flex;justify-content:center;margin-top:10px">
        <button class="btn btn-ghost btn-sm" id="tone-btn">🔊 پخش موج</button>
      </div>
      <div class="tuner-lines">
        <p class="static-noise" id="static-line">٭٭٭ خِش‌خِشِ ایستا ٭٭٭</p>
        ${lines}
        <p class="tuner-line" data-f="880">📻 ۸۸۰ هرتز — صدای استاد، شفاف و آرام: «بچه‌ها! من بیرونِ روستام، کنارِ جاده. برگردید...» — اما به صدای آشنا اعتماد نکن.</p>
      </div>
    </div>
  </div>`);
  const slider=$('freq-slider');
  slider.oninput=()=>{
    const v=+slider.value;$('freq-val').textContent=v;A.setRadioFreq(v);
    let any=false;
    document.querySelectorAll('.tuner-line').forEach(el=>{
      const hit=+el.dataset.f===v;el.classList.toggle('show',hit);if(hit)any=true;
    });
    $('static-line').style.display=any?'none':'block';
  };
  $('tone-btn').onclick=()=>{
    const on=!A.radioPlaying();
    A.radioTone(on,+slider.value);
    $('tone-btn').textContent=on?'🔇 قطع موج':'🔊 پخش موج';
  };
}

/* ============ نقشه قنات ============ */
function qmap(){
  const W=S.W,ROWS=['الف','ب','ج','د'];
  body(`<div class="card">
    <p class="story" style="font-size:.9rem">نقشه‌ی مهندسیِ چاه‌های قنات. اگر چاه‌ها را <b>به ترتیبِ جریانِ آب</b> لمس کنی، آب‌نگار روشن می‌شود — ترتیبِ درست روی نیم‌نقشه‌ای است که در روستا جا مانده...</p>
    <div class="starmap">
      <div class="smap-grid" id="smap"></div>
      <div class="smap-status" id="smap-status">چاه‌ها را به ترتیب لمس کن (۴ چاه)</div>
      <div style="text-align:center;margin-top:8px"><button class="btn btn-ghost btn-sm" id="smap-reset">پاک کردن</button></div>
      <div class="secret-msg" id="map-secret">💧 آب‌نگار روشن شد! مُهرِ آب‌سالاران، ماه‌ها به همین ترتیب: <b>${W.months4.join(' — ')}</b></div>
    </div>
  </div>`);
  const g=$('smap');let sel=[];
  const mk=(txt,cls)=>{const b=document.createElement('button');b.className='smap-cell '+cls;b.innerHTML=txt;if(cls)b.disabled=true;return b;};
  g.appendChild(mk('','lbl'));
  for(let c=1;c<=4;c++)g.appendChild(mk(toFa(c),'lbl'));
  const starry=[...W.wells,...W.decoyWells];
  ROWS.forEach(r=>{
    g.appendChild(mk(r,'lbl'));
    for(let c=1;c<=4;c++){
      const id=r+c,el=mk(starry.includes(id)?'🕳':'·','');
      el.disabled=false;
      el.onclick=()=>{
        if(sel.find(s=>s.id===id))return;
        A.sClick();sel.push({id,el});el.classList.add('sel');
        el.insertAdjacentHTML('beforeend','<span class="ord">'+toFa(sel.length)+'</span>');
        if(sel.length===4){
          if(W.wells.every((w,i)=>w===sel[i].id)){A.sChime();$('map-secret').classList.add('show');$('smap-status').textContent='';}
          else{A.sErr();$('smap-status').textContent='✖ نقشه تاریک ماند... و از بلندگو صدای چک‌چکِ آب آمد.';setTimeout(reset,900);}
        }else $('smap-status').textContent='چاهِ '+toFa(sel.length)+' از ۴ ثبت شد';
      };
      g.appendChild(el);
    }
  });
  function reset(){sel.forEach(s=>{s.el.classList.remove('sel');const o=s.el.querySelector('.ord');if(o)o.remove();});sel=[];$('map-secret').classList.remove('show');$('smap-status').textContent='چاه‌ها را به ترتیب لمس کن (۴ چاه)';}
  $('smap-reset').onclick=reset;
}

/* ============ ریل‌خوان ============ */
function reel(){
  const W=S.W;let sp=null,rv=false;
  body(`<div class="card">
    <p class="story" style="font-size:.9rem">ریل‌خوانِ صحراییِ استاد. سرعت و جهت را تنظیم کن و بنواز — تنظیمِ درست روی برچسبِ حلقه‌ای است که در روستا افتاده. تنظیمِ غلط، صداهایی پخش می‌کند که ما ضبط نکرده‌ایم.</p>
    <div class="turntable">
      <div class="tt-disc" id="tt-disc"></div>
      <div class="tt-row"><span style="color:#8d7fae;font-size:.85rem;align-self:center">سرعت:</span>
        <button class="tt-opt" data-s="33">۳۳</button>
        <button class="tt-opt" data-s="45">۴۵</button>
        <button class="tt-opt" data-s="78">۷۸</button>
      </div>
      <div class="tt-row"><span style="color:#8d7fae;font-size:.85rem;align-self:center">جهت:</span>
        <button class="tt-opt on" id="tt-fwd">درست ⟳</button>
        <button class="tt-opt" id="tt-rev">وارون ⟲</button>
      </div>
      <button class="btn btn-gold" style="margin-top:8px" id="tt-play">▶ نواختن</button>
      <div class="tt-out" id="tt-out"></div>
    </div>
  </div>`);
  document.querySelectorAll('[data-s]').forEach(b=>{
    b.onclick=()=>{A.sClick();sp=+b.dataset.s;document.querySelectorAll('[data-s]').forEach(x=>x.classList.remove('on'));b.classList.add('on');};
  });
  $('tt-fwd').onclick=()=>{A.sClick();rv=false;$('tt-fwd').classList.add('on');$('tt-rev').classList.remove('on');};
  $('tt-rev').onclick=()=>{A.sClick();rv=true;$('tt-rev').classList.add('on');$('tt-fwd').classList.remove('on');};
  $('tt-play').onclick=()=>{
    const d=$('tt-disc');d.classList.remove('spin','rev');void d.offsetWidth;
    d.classList.add('spin');if(rv)d.classList.add('rev');
    const out=$('tt-out');
    if(sp===W.reel.speed&&rv===W.reel.rev){
      A.sChime();A.noise(.5,.04,250);
      const revNum=W.mirrorNum.split('').reverse().join('');
      out.innerHTML=`🔊 صدای استاد — خسته، اما زنده:<br><b>«اگر این به دستتان رسید: شمعِ ${ORD[W.candleIdx]}ِ قابِ میانی را بکُشید...<br>و عددِ ${toFa(revNum)} را وارونه بر قاب بخوانید. عجله کنید.»</b>`;
    }else if(sp===null){
      out.innerHTML='<span class="tt-garble">سرعتی انتخاب نشده است.</span>';
    }else{
      A.sWhisper();
      const garbles=['...شِشِشِ...مم...عـ...','(صدای خنده‌ای کشدار و وارونه)','...خِرِرِخ... چیزی پشتِ صداست...','...صدای آب... و چیزی که در آب راه می‌رود...'];
      out.innerHTML='<span class="tt-garble">'+garbles[Math.floor(Math.random()*garbles.length)]+'</span>';
    }
    setTimeout(()=>d.classList.remove('spin','rev'),2600);
  };
}

/* ============ دفتر ============ */
function book(){
  const W=S.W;
  const rows=Object.entries(W.cipher).filter(([ch])=>!W.missing.includes(ch));
  const tds=rows.map(([ch,g])=>`<td>${g}</td>`).join('');
  const tls=rows.map(([ch])=>`<td>${ch}</td>`).join('');
  body(`<div class="book-shell">
    <h3>دفترِ ایستگاه — رونوشت‌های استاد</h3>
    <p>استاد پیش از رفتن، هرچه از چاه‌سوخته می‌دانست اینجا رونویسی کرد. آنچه مانده:</p>
    <div class="frame">
      <p style="text-align:center;font-weight:700;color:#6e4a23">نشانه‌های سنگ‌نوشته‌ها (رونوشتِ ناقص)</p>
      <table class="cipher"><tr><th>نشانه</th>${tds}</tr><tr><th>حرف</th>${tls}</tr></table>
      <p class="warning">⚠ استاد نوشته: «دو حرف را نیافتم — می‌گویند بر کلیدِ مکتب‌خانه و پشتِ نقشه‌ی چاه‌ها حک‌اند.»</p>
    </div>
    <div class="frame">
      <p style="text-align:center;font-weight:700;color:#6e4a23">قاعده‌ی نواختن</p>
      <p class="poem">«${W.orderText}» —<br>این را ساربان‌ها بر تخته‌ی قهوه‌خانه می‌نوشتند.</p>
    </div>
    <p class="warning" style="margin-top:12px">⚠ بقیه‌ی دانسته‌های استاد در «بایگانی» قفل است؛ کدهایش را کاوشگر در روستا می‌یابد.</p>
  </div>`);
}

/* ============ بایگانی ============ */
function archive(){
  const W=S.W,P=lorePages(W);
  const list=S.codes.map(c=>{
    let pg=P[c];if(!pg)return '';
    let h=pg.h;
    if(h==='MAZE'){
      const rows=[...W.mazeMarks.keys()].sort((a,b)=>W.mazeMarks[a].localeCompare(W.mazeMarks[b],'fa'));
      h='<table class="cipher"><tr><th>نشانِ تاقچه</th><th>راهِ آب</th></tr>'+
        rows.map(i=>`<tr><td>${W.mazeMarks[i]}</td><td>${W.mazeDirs[i]}</td></tr>`).join('')+'</table>'+
        '<p class="warning">⚠ مقنی‌باشی نوشته: «راهِ آب را برو؛ راه‌های دیگر یا بن‌بست‌اند یا بدتر.»</p>';
    }
    return `<div class="frame arch-page"><p style="text-align:center;font-weight:700;color:#6e4a23">${pg.t}</p>${h}</div>`;
  }).join('');
  body(`<div class="book-shell">
    <h3>بایگانیِ قفل‌دارِ استاد</h3>
    <p>هر کدی که کاوشگر در روستا پیدا کرد، اینجا وارد کن تا برگه‌اش باز شود.</p>
    <div class="seed-box" style="margin-top:10px">
      <input class="answer-input" id="in-arch" inputmode="numeric" maxlength="4" placeholder="کدِ ۴ رقمی" autocomplete="off" style="background:#fff;color:#251c12;border-color:#6e4a23">
      <button class="btn" style="background:#6e4a23;color:#efe6d0" id="btn-arch">گشودن</button>
    </div>
    <div class="feedback" id="fb-arch"></div>
    ${list||'<p class="lock-note" style="margin-top:10px;color:#6e4a23">هنوز برگه‌ای باز نشده است.</p>'}
  </div>`);
  $('btn-arch').onclick=()=>{
    const v=normalize($('in-arch').value);
    if(P[v]&&!S.codes.includes(v)){S.codes.push(v);save();A.sChime();archive();}
    else if(S.codes.includes(v)){const fb=$('fb-arch');fb.textContent='این برگه از قبل باز است.';fb.className='feedback';}
    else{A.sErr();const fb=$('fb-arch');fb.textContent='✖ کشو تکان نخورد.';fb.className='feedback bad';}
  };
  $('in-arch').onkeydown=e=>{if(e.key==='Enter')$('btn-arch').click();};
}
