(()=>{'use strict';
const W=960,H=540,GR=1800,R=Math.random;
const cv=document.getElementById('c'),ctx=cv.getContext('2d'),ui=document.getElementById('ui');
const S={vol:.5,part:'high',shake:true,mode:'survival',c1:'ninja',c2:'runner',map:'dojo'};
const CH={
 runner:{n:'The Runner',hp:80,spd:320,jump:700,dj:1.15,wind:.65,dmg:1,res:1,col:'#3df',sp:'dash',spc:2.5,d:'Fast, fragile, high double-jump.<br>Special: Dash'},
 jugg:{n:'The Juggernaut',hp:170,spd:190,jump:600,dj:.85,wind:1.25,dmg:1.7,res:.4,col:'#f74',sp:'slam',spc:5,d:'Slow, tanky, huge damage.<br>Special: Ground Slam'},
 ninja:{n:'The Ninja',hp:100,spd:250,jump:660,dj:.95,wind:1,dmg:1,res:1,col:'#c6f',sp:'tp',spc:3,d:'Balanced.<br>Special: Teleport'}};
const MAPN={dojo:['The Dojo','Flat arena, no hazards'],sky:['Sky Islands','Floating islands, bottomless pits'],cyber:['Cyber City','Moving platform + timed lasers']};
const WP={
 katana:{n:'Katana',t:'melee',dmg:1.5,rng:70,dur:20,kb:1,dash:1,col:'#dde'},
 hammer:{n:'Heavy Hammer',t:'melee',dmg:2.4,rng:62,dur:12,kb:2,slow:1.6,col:'#c96'},
 blade:{n:'Energy Blade',t:'melee',dmg:1.8,rng:82,dur:16,kb:1,col:'#0ff'},
 rifle:{n:'Assault Rifle',t:'gun',dur:30,rate:.11,dmg:5,spd:900,col:'#fa0'},
 laser:{n:'Laser Blaster',t:'gun',dur:15,rate:.35,dmg:12,spd:1200,col:'#f0f'},
 bow:{n:'Bow',t:'gun',dur:8,rate:.6,dmg:16,spd:800,grav:300,col:'#8c4'},
 grenade:{n:'Grenade',t:'throw',dur:3,rate:.6,col:'#4a4'},
 shuriken:{n:'Shuriken',t:'throw',dur:8,rate:.3,col:'#ccd'},
 boomerang:{n:'Boomerang',t:'throw',dur:6,rate:.5,col:'#fc4'}};
const B2={l:['ArrowLeft'],r:['ArrowRight'],u:['ArrowUp'],d:['ArrowDown'],a:['Numpad1','Comma'],h:['Numpad2','Period'],s:['Numpad3','Slash'],g:['Numpad5','Semicolon']};
const mkB1=()=>{const b={l:['KeyA'],r:['KeyD'],u:['KeyW'],d:['KeyS'],a:['KeyJ'],h:['KeyK'],s:['KeyL'],g:['KeyI']};
 if(S.mode!=='versus'){b.l.push('ArrowLeft');b.r.push('ArrowRight');b.u.push('ArrowUp');b.d.push('ArrowDown');}return b;};
let G=null,M=null,cur='menu',AC;
const K={},P={};
const dn=(b,k)=>b[k].some(c=>K[c]),pr=(b,k)=>b[k].some(c=>P[c]);
addEventListener('keydown',e=>{if(!K[e.code])P[e.code]=1;K[e.code]=1;if(/^(Arrow|Space)/.test(e.code))e.preventDefault();if(e.code==='Escape')pause();});
addEventListener('keyup',e=>{K[e.code]=0});
addEventListener('blur',()=>{for(const k in K)K[k]=0});
function snd(f,d=.08,t='square',v=.15){if(!S.vol)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=t;o.frequency.value=f;g.gain.value=v*S.vol;g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d);}catch(e){}}
/* ---------- map ---------- */
function buildMap(m){
 const p=[],lasers=[];let walls=true;
 if(m==='dojo')p.push({x:0,y:470,w:W,h:70});
 if(m==='sky'){walls=false;p.push({x:80,y:440,w:260,h:30},{x:620,y:440,w:260,h:30},{x:340,y:330,w:280,h:20},{x:100,y:230,w:160,h:16},{x:700,y:230,w:160,h:16});}
 if(m==='cyber'){walls=false;p.push({x:0,y:470,w:340,h:70},{x:620,y:470,w:340,h:70},{x:100,y:320,w:140,h:16},{x:720,y:320,w:140,h:16},{x:420,y:360,w:120,h:16,mv:1,ox:420,rng:140,sp:.9});lasers.push({x:480,ph:0},{x:160,ph:2});}
 if(m==='sky'||m==='cyber')walls=false;
 if(m==='dojo')walls=true;
 return{p,walls,lasers};}
