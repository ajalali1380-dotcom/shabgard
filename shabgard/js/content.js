import {hashSeed, mulberry, makeR, toFa} from './rng.js';

export const SYMBOLS=['🌙','☀️','⭐','👁','🗝','🕯','🌹','🐍','🦉','🌊','🔥','🌿'];
export const GLYPHS=['🜁','🜂','⊕','☽','✶','⌘','◈','✠','♆','⌖','۞','☍'];
export const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const MARKS=['ماهی','خورشید','دستِ باز','چشم','بُزِ کوهی','ستاره','مار','خوشه‌ی گندم'];
const WORD1S=['خاموشی','سرگشته','گمگشته'];
const WORD2S=['زندانی','گرفتار','بازگرد'];
const NAMES=[
  {name:'کابوس',hint:'نامِ راستینش همان است که هر شب به خوابتان می‌آید'},
  {name:'تشنگی',hint:'نامِ راستینش همان دردِ چهل‌ساله‌ی قناتِ خشک است'},
  {name:'سیاهی',hint:'نامِ راستینش همان است که پس از مرگِ چراغ می‌ماند'},
];
const DIRS=['چپ','مستقیم','راست'];

function freqRiddle(R,f){
  const forms=[];
  if(f%2===0)forms.push(`دوبرابرِ ${toFa(f/2)}`);
  forms.push(`نیمی از ${toFa(f*2)}`);
  if(f%10===0)forms.push(`${toFa(f/10)}، ده‌برابر`);
  forms.push(`صد کم از ${toFa(f+100)}`);
  return R.pick(forms);
}

export function generateWorld(seedStr){
  const R=makeR(mulberry(hashSeed(seedStr)));
  const W={seed:seedStr};

  /* ---- شب ۱: خانه کدخدا ---- */
  W.tally=[R.int(1,9),R.int(1,9),R.int(1,9)];
  W.chestRule=R.pick(['rev','inc','mid']);
  const t=W.tally;
  W.chestCode=(W.chestRule==='rev')?[t[2],t[1],t[0]].join('')
    :(W.chestRule==='inc')?t.map(d=>(d+1)%10).join('')
    :[t[1],t[0],t[2]].join('');
  W.ruleText={
    rev:'«شمارش‌های تیرک را وارونه بخوان؛ شمارِ آخر، رقمِ نخست است.»',
    inc:'«به هر شمارشِ تیرک یکی بیفزای؛ و نُه، به هیچ بازمی‌گردد.»',
    mid:'«میانه را نخست بخوان؛ آنگاه آغاز را، آنگاه پایان را.»'
  }[W.chestRule];
  W.astroSym=R.pick(SYMBOLS);
  W.astroNum=R.int(1,12);

  /* ---- شب ۱: قهوه‌خانه ---- */
  const freqPool=[220,330,440,550,660,770];
  W.freqs=R.sample(freqPool,3);            // سه بسامد
  W.bells=R.sample([1,2,3,4,5,6,7,8],3);   // سه زنگوله
  W.freqBell={};W.freqs.forEach((f,i)=>W.freqBell[f]=W.bells[i]);
  W.bellAsc=R.bool();
  const sortedF=[...W.freqs].sort((a,b)=>W.bellAsc?a-b:b-a);
  W.bellAnswer=sortedF.map(f=>W.freqBell[f]);
  W.freqRiddles=R.shuffle(W.freqs).map(f=>freqRiddle(R,f));
  W.orderText=W.bellAsc?'از بم به زیر بنواز':'از زیر به بم بنواز';

  /* ---- شب ۱: مدرسه (رمزنگار) ---- */
  W.word1=R.pick(WORD1S);
  W.word2=R.pick(WORD2S);
  const uniq=[...new Set((W.word1+W.word2+'قل').split(''))];
  const glyphs=R.shuffle(GLYPHS).slice(0,uniq.length);
  W.cipher={};uniq.forEach((ch,i)=>W.cipher[ch]=glyphs[i]);
  const w1u=[...new Set(W.word1.split(''))];
  const w2only=[...new Set(W.word2.split(''))].filter(c=>!w1u.includes(c));
  W.missing=[R.pick(w1u),R.pick(w2only)]; // غایب۱ روی کلید (لازمِ شب۱)، غایب۲ پشتِ نقشه (لازمِ شب۳)
  W.inscr1=W.word1.split('').map(c=>W.cipher[c]);
  W.inscr2=W.word2.split('').map(c=>W.cipher[c]);

  /* ---- شب ۱: دهانه قنات ---- */
  const rows=['الف','ب','ج','د'];
  const allCells=[];rows.forEach(r=>{for(let c=1;c<=4;c++)allCells.push(r+c);});
  W.wells=R.sample(allCells,4);
  W.decoyWells=R.sample(allCells.filter(c=>!W.wells.includes(c)),4);
  W.months4=R.sample(MONTHS,4);

  /* ---- شب ۲: تونل قنات ---- */
  W.mazeMarks=R.sample(MARKS,5);
  W.mazeDirs=W.mazeMarks.map(()=>R.pick(DIRS));
  W.mazeOilJ=1; W.mazeCodeJ=3; // بن‌بست‌های گنج‌دار (اندیس تقاطع)
  W.mazeOilDir=R.pick(DIRS.filter(d=>d!==W.mazeDirs[1]));
  W.mazeCodeDir=R.pick(DIRS.filter(d=>d!==W.mazeDirs[3]));
  W.voiceJ=2; // تقاطعِ وسوسه‌ی صدا
  W.voiceDir=R.pick(DIRS.filter(d=>d!==W.mazeDirs[2]));

  /* ---- شب ۲: آسیاب ---- */
  W.weights=R.sample([3,4,5,6,7,8,9,11,12,13],5);
  const idx=R.sample([0,1,2,3,4],3);
  W.millTarget=idx.reduce((s,i)=>s+W.weights[i],0);

  /* ---- شب ۲: امامزاده ---- */
  W.candleIdx=R.int(1,5);
  W.mirrorNum=String(R.int(102,987));
  W.reel={speed:R.pick([33,45,78]),rev:R.bool()};

  /* ---- شب ۳ ---- */
  const nm=R.pick(NAMES);
  W.trueName=nm.name; W.nameHint=nm.hint;
  W.nameLetters=R.shuffle(nm.name.split(''));
  W.clockH=R.int(1,12);
  W.clockM=R.int(0,11)*5;

  /* ---- کدهای بایگانی ---- */
  const codes=new Set();while(codes.size<4)codes.add(String(R.int(1000,9999)));
  [W.code1,W.code2,W.code3,W.code4]=[...codes];

  return W;
}

