import sys
src,chunk,dst=sys.argv[1:4]
s=open(src).read(); c=open(chunk).read()
def rep(old,new,count=1):
    global s
    n=s.count(old)
    assert n==count,f'expected {count} match(es), found {n} for: {old[:90]}'
    s=s.replace(old,new)

# 1. inject tutorial chunk right before the app root component
rep('function vt(){',c+'\nfunction vt(){')

# 2. vt: state, persistence guard, card count
rep('[v,y]=(0,l.useState)(!0),','[v,y]=(0,l.useState)(!0),[tutOn,setTutOn]=(0,l.useState)(!1),[tutRun,setTutRun]=(0,l.useState)(0),[tutDone,setTutDone]=(0,l.useState)(tutLoad),[tutAsk,setTutAsk]=(0,l.useState)(!1),')
rep('(0,l.useEffect)(()=>{let e=te?.some(e=>!s.cardIds.includes(e)),t=C!==null&&C!==ee.current;','(0,l.useEffect)(()=>{if(tutOn)return;let e=te?.some(e=>!s.cardIds.includes(e)),t=C!==null&&C!==ee.current;')
rep('victories:s.victories+(t&&C?.kind===`victory`?1:0)}))},[te,ne,C,s]);','victories:s.victories+(t&&C?.kind===`victory`?1:0)}))},[te,ne,C,s,tutOn]);')
rep('let pe=[...new Set([...s.cardIds,...te??[]])];','let pe=[...new Set([...s.cardIds,...tutOn?[]:te??[]])];')

# 3. vt: begin / end helpers
rep('function le(e){e.type!==`set-shield-mode`','''function tutBegin(){m(null),g(null),setTutAsk(!1),w(),setTutRun(e=>e+1),setTutOn(!0),r({type:`set-paused`,reason:`tutorial`,paused:!0})}
function tutEnd(e){let t=tutDone!==null;(!t||e===`done`)&&(tutSave(e),setTutDone(e)),setTutOn(!1),setTutAsk(!1),e===`skipped`&&t?re():w()}
function le(e){e.type!==`set-shield-mode`''')

# 4. vt: keyboard. Space, mute, and module keys stay live during the trial.
rep('let n=e.key.toLowerCase();if(v&&n===`m`)','let n=e.key.toLowerCase();if(tutOn&&n!==`m`&&n!==` `&&!/^[1-5]$/.test(n))return;if(v&&n===`m`)')

# 5. reducer: tutorial-only event injection. Handled before the outcome lock so a scrubbed trial can recover.
rep('function Re(e,t){if(t.type===`retry-day`)return Ae(e,t.day);if(e.outcome)return e;',
    'function Re(e,t){if(t.type===`retry-day`)return Ae(e,t.day);if(t.type===`tutorial-event`){let n={...e,outcome:null};t.greenhouseMode&&(n.greenhouseMode=t.greenhouseMode);t.shieldMode&&(n.shieldMode=t.shieldMode);t.resources&&(n.resources={...e.resources,...t.resources});t.clearEvent&&(n.activeUrgentEvent=null);if(t.eventId){let r=ve.get(t.eventId);r&&(n.activeUrgentEvent={eventId:r.id,remainingSec:t.remainingSec??r.durationSec},n.handledUrgentEventIds=e.handledUrgentEventIds.filter(e=>e!==r.id),n.lastUrgentResult=e.lastUrgentResult?.eventId===r.id?null:e.lastUrgentResult)}return n}if(e.outcome)return e;')

# 6. vt: render wiring. Replay lives in How to play, including mid-run.
rep('(0,_.jsx)(nt,{state:e,selected:u,','(0,_.jsx)(nt,{state:e,training:tutOn,selected:u,')
rep('onStart:w,onMute:a,','onStart:()=>tutDone===null?setTutAsk(!0):w(),onMute:a,')
rep(',S&&!C&&(0,_.jsx)(Be,{',',tutOn&&e&&(0,_.jsx)(TutorialLayer,{state:e,selected:u,onSelect:D,dispatch:r,isReplay:tutDone!==null,runId:tutRun,onFinish:()=>tutEnd(`done`),onSkip:()=>tutEnd(`skipped`)}),tutAsk&&!e&&(0,_.jsx)(TutorialIntro,{onTrain:tutBegin,onSkip:()=>{tutSave(`skipped`),setTutDone(`skipped`),setTutAsk(!1),w()},onClose:()=>setTutAsk(!1)}),S&&!C&&(0,_.jsx)(Be,{')
rep('(0,_.jsx)(st,{onDismiss:ae,shortcutsEnabled:v,','(0,_.jsx)(st,{onDismiss:ae,onTraining:tutBegin,shortcutsEnabled:v,')
rep('e&&C&&(0,_.jsx)(ot,{','e&&C&&!tutOn&&(0,_.jsx)(ot,{')

# 7. shell + toolbar label
rep('className:`game-shell`,children','className:`game-shell${e.training?` is-training`:``}`,children')
rep('(0,_.jsx)($e,{state:t,muted:r,onPause:l,onMute:u,onMenu:d})','(0,_.jsx)($e,{state:t,training:e.training,muted:r,onPause:l,onMute:u,onMenu:d})')
rep('function $e({state:e,muted:t,onPause:n,onMute:r,onMenu:i}){let a=be(e),o=e.pauseReasons.length>0||!!e.outcome,','function $e({state:e,training:tutTraining,muted:t,onPause:n,onMute:r,onMenu:i}){let a=be(e),o=e.pauseReasons.some(e=>e!==`tutorial`)||!!e.outcome,')
rep('(0,_.jsxs)(`strong`,{children:[`Day `,e.day,` / `,T.dayCount]}),(0,_.jsxs)(`small`,{children:[`Sol `,e.sol]})','(0,_.jsxs)(`strong`,{children:tutTraining?[`Trial`]:[`Day `,e.day,` / `,T.dayCount]}),(0,_.jsxs)(`small`,{children:tutTraining?[`Practice`]:[`Sol `,e.sol]})')

# 8. How to play: Replay tutorial
rep('function st({onDismiss:e,shortcutsEnabled:t,onToggleShortcuts:n}){','function st({onDismiss:e,shortcutsEnabled:t,onToggleShortcuts:n,onTraining:tutBtn}){')
rep('(0,_.jsx)(`div`,{className:`dialog-actions`,children:(0,_.jsx)(`button`,{type:`button`,className:`button button-primary`,onClick:e,children:`Got it`})})','(0,_.jsxs)(`div`,{className:`dialog-actions`,children:[(0,_.jsx)(`button`,{type:`button`,className:`button button-primary`,onClick:e,children:`Got it`}),tutBtn&&(0,_.jsxs)(`button`,{type:`button`,className:`button button-outline`,onClick:()=>{e(),tutBtn()},title:`Replays the practice sol. Ends a run in progress.`,children:[(0,_.jsx)(S,{name:`flag`,size:18}),` Replay tutorial`]})]})')
rep('`R`}),` Retry today`]','`R`}),` Retry the current day`]')
open(dst,'w').write(s)
print('patched OK',len(s))