const hasG=(x,y)=>M.p.some(p=>x>p.x&&x<p.x+p.w&&p.y>=y-8&&p.y<y+220);
/* ---------- fx ---------- */
const pm=()=>S.part==='high'?1:.35;
function burst(x,y,col,n){n=Math.ceil(n*pm());for(let i=0;i<n;i++){const a=R()*6.28,s=80+R()*280;G.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:.4+R()*.3,max:.7,r:2+R()*3,col,g:600});}}
const puff=(x,y)=>burst(x,y,'#ccc',4);
function ghost(f){if(S.part==='low'&&R()<.6)return;G.fx.push({x:f.x,y:f.y-f.h/2,vx:0,vy:0,life:.22,max:.22,r:9,col:f.c.col,g:0,gh:1});}
const shake=n=>{if(S.shake)G.shake=Math.max(G.shake,n)};
const num=(x,y,txt,col)=>G.nums.push({x,y,txt,col,life:.9});
const banner=t=>G.banner={txt:t,t:2};
/* ---------- items ---------- */
const itemNear=f=>G.it.find(t=>t.rest&&Math.abs(t.x-f.x)<36&&Math.abs(t.y-f.y)<40);
function dropItem(f){G.it.push({x:f.x+f.face*14,y:f.y-20,vy:-200,vx:f.face*120,k:f.wp.k,dur:f.wp.dur,rest:0});f.wp=null;}
function crate(){if(G.it.length>5)return;const k=Object.keys(WP)[(R()*9)|0],st=M.p.filter(q=>!q.mv),p=st[(R()*st.length)|0];
 G.it.push({x:p.x+20+R()*(p.w-40),y:-30,vy:0,vx:0,k,dur:WP[k].dur,crate:1,rest:0});}
