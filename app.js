const $=id=>document.getElementById(id);
const s={symbol:"XAUUSD",prices:{XAUUSD:2650,BTCUSD:68400},balance:10000,positions:[],history:[],bot:false,candles:[],priceHistory:[],botTradeIds:[],previousFast:null,previousSlow:null};
const fmt=n=>n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}),cash=n=>(n<0?"-$":"$")+Math.abs(n).toFixed(2),price=()=>s.prices[s.symbol],spread=()=>s.symbol==="XAUUSD"?.4:12,bid=()=>price()-spread()/2,ask=()=>price()+spread()/2,pnl=p=>(s.prices[p.symbol]-p.entry)*p.size*(p.side==="BUY"?1:-1);
function seed(){let p=price()*.997,v=s.symbol==="XAUUSD"?2.2:90;s.candles=Array.from({length:42},()=>{let o=p,c=o+(Math.random()-.48)*v,h=Math.max(o,c)+Math.random()*v*.5,l=Math.min(o,c)-Math.random()*v*.5;p=c;return{o,c,h,l}});s.priceHistory=s.candles.map(c=>c.c);draw()}
function draw(){let c=$("chart"),r=c.getBoundingClientRect(),d=devicePixelRatio||1;c.width=r.width*d;c.height=260*d;let x=c.getContext("2d");x.scale(d,d);let w=r.width,vals=s.candles.flatMap(a=>[a.h,a.l]),lo=Math.min(...vals),hi=Math.max(...vals),pad=(hi-lo)*.12;lo-=pad;hi+=pad;let y=v=>12+(hi-v)/(hi-lo)*220;x.strokeStyle="#233246";x.fillStyle="#8190a4";x.font="10px monospace";for(let i=0;i<5;i++){let yy=12+i*55;x.beginPath();x.moveTo(0,yy);x.lineTo(w-52,yy);x.stroke();x.fillText(fmt(hi-i*(hi-lo)/4),w-48,yy+3)}let slot=(w-58)/s.candles.length;s.candles.forEach((a,i)=>{let xx=i*slot+slot/2,col=a.c>=a.o?"#22d69a":"#ff6478";x.strokeStyle=x.fillStyle=col;x.beginPath();x.moveTo(xx,y(a.h));x.lineTo(xx,y(a.l));x.stroke();x.fillRect(xx-2,Math.min(y(a.o),y(a.c)),4,Math.max(2,Math.abs(y(a.o)-y(a.c))))})}
function render(){let open=s.positions.reduce((a,p)=>a+pnl(p),0);$("balance").textContent=cash(s.balance);$("equity").textContent=cash(s.balance+open);$("pl").textContent=cash(open);$("pl").className=open>=0?"positive":"negative";$("closed").textContent=s.history.length;$("price").textContent=fmt(price());$("bid").textContent=fmt(bid());$("ask").textContent=fmt(ask());$("symbolTitle").textContent=s.symbol+" · "+(s.symbol==="XAUUSD"?"Gold / USD":"Bitcoin / USD");$("positionRows").innerHTML=s.positions.length?s.positions.map(p=>{let n=pnl(p);return '<tr><td>'+p.symbol+'</td><td>'+p.side+'</td><td>'+p.size+'</td><td>'+fmt(p.entry)+'</td><td>'+fmt(s.prices[p.symbol])+'</td><td class="'+(n>=0?"positive":"negative")+'">'+cash(n)+'</td><td><button class="close" data-id="'+p.id+'">CLOSE</button></td></tr>'}).join(""):'<tr><td colspan="7" class="empty">No open paper positions.</td></tr>';$("historyRows").innerHTML=s.history.length?s.history.slice().reverse().map(p=>'<tr><td>'+p.symbol+'</td><td>'+p.side+'</td><td>'+p.size+'</td><td>'+fmt(p.entry)+'</td><td>'+fmt(p.exit)+'</td><td>'+cash(p.result)+'</td></tr>').join(""):'<tr><td colspan="6" class="empty">No closed trades yet.</td></tr>'}
function openPaperTrade(side,size,source="Manual"){let p={id:Date.now()+Math.random(),symbol:s.symbol,side,size,entry:side==="BUY"?ask():bid(),source};s.positions.push(p);$("feedback").textContent=source+" "+side+" paper trade opened at "+fmt(p.entry);render();return p}
function trade(side){let size=Number($("size").value);if(!Number.isFinite(size)||size<.01||size>5){$("feedback").textContent="Use a demo size from 0.01 to 5.";return}openPaperTrade(side,size)}
function close(id){let i=s.positions.findIndex(p=>String(p.id)===String(id));if(i<0)return;let p=s.positions.splice(i,1)[0],exit=p.symbol===s.symbol?(p.side==="BUY"?bid():ask()):s.prices[p.symbol],result=(exit-p.entry)*p.size*(p.side==="BUY"?1:-1);s.balance+=result;s.history.push({...p,exit,result});s.botTradeIds=s.botTradeIds.filter(x=>String(x)!==String(p.id));render()}
function average(values,count){let a=values.slice(-count);return a.reduce((sum,n)=>sum+n,0)/a.lefunction botStep(){
 if(!s.bot||s.priceHistory.length<12)return;
 const fast=average(s.priceHistory,5),slow=average(s.priceHistory,12);
 let signal=null;
 if(s.previousFast===null)signal=fast>=slow?"BUY":"SELL";
 else if(s.previousFast<=s.previousSlow&&fast>slow)signal="BUY";
 else if(s.previousFast>=s.previousSlow&&fast<slow)signal="SELL";
 s.previousFast=fast;s.previousSlow=slow;
 if(!signal)return;
 const botPositions=s.positions.filter(p=>s.botTradeIds.some(id=>String(id)===String(p.id)));
 if(botPositions.length&&botPositions[0].side===signal)return;
 if(botPositions.length){
   const ids=botPositions.map(p=>p.id);
   ids.forEach(id=>close(id));
   $("feedback").textContent="Bot closed all 5 paper trades after the opposite crossover.";
 }
 s.botTradeIds=[];
 for(let i=0;i<5;i++){const p=openPaperTrade(signal,.01,"Bot");s.botTradeIds.push(p.id)}
 $("signals").textContent="Bot opened 5 "+signal+" paper trades on "+s.symbol+" using a 5/12 moving-average crossover. All 5 close on the opposite crossover.";
}
n."}
}
$("symbol").onchange=e=>{if(s.bot){s.bot=false;s.botTradeIds=[];$("bot").textContent="START BOT";$("bot").classList.remove("stop");$("botState").textContent="BOT PAUSED";$("feedback").textContent="Bot paused because the instrument changed."}s.symbol=e.target.value;seed();render()};
$("buy").onclick=()=>trade("BUY");$("sell").onclick=()=>trade("SELL");
$("positionRows").onclick=e=>{if(e.target.dataset.id)close(e.target.dataset.id)};
$("bot").onclick=()=>{s.bot=!s.bot;$("bot").textContent=s.bot?"STOP BOT":"START BOT";$("bot").classList.toggle("stop",s.bot);$("botState").textContent=s.bot?"BOT RUNNING · PAPER ONLY":"BOT PAUSED";s.previousFast=null;s.previousSlow=null;s.botTradeId=null;if(s.bot){$("signals").textContent="Bot active: using a simple 5/12 moving-average crossover. Demo trades only, 5 demo positions of 0.01 each. All close on an opposite crossover. Simulated results can lose.";botStep()}else{$("feedback").textContent="Bot paused. Any open bot paper position remains open; close it manually if desired."}};
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));["positions","history","signals"].forEach(id=>$(id).hidden=id!==b.dataset.tab)});
document.querySelectorAll("[data-tf]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tf]").forEach(x=>x.classList.toggle("active",x===b))});
setInterval(()=>{for(let k of Object.keys(s.prices))s.prices[k]+=((Math.random()-.49)*(k==="XAUUSD"?2:85));let last=s.candles.at(-1);last.c=s.prices[s.symbol];last.h=Math.max(last.h,last.c);last.l=Math.min(last.l,last.c);s.priceHistory.push(s.prices[s.symbol]);if(s.priceHistory.length>100)s.priceHistory.shift();if(Math.random()>.65){let o=last.c;s.candles.push({o,c:o,h:o+.5,l:o-.5});s.candles.shift()}botStep();render();draw()},500);
window.onresize=draw;seed();render();