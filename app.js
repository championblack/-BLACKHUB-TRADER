const $=id=>document.getElementById(id);
const STORE_KEY="blackhub-paper-v2";
const s={symbol:"XAUUSD",prices:{XAUUSD:2650,BTCUSD:68400},balance:10000,positions:[],history:[],totalOpened:0,bot:false,candles:[],priceHistory:[],botTradeIds:[],previousFast:null,previousSlow:null,botCooldownUntil:0};
try{const saved=JSON.parse(localStorage.getItem(STORE_KEY)||"null");if(saved){s.balance=Number(saved.balance)||10000;s.positions=Array.isArray(saved.positions)?saved.positions:[];s.history=Array.isArray(saved.history)?saved.history:[];s.totalOpened=Number(saved.totalOpened)||s.positions.length+s.history.length;}}catch(e){}
function saveData(){try{localStorage.setItem(STORE_KEY,JSON.stringify({balance:s.balance,positions:s.positions,history:s.history,totalOpened:s.totalOpened}));}catch(e){}}
const fmt=n=>n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const cash=n=>(n<0?"-$":"$")+Math.abs(n).toFixed(2);
const price=()=>s.prices[s.symbol],spread=()=>s.symbol==="XAUUSD"?.4:12;
const bid=()=>price()-spread()/2,ask=()=>price()+spread()/2;
const pnl=p=>(s.prices[p.symbol]-p.entry)*p.size*(p.side==="BUY"?1:-1);
function seed(){let p=price()*.997,v=s.symbol==="XAUUSD"?2.2:90;s.candles=Array.from({length:42},()=>{let o=p,c=o+(Math.random()-.48)*v;p=c;return{o,c,h:Math.max(o,c)+Math.random()*v*.5,l:Math.min(o,c)-Math.random()*v*.5}});s.priceHistory=s.candles.map(c=>c.c);draw()}
function draw(){const c=$("chart"),r=c.getBoundingClientRect(),d=window.devicePixelRatio||1;c.width=r.width*d;c.height=260*d;const x=c.getContext("2d");x.scale(d,d);const w=r.width,vals=s.candles.flatMap(a=>[a.h,a.l]);let lo=Math.min(...vals),hi=Math.max(...vals),pad=(hi-lo)*.12;lo-=pad;hi+=pad;const y=v=>12+(hi-v)/(hi-lo)*220;x.strokeStyle="#233246";x.fillStyle="#8190a4";x.font="10px monospace";for(let i=0;i<5;i++){let yy=12+i*55;x.beginPath();x.moveTo(0,yy);x.lineTo(w-52,yy);x.stroke();x.fillText(fmt(hi-i*(hi-lo)/4),w-48,yy+3)}const slot=(w-58)/s.candles.length;s.candles.forEach((a,i)=>{let xx=i*slot+slot/2,col=a.c>=a.o?"#22d69a":"#ff6478";x.strokeStyle=col;x.fillStyle=col;x.beginPath();x.moveTo(xx,y(a.h));x.lineTo(xx,y(a.l));x.stroke();x.fillRect(xx-2,Math.min(y(a.o),y(a.c)),4,Math.max(2,Math.abs(y(a.o)-y(a.c))))})}
function render(){const open=s.positions.reduce((a,p)=>a+pnl(p),0),wins=s.history.filter(p=>p.result>0).length,losses=s.history.filter(p=>p.result<0).length,grossProfit=s.history.filter(p=>p.result>0).reduce((a,p)=>a+p.result,0),grossLoss=Math.abs(s.history.filter(p=>p.result<0).reduce((a,p)=>a+p.result,0)),net=grossProfit-grossLoss;$("balance").textContent=cash(s.balance);$("equity").textContent=cash(s.balance+open);$("pl").textContent=cash(open);$("pl").className=open>=0?"positive":"negative";$("openCount").textContent=s.positions.length;$("openCountStats").textContent=s.positions.length;$("totalOpened").textContent=s.totalOpened;$("closed").textContent=s.history.length;$("wins").textContent=wins;$("losses").textContent=losses;$("grossProfit").textContent=cash(grossProfit);$("grossLoss").textContent=cash(grossLoss);$("netResult").textContent=cash(net);$("netResult").className=net>0?"positive":net<0?"negative":"";$("price").textContent=fmt(price());$("bid").textContent=fmt(bid());$("ask").textContent=fmt(ask());$("symbolTitle").textContent=s.symbol+" · "+(s.symbol==="XAUUSD"?"Gold / USD":"Bitcoin / USD");$("positionRows").innerHTML=s.positions.length?s.positions.map(p=>{const n=pnl(p);return '<tr><td>'+p.symbol+'</td><td>'+p.side+'</td><td>'+p.size+'</td><td>'+fmt(p.entry)+'</td><td>'+fmt(s.prices[p.symbol])+'</td><td class="'+(n>=0?"positive":"negative")+'">'+cash(n)+'</td><td><button class="close" data-id="'+p.id+'">CLOSE</button></td></tr>'}).join(""):'<tr><td colspan="7" class="empty">No open paper positions.</td></tr>';$("historyRows").innerHTML=s.history.length?s.history.slice().reverse().map(p=>'<tr><td>'+p.symbol+'</td><td>'+p.side+'</td><td>'+p.size+'</td><td>'+fmt(p.entry)+'</td><td>'+fmt(p.exit)+'</td><td>'+cash(p.result)+'</td></tr>').join(""):'<tr><td colspan="6" class="empty">No closed trades yet.</td></tr>'}
function openPaperTrade(side,size,source){const p={id:String(Date.now()+Math.random()),symbol:s.symbol,side,size,entry:side==="BUY"?ask():bid(),source};s.positions.push(p);s.totalOpened++;saveData();render();return p}
function closePosition(id){const i=s.positions.findIndex(p=>p.id===String(id));if(i<0)return;const p=s.positions.splice(i,1)[0],exit=p.symbol===s.symbol?(p.side==="BUY"?bid():ask()):s.prices[p.symbol],result=(exit-p.entry)*p.size*(p.side==="BUY"?1:-1);s.balance+=result;s.history.push({...p,exit,result});s.botTradeIds=s.botTradeIds.filter(x=>x!==p.id);saveData()}
function average(values,count){const a=values.slice(-count);return a.length?a.reduce((sum,n)=>sum+n,0)/a.length:0}
function ema(values,period){if(values.length<period)return null;const k=2/(period+1);let out=average(values.slice(0,period),period);for(let i=period;i<values.length;i++)out=values[i]*k+out*(1-k);return out}
function rsi(values,period=14){if(values.length<period+1)return 50;let gains=0,losses=0;for(let i=values.length-period;i<values.length;i++){const d=values[i]-values[i-1];if(d>0)gains+=d;else losses-=d}if(losses===0)return 100;const rs=(gains/period)/(losses/period);return 100-(100/(1+rs))}
function atrProxy(values,period=14){if(values.length<period+1)return spread()*2;let total=0;for(let i=values.length-period;i<values.length;i++)total+=Math.abs(values[i]-values[i-1]);return Math.max(total/period,spread()*1.5)}
function botStep(){
 if(!s.bot||s.priceHistory.length<51)return;
 const fast=ema(s.priceHistory,20),slow=ema(s.priceHistory,50),momentum=rsi(s.priceHistory,14),vol=atrProxy(s.priceHistory,14);
 if(fast===null||slow===null)return;
 let signal=null;
 if(s.previousFast!==null){
  if(s.previousFast<=s.previousSlow&&fast>slow&&momentum>=55)signal="BUY";
  else if(s.previousFast>=s.previousSlow&&fast<slow&&momentum<=45)signal="SELL";
 }
 s.previousFast=fast;s.previousSlow=slow;
 const botPositions=s.positions.filter(p=>p.source==="Bot-v2"&&p.symbol===s.symbol);
 if(botPositions.length){
  const p=botPositions[0],exitNow=p.side==="BUY"?bid():ask();
  const stopHit=p.side==="BUY"?exitNow<=p.stopLoss:exitNow>=p.stopLoss;
  const targetHit=p.side==="BUY"?exitNow>=p.takeProfit:exitNow<=p.takeProfit;
  const reverse=p.side==="BUY"?fast<slow:fast>slow;
  if(stopHit||targetHit||reverse){
   closePosition(p.id);s.botCooldownUntil=Date.now()+20000;
   $("feedback").textContent=stopHit?"Bot closed its paper trade at its stop level.":targetHit?"Bot reached its paper target.":"Bot closed after the trend filter reversed.";
   $("signals").textContent=stopHit?"Exit: stop level reached.":targetHit?"Exit: target level reached.":"Exit: EMA trend reversed.";
   render();return;
  }
  return;
 }
 if(!signal||Date.now()<s.botCooldownUntil)return;
 const entry=signal==="BUY"?ask():bid(),risk=Math.max(vol*2,spread()*3);
 const p=openPaperTrade(signal,3,"Bot-v2");
 p.stopLoss=signal==="BUY"?entry-risk:entry+risk;
 p.takeProfit=signal==="BUY"?entry+risk*1.5:entry-risk*1.5;
 s.botTradeIds=[p.id];saveData();
 $("feedback").textContent="Bot opened one 3-unit paper trade. EMA 20/50 + RSI filter; ATR-based stop and target.";
 $("signals").textContent="Signal: "+signal+" · EMA 20/50 trend crossover confirmed by RSI. One position only.";
 render();
}
function manualTrade(side){const size=Number($("size").value);if(!Number.isFinite(size)||size!==3){$("feedback").textContent="The demo lot size is fixed at 3.";return}openPaperTrade(side,size,"Manual")}
$("symbol").onchange=e=>{if(s.bot){s.bot=false;s.botTradeIds=[];$("bot").textContent="START BOT";$("botState").textContent="BOT PAUSED"}s.symbol=e.target.value;seed();render()};
$("buy").onclick=()=>manualTrade("BUY");$("sell").onclick=()=>manualTrade("SELL");
$("positionRows").onclick=e=>{if(e.target.dataset.id){closePosition(e.target.dataset.id);render()}};
$("bot").onclick=()=>{s.bot=!s.bot;$("bot").textContent=s.bot?"STOP BOT":"START BOT";$("bot").classList.toggle("stop",s.bot);$("botState").textContent=s.bot?"BOT RUNNING · PAPER ONLY":"BOT PAUSED";s.previousFast=null;s.previousSlow=null;s.botTradeIds=[];if(s.bot){$("feedback").textContent="Bot is waiting for a fresh 5/12 moving-average crossover. It opens five demo trades together."; $("signals").textContent="Waiting for crossover. Demo prices only."}else{$("feedback").textContent="Bot paused. Existing positions remain open."}};
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));["positions","history","signals"].forEach(id=>$(id).hidden=id!==b.dataset.tab)});
document.querySelectorAll("[data-tf]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-tf]").forEach(x=>x.classList.toggle("active",x===b))});
setInterval(()=>{for(const k of Object.keys(s.prices))s.prices[k]+=(Math.random()-.49)*(k==="XAUUSD"?2:85);const last=s.candles[s.candles.length-1];last.c=s.prices[s.symbol];last.h=Math.max(last.h,last.c);last.l=Math.min(last.l,last.c);s.priceHistory.push(s.prices[s.symbol]);if(s.priceHistory.length>100)s.priceHistory.shift();if(Math.random()>.65){const o=last.c;s.candles.push({o,c:o,h:o+.5,l:o-.5});s.candles.shift()}botStep();render();draw()},500);
window.onresize=draw;seed();render();