/* ---------- fighter ---------- */
class F{
 constructor(o){
  Object.assign(this,{vx:0,vy:0,w:22,h:56,face:1,onG:0,jc:0,atk:null,cd:0,spcd:0,wp:null,stun:0,inv:0,drop:0,dead:0,kills:0,dmgD:0,used:new Set(),shot:0,wall:0,dashT:0,plat:null,hb:null,lastHit:null,lv:.5,cr:0},o);
  this.c=CH[this.cls];this.max=this.hp=Math.round(this.c.hp*(o.hpm||1));}
 get box(){return{x:this.x-this.w/2,y:this.y-this.h,w:this.w,h:this.h}}
 update(dt,i){
  const c=this.c;
  this.cd-=dt;this.spcd-=dt;this.stun-=dt;this.inv-=dt;this.drop-=dt;this.shot-=dt;
  if(this.hb){this.hb.t-=dt;if(this.hb.t<=0)this.hb=null;}
  const st=this.stun>0;
  this.cr=(i.d&&this.onG&&!st&&!this.atk)?1:0;this.h=this.cr?38:56;
  const mv=(i.r?1:0)-(i.l?1:0);
  if(this.dashT>0){this.dashT-=dt;this.vx=this.face*680;this.vy=0;ghost(this);}
  else{
   if(st)this.vx*=Math.pow(.08,dt);
   else if(this.cr)this.vx*=Math.pow(.001,dt);
   else if(mv){this.face=mv;const sp=c.spd*(this.atk?.45:1);this.vx+=(mv*sp-this.vx)*Math.min(1,dt*(this.onG?16:7));}
   else this.vx*=Math.pow(this.onG?.0005:.15,dt);
   this.vy+=GR*dt*(i.d&&!this.onG&&this.vy>-50?1.8:1);
   if(this.wall&&this.vy>90)this.vy=90;
   if(this.vy>1100)this.vy=1100;
  }
  if(i.u&&!st&&this.dashT<=0){
   if(this.onG){this.vy=-c.jump;this.jc=1;this.onG=0;snd(420,.07,'sine');puff(this.x,this.y);}
   else if(this.wall){this.vy=-c.jump*.95;this.vx=-this.wall*320;this.face=-this.wall;snd(480,.06,'sine');}
   else if(this.jc<2){this.vy=-c.jump*c.dj;this.jc=2;snd(520,.06,'sine');puff(this.x,this.y);}
  }
  if(i.dp&&this.onG&&this.plat&&this.plat.h<40&&!this.atk&&!itemNear(this)){this.drop=.25;this.onG=0;this.y+=3;}
  const py=this.y;
  this.x+=this.vx*dt;this.y+=this.vy*dt;
  this.onG=0;this.plat=null;
  if(M.walls)this.x=Math.max(this.w/2,Math.min(W-this.w/2,this.x));
  if(this.vy>=0&&this.drop<=0)for(const p of M.p){
   if(this.x+this.w/2>p.x&&this.x-this.w/2<p.x+p.w&&py<=p.y+4&&this.y>=p.y){this.y=p.y;this.vy=0;this.onG=1;this.jc=0;this.plat=p;this.x+=p.dx||0;break;}
  }
  this.wall=0;
  if(M.walls&&!this.onG){if(this.x<=this.w/2+.5&&i.l)this.wall=-1;else if(this.x>=W-this.w/2-.5&&i.r)this.wall=1;}
  if(this.y>700||this.x<-150||this.x>W+150){
   if(G.mode==='train'){this.x=M.p[0].x+M.p[0].w/2;this.y=-40;this.vx=this.vy=0;}else this.hp=0;}
  if(this.onG&&Math.abs(this.vx)>340)ghost(this);
  if(this.atk){const a=this.atk;a.t+=dt;if(!a.hit&&a.t>=a.wind){a.hit=1;this.strike();}if(a.t>=a.end)this.atk=null;}
 }
 act(i){
  if(this.stun>0||this.dead)return;
  if(i.g)this.grab();
  if(i.dp){const it=itemNear(this);if(it)this.take(it);}
  if(i.a&&this.cd<=0&&!this.atk){if(this.wp&&this.wp.d.t!=='melee')this.fire();else this.startAtk(0);}
  else if(i.h&&this.cd<=0&&!this.atk)this.startAtk(1);
  if(i.s&&this.spcd<=0)this.special();
 }
 grab(){
  const it=itemNear(this);if(it)return this.take(it);
  const t=G.fs.find(o=>o!==this&&!o.dead&&Math.abs(o.x-this.x)<48&&Math.abs(o.y-this.y)<40&&Math.sign(o.x-this.x)===this.face);
  if(t&&this.cd<=0){this.cd=.5;t.hurt(9,this.face*620,420,this,.3);t.stun=.5;snd(90,.15,'sawtooth');return;}
  if(this.wp)dropItem(this);
 }
 take(it){
  if(this.wp)dropItem(this);
  const d=WP[it.k];this.wp={k:it.k,d,dur:it.dur};this.used.add(it.k);
  G.it.splice(G.it.indexOf(it),1);num(this.x,this.y-80,d.n,'#ff0');snd(700,.1,'triangle');
 }
 startAtk(h){
  const c=this.c,w=this.wp&&this.wp.d.t==='melee'?this.wp.d:null;
  const wind=(h?.3:.1)*c.wind*(w&&w.slow||1);
  this.atk={t:0,wind,end:wind+(h?.28:.16),hit:0,h,w};
  this.cd=this.atk.end+.03;
  if(w&&w.dash)this.vx+=this.face*(h?480:320);
  if(w){this.wp.dur--;if(this.wp.dur<=0){num(this.x,this.y-80,'BROKEN','#f55');this.wp=null;}}
  snd(h?200:300,.06,'sawtooth',.08);
 }
 strike(){
  const a=this.atk,w=a.w,rng=w?w.rng:(a.h?54:44);
  const dmg=Math.round((a.h?14:6)*(w?w.dmg:1)*this.c.dmg),kb=(a.h?560:300)*(w?w.kb:1);
  const hb={x:this.face>0?this.x:this.x-rng-this.w/2,y:this.y-this.h-4,w:rng+this.w/2,h:this.h+8,t:.12};
  this.hb=hb;
  for(const t of G.fs){
   if(t===this||t.dead||t.team===this.team)continue;
   const b=t.box;
   if(hb.x<b.x+b.w&&hb.x+hb.w>b.x&&hb.y<b.y+b.h&&hb.y+hb.h>b.y)t.hurt(dmg,this.face*kb,a.h?380:240,this);
  }
 }
 fire(){
  if(this.shot>0)return;
  const wp=this.wp,w=wp.d;this.shot=w.rate;this.cd=.05;
  const f=this.face,base={x:this.x+f*16,y:this.y-this.h*.6,vx:f*(w.spd||600),vy:0,g:0,owner:this,team:this.team,life:1.5,r:0,hits:[],col:w.col};
  if(w.t==='gun')G.pr.push({...base,type:'b',dmg:w.dmg,kb:220,g:w.grav||0,vy:w.grav?-60:0});
  else if(wp.k==='grenade')G.pr.push({...base,type:'g',vx:f*430,vy:-380,g:1500,life:1.4});
  else if(wp.k==='shuriken')G.pr.push({...base,type:'s',vx:f*760,dmg:7,kb:180,life:1});
  else G.pr.push({...base,type:'m',vx:f*640,dmg:9,kb:260,life:1.4,tt:0});
  if(w.t==='gun'){this.vx-=f*30;burst(base.x,base.y,w.col,2);}
  snd(w.t==='gun'?600:350,.05,'square',.07);
  if(--wp.dur<=0){num(this.x,this.y-80,'EMPTY','#f55');this.wp=null;}
 }
 special(){
  const c=this.c;this.spcd=c.spc;
  if(c.sp==='dash'){this.dashT=.16;this.inv=Math.max(this.inv,.2);snd(260,.12,'sawtooth');}
  else if(c.sp==='tp'){burst(this.x,this.y-28,c.col,14);this.x+=this.face*170;if(M.walls)this.x=Math.max(14,Math.min(W-14,this.x));this.vy=Math.min(this.vy,0);this.inv=.2;burst(this.x,this.y-28,c.col,14);snd(900,.1,'sine');}
  else{shake(10);burst(this.x,this.y,c.col,26);snd(70,.3,'sawtooth',.25);
   for(const t of G.fs)if(t!==this&&!t.dead&&t.team!==this.team&&Math.abs(t.x-this.x)<130&&Math.abs(t.y-this.y)<70)t.hurt(18,Math.sign(t.x-this.x||1)*450,550,this);}
 }
 hurt(d,kx,ky,by,inv=.08){
  if(this.inv>0||this.dead)return;
  const r=this.c.res;
  this.hp-=d;this.vx=kx*r;this.vy=-ky*r;this.onG=0;this.stun=(.12+d*.012)*(r<1?.55:1);this.inv=inv;this.atk=null;this.dashT=0;
  this.lastHit=by;if(by)by.dmgD+=d;
  burst(this.x,this.y-30,'#fff',8);burst(this.x,this.y-30,by?by.c.col:'#f80',6);
  num(this.x,this.y-this.h-10,d,d>=12?'#f44':'#fd4');
  shake(d>=12?9:3);snd(110+d*6,.09,'square',.12);
  if(G.mode==='train')this.hp=this.max;
 }
 draw(){
  if(this.dead)return;
  const x=this.x,y=this.y,f=this.face,c=this.c,h=this.h,t=G.t;
  ctx.save();ctx.globalAlpha=this.stun>0&&((t*40|0)&1)?.55:1;
  ctx.strokeStyle=c.col;ctx.lineWidth=this.cls==='jugg'?7:4.5;ctx.lineCap='round';
  const neck=y-h+16,hip=y-h*.42,run=this.onG&&Math.abs(this.vx)>30?Math.sin(t*18):0;
  let hx=x+f*10,hy=neck+18-run*4;
  if(this.atk){const p=this.atk.t/this.atk.end;hx=x+f*(12+30*Math.sin(p*Math.PI));hy=neck+10;}
  else if(this.wp&&this.wp.d.t!=='melee'){hx=x+f*22;hy=neck+10;}
  ctx.beginPath();ctx.moveTo(x,neck);ctx.lineTo(x,hip);
  if(!this.onG){ctx.moveTo(x,hip);ctx.lineTo(x-9,y-6);ctx.moveTo(x,hip);ctx.lineTo(x+9,y-14);}
  else if(this.cr){ctx.moveTo(x,hip);ctx.lineTo(x-14,y);ctx.moveTo(x,hip);ctx.lineTo(x+14,y);}
  else{ctx.moveTo(x,hip);ctx.lineTo(x+run*12,y);ctx.moveTo(x,hip);ctx.lineTo(x-run*12,y);}
  ctx.moveTo(x,neck+6);ctx.lineTo(x-f*12,neck+18+run*4);
  ctx.moveTo(x,neck+6);ctx.lineTo(hx,hy);ctx.stroke();
  ctx.fillStyle='#0b0b12';ctx.beginPath();ctx.arc(x,y-h+7,this.cls==='jugg'?10:8,0,7);ctx.fill();ctx.stroke();
  if(this.cls==='ninja'){ctx.strokeStyle='#f33';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-8,y-h+5);ctx.lineTo(x+8,y-h+5);ctx.moveTo(x-f*8,y-h+5);ctx.lineTo(x-f*18,y-h+9+run*2);ctx.stroke();}
  const a=this.atk,w=a?a.w:(this.wp&&this.wp.d.t==='melee'?this.wp.d:null);
  if(w){const p=a?a.t/a.end:0,ang=a?-1.7+2.6*p:-.6,L=w.rng*.85;
   ctx.strokeStyle=w.col;ctx.lineWidth=w===WP.hammer?8:3;ctx.shadowColor=w.col;ctx.shadowBlur=w===WP.blade?14:0;
   ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+f*Math.cos(ang)*L,hy+Math.sin(ang)*L);ctx.stroke();}
  else if(this.wp){const d=this.wp.d;ctx.strokeStyle=ctx.fillStyle=d.col;ctx.lineWidth=5;
   if(d.t==='gun'){ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+f*20,hy);ctx.stroke();}
   else{ctx.beginPath();ctx.arc(hx,hy,5,0,7);ctx.fill();}}
  ctx.restore();
  ctx.fillStyle=c.col;ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(this.name,x,y-h-22);
 }
}
/* ---------- input / AI ---------- */
const idle=()=>({l:0,r:0,u:0,d:0,dp:0,a:0,h:0,s:0,g:0});
function humanIn(f){const b=f.b,gun=f.wp&&f.wp.d.t==='gun';
 return{l:dn(b,'l'),r:dn(b,'r'),u:pr(b,'u'),d:dn(b,'d'),dp:pr(b,'d'),a:pr(b,'a')||(gun&&dn(b,'a')),h:pr(b,'h'),s:pr(b,'s'),g:pr(b,'g')};}
