/* ===== Trial sol (injected before `function vt()` in the bundle) =====
 * Source of truth for the tutorial. Uses bundle-scope identifiers that exist at module level:
 *   l (React), S (icon), te (Dialog), se (modules), ve (urgent events), T (mission config).
 * Every name this chunk introduces is prefixed tut/Tut/TUT to avoid collisions in the flat bundle scope.
 *
 * The trial lets the player set the pace. A card points at a module, then gets out of the way so they
 * can look, then highlights one control. After they act, the highlight drops so the result is visible,
 * and the next card explains it. The script never switches modules for them.
 */
var TUT_KEY=`outpost_tutorial_v1`;
function tutLoad(){try{let v=localStorage.getItem(TUT_KEY);return v===`done`||v===`skipped`?v:null}catch{return null}}
function tutSave(v){try{localStorage.setItem(TUT_KEY,v)}catch{}}

var tutH=(...a)=>l.createElement(...a);
var tutB=t=>tutH(`b`,null,t);
var tutK=t=>tutH(`kbd`,null,t);
var tutIco=(name,size=17)=>tutH(S,{name,size});
var tutMod=id=>se.find(m=>m.id===id);
var tutName=id=>tutMod(id)?.name||`that module`;
var tutHot=id=>`button.hotspot[aria-label="${tutName(id)}"]`;
var tutTab=id=>{let i=se.findIndex(m=>m.id===id);return i<0?`.module-navigation`:`.module-navigation button:nth-child(${i+1})`};
var tutAway=id=>[tutHot(id),tutTab(id)];
var tutGo=id=>{let m=tutMod(id);return m?[`Tap the `,tutB(m.name),`, or press `,tutK(m.shortcut),`.`]:[`Open that module.`]};
var tutP=(...c)=>tutH(`p`,null,...c);
var tutEventDone=(s,id)=>!!(s.handledUrgentEventIds.includes(id)||s.lastUrgentResult?.eventId===id);
var tutEventOk=(s,id)=>s.lastUrgentResult?.eventId===id&&!!s.lastUrgentResult.resolved;
var tutArrow=v=>(v>=0?`↑ `:`↓ `)+Math.abs(v).toFixed(1);
var tutTask=()=>_e.get(`sync-sol-clock`);
var tutClockDone=s=>s.completedTaskIds.includes(`sync-sol-clock`);
function tutRates(state,patch){return De({...state,solElapsedSec:0,activeTask:null,crewRestRemainingSec:0,...patch})}
function tutJuice(state,cost){return state.resources.power<=cost+8?{power:Math.max(state.resources.power,cost+36)}:null}
function tutTable(head,rows){
  return tutH(`div`,{className:`tut-table`,role:`table`,style:{"--cols":head.length}},
    tutH(`div`,{className:`tut-tr tut-th`,role:`row`},...head.map((x,i)=>tutH(`span`,{key:i,role:`columnheader`},x))),
    ...rows.map((r,i)=>tutH(`div`,{className:`tut-tr`,role:`row`,key:i},
      tutH(`span`,{role:`rowheader`,className:`tut-rowlabel`},r.icon?tutIco(r.icon,15):null,` `,r.label),
      ...r.cells.map((c,j)=>tutH(`span`,{key:j,role:`cell`,className:c.tone?`tut-${c.tone}`:``},c.text)))));
}
function tutLegend(items){
  return tutH(`ul`,{className:`tut-list`},...items.map((it,i)=>tutH(`li`,{key:i},
    tutH(`span`,{className:`tut-dotico tut-c-${it.c}`,"aria-hidden":`true`},tutIco(it.icon,15)),
    tutH(`span`,null,tutB(it.title),` `,it.text))));
}
function tutChip(cls,icon,text){return tutH(`span`,{className:`tut-chip ${cls}`},tutIco(icon,13),` `,text)}

/* dot:false beats belong to the previous step, so the progress dots stay on the lesson, not every pause.
 * free: no dim and no highlight, so the player can look at what just happened.
 * until(state, selected) advances on its own once it is true. minWait is the shortest time on a beat.
 * holdAfter keeps a beat up for a moment after `until` becomes true. */
