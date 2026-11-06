'use client';
import {useEffect} from 'react';

export default function Page(){
  useEffect(()=>startGame(),[]);
  return (<>
<header>
  <h1>🌱Garden<i>Agent</i></h1>
  <span className="chip" id="st">connecting</span>
  <span className="chip" id="day"></span><span className="chip" id="mon"></span><span className="chip" id="wx"></span>
  <span className="chip" id="tank"></span><span className="chip" id="spray"></span><span className="chip" id="feed"></span><span className="chip" id="bask"></span>
  <button id="pause">Pause</button><button id="next">Next day ▶</button><button id="reset">Reset</button><button id="theme">Sleek mode</button><button id="brain">Brain: AI</button>
</header>
<main>
<div>
  <section>
    <div className="agent"><b id="face">🌱</b><div><strong>Sprout</strong> <span className="mut">your garden buddy</span><div id="say">Waking up…</div></div></div>
  </section>
  <section>
    <h2>🌿 Your garden</h2>
    <div className="mut">Pick a seed, click an empty bed. The agent tends everything else itself.</div>
    <div className="seeds" id="seeds"></div>
    <canvas id="scene" width="240" height="150" aria-label="Garden beds. Click an empty bed to plant."></canvas>
    <p><button id="ask">Ask the agent for advice 🌿</button></p>
    <div id="advice" className="mut"></div>
  </section>
  <section>
    <h2>📈 Score over time</h2>
    <canvas id="chart"></canvas>
    <div className="stats" id="stats"></div>
  </section>
</div>
<div>
  <section>
    <div className="tabs"><button className="on" data-t="p1">Plants</button><button data-t="p2">Jobs</button><button data-t="p3">Know-how</button></div>
    <div className="pane on" id="p1"><h2>📖 Plant guide</h2><div id="guide"></div></div>
    <div className="pane" id="p2"><h2>📋 Waiting for your OK</h2><div id="pend" className="mut">Nothing waiting.</div>
      <h2 style={{marginTop:12}}>Standing order</h2>
      <input type="text" id="order" placeholder="e.g. more tomatoes, no lettuce" aria-label="Standing order"/></div>
    <div className="pane" id="p3"><h2>How the AI works</h2>
      <p>Every game day Sprout does four things: <b>observe</b> each plant (water, health, pests, ripeness, season, tomorrow’s weather), <b>think</b> using gardening rules, <b>act</b> with its tools (water, feed, shade, spray, harvest, plant) and <b>learn</b> when a plant wilts.</p>
      <h2>🎓 What it has learned</h2><div id="learned" className="mut">Nothing yet.</div></div>
  </section>
  <section>
    <h2>🎛️ Mission control</h2>
    <div id="auto" style={{display:'flex',gap:6,marginBottom:6}}></div>
    <label>Save water ⟷ Pamper<input type="range" id="pamper" min="0" max="100" defaultValue="40"/><b id="pv">40</b></label>
    <label>Variety ⟷ Max harvest<input type="range" id="maxh" min="0" max="100" defaultValue="50"/><b id="mv">50</b></label>
    <label>Seconds per day<input type="range" id="secs" min="2" max="20" defaultValue="6"/><b id="sv">6s</b></label>
  </section>
  <section><h2>🧾 What the agent decided</h2><div id="log"></div></section>
</div>
</main>
  </>);
}