function aiIn(f,dt){
 const i=idle();if(f.dummy||f.dead||f.stun>0)return i;
 const t=G.fs.find(o=>o.team!==f.team&&!o.dead);if(!t)return i;
 const dx=t.x-f.x,ad=Math.abs(dx),lv=f.lv,w=f.wp,rangedW=w&&w.d.t!=='melee';
 const want=rangedW?300:w?w.d.rng-8:44;
 let goal=t.x;
 if(!w){const it=G.it.find(o=>o.rest&&Math.abs(o.x-f.x)<300&&Math.abs(o.y-f.y)<80);if(it){goal=it.x;if(Math.abs(it.x-f.x)<28)i.g=1;}}
 const gd=goal-f.x;
 if(goal!==t.x){if(Math.abs(gd)>20)i[gd>0?'r':'l']=1;}
 else if(ad>want)i[dx>0?'r':'l']=1;
 if(!f.atk&&!i.l&&!i.r)f.face=Math.sign(dx)||f.face;
 if(f.onG){if(!hasG(f.x+f.face*45,f.y)||(t.y<f.y-70&&ad<260&&R()<dt*3)||(ad<70&&R()<dt*.4*lv))i.u=1;}
 else if(f.vy>0&&f.y>300&&!hasG(f.x,f.y)){if(f.jc<2)i.u=1;const p=M.p.reduce((a,b)=>Math.abs(b.x+b.w/2-f.x)<Math.abs(a.x+a.w/2-f.x)?b:a);i[p.x+p.w/2>f.x?'r':'l']=1;}
 if(f.cd<=0&&Math.abs(t.y-f.y)<60&&f.face===Math.sign(dx)){
  if(rangedW){if(ad<520&&R()<dt*(2+4*lv))i.a=1;}
  else if(ad<want+10&&R()<dt*(1.5+5*lv)){if(R()<.35)i.h=1;else i.a=1;}
 }
 if(f.spcd<=0&&ad<220&&R()<dt*lv*.7)i.s=1;
 return i;
}
/* ---------- game flow ---------- */
function start(){
 M=buildMap(S.map);const gy=S.map==='sky'?440:470;
 G={mode:S.mode,fs:[],pr:[],it:[],fx:[],nums:[],t:0,wave:0,score:0,shake:0,dropT:8,over:0,paused:0,timer:99,nextT:1.2,banner:null,hitbox:S.mode==='train'};
 G.p1=new F({cls:S.c1,x:200,y:gy,team:1,human:1,name:'P1',b:mkB1()});G.fs.push(G.p1);
 if(S.mode==='versus'){G.p2=new F({cls:S.c2,x:760,y:gy,team:2,human:1,name:'P2',b:B2,face:-1});G.fs.push(G.p2);}
 if(S.mode==='train'){G.dummy=new F({cls:S.c2,x:760,y:gy,team:9,dummy:1,name:'DUMMY',face:-1});G.fs.push(G.dummy);}
 ui.innerHTML='';
}
function resetTrain(){const gy=S.map==='sky'?440:470;
 for(const [f,x] of [[G.p1,200],[G.dummy,760]]){f.x=x;f.y=gy;f.vx=f.vy=0;f.hp=f.max;f.wp=null;f.atk=null;f.stun=0;f.spcd=0;f.cd=0;}
 G.pr=[];G.it=[];}