var TUT_BEATS=[
  {id:`welcome`,coach:!0,center:!0,targets:()=>[],nextLabel:`Let’s go`,
   title:()=>`Welcome, Commander!`,
   body:()=>[
     tutH(`p`,null,`Let’s look after a Mars colony together. When you make a choice, you give something up to get something you need.`),
     tutH(`p`,null,`This is a practice day. `,tutB(`Nothing is saved`),`. The clock is paused, and you can skip any time.`),
     tutH(`div`,{className:`tut-facts`},tutH(`span`,null,tutIco(`clock`,15),` A few minutes`),tutH(`span`,null,tutIco(`check`,15),` Nothing is saved`),tutH(`span`,null,tutIco(`flag`,15),` Skip any time`))]},

  {id:`clock`,coach:!0,targets:()=>[`.sol-status`],
   title:()=>`A Sol is one Mars day`,
   body:()=>[
     tutH(`p`,null,`One Sol lasts `,tutB(`${T.solDurationSec} seconds`),` here. `,tutB(`${T.daylightDurationSec} seconds`),` are daylight, while the solar panels fill the batteries. Then `,tutB(`${T.solDurationSec-T.daylightDurationSec} seconds`),` are night.`),
     tutH(`p`,null,`You have `,tutB(`${T.dayCount} days`),` to finish.`),
     tutH(`p`,{className:`tut-tip`},tutK(`Space`),` pauses the game, so you can stop and think.`)]},

  {id:`meters`,coach:!0,targets:()=>[`.resource-meters`],
   arm:({dispatch})=>dispatch({type:`tutorial-event`,greenhouseMode:`low`}),
   title:()=>`Four meters to watch`,
   body:()=>[
     tutLegend([
       {c:`sun`,icon:`power`,title:`Power`,text:`keeps the base running.`},
       {c:`blue`,icon:`water`,title:`Air & Water`,text:`is what the crew breathes and drinks.`},
       {c:`teal`,icon:`health`,title:`Crew Health`,text:`shows how safe the crew is.`},
       {c:`grape`,icon:`science`,title:`Research`,text:`is how you finish.`}]),
     tutH(`p`,null,`The `,tutB(`↑ ↓`),` arrows show if a meter is going up or down.`),
     tutH(`p`,null,`If Power, Air & Water, or Crew Health reaches zero, the mission ends.`)]},

  {id:`greenhouse-go`,coach:!0,module:`greenhouse`,dot:!1,
   until:(s,sel)=>sel===`greenhouse`,
   finish:({onSelect})=>onSelect(`greenhouse`),
   targets:()=>tutAway(`greenhouse`),
   title:()=>`Each place has one job`,
   body:()=>[tutP(`The Greenhouse turns power into air and water. Go ahead and open it.`)],
   hint:()=>tutGo(`greenhouse`)},

  /* A few seconds with the card gone, so they can open other modules without a prompt. */
  {id:`greenhouse-look`,dot:!1,wait:4000},

  {id:`greenhouse-act`,coach:!0,module:`greenhouse`,dot:!1,auto:!0,autoDelay:500,skipIfDone:!0,
   gate:s=>s.greenhouseMode===`high`,
   finish:({dispatch,onSelect})=>{onSelect(`greenhouse`);dispatch({type:`set-greenhouse-mode`,mode:`high`})},
   targets:()=>[`.mode-buttons`],
   title:()=>`Make more air and water`,
   body:()=>[tutP(`Try `,tutB(`High yield`),`. You use more power, but you make more air and water.`)],
   hint:()=>[`Press `,tutB(`High yield`),`.`]},

  {id:`greenhouse-see`,coach:!0,module:`greenhouse`,free:!0,dot:!1,run:!0,minWait:9000,
   title:()=>`Watch the meters`,
   body:()=>[tutP(`Power goes up slower, but air and water go up faster.`)]},

  {id:`greenhouse-why`,coach:!0,module:`greenhouse`,dot:!1,targets:()=>[`.resource-meters`],
   leave:({dispatch})=>dispatch({type:`tutorial-event`,greenhouseMode:`standard`}),
   title:()=>`More air, less power`,
   body:({state})=>{
     let a=tutRates(state,{greenhouseMode:`standard`}),b=tutRates(state,{greenhouseMode:`high`});
     return [
       tutP(`You gave up some `,tutB(`power`),`, but you gained `,tutB(`air and water`),`.`),
       tutTable([`Each second, in daylight`,`Standard`,`High yield`],[
         {label:`Power`,icon:`power`,cells:[{text:tutArrow(a.power)},{text:tutArrow(b.power),tone:b.power<a.power?`down`:`up`}]},
         {label:`Air & Water`,icon:`water`,cells:[{text:tutArrow(a.lifeSupport)},{text:tutArrow(b.lifeSupport),tone:b.lifeSupport>a.lifeSupport?`up`:`down`}]}]),
       tutP(`When air and water are low, turn the Greenhouse up.`),
       tutP(tutB(`Low`),` saves power, but air and water slowly fall.`),
       tutP(`Good astronauts switch modes whenever a meter runs low.`)]}},

  {id:`task-go`,coach:!0,module:`comms`,
   until:(s,sel)=>sel===`comms`,
   finish:({onSelect})=>onSelect(`comms`),
   targets:()=>tutAway(`comms`),
   title:()=>`Tasks fill Research`,
   body:()=>[tutP(`A task uses some power, but it raises Research. Open the `,tutB(`Comms Dish`),`.`)],
   hint:()=>tutGo(`comms`)},

  {id:`task-look`,dot:!1,wait:4000},

  {id:`task-act`,coach:!0,module:`comms`,dot:!1,auto:!0,autoDelay:500,skipIfDone:!0,
   gate:s=>!!s.activeTask||tutClockDone(s),
   finish:({dispatch,state,onSelect})=>{
     onSelect(`comms`);
     if(tutClockDone(state)||state.activeTask)return;
     if(state.resources.power<=8)dispatch({type:`tutorial-event`,resources:{power:40}});
     dispatch({type:`start-task`,taskId:`sync-sol-clock`})},
   targets:()=>[`.module-task`],
   title:()=>`Start the task`,
   body:()=>{
     let t=tutTask();
     return [
       tutH(`p`,null,`Look at what this one costs. Then look at what you get back.`),
       tutH(`ul`,{className:`tut-list tut-chips`},
         tutH(`li`,{key:1},tutChip(`trade-power`,`power`,`−${t.powerCost} power`),tutH(`span`,null,`The power you spend.`)),
         tutH(`li`,{key:2},tutChip(`trade-science`,`science`,`+${t.taskReward}% science`),tutH(`span`,null,`The research you gain.`)),
         tutH(`li`,{key:3},tutChip(`trade-science`,`cards`,`Science card`),tutH(`span`,null,`A science card.`))),
       tutH(`p`,null,`Go ahead and run it.`)]},
   hint:()=>[`Press `,tutB(`Start task`),`.`]},

  {id:`task-see`,coach:!0,module:`comms`,free:!0,dot:!1,minWait:12000,holdAfter:2250,
   run:s=>!!s.activeTask&&!tutClockDone(s),
   until:s=>tutClockDone(s),
   title:()=>`Power drops instantly`,
   body:()=>[tutP(`Power drops instantly. Watch the bar fill, then look at Research.`)]},

  {id:`task-done`,coach:!0,module:`comms`,dot:!1,targets:()=>[`.resource-meters`],
   title:()=>`Task complete`,
   body:()=>{
     let t=tutTask();
     return [tutP(`Great! `,tutB(`Research`),` went up by `,tutB(`+${t.taskReward}%`),`. A real mission would also give you a science card. This practice run does not save cards.`)]}},

  {id:`alert-spot`,coach:!0,module:`greenhouse`,eventId:`scrubber-pressure-spike`,minWait:11250,dismissOnModule:!0,
   until:(s,sel)=>sel===`greenhouse`,
   finish:({onSelect})=>onSelect(`greenhouse`),
   targets:()=>tutAway(`greenhouse`),
   arm:({dispatch,state})=>{
     let p={type:`tutorial-event`,eventId:`scrubber-pressure-spike`,remainingSec:35};
     let juice=tutJuice(state,8);if(juice)p.resources=juice;
     dispatch(p)},
   title:()=>`An alert just came in`,
   body:()=>[
     tutP(`The air cleaner is stuck. If you leave it, the crew loses air and water.`),
     tutP(`The timer stays paused until you get there.`)],
   hint:()=>tutGo(`greenhouse`)},

  {id:`alert-look`,dot:!1,eventId:`scrubber-pressure-spike`,wait:4000},

  {id:`alert-act`,coach:!0,module:`greenhouse`,dot:!1,eventId:`scrubber-pressure-spike`,auto:!0,autoDelay:0,skipIfDone:!0,
   gate:s=>tutEventDone(s,`scrubber-pressure-spike`),
   run:(s,sel)=>sel===`greenhouse`&&!tutEventDone(s,`scrubber-pressure-spike`),
   finish:({dispatch,state,onSelect})=>{
     onSelect(`greenhouse`);
     if(tutEventDone(state,`scrubber-pressure-spike`))return;
     dispatch({type:`tutorial-event`,eventId:`scrubber-pressure-spike`,remainingSec:35,resources:{power:Math.max(state.resources.power,40)}});
     dispatch({type:`resolve-urgent-event`,eventId:`scrubber-pressure-spike`})},
   targets:()=>[`#anomaly-response`],
   arm:({dispatch,state})=>{let juice=tutJuice(state,8);if(juice)dispatch({type:`tutorial-event`,resources:juice})},
   title:()=>`Keep the air and water`,
   body:()=>[
     tutP(`Press `,tutB(`Purge & Vent`),`. You spend a little power, but you keep the air and water.`),
     tutP(`The timer is running now.`)],
   hint:()=>[`Press `,tutB(`Purge & Vent`),`.`]},

  {id:`alert-see`,coach:!0,module:`greenhouse`,free:!0,dot:!1,eventId:`scrubber-pressure-spike`,minWait:9000,
   title:({state})=>tutEventOk(state,`scrubber-pressure-spike`)?`Alert cleared`:`The alert timed out`,
   body:({state})=>tutEventOk(state,`scrubber-pressure-spike`)
     ?[tutP(`Great! You fixed it in time. The alert is gone.`)]
     :[tutP(`Oopsie! Time ran out. The crew lost some air and water.`)]},

  {id:`alert-why`,coach:!0,dot:!1,eventId:`scrubber-pressure-spike`,
   targets:({state})=>tutEventOk(state,`scrubber-pressure-spike`)?[]:[`.resource-meters`],
   title:()=>`Alerts are timed`,
   body:({state})=>tutEventOk(state,`scrubber-pressure-spike`)
     ?[tutP(`Next time, fix the alert before the timer ends.`)]
     :[tutP(`The crew lost air and water. Next time, open the place the alert names before the timer ends.`)]},

  {id:`shield-go`,coach:!0,module:`habitat`,
   until:(s,sel)=>sel===`habitat`,
   finish:({onSelect})=>onSelect(`habitat`),
   targets:()=>tutAway(`habitat`),
   title:()=>`Block the Sun’s radiation`,
   body:()=>[tutP(`The `,tutB(`Water-Wall Shelter`),` uses power to block the Sun’s radiation. Let’s open it.`)],
   hint:()=>tutGo(`habitat`)},

  {id:`shield-look`,dot:!1,wait:4000},

  {id:`shield-show`,coach:!0,module:`habitat`,bringBack:!0,dot:!1,
   finish:({onSelect})=>onSelect(`habitat`),
   targets:()=>[`.mode-buttons`],
   title:()=>`Stronger shield, more power`,
   body:()=>[
     tutTable([`Mode`,`Blocks radiation`,`Power use`],[`passive`,`active`,`lockdown`].map(k=>({label:de[k].label,cells:[{text:`${Math.round(de[k].mitigation*100)}%`,tone:k===`lockdown`?`up`:``},{text:de[k].powerDraw===0?`None`:`${de[k].powerDraw.toFixed(1)} / sec`,tone:de[k].powerDraw>2?`down`:``}]}))),
     tutP(`A stronger shield keeps the crew safer, but it uses more power.`),
     tutP(`Turn the water wall back down when you are not using it.`),
     tutP(`If crew health is low because of radiation, turn the water shield up. Otherwise the radiation keeps getting through.`),
     tutH(`p`,{className:`tut-tip`},`When power is low, or you are in a pinch, try `,tutB(`Battery Eco`),` in the Solar Array. It saves 20% power, but tasks take longer.`),
     tutP(`You can also turn down whichever module you can spare, so you keep the power you have.`)],
   hint:()=>null},

  {id:`wave-spot`,coach:!0,module:`habitat`,eventId:`peak-proton-wave`,minWait:11250,dismissOnModule:!0,
   until:(s,sel)=>sel===`habitat`,
   finish:({onSelect})=>onSelect(`habitat`),
   targets:()=>tutAway(`habitat`),
   arm:({dispatch,state})=>{
     let p={type:`tutorial-event`,eventId:`peak-proton-wave`,remainingSec:35};
     if(state.shieldMode===`lockdown`)p.shieldMode=`passive`;
     let juice=tutJuice(state,15);if(juice)p.resources=juice;
     dispatch(p)},
   title:()=>`Particles from the Sun`,
   body:()=>[tutP(`The shelter can block these particles if you spend power.`)],
   hint:({here})=>here?null:tutGo(`habitat`)},

  {id:`wave-look`,dot:!1,eventId:`peak-proton-wave`,wait:4000},

  {id:`wave-act`,coach:!0,module:`habitat`,dot:!1,eventId:`peak-proton-wave`,auto:!0,autoDelay:0,skipIfDone:!0,
   gate:s=>tutEventDone(s,`peak-proton-wave`),
   run:(s,sel)=>sel===`habitat`&&!tutEventDone(s,`peak-proton-wave`),
   finish:({dispatch,state,onSelect})=>{
     onSelect(`habitat`);
     if(tutEventDone(state,`peak-proton-wave`))return;
     dispatch({type:`tutorial-event`,eventId:`peak-proton-wave`,remainingSec:35,resources:{power:Math.max(state.resources.power,48)},shieldMode:state.shieldMode===`lockdown`?`passive`:void 0});
     dispatch({type:`resolve-urgent-event`,eventId:`peak-proton-wave`})},
   targets:()=>[`#anomaly-response`],
   leave:({dispatch,state})=>{if(state.shieldMode===`lockdown`)dispatch({type:`tutorial-event`,shieldMode:`passive`})},
   arm:({dispatch,state})=>{let juice=tutJuice(state,15);if(juice)dispatch({type:`tutorial-event`,resources:juice})},
   title:()=>`Block the wave`,
   body:()=>[
     tutP(`Press `,tutB(`Capacitor Overdrive`),`. You spend a lot of power, but the crew stays safer.`),
     tutP(`The timer is running now.`)],
   hint:()=>[`Press `,tutB(`Capacitor Overdrive`),`.`]},

  {id:`wave-see`,coach:!0,module:`habitat`,free:!0,dot:!1,eventId:`peak-proton-wave`,minWait:9000,
   title:({state})=>tutEventOk(state,`peak-proton-wave`)?`Wave blocked`:`The wave got through`,
   body:({state})=>tutEventOk(state,`peak-proton-wave`)
     ?[tutP(`Great! The crew is safer. Look at their health.`)]
     :[tutP(`Oopsie! Health dropped. Look at the meters.`)]},

  {id:`wave-why`,coach:!0,dot:!1,eventId:`peak-proton-wave`,
   targets:({state})=>tutEventOk(state,`peak-proton-wave`)?[]:[`.resource-meters`],
   title:()=>`Shelter first`,
   body:({state})=>tutEventOk(state,`peak-proton-wave`)
     ?[tutP(`You spent some power to keep the crew safer. Don’t forget to turn the water wall back down when you are not using it.`)]
     :[tutP(`Health dropped. If crew health is low because of radiation, turn the water shield up.`)]},

  {id:`ready`,coach:!0,center:!0,last:!0,nextLabel:`Start Sol 1`,targets:()=>[],
   title:()=>`You’re ready, Commander!`,
   body:()=>[
     tutH(`ul`,{className:`tut-keys`},
       tutH(`li`,{key:1},tutK(`Space`),` Pause and plan`),
       tutH(`li`,{key:2},tutK(`1–5`),` Open a place`),
       tutH(`li`,{key:3},tutK(`R`),` Retry the current day`),
       tutH(`li`,{key:4},tutK(`M`),` Mute`)),
     tutH(`p`,null,`You know the choices now. Fill Research to `,tutB(`100%`),`, and keep Power, Air & Water, and Crew Health above zero.`)]}
];