export const ORD=['','یکم','دوم','سوم','چهارم','پنجم','ششم','هفتم','هشتم'];

export function lorePages(W){
  return {
    [W.code1]:{t:'برگه‌های ۲ و ۳ دفترِ استاد',h:`<p class="poem">«اهالی نمرده‌اند؛ گریخته‌اند. از چیزی که شبِ لایروبی از قنات بالا آمد.<br>
      شب‌گرد چهره ندارد؛ <b>صدا</b> دارد. صدای هرکس که دوستش داری.<br>
      اگر صدایت زد — حتی با صدای من — <b>پاسخ نده.</b> هر پاسخ، دری است که برایش باز می‌کنی.»</p>`},
    [W.code2]:{t:'راهنمای آب‌راهِ قنات (دست‌نوشته‌ی مقنی‌باشی)',h:'MAZE'},
    [W.code3]:{t:'وزن‌نامه‌ی آسیاب',h:`<p class="poem">«سنگِ بالایی تنها با بارِ <b>${toFa(W.millTarget)} مَن</b> می‌چرخد؛<br>نه کم، نه بیش — کیسه‌ها را بسنج.»</p>`},
    [W.code4]:{t:'سرودِ ساعت و نامِ راستین',h:`<p class="poem">«آن شب، عقربه‌ی کوچک بر <b>${toFa(W.clockH)}</b> خفته بود<br>
      و عقربه‌ی بزرگ بر عددِ <b>${toFa(W.clockM===0?12:W.clockM/5)}</b>ِ صفحه ایستاد —<br>و دیگر هیچ‌چیز تکان نخورد.»</p>
      <p class="poem" style="margin-top:10px">«${W.nameHint}؛<br>حروفش را کاوشگر، تکه‌تکه، در روستا یافته است.»</p>`},
  };
}
