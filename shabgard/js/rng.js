export function hashSeed(str){
  let h=2166136261>>>0;
  const s=String(str).trim().toLowerCase();
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
export function mulberry(seed){
  let a=seed>>>0;
  return function(){
    a|=0;a=(a+0x6D2B79F5)|0;
    let t=Math.imul(a^(a>>>15),1|a);
    t=(t+Math.imul(t^(t>>>7),61|t))^t;
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
export function makeR(rnd){
  return {
    f:rnd,
    int:(a,b)=>a+Math.floor(rnd()*(b-a+1)),
    pick:arr=>arr[Math.floor(rnd()*arr.length)],
    bool:()=>rnd()<.5,
    shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;},
    sample(arr,n){return this.shuffle(arr).slice(0,n);}
  };
}
export const FA='۰۱۲۳۴۵۶۷۸۹';
export const toFa=n=>String(n).replace(/\d/g,d=>FA[d]);
export const normalize=s=>String(s||'').trim()
  .replace(/[۰-۹]/g,d=>FA.indexOf(d))
  .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  .replace(/ي/g,'ی').replace(/ك/g,'ک')
  .replace(/[\s\u200c\u200f\u200e\-ـ]/g,'');