function startGame(){

const $=id=>document.getElementById(id),rnd=a=>a[Math.floor(Math.random()*a.length)];
const MONTHS=['April','May','June','July','August','September','October'];
const WX={sunny:'☀️',cloudy:'⛅',rain:'🌧️',heat:'🔥'};
const PLANTS={
  tomato:{e:'🍅',grow:9,need:14,months:[1,2,3,4],value:5},
  lettuce:{e:'🥬',grow:5,need:10,months:[0,1,5,6],value:2,heat:1},
  carrot:{e:'🥕',grow:7,need:8,months:[0,1,2,3,4,5],value:3},
  basil:{e:'🌿',grow:4,need:9,months:[1,2,3,4],value:2},
  pepper:{e:'🫑',grow:10,need:11,months:[2,3,4],value:6}
};
const AUTO=['Suggest','Ask first','Full auto'];
const S={auto:2,paused:false,secs:6,seed:'tomato',ai:true};
let s,timer;
const mon=()=>Math.floor((s.day-1)/30)%7;
const roll=()=>rnd(mon()>=2&&mon()<=4?['sunny','sunny','heat','cloudy','rain']:['sunny','cloudy','cloudy','rain','rain']);
const say=(m)=>{s.log.unshift({d:s.day,m});s.log.length=Math.min(s.log.length,80);$('say').textContent=m};
function fresh(){
  s={day:1,tank:100,feed:5,spray:5,harvest:0,pts:0,waste:0,lost:0,beds:Array(12).fill(null),w:'sunny',nw:'cloudy',learn:{},log:[],hist:[],pending:[]};
  s.w=roll();s.nw=roll();say('Hi! I’m Sprout. Plant a seed or let me choose — I’ll handle the rest.');
}
const th=k=>45+(document.getElementById('pamper').value-50)*.4+(s.learn[k]||0);
function pickSeed(){
  const o=$('order').value.toLowerCase(),m=mon();
  let ok=Object.keys(PLANTS).filter(k=>PLANTS[k].months.includes(m)&&!o.includes('no '+k));
  if(!ok.length)return null;
  const want=ok.filter(k=>o.includes(k)&&!o.includes('no '+k));
  if(want.length&&Math.random()<.7)return rnd(want);
  if(+$('maxh').value>Math.random()*100)return ok.sort((a,b)=>PLANTS[b].value-PLANTS[a].value)[0];
  const n=k=>s.beds.filter(p=>p&&p.k===k).length;
  return ok.sort((a,b)=>n(a)-n(b))[0];
}
function plan(){
  const A=[];
  s.beds.forEach((p,i)=>{
    if(!p)return;const P=PLANTS[p.k];
    if(p.age>=P.grow){A.push({t:'harvest',i,why:`${p.k} is ripe`});return}
    if(p.pest)A.push({t:'spray',i,why:`pests on ${p.k}`,ask:1});
    if(p.water<th(p.k)&&s.w!=='rain'&&(s.nw!=='rain'||p.water<25))A.push({t:'water',i,why:`water ${Math.round(p.water)}% is under ${Math.round(th(p.k))}%`+(s.learn[p.k]?' (learned to water earlier)':'')});
    if(P.heat&&s.nw==='heat')A.push({t:'shade',i,why:'heat is forecast and lettuce scorches'});
    if(p.health<75&&!p.pest&&p.water>=30)A.push({t:'feed',i,why:`health is ${Math.round(p.health)}%`,ask:1});
  });
  let free=s.beds.map((p,i)=>p?-1:i).filter(i=>i>=0).slice(0,3);
  free.forEach(i=>{const k=pickSeed();if(k)A.push({t:'plant',i,k,why:`${k} suits ${MONTHS[mon()]}`,ask:1})});
  return A;
}
const txt=a=>({harvest:`Harvest ${s.beds[a.i]?.k}`,water:`Water ${s.beds[a.i]?.k}`,shade:`Shade ${s.beds[a.i]?.k}`,spray:`Spray ${s.beds[a.i]?.k}`,feed:`Feed ${s.beds[a.i]?.k}`,plant:`Plant ${a.k}`}[a.t]+` in bed ${a.i+1}`);
function perform(a){
  const p=s.beds[a.i],P=p&&PLANTS[p.k],t=txt(a);
  if(a.t==='plant'){if(p)return;s.beds[a.i]={k:a.k,age:0,water:70,health:100,pest:false}}
  else if(!p)return;
  else if(a.t==='harvest'){s.harvest++;s.pts+=P.value*(p.health/100)*2;s.beds[a.i]=null}
  else if(a.t==='water'){const l=Math.max(1,Math.ceil((90-p.water)/8));if(s.tank<l){s.tank=100;say('Refilled the water tank.')}s.tank-=l;if(p.water>70)s.waste+=l;p.water=Math.min(100,p.water+l*8)}
  else if(a.t==='shade')p.shade=true;
  else if(a.t==='spray'){if(s.spray<1)return say('Out of spray — will restock soon.');s.spray--;p.pest=false}
  else if(a.t==='feed'){if(s.feed<1)return say('Out of plant food — will restock soon.');s.feed--;p.health=Math.min(100,p.health+15)}
  say(`${t} — ${a.why}.`);
}
const OKT=['harvest','water','shade','spray','feed','plant'];
const snap=()=>({day:s.day,month:MONTHS[mon()],weather:s.w,forecast:s.nw,tankLitres:Math.round(s.tank),sprayLeft:s.spray,feedLeft:s.feed,learned:s.learn,pamper:+$('pamper').value,maxHarvest:+$('maxh').value,autonomy:AUTO[S.auto],order:$('order').value,beds:s.beds.map((p,i)=>p?{i,plant:p.k,age:p.age,ripeAt:PLANTS[p.k].grow,water:Math.round(p.water),health:Math.round(p.health),pest:p.pest}:{i,empty:true})});
async function think(){
  let A=null;
  if(S.ai){
    try{
      const r=await fetch('/api/think',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(snap())});
      const j=await r.json();
      if(!r.ok)throw new Error(j.error||('HTTP '+r.status));
      A=(j.actions||[]).filter(a=>OKT.includes(a.t)&&Number.isInteger(a.i)&&a.i>=0&&a.i<12&&(a.t==='plant'?!s.beds[a.i]&&PLANTS[a.k]:s.beds[a.i])).map(a=>({...a,why:a.why||'AI decision',ask:['plant','spray','feed'].includes(a.t)?1:0}));
      if(j.thought)say('🧠 '+j.thought);
    }catch(e){A=null;say(`⚠️ AI unavailable (${e.message}). Using gardening rules.`)}
  }
  if(!A)A=plan();
  if(!A.length)return say('All calm. Nothing to do today.');
  A.forEach(a=>{
    if(S.auto===0)s.log.unshift({d:s.day,m:`💡 I would: ${txt(a)} (${a.why}).`});
    else if(S.auto===1&&a.ask)s.pending.push(a);
    else perform(a);
  });
  s.pending=s.pending.filter(a=>s.beds[a.i]?a.t!=='plant':a.t==='plant').slice(-8);
}
function sim(){
  s.beds.forEach((p,i)=>{
    if(!p)return;
    const f={sunny:1,cloudy:.7,rain:.4,heat:1.5}[s.w]*(p.shade?.6:1);
    p.age++;p.water-=PLANTS[p.k].need*f;
    if(s.w==='rain')p.water=Math.min(100,p.water+35);
    if(p.water<=0){p.water=0;p.health-=25;
      if(!p.wilt){p.wilt=1;s.learn[p.k]=Math.min(30,(s.learn[p.k]||0)+8);say(`🎓 ${p.k} wilted — I’ll water ${p.k} earlier from now on.`)}
    }else p.wilt=0;
    if(Math.random()<.07)p.pest=true;
    if(p.pest)p.health-=8;
    if(PLANTS[p.k].heat&&s.w==='heat'&&!p.shade)p.health-=12;
    if(!p.pest&&p.water>20)p.health=Math.min(100,p.health+3);
    if(p.age>PLANTS[p.k].grow+4)p.health=0;
    p.shade=false;
    if(p.health<=0){s.lost++;s.pts-=5;s.beds[i]=null;say(`💀 Lost a ${p.k}.`)}
  });
  if(s.day%4===0){s.feed=Math.min(5,s.feed+1);s.spray=Math.min(5,s.spray+1)}
  s.hist.push(score());s.day++;s.w=s.nw;s.nw=roll();
}
const score=()=>Math.round(s.pts-s.waste*.2);
let busy=0;
async function tick(){
  if(busy||(S.paused&&!tick.force))return;tick.force=0;busy=1;
  try{await think();sim();render()}finally{busy=0}
}
function render(){
  $('day').textContent='📅 Day '+s.day;$('mon').textContent='🗓️ '+MONTHS[mon()];
  $('wx').textContent=WX[s.w]+' → '+WX[s.nw];$('wx').title='today → tomorrow';
  $('tank').textContent='💧 '+Math.round(s.tank)+' L';$('spray').textContent='🧴 '+s.spray;$('feed').textContent='🧪 '+s.feed;$('bask').textContent='🧺 '+s.harvest;
  $('st').textContent=S.paused?'paused':'live';$('pause').textContent=S.paused?'Resume':'Pause';
  scene();
  $('log').innerHTML=s.log.map(l=>`<div><em>Day ${l.d}</em> ${l.m}</div>`).join('');
  $('pend').innerHTML=s.pending.length?s.pending.map((a,j)=>`<div>${txt(a)} <span class="mut">— ${a.why}</span> <button data-ok="${j}">Approve</button></div>`).join(''):'Nothing waiting.';
  const L=Object.entries(s.learn);$('learned').innerHTML=L.length?L.map(([k,v])=>`${PLANTS[k].e} Waters ${k} when it hits ${Math.round(th(k))}% (+${v} from wilting)`).join('<br>'):'Nothing yet. Raises a plant’s watering trigger after it wilts.';
  $('stats').innerHTML=`<span>Score <b>${score()}</b></span><span>Water wasted <b>${s.waste}</b> L</span><span>Plants lost <b>${s.lost}</b></span><span>Harvested <b>${s.harvest}</b></span>`;
  $('face').textContent=s.lost&&s.log[0]&&s.log[0].m.startsWith('💀')?'😟':S.paused?'😴':'🌱';
  chart();
}
function chart(){
  const c=$('chart'),d=s.hist,P=document.documentElement.dataset.theme==='pixel',cs=getComputedStyle(document.body);
  const w=c.width=P?120:c.clientWidth*2,h=c.height=P?40:260,x=c.getContext('2d');
  x.clearRect(0,0,w,h);x.fillStyle=cs.getPropertyValue('--line');x.fillRect(0,h-(P?1:2),w,P?1:2);
  if(d.length<2)return;
  const mx=Math.max(10,...d),mn=Math.min(0,...d),Y=v=>h-(P?3:10)-(v-mn)/(mx-mn)*(h-(P?6:24));
  x.fillStyle=cs.getPropertyValue('--leaf');x.strokeStyle=x.fillStyle;x.lineWidth=4;
  if(P)d.forEach((v,i)=>{const X=Math.round(i/(d.length-1)*(w-2));x.fillRect(X,Math.round(Y(v)),2,2)});
  else{x.beginPath();d.forEach((v,i)=>{const X=i/(d.length-1)*(w-8)+4;i?x.lineTo(X,Y(v)):x.moveTo(X,Y(v))});x.stroke()}
}
function advice(){
  const out=[],ps=s.beds.filter(Boolean);
  if(!ps.length)out.push('Your beds are empty — plant something that suits '+MONTHS[mon()]+': '+Object.keys(PLANTS).filter(k=>PLANTS[k].months.includes(mon())).join(', ')+'.');
  const dry=ps.slice().sort((a,b)=>a.water-b.water)[0];
  if(dry)out.push(`Thirstiest plant: ${dry.k} at ${Math.round(dry.water)}% water.`);
  const pests=ps.filter(p=>p.pest).length;if(pests)out.push(`${pests} plant(s) have pests — spraying helps.`);
  const ripe=ps.filter(p=>p.age>=PLANTS[p.k].grow).length;if(ripe)out.push(`${ripe} ready to harvest.`);
  out.push(s.nw==='rain'?'Rain tomorrow — I’ll hold back on watering.':s.nw==='heat'?'Heat tomorrow — I’ll shade lettuce and water more.':'Tomorrow looks '+s.nw+'.');
  if(s.waste>20)out.push('You’ve wasted '+s.waste+' L — try sliding toward Save water.');
  $('advice').innerHTML=out.join('<br>');
}
function restart(){clearInterval(timer);timer=setInterval(tick,S.secs*1000)}
const onDoc=e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.i!==undefined){const i=+b.dataset.i;if(!s.beds[i]){perform({t:'plant',i,k:S.seed,why:'you picked it'});render()}}
  if(b.dataset.ok!==undefined){perform(s.pending[+b.dataset.ok]);s.pending.splice(+b.dataset.ok,1);render()}
  if(b.dataset.seed){S.seed=b.dataset.seed;seeds()}
  if(b.dataset.t){document.querySelectorAll('.tabs button,.pane').forEach(x=>x.classList.remove('on'));b.classList.add('on');$(b.dataset.t).classList.add('on')}
  if(b.dataset.a!==undefined){S.auto=+b.dataset.a;autos()}
};
document.addEventListener('click',onDoc);
$('pause').onclick=()=>{S.paused=!S.paused;render()};
$('next').onclick=()=>{tick.force=1;tick();restart()};
$('reset').onclick=()=>{fresh();render()};
$('ask').onclick=advice;
$('brain').onclick=()=>{S.ai=!S.ai;$('brain').textContent='Brain: '+(S.ai?'AI':'Rules')};
function theme(t){document.documentElement.dataset.theme=t;$('theme').textContent=t==='pixel'?'Sleek mode':'Pixel mode';try{localStorage.setItem('ga-theme2',t)}catch(e){}if(s)chart()}
$('theme').onclick=()=>theme(document.documentElement.dataset.theme==='pixel'?'sleek':'pixel');
try{theme(localStorage.getItem('ga-theme2')||'pixel')}catch(e){theme('pixel')}
document.fonts&&document.fonts.ready.then(()=>s&&chart());
$('pamper').oninput=e=>{$('pv').textContent=e.target.value;if(s)render()};
$('maxh').oninput=e=>$('mv').textContent=e.target.value;
$('secs').oninput=e=>{S.secs=+e.target.value;$('sv').textContent=S.secs+'s';restart()};
function seeds(){$('seeds').innerHTML=Object.entries(PLANTS).map(([k,P])=>`<button data-seed="${k}" class="${S.seed===k?'on':''}">${P.e} ${k}</button>`).join('')}
function autos(){$('auto').innerHTML=AUTO.map((n,i)=>`<button data-a="${i}" class="${S.auto===i?'on':''}">${n}</button>`).join('')}
$('guide').innerHTML=Object.entries(PLANTS).map(([k,P])=>`<div>${P.e} <b>${k}</b> <span class="mut">— ${P.grow} days to ripen, season ${MONTHS[P.months[0]]}–${MONTHS[P.months[P.months.length-1]]}${P.heat?', hates heat':''}</span></div>`).join('');
const SC={bx:c=>8+c*58,by:r=>10+r*46};
const COL={tomato:['#4fbf3a','#2d7a2a','#e63b2e'],lettuce:['#9be564','#5fb03a','#d4f79a'],carrot:['#4fbf3a','#2d7a2a','#f08a24'],basil:['#2f9a3a','#1f6a2a','#6fd36a'],pepper:['#4fbf3a','#2d7a2a','#f2b01b']};
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
let bg;
function makeBg(){
  bg=document.createElement('canvas');bg.width=240;bg.height=150;
  const g=bg.getContext('2d'),R=rng(7),px=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
  px(0,0,240,150,'#4c9c3a');
  for(let i=0;i<500;i++)px(R()*240|0,R()*150|0,1,1,R()<.5?'#5db047':'#3f8a31');
  const path=(x,y,w,h)=>{px(x,y,w,h,'#b57a43');for(let i=0;i<w*h/10;i++)px(x+R()*w|0,y+R()*h|0,1,1,R()<.5?'#a26a38':'#c98f58')};
  [46,92].forEach(y=>path(0,y,240,10));[56,114,172].forEach(x=>path(x,0,10,150));
  for(let y=0;y<150;y++){const cx=119+Math.round(Math.sin(y/14)*1);px(cx-3,y,6,1,'#2a8fe0');px(cx-3,y,1,1,'#7fd0ff');px(cx+2,y,1,1,'#1c6ab8');if(R()<.12)px(cx-1,y,2,1,'#a8e4ff')}
  [46,92].forEach(y=>{px(113,y,12,10,'#8a5a2b');for(let k=0;k<10;k+=2)px(113,y+k,12,1,'#6d441f');px(113,y,12,1,'#4a2c14');px(113,y+9,12,1,'#4a2c14')});
  const dots=(x,y,w,h,n)=>{for(let i=0;i<n;i++){const a=x+R()*w|0,b=y+R()*h|0;px(a,b,1,1,rnd(['#fff','#ffe14a','#ff8ab8','#c9a8ff']))}};
  dots(0,0,240,9,10);dots(0,139,240,11,10);dots(0,0,7,150,6);dots(231,0,9,150,6);
  [[0,1],[231,1],[0,141],[230,140]].forEach(([x,y])=>{px(x+1,y,6,1,'#2e7a2e');px(x,y+1,8,5,'#2e7a2e');px(x+1,y+6,6,1,'#256325');px(x+2,y+2,2,2,'#4fae44');px(x+5,y+3,1,1,'#4fae44')});
}
function plant(g,x,y,p){
  const px=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(x+a,y+b,w,h)},P=PLANTS[p.k],[l,d,f]=COL[p.k],dry=p.water<20,L=dry?'#a8933a':l,D=dry?'#7d6b2a':d;
  if(p.age<1){px(4,7,2,1,D);px(4,6,1,1,L);return}
  const h=1+Math.round(Math.min(1,p.age/P.grow)*5);
  px(4,8-h,1,h,D);px(3,8-h,3,1,L);
  if(h>=3){px(2,9-h,2,1,L);px(6,10-h,2,1,L)}
  if(p.age<P.grow)return;
  ({tomato:()=>{px(2,3,3,3,f);px(5,5,3,3,f);px(3,3,1,1,'#fff')},
    lettuce:()=>{px(1,3,7,5,L);px(2,2,5,1,L);px(3,4,3,3,f)},
    carrot:()=>{px(3,6,4,2,f);px(4,5,2,1,D)},
    basil:()=>{px(1,3,7,5,L);px(2,2,5,1,D);px(3,4,3,3,f)},
    pepper:()=>{px(2,3,3,4,f);px(5,4,3,3,f);px(3,2,1,1,D)}})[p.k]();
}
function scene(){
  if(!bg)makeBg();
  const g=$('scene').getContext('2d'),px=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
  g.drawImage(bg,0,0);
  s.beds.forEach((p,i)=>{
    const x=SC.bx(i%4),y=SC.by(i/4|0);
    px(x,y,48,36,'#4a2c14');px(x+1,y+1,46,34,'#8a5a2b');px(x+3,y+3,42,30,'#33200f');px(x,y+34,48,2,'#3a2210');
    for(let k=0;k<14;k++)px(x+4+(k*7)%40,y+4+(k*11)%26,1,1,'#4a2e18');
    if(!p){px(x+21,y+17,5,1,'#b89a74');px(x+23,y+15,1,5,'#b89a74');return}
    for(let j=0;j<12;j++)plant(g,x+4+(j%4)*10,y+4+(j/4|0)*9,p);
    px(x,y+37,48,2,'#0008');px(x,y+37,Math.round(48*p.water/100),2,'#59c8ff');
    px(x,y+40,48,1,'#0008');px(x,y+40,Math.round(48*p.health/100),1,p.health>50?'#8be04e':'#ff5a4d');
    if(p.pest){px(x+42,y+1,4,3,'#e03030');px(x+43,y+1,1,1,'#fff')}
  });
  if(s.w==='rain'){const R=rng(s.day*13+1);g.fillStyle='#9fd8ffaa';for(let i=0;i<70;i++)g.fillRect(R()*240|0,R()*150|0,1,3)}
  if(s.w==='heat'){g.fillStyle='#ff8a2a1c';g.fillRect(0,0,240,150)}
}
const sc=$('scene');
const hit=e=>{const r=sc.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*240,y=(e.clientY-r.top)/r.height*150;for(let i=0;i<12;i++){const bx=SC.bx(i%4),by=SC.by(i/4|0);if(x>=bx&&x<bx+48&&y>=by&&y<by+36)return i}return -1};
sc.onclick=e=>{const i=hit(e);if(i>=0&&!s.beds[i]){perform({t:'plant',i,k:S.seed,why:'you picked it'});render()}};
sc.onmousemove=e=>{const i=hit(e),p=i>=0&&s.beds[i];sc.title=p?`${p.k}: water ${Math.round(p.water)}%, health ${Math.round(p.health)}%, day ${p.age}/${PLANTS[p.k].grow}`:i>=0?`Empty bed: click to plant ${S.seed}`:''};
fresh();seeds();autos();render();restart();

return()=>{clearInterval(timer);document.removeEventListener('click',onDoc)};
}