/* ---------- geometry ----------
 * Holes use evenodd, so a box inside another box fills back in and blocks clicks.
 * tutPrune drops those inner boxes. Highlight rings snap; only the card eases. */
var TUT_PAD=8;
function tutPrune(rects){
  return rects.filter((a,i)=>!rects.some((b,j)=>j<i&&a.x>=b.x-1&&a.y>=b.y-1&&a.x+a.w<=b.x+b.w+1&&a.y+a.h<=b.y+b.h+1));
}
function tutHolePath(vw,vh,rects){
  let d=`M0 0H${vw}V${vh}H0Z`;
  for(let r of rects){
    let x=r.x,y=r.y,w=r.w,h=r.h,k=Math.min(18,w/2,h/2);
    d+=`M${x+k} ${y}H${x+w-k}A${k} ${k} 0 0 1 ${x+w} ${y+k}V${y+h-k}A${k} ${k} 0 0 1 ${x+w-k} ${y+h}H${x+k}A${k} ${k} 0 0 1 ${x} ${y+h-k}V${y+k}A${k} ${k} 0 0 1 ${x+k} ${y}Z`;
  }
  return d;
}
function tutOverlap(a,b){let w=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),h=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);return w>0&&h>0?w*h:0}
function tutPlace(rects,cw,ch,vw,vh){
  let M=14,G=16,clampX=x=>Math.max(M,Math.min(x,vw-cw-M)),clampY=y=>Math.max(M,Math.min(y,vh-ch-M));
  if(!rects.length)return{left:Math.round((vw-cw)/2),top:Math.round((vh-ch)/2)};
  let all={x:Math.min(...rects.map(r=>r.x)),y:Math.min(...rects.map(r=>r.y))};
  all.w=Math.max(...rects.map(r=>r.x+r.w))-all.x;all.h=Math.max(...rects.map(r=>r.y+r.h))-all.y;
  let cands=[];
  for(let r of [...rects,all])cands.push(
    {left:clampX(r.x+r.w/2-cw/2),top:r.y+r.h+G},{left:clampX(r.x+r.w/2-cw/2),top:r.y-ch-G},
    {left:r.x+r.w+G,top:clampY(r.y+r.h/2-ch/2)},{left:r.x-cw-G,top:clampY(r.y+r.h/2-ch/2)});
  cands.push({left:M,top:vh-ch-M},{left:vw-cw-M,top:vh-ch-M},{left:clampX((vw-cw)/2),top:vh-ch-M});
  let best=null,bestScore=1/0;
  for(let c of cands){
    let box={x:c.left,y:c.top,w:cw,h:ch};
    let off=(box.x<M-1||box.y<M-1||box.x+cw>vw-M+1||box.y+ch>vh-M+1)?1e9:0;
    let score=off+rects.reduce((s,r)=>s+tutOverlap(box,r)*4,0);
    if(score<bestScore){best=c;bestScore=score;if(score===0)break}
  }
  return{left:Math.round(best.left),top:Math.round(best.top)};
}
/* Park the card in the left column, under the full-width meters, while the player looks. */
function tutPark(cw,ch,vw,vh){
  let M=16,top=Math.min(268,Math.max(M,vh-ch-M));
  return{left:M,top:Math.max(M,Math.min(top,vh-ch-M))};
}
function tutMeasure(selectors){
  let rects=[];
  for(let sel of selectors){
    let x1=1/0,y1=1/0,x2=-1/0,y2=-1/0;
    document.querySelectorAll(sel).forEach(el=>{let r=el.getBoundingClientRect();if(r.width>0&&r.height>0){x1=Math.min(x1,r.left);y1=Math.min(y1,r.top);x2=Math.max(x2,r.right);y2=Math.max(y2,r.bottom)}});
    if(x1<1/0)rects.push({x:Math.round(x1-TUT_PAD),y:Math.round(y1-TUT_PAD),w:Math.round(x2-x1+TUT_PAD*2),h:Math.round(y2-y1+TUT_PAD*2)});
  }
  return tutPrune(rects);
}
var TUT_SLOTS=4;
function tutSlots(host,kind){return [...host.querySelectorAll(`[data-tut="${kind}"]`)]}
function tutSteps(){return TUT_BEATS.filter(b=>b.coach&&b.dot!==false)}
function tutStepAt(i){let n=-1;for(let k=0;k<=i;k++)if(TUT_BEATS[k].coach&&TUT_BEATS[k].dot!==false)n++;return n}