function nextWave(){
 G.wave++;const n=Math.min(1+(G.wave>>1),4);banner('WAVE '+G.wave);
 const st=M.p.filter(p=>!p.mv&&p.w>=140);
 for(let k=0;k<n;k++){const p=st[(R()*st.length)|0];
  G.fs.push(new F({cls:['runner','jugg','ninja'][(R()*3)|0],x:p.x+20+R()*(p.w-40),y:-40-k*50,team:9,name:'CPU',lv:Math.min(1,.15+G.wave*.09),hpm:1+G.wave*.06,face:-1}));}
}
function explode(p){
 burst(p.x,p.y,'#fa0',30);burst(p.x,p.y,'#f33',16);shake(14);snd(60,.4,'sawtooth',.3);
 for(const t of G.fs){if(t.dead)continue;const d=Math.hypot(t.x-p.x,t.y-30-p.y);
  if(d<120)t.hurt(Math.max(4,Math.round(26*(1-d/150))),(Math.sign(t.x-p.x)||1)*600,500,t===p.owner?null:p.owner);}
}
function end(){
 G.over=1;const p1=G.p1,p2=G.p2;let title='GAME OVER';
 if(G.mode==='versus'){let w=0;
  if(p1.dead!==p2.dead)w=p1.dead?2:1;else if(p1.hp!==p2.hp)w=p1.hp>p2.hp?1:2;
  title=w?`PLAYER ${w} WINS!`:'DRAW!';}
 const row=f=>`<tr><td>${f.name}</td><td>${f.kills}</td><td>${Math.round(f.dmgD)}</td><td>${f.used.size}</td></tr>`;
 const extra=G.mode==='survival'?`<p>Wave reached: <b>${G.wave}</b> &nbsp; Score: <b>${G.score}</b></p>`:'';
 ui.innerHTML=`<div class="panel"><h2>${title}</h2>${extra}<table><tr><th>Player</th><th>Kills</th><th>Damage</th><th>Weapons used</th></tr>${row(p1)}${p2?row(p2):''}</table><button data-a="again">REMATCH</button><button data-a="menu">MAIN MENU</button></div>`;
}
function pause(){if(!G||G.over)return;G.paused=!G.paused;if(G.paused)show('pause');else ui.innerHTML='';}
function step(dt){
 G.t+=dt;G.shake=Math.max(0,G.shake-45*dt);
 if(G.banner&&(G.banner.t-=dt)<=0)G.banner=null;
 if(G.mode==='train'){if(P.KeyR)resetTrain();if(P.KeyT)G.hitbox=!G.hitbox;if(P.KeyC)crate();}
 for(const p of M.p)if(p.mv){const nx=p.ox+Math.sin(G.t*p.sp)*p.rng;p.dx=nx-p.x;p.x=nx;}
 if((G.dropT-=dt)<=0){crate();G.dropT=15+R()*15;}
 for(const f of G.fs){if(f.dead)continue;const i=f.human?humanIn(f):aiIn(f,dt);f.update(dt,i);f.act(i);}
 for(const f of G.fs)if(f.hp<=0&&!f.dead){f.dead=1;burst(f.x,f.y-30,f.c.col,30);shake(10);snd(80,.35,'sawtooth',.2);
  if(f.lastHit&&f.lastHit!==f)f.lastHit.kills++;if(f.team===9&&G.mode==='survival')G.score+=100+10*G.wave;}
 G.fs=G.fs.filter(f=>!f.dead||f.human);
 for(const L of M.lasers){const ph=(G.t+L.ph)%4;L.on=ph>3;L.warn=ph>2.4;
  if(L.on)for(const f of G.fs)if(!f.dead&&Math.abs(f.x-L.x)<f.w/2+12)f.hurt(14,(f.x>=L.x?1:-1)*380,420,null,.7);}
 for(let n=G.it.length;n--;){const it=G.it[n];
  if(it.rest){if(it.plat){it.x+=it.plat.dx||0;if(it.x<it.plat.x||it.x>it.plat.x+it.plat.w)it.rest=0;}continue;}
  it.vy=it.crate?130:it.vy+1100*dt;const py=it.y;it.y+=it.vy*dt;it.x+=it.vx*dt;it.vx*=.97;
  if(it.vy>=0)for(const p of M.p)if(it.x>p.x&&it.x<p.x+p.w&&py<=p.y+4&&it.y>=p.y){it.y=p.y;it.vy=it.vx=0;it.rest=1;it.plat=p;break;}
  if(it.y>700)G.it.splice(n,1);}
 for(let n=G.pr.length;n--;){const p=G.pr[n];p.life-=dt;p.r+=dt*18;
  if(p.type==='m'){p.tt+=dt;if(p.tt>.45&&!p.back){p.back=1;p.vx=-p.vx;p.hits=[];}}
  p.vy+=p.g*dt;const py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;
  let dead=p.life<=0||p.x<-60||p.x>W+60||p.y>700;
  if(p.type==='g'){
   for(const pl of M.p)if(p.vy>0&&p.x>pl.x&&p.x<pl.x+pl.w&&py<=pl.y&&p.y>=pl.y){p.y=pl.y;p.vy*=-.4;p.vx*=.6;}
   if(dead){explode(p);G.pr.splice(n,1);}continue;}
  for(const t of G.fs)if(!t.dead&&t.team!==p.team&&!p.hits.includes(t)&&Math.abs(p.x-t.x)<t.w/2+7&&p.y>t.y-t.h-4&&p.y<t.y+4){
   t.hurt(p.dmg,Math.sign(p.vx)*p.kb,160,p.owner);p.hits.push(t);burst(p.x,p.y,p.col,6);if(p.type!=='m')dead=true;}
  if(dead)G.pr.splice(n,1);}
 for(let n=G.fx.length;n--;){const q=G.fx[n];q.life-=dt;q.vy+=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.life<=0)G.fx.splice(n,1);}
 for(let n=G.nums.length;n--;){const q=G.nums[n];q.life-=dt;q.y-=40*dt;if(q.life<=0)G.nums.splice(n,1);}
 if(G.mode==='survival'){
  if(G.nextT>0){if((G.nextT-=dt)<=0)nextWave();}
  else if(!G.fs.some(f=>f.team===9&&!f.dead)){G.nextT=2.2;G.score+=50*G.wave;G.p1.hp=Math.min(G.p1.max,G.p1.hp+30);banner('WAVE '+G.wave+' CLEARED');}
  if(G.p1.dead)end();
 }else if(G.mode==='versus'){G.timer-=dt;if(G.timer<=0||G.fs.some(f=>f.dead))end();}
}
/* ---------- render ---------- */
const circ=(x,y,r)=>{ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,7);};
function bg(){
 const m=S.map,g=ctx.createLinearGradient(0,0,0,H),t=G?G.t:0;
 if(m==='dojo'){g.addColorStop(0,'#2b1b3a');g.addColorStop(1,'#c4573a');}
 else if(m==='sky'){g.addColorStop(0,'#3d8fee');g.addColorStop(1,'#cfeeff');}
 else{g.addColorStop(0,'#08051a');g.addColorStop(1,'#2a0a4a');}
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(m==='dojo'){ctx.fillStyle='#ffd27a';ctx.beginPath();circ(700,170,70);ctx.fill();ctx.fillStyle='rgba(0,0,0,.28)';for(let i=0;i<8;i++)ctx.fillRect(i*130+10,250,10,220);ctx.fillRect(0,250,W,10);}
 if(m==='sky'){ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();for(let i=0;i<6;i++){const cx=(i*220+t*12)%1200-120,cy=90+(i%3)*70;circ(cx,cy,30);circ(cx+30,cy+6,26);circ(cx-28,cy+8,22);}ctx.fill();}
 if(m==='cyber'){for(let i=0;i<12;i++){const bh=120+((i*97)%170),bx=i*80;ctx.fillStyle='#140a30';ctx.fillRect(bx,H-bh,70,bh);ctx.strokeStyle=i%2?'#0ff':'#f0f';ctx.lineWidth=2;ctx.strokeRect(bx,H-bh,70,bh);
  ctx.fillStyle=i%2?'#0ff5':'#f0f5';for(let y=H-bh+14;y<H-20;y+=26)ctx.fillRect(bx+12,y,10,6),ctx.fillRect(bx+40,y,10,6);}}
}
function plats(){
 for(const p of M.p){const m=S.map;
  if(m==='dojo'){ctx.fillStyle='#6b3f22';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#a8703c';ctx.fillRect(p.x,p.y,p.w,8);}
  else if(m==='sky'){ctx.fillStyle='#7a6650';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#5aa03a';ctx.fillRect(p.x-3,p.y,p.w+6,8);}
  else{ctx.fillStyle='#1a1240';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle=p.mv?'#f0f':'#0ff';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.fillRect(p.x,p.y,p.w,4);ctx.shadowBlur=0;}}
}
function bar(x,y,w,h,r,col){ctx.fillStyle='#000a';ctx.fillRect(x-2,y-2,w+4,h+4);ctx.fillStyle=col;ctx.fillRect(x,y,w*Math.max(0,Math.min(1,r)),h);}
function hud(){
 ctx.textBaseline='top';ctx.textAlign='left';
 [G.p1,G.p2||G.dummy].forEach((f,n)=>{if(!f)return;const x=n?W-310:10;
  ctx.font='bold 14px Trebuchet MS';ctx.fillStyle='#fff';
  ctx.fillText(f.name+' · '+f.c.n+'  '+Math.max(0,Math.ceil(f.hp))+'/'+f.max,x,6);
  const r=f.hp/f.max;bar(x,26,300,14,r,r>.5?'#4d4':r>.25?'#fc3':'#e33');
  bar(x,46,300,6,1-Math.max(0,f.spcd)/f.c.spc,f.c.col);
  if(f.wp){ctx.fillStyle=f.wp.d.col;ctx.fillText(f.wp.d.n+' ×'+f.wp.dur,x,58);bar(x+170,62,120,6,f.wp.dur/f.wp.d.dur,f.wp.d.col);}
 });
 ctx.textAlign='center';ctx.font='22px Impact, sans-serif';ctx.fillStyle='#fff';
 ctx.fillText(G.mode==='versus'?Math.ceil(Math.max(0,G.timer)):G.mode==='survival'?`WAVE ${G.wave}  SCORE ${G.score}`:'TRAINING',W/2,8);
 if(G.mode==='survival'){ctx.textAlign='right';ctx.font='bold 14px Trebuchet MS';ctx.fillText('ENEMIES: '+G.fs.filter(f=>f.team===9).length,W-10,8);}
 ctx.textAlign='center';ctx.font='12px Trebuchet MS';ctx.fillStyle='rgba(255,255,255,.7)';
 ctx.fillText(G.mode==='train'?'R reset · T hitboxes · C spawn crate · ESC pause':'ESC pause',W/2,H-16);
 if(G.mode==='train'){const a=G.p1.atk;ctx.fillText(a?`P1 frame ${a.t*60|0}/${a.end*60|0}  startup ${a.wind*60|0}f  ${a.hit?'ACTIVE/RECOVERY':'STARTUP'}`:'P1 idle',W/2,H-32);}
 if(G.banner){ctx.globalAlpha=Math.min(1,G.banner.t);ctx.font='64px Impact, sans-serif';ctx.fillStyle='#fff';ctx.shadowColor='#0ff';ctx.shadowBlur=20;ctx.fillText(G.banner.txt,W/2,180);ctx.shadowBlur=0;ctx.globalAlpha=1;}
}
function render(){
 ctx.textBaseline='alphabetic';ctx.save();
 if(G&&G.shake>0)ctx.translate((R()-.5)*G.shake,(R()-.5)*G.shake);
 bg();plats();
 if(G){
  for(const L of M.lasers){if(L.on){ctx.fillStyle='#f0a';ctx.shadowColor='#f0a';ctx.shadowBlur=20;ctx.fillRect(L.x-10,0,20,H);ctx.shadowBlur=0;}
   else if(L.warn){ctx.fillStyle='rgba(255,0,170,.25)';ctx.fillRect(L.x-2,0,4,H);}}
  for(const it of G.it){const d=WP[it.k];
   if(it.crate){if(!it.rest){ctx.strokeStyle='#eee';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(it.x,it.y-46,22,Math.PI,0);ctx.moveTo(it.x-22,it.y-46);ctx.lineTo(it.x,it.y-20);ctx.lineTo(it.x+22,it.y-46);ctx.stroke();}
    ctx.fillStyle='#a6752f';ctx.fillRect(it.x-13,it.y-26,26,26);ctx.strokeStyle='#5a3c12';ctx.lineWidth=2;ctx.strokeRect(it.x-13,it.y-26,26,26);}
   else{ctx.fillStyle=d.col;ctx.fillRect(it.x-8,it.y-12,16,8);}
   if(it.rest){ctx.fillStyle=d.col;ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillText(d.n,it.x,it.y-32);}}
  for(const f of G.fs)f.draw();
  for(const p of G.pr){ctx.strokeStyle=ctx.fillStyle=p.col;ctx.lineWidth=3;
   if(p.type==='b'){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.02,p.y-p.vy*.02);ctx.stroke();}
   else if(p.type==='g'){ctx.beginPath();ctx.arc(p.x,p.y,6,0,7);ctx.fill();}
   else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.beginPath();if(p.type==='s'){ctx.moveTo(-7,0);ctx.lineTo(7,0);ctx.moveTo(0,-7);ctx.lineTo(0,7);}else{ctx.moveTo(-9,-3);ctx.lineTo(0,5);ctx.lineTo(9,-3);}ctx.stroke();ctx.restore();}}
  for(const q of G.fx){ctx.globalAlpha=Math.max(0,q.life/q.max);ctx.fillStyle=q.col;ctx.beginPath();ctx.arc(q.x,q.y,q.gh?q.r*q.life/q.max:q.r,0,7);ctx.fill();}
  ctx.globalAlpha=1;ctx.textAlign='center';
  for(const q of G.nums){ctx.globalAlpha=Math.min(1,q.life*2);ctx.font='bold 20px Trebuchet MS';ctx.fillStyle=q.col;ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.strokeText(q.txt,q.x,q.y);ctx.fillText(q.txt,q.x,q.y);}
  ctx.globalAlpha=1;
  if(G.hitbox){ctx.lineWidth=1.5;for(const f of G.fs){if(f.dead)continue;const b=f.box;ctx.strokeStyle='#0f0';ctx.strokeRect(b.x,b.y,b.w,b.h);if(f.hb){ctx.strokeStyle='#f22';ctx.strokeRect(f.hb.x,f.hb.y,f.hb.w,f.hb.h);}}}
 }
 ctx.restore();
 if(G)hud();
}
/* ---------- menus ---------- */
const btn=(a,v,t,s='',c='')=>`<button data-a="${a}" data-v="${v}" class="${c}">${t}${s?`<small>${s}</small>`:''}</button>`;
const scr={
 menu:()=>`<h1>STICK<span>BRAWL</span></h1><p style="opacity:.8">${CH[S.c1].n} · ${MAPN[S.map][0]}</p>${btn('go','play','▶ PLAY')}${btn('go','chars','CHARACTER SELECT')}${btn('go','maps','MAP SELECT')}${btn('go','set','SETTINGS')}${btn('snd','','SOUND: '+(S.vol?'ON':'OFF'))}`,
 play:()=>`<h2>SELECT MODE</h2>${btn('mode','survival','CLASSIC SURVIVAL','Fight endless waves of tougher stickmen')}${btn('mode','versus','LOCAL 2-PLAYER VERSUS','Same keyboard · 99s timer')}${btn('mode','train','TRAINING','Infinite health · hitbox & frame data')}${btn('go','menu','BACK')}`,
 chars:()=>`<h2>CHARACTER SELECT</h2>${[['c1','PLAYER 1'],['c2','PLAYER 2 / DUMMY']].map(([k,l])=>`<p><b>${l}</b></p><div class="row">${Object.keys(CH).map(c=>btn(k,c,CH[c].n,CH[c].d,S[k]===c?'sel':'')).join('')}</div>`).join('')}${btn('go','menu','BACK')}`,
 maps:()=>`<h2>MAP SELECT</h2>${Object.keys(MAPN).map(m=>btn('map',m,MAPN[m][0],MAPN[m][1],S.map===m?'sel':'')).join('')}${btn('go','menu','BACK')}`,
 set:()=>`<h2>SETTINGS</h2><label>MASTER VOLUME <input type="range" id="vol" min="0" max="100" value="${S.vol*100}"></label><label>PARTICLES <select id="part"><option value="high" ${S.part==='high'?'selected':''}>High</option><option value="low" ${S.part==='low'?'selected':''}>Low</option></select></label><label>SCREEN SHAKE <input type="checkbox" id="shk" ${S.shake?'checked':''}></label>
 <table><tr><th></th><th>P1</th><th>P2</th></tr><tr><td>Move</td><td>A/D or ←/→</td><td>←/→</td></tr><tr><td>Jump ×2</td><td>W or ↑</td><td>↑</td></tr><tr><td>Crouch/Drop</td><td>S or ↓</td><td>↓</td></tr><tr><td>Light</td><td>J</td><td>Num1 or ,</td></tr><tr><td>Heavy</td><td>K</td><td>Num2 or .</td></tr><tr><td>Special</td><td>L</td><td>Num3 or /</td></tr><tr><td>Grab/Pickup/Drop</td><td>I (or ↓ pickup)</td><td>Num5 or ;</td></tr></table><small>In Versus, P1 uses WASD only.</small>${btn('go','menu','BACK')}`,
 pause:()=>`<h2>PAUSED</h2>${btn('resume','','RESUME')}${btn('again','','RESTART')}${btn('menu','','MAIN MENU')}`
};
function show(n){cur=n;if(!G)M=buildMap(S.map);ui.innerHTML=`<div class="panel">${scr[n]()}</div>`;}
ui.onclick=e=>{const b=e.target.closest('button');if(!b||!b.dataset.a)return;const{a,v}=b.dataset;snd(500,.05,'triangle');
 if(a==='go')show(v);
 else if(a==='mode'){S.mode=v;start();}
 else if(a==='c1'||a==='c2'||a==='map'){S[a]=v;show(cur);}
 else if(a==='snd'){S.vol=S.vol?0:.5;show('menu');}
 else if(a==='again')start();
 else if(a==='menu'){G=null;show('menu');}
 else if(a==='resume')pause();};
ui.oninput=e=>{const t=e.target;if(t.id==='vol')S.vol=t.value/100;else if(t.id==='part')S.part=t.value;else if(t.id==='shk')S.shake=t.checked;};
/* ---------- loop ---------- */
let last=0;
function loop(ts){requestAnimationFrame(loop);
 const dt=Math.min(.033,(ts-last)/1000||0);last=ts;
 try{if(G&&!G.paused&&!G.over)step(dt);render();}catch(err){console.error(err);}
 for(const k in P)delete P[k];}
show('menu');requestAnimationFrame(loop);
})();
