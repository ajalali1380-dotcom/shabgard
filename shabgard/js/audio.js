let actx=null;
export let soundOn=true;
export function setSound(v){soundOn=v;}
const AC=()=>actx||(actx=new (window.AudioContext||window.webkitAudioContext)());
export function tone(freq,dur=.3,type='sine',vol=.14,when=0){
  if(!soundOn)return;
  try{
    const ctx=AC(),o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.value=freq;
    const t=ctx.currentTime+when;
    g.gain.setValueAtTime(vol,t);
    g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+dur);
  }catch(e){}
}
export function noise(dur=.5,vol=.08,freq=900){
  if(!soundOn)return;
  try{
    const ctx=AC(),len=ctx.sampleRate*dur,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    const src=ctx.createBufferSource();src.buffer=buf;
    const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=freq;
    const g=ctx.createGain();g.gain.value=vol;
    src.connect(f);f.connect(g);g.connect(ctx.destination);src.start();
  }catch(e){}
}
export const sClick=()=>tone(620,.07,'square',.05);
export const sErr=()=>{tone(160,.25,'sawtooth',.09);tone(120,.3,'sawtooth',.07,.08);};
export const sChime=()=>{[523,659,784,1047].forEach((f,i)=>tone(f,.5,'sine',.12,i*.12));};
export const sFound=()=>{tone(880,.18,'triangle',.1);tone(1175,.25,'triangle',.1,.1);};
export const sWhisper=()=>{noise(.9,.07,500);tone(92,1.1,'sine',.05);};
export const sCreak=()=>{tone(180,.7,'sawtooth',.025);tone(170,.8,'sawtooth',.02,.15);};
export const sHeart=()=>{tone(58,.16,'sine',.22);tone(50,.2,'sine',.18,.22);};
let drone=null;
export function startDrone(){
  if(drone||!soundOn)return;
  try{
    const ctx=AC(),g=ctx.createGain();g.gain.value=.026;
    const o1=ctx.createOscillator(),o2=ctx.createOscillator();
    o1.frequency.value=52;o2.frequency.value=55.5;
    o1.connect(g);o2.connect(g);g.connect(ctx.destination);o1.start();o2.start();
    drone=[o1,o2];
  }catch(e){}
}
let osc=null;
export function radioTone(on,freq){
  const ctx=AC();
  if(!on){if(osc){osc.stop();osc=null;}return;}
  if(osc){osc.frequency.setValueAtTime(freq,ctx.currentTime);return;}
  osc=ctx.createOscillator();
  const g=ctx.createGain();g.gain.value=.05;
  osc.frequency.value=freq;osc.connect(g);g.connect(ctx.destination);osc.start();
}
export function setRadioFreq(f){if(osc)osc.frequency.setValueAtTime(f,AC().currentTime);}
export const radioPlaying=()=>!!osc;