/* ---------- overlay ---------- */
function TutorialLayer({state,selected,onSelect,dispatch,isReplay,runId,onFinish,onSkip}){
  let [idx,setIdx]=l.useState(0),[stuckId,setStuckId]=l.useState(null),[readReady,setReadReady]=l.useState(!1),[leaveAsk,setLeaveAsk]=l.useState(!1);
  let cardRef=l.useRef(null),dimRef=l.useRef(null),fxRef=l.useRef(null);
  let idxRef=l.useRef(0),stateRef=l.useRef(state),targetsRef=l.useRef([]),openRef=l.useRef(!1),freeRef=l.useRef(!1),runSeen=l.useRef(runId),selectedRef=l.useRef(selected);
  /* Replay while a trial is already open must start the script over. The layer stays mounted. */
  if(runSeen.current!==runId){
    runSeen.current=runId;
    idxRef.current=0;
    if(idx!==0) setIdx(0);
    if(stuckId!==null) setStuckId(null);
  }
  stateRef.current=state;
  selectedRef.current=selected;
  let beat=TUT_BEATS[idx],last=TUT_BEATS.length-1,stuck=stuckId===beat.id;
  let here=!beat.module||selected===beat.module;
  let done=beat.gate?!!beat.gate(state,selected):!0;
  let arrived=beat.until?!!beat.until(state,selected):!0;
  let running=!!state.activeTask&&!tutClockDone(state);
  let needModule=!!(beat.module&&!here);
  let ctx={state,selected,here,done,running,beat};
  let targets=beat.targets?beat.targets(ctx):[];
  /* Only pull them back when this step's control is on that module. */
  let mustReturn=needModule&&!beat.free&&(!!beat.gate||!!beat.bringBack);
  if(mustReturn)targets=[...new Set([...tutAway(beat.module),...targets])];
  let clock=typeof beat.run===`function`?!!beat.run(state,selected):!!beat.run;
  /* Free beats stay open even if the player wanders. The next step points them back. */
  let free=!!beat.free;
  /* dismissOnModule keeps the travel buttons clickable even if the player is already there. */
  let open=!free&&(mustReturn||!!(beat.gate&&!done)||!!(beat.until&&!arrived)||!!beat.dismissOnModule);
  targetsRef.current=targets;
  openRef.current=open;
  freeRef.current=free;
  let steps=tutSteps(),stepAt=tutStepAt(idx);

  let go=next=>{
    next=Math.max(0,Math.min(last,next));
    if(next===idxRef.current)return;
    let prev=TUT_BEATS[idxRef.current],s=stateRef.current;
    if(prev&&prev.leave)prev.leave({dispatch,state:s,done:prev.gate?!!prev.gate(s,selectedRef.current):!0});
    /* Already done during the look-around: never flash the prompt. */
    while(next<last){
      let cand=TUT_BEATS[next];
      if(!(cand.skipIfDone&&cand.gate&&cand.gate(stateRef.current,selectedRef.current)))break;
      if(cand.leave)cand.leave({dispatch,state:stateRef.current,done:!0});
      next++;
    }
    let b=TUT_BEATS[next];
    if(prev&&prev.eventId&&prev.eventId!==b.eventId)dispatch({type:`tutorial-event`,clearEvent:!0});
    idxRef.current=next;
    if(b.arm)b.arm({dispatch,state:stateRef.current});
    setIdx(next);
  };
  let skipStep=()=>{
    let b=TUT_BEATS[idxRef.current];
    if(b.finish)b.finish({dispatch,state:stateRef.current,onSelect});
    go(idxRef.current+1);
  };

  l.useEffect(()=>{if(state.outcome)dispatch({type:`tutorial-event`,clearEvent:!0,greenhouseMode:`standard`,shieldMode:`passive`,resources:{power:72,lifeSupport:72,health:72}})},[state.outcome]);
  l.useEffect(()=>{dispatch({type:`set-paused`,reason:`tutorial`,paused:!clock})},[clock]);
  l.useEffect(()=>{
    let start=Date.now(),readyAt=0,b0=TUT_BEATS[idx];
    let beganHere=!!(b0.until&&b0.until(stateRef.current,selectedRef.current));
    if(!b0.until&&!b0.minWait&&!b0.wait&&!b0.holdAfter)return;
    if(b0.wait&&!b0.until&&!b0.minWait&&!b0.holdAfter){let t=setTimeout(()=>go(idx+1),b0.wait);return()=>clearTimeout(t)}
    let t=setInterval(()=>{
      let b=TUT_BEATS[idx];
      let ok=!b.until||!!b.until(stateRef.current,selectedRef.current);
      if(!ok){readyAt=0;return}
      /* Clicking over to the module dismisses an alert card at once. Already being there still leaves time to read. */
      if(b.dismissOnModule&&!beganHere){go(idx+1);return}
      if(!readyAt)readyAt=Date.now();
      if(Date.now()-start<(b.minWait||0))return;
      if(Date.now()-readyAt<(b.holdAfter||0))return;
      go(idx+1);
    },200);
    return()=>clearInterval(t);
  },[idx]);
  /* Fast readers can move on halfway through a reading card. Alert cards stay until the module is opened. */
  l.useEffect(()=>{
    setReadReady(!1);
    let b=TUT_BEATS[idx];
    /* Urgent prompts stay until the module is opened. The parked wait cards still get an early Next. */
    if(!b.minWait||(b.eventId&&!b.free))return;
    let t=setTimeout(()=>setReadReady(!0),Math.round(b.minWait/2));
    return()=>clearTimeout(t);
  },[idx]);
  l.useEffect(()=>{
    let b=TUT_BEATS[idx];
    if(!b.dismissOnModule||!b.module)return;
    let sels=tutAway(b.module);
    let onClick=e=>{
      let el=e.target instanceof Element?e.target.closest(`button`):null;
      if(el&&sels.some(s=>el.matches(s)))go(idx+1);
    };
    document.addEventListener(`click`,onClick);
    return()=>document.removeEventListener(`click`,onClick);
  },[idx]);
  l.useEffect(()=>{
    if(!(beat.auto&&done))return;
    let t=setTimeout(()=>go(Math.min(idx+1,last)),beat.autoDelay??600);
    return()=>clearTimeout(t);
  },[idx,done]);
  l.useEffect(()=>{
    if(!beat.gate&&!beat.until)return;
    let id=beat.id,t=setTimeout(()=>setStuckId(id),8000);
    return()=>clearTimeout(t);
  },[idx]);
  l.useEffect(()=>{
    if(open)return;
    let t=setTimeout(()=>document.getElementById(`tut-title`)?.focus({preventScroll:!0}),80);
    return()=>clearTimeout(t);
  },[idx]);

  /* Rings snap to their target. The card eases only after it has settled on a beat, so scrolling glides and a new step does not. */
  l.useEffect(()=>{
    let card=cardRef.current;
    if(!card)return;
    card.classList.remove(`tut-glide`);
    let t=setTimeout(()=>card.classList.add(`tut-glide`),80);
    return()=>clearTimeout(t);
  },[idx]);

  l.useEffect(()=>{
    let raf=0,prev=``;
    let hide=node=>node.style.display=`none`;
    let tick=()=>{
      let dim=dimRef.current,fx=fxRef.current,card=cardRef.current;
      if(!dim||!fx||!card)prev=``;
      else{
        let vw=document.documentElement.clientWidth,vh=window.innerHeight,phone=vw<=700,freeNow=freeRef.current;
        let rects=freeNow?[]:tutMeasure(targetsRef.current);
        let cw=card.offsetWidth||380,ch=card.offsetHeight||220;
        let key=[vw,vh,cw,ch,phone?1:0,freeNow?1:0,openRef.current?1:0,...rects.flatMap(r=>[r.x,r.y,r.w,r.h])].join(`,`);
        if(key!==prev){
          prev=key;
          card.classList.toggle(`tut-sheet`,phone);
          if(freeNow){
            dim.style.visibility=`hidden`;dim.style.pointerEvents=`none`;
            tutSlots(fx,`block`).forEach(hide);tutSlots(fx,`ring`).forEach(hide);
          }else{
            dim.style.visibility=`visible`;dim.style.pointerEvents=`auto`;
            let path=`path(evenodd, "${tutHolePath(vw||1,vh||1,rects)}")`;
            dim.style.clipPath=path;dim.style.webkitClipPath=path;
            let showBlocks=!openRef.current;
            tutSlots(fx,`block`).forEach((node,i)=>{
              let r=showBlocks?rects[i]:null;
              node.style.cssText=r?`display:block;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`:`display:none`;
            });
            tutSlots(fx,`ring`).forEach((node,i)=>{
              let r=rects[i];
              node.style.cssText=r?`display:block;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`:`display:none`;
            });
          }
          if(phone){card.style.left=``;card.style.top=``}
          else{
            let p=freeNow?tutPark(cw,ch,vw,vh):tutPlace(rects,cw,ch,vw,vh);
            card.style.left=p.left+`px`;card.style.top=p.top+`px`;
          }
          card.style.visibility=`visible`;
        }
      }
      raf=requestAnimationFrame(tick);
    };
    tick();
    return()=>cancelAnimationFrame(raf);
  },[]);

  l.useEffect(()=>{
    let card=cardRef.current;
    if(!card)return;
    card.classList.remove(`tut-pop`);
    void card.offsetWidth;
    card.classList.add(`tut-pop`);
  },[idx]);

  l.useEffect(()=>{
    if(!beat.coach||!targets.length)return;
    let t=setTimeout(()=>{
      let el=document.querySelector(targetsRef.current[0]||``);
      if(!el)return;
      let r=el.getBoundingClientRect(),vh=window.innerHeight,phone=document.documentElement.clientWidth<=700;
      let cardH=cardRef.current?cardRef.current.offsetHeight:220,top;
      if(phone){
        let freeH=vh-cardH-24;
        if(r.top>=8&&r.bottom<=freeH)return;
        top=r.height<=freeH?8+(freeH-r.height)/2:8;
      }else{
        if(r.top>=48&&r.bottom<=vh-48)return;
        top=Math.max(24,(vh-r.height)/2);
      }
      if(Math.abs(r.top-top)>8)window.scrollTo({top:Math.max(0,window.scrollY+r.top-top),behavior:`auto`});
    },60);
    return()=>clearTimeout(t);
  },[idx,here,done,running]);

  let askLeave=()=>setLeaveAsk(!0);
  let leaveDialog=leaveAsk&&tutH(te,{title:`Leave training?`,label:`Sol 0`,icon:`flag`,onDismiss:()=>setLeaveAsk(!1)},
    tutH(`p`,{className:`dialog-lead`},`This ends the practice day. You can open this training any time from How to play.`),
    tutH(`div`,{className:`dialog-actions`},
      tutH(`button`,{type:`button`,className:`button button-outline`,onClick:()=>setLeaveAsk(!1)},`Stay`),
      tutH(`button`,{type:`button`,className:`button button-primary`,onClick:()=>{setLeaveAsk(!1);onSkip()}},`Leave training`)));
  if(!beat.coach)return tutH(l.Fragment,null,
    tutH(`button`,{type:`button`,className:`tut-live`,onClick:askLeave},tutIco(`flag`,14),` Sol 0 · Skip`),
    leaveDialog);
  /* The finished alert prompt has no button left to point at, so it would jump to the center and vanish. Skip that frame. */
  if(beat.auto&&done&&beat.eventId)return leaveDialog||null;

  let phone=typeof document<`u`&&document.documentElement.clientWidth<=700;
  let title=beat.title(ctx),body=beat.body(ctx),hint=beat.hint&&!done?beat.hint(ctx):null;
  /* Point them back only once a step actually needs that module. */
  if(mustReturn){
    title=`Back to the ${tutName(beat.module)}`;
    body=[tutP(`Come back to the `,tutB(tutName(beat.module)),`.`)];
    hint=tutGo(beat.module);
  }
  let hold=!free&&((beat.gate&&!done)||(beat.until&&!arrived)||mustReturn);
  let showNext=(!hold&&!beat.auto&&!beat.minWait&&!beat.wait&&!beat.until&&!beat.holdAfter)||(readReady&&!!beat.minWait&&(beat.free||!beat.eventId));
  let next=()=>idx>=last?onFinish():go(idx+1);

  return tutH(l.Fragment,null,
    tutH(`div`,{ref:dimRef,className:`tut-dim`,"aria-hidden":`true`}),
    tutH(`div`,{ref:fxRef,className:`tut-fx`,"aria-hidden":`true`},
      ...Array.from({length:TUT_SLOTS},(_,i)=>tutH(`div`,{key:`b${i}`,className:`tut-block`,"data-tut":`block`})),
      ...Array.from({length:TUT_SLOTS},(_,i)=>tutH(`div`,{key:`r${i}`,className:`tut-ring`,"data-tut":`ring`}))),
    tutH(`section`,{ref:cardRef,className:`tut-card tut-pop${phone?` tut-sheet`:``}${beat.center?` tut-center`:``}`,role:`dialog`,"aria-modal":`false`,"aria-labelledby":`tut-title`},
      tutH(`div`,{className:`tut-card-head`},
        tutH(`span`,{className:`tut-badge`},tutIco(`flag`,14),` Sol 0 · Training`),
        stepAt>=0&&tutH(`span`,{className:`micro-label`},`Step ${stepAt+1} of ${steps.length}`)),
      tutH(`h2`,{id:`tut-title`,tabIndex:-1},title),
      tutH(`div`,{className:`tut-body`,"aria-live":`polite`},...body),
      hint&&tutH(`div`,{className:`tut-hint`,role:`status`},tutIco(`arrow`,19),tutH(`span`,null,...(Array.isArray(hint)?hint:[hint]))),
      stepAt>=0&&tutH(`div`,{className:`tut-dots`,"aria-hidden":`true`},...steps.map((x,i)=>tutH(`span`,{key:x.id,className:`tut-dot`,"data-state":i<stepAt?`done`:i===stepAt?`now`:`todo`}))),
      tutH(`div`,{className:`tut-actions`},
        !beat.last&&tutH(`button`,{type:`button`,className:`tool-button tut-skip`,onClick:askLeave},isReplay?`Exit training`:`Skip training`),
        tutH(`span`,{className:`tut-nav`},
          hold&&stuck&&tutH(`button`,{type:`button`,className:`tool-button`,onClick:skipStep},`Skip this`),
          showNext&&tutH(`button`,{type:`button`,className:`button button-primary tut-next`,onClick:next},beat.nextLabel||`Next`,` `,tutIco(beat.last?`play`:`arrow`,17))))),
      leaveDialog);
}

