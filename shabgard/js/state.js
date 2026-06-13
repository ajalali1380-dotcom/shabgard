export const S={
  seed:null, role:null, W:null,
  night:1, sanity:85, oil:100,
  items:[], letters:[], flags:{voice1:0,voice2:0,doll:null},
  done:{},          // مکان/پازل‌های حل‌شده
  codes:[],         // کدهای بایگانی پیداشده (کاوشگر) / بازشده (رمزگشا)
  ending:null,
};
const KEY=s=>'shabgard:'+s;
export function save(){
  if(!S.seed)return;
  const d={night:S.night,sanity:S.sanity,oil:S.oil,items:S.items,letters:S.letters,
    flags:S.flags,done:S.done,codes:S.codes,ending:S.ending};
  try{localStorage.setItem(KEY(S.seed),JSON.stringify(d));}catch(e){}
}
export function load(seed){
  try{
    const d=JSON.parse(localStorage.getItem(KEY(seed))||'null');
    if(!d)return false;
    Object.assign(S,d);return true;
  }catch(e){return false;}
}
export function hasSave(seed){
  try{return !!localStorage.getItem(KEY(seed));}catch(e){return false;}
}
export function wipe(seed){try{localStorage.removeItem(KEY(seed));}catch(e){}}