function TutorialIntro({onTrain,onSkip,onClose}){
  return tutH(te,{title:`New here, Commander?`,label:`Mission briefing`,icon:`flag`,onDismiss:onClose},
    tutH(`p`,{className:`dialog-lead`},`Let’s look after a Mars colony together. When you make a choice, you give something up to get something you need.`),
    tutH(`ul`,{className:`tut-list`},
      tutH(`li`,{key:1},tutH(`span`,{className:`tut-dotico tut-c-sun`},tutIco(`clock`,15)),tutH(`span`,null,tutB(`A few minutes.`),` Skip it any time.`)),
      tutH(`li`,{key:2},tutH(`span`,{className:`tut-dotico tut-c-teal`},tutIco(`check`,15)),tutH(`span`,null,tutB(`Nothing is saved.`),` The real game starts after this, from the beginning.`)),
      tutH(`li`,{key:3},tutH(`span`,{className:`tut-dotico tut-c-grape`},tutIco(`help`,15)),tutH(`span`,null,tutB(`Replay it later`),` from the menu or the How to play window.`))),
    tutH(`div`,{className:`dialog-actions`},
      tutH(`button`,{type:`button`,className:`button button-primary`,onClick:onTrain},tutIco(`play`,18),` Start Sol 0 training`),
      tutH(`button`,{type:`button`,className:`button button-outline`,onClick:onSkip},`Skip, start the mission`)));
}
