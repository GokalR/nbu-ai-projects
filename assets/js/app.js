/* presentation-1 */
(function(){
    var slide=document.querySelector('#deck > .copyscripts');
    if(!slide) return;
    slide.addEventListener('click',function(e){
      var tab=e.target.closest('.cp-tab'), copy=e.target.closest('.cp-copy');
      if(!tab&&!copy) return;
      e.stopPropagation();
      if(tab){
        slide.querySelectorAll('.cp-tab').forEach(function(b){b.classList.toggle('on',b===tab)});
        slide.querySelectorAll('.cp-pane').forEach(function(p){p.classList.toggle('on',p.dataset.p===tab.dataset.t)});
      } else {
        var pane=copy.closest('.cp-pane'), txt=pane.querySelector('.cp-text').textContent;
        var done=function(){ copy.textContent='Скопировано'; setTimeout(function(){copy.textContent='Копировать'},1600); };
        try{ navigator.clipboard.writeText(txt).then(done,function(){fallback()}); }catch(err){ fallback(); }
        function fallback(){
          var ta=document.createElement('textarea'); ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
          document.body.appendChild(ta); ta.select();
          try{ document.execCommand('copy'); done(); }catch(e2){ copy.textContent='Выделите текст вручную'; }
          document.body.removeChild(ta);
        }
      }
    });
  })();
;

/* presentation-2 */
(function(){
  var slides=[];
  function isEd(){ return document.body.classList.contains('editing'); }
  function collectSlides(){ var ed=isEd(); slides=[].slice.call(document.querySelectorAll('#deck > .slide')).filter(function(s){ return ed || !s.hasAttribute('data-hidden'); }); }
  collectSlides();
  var deck=document.getElementById('deck'), panel=document.getElementById('notesPanel');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i=0, step=0, notesOn=false, typers=[];
  try{var h=parseInt(location.hash.slice(1),10); if(h>0&&h<=slides.length) i=h-1;}catch(e){}
  try{var rt=parseInt(sessionStorage.getItem('deck-return'),10); if(rt>0){ sessionStorage.removeItem('deck-return'); if(rt<=slides.length) i=rt-1; }}catch(e){}

  function frags(s){return [].slice.call(s.querySelectorAll('.f'))}
  function fit(){
    var nh=notesOn?window.innerHeight*0.34:0;
    var eb=document.getElementById('edbar'), top=(isEd()&&eb)?eb.offsetHeight+18:0;
    var s=Math.min(window.innerWidth/1280,(window.innerHeight-nh-top)/720)*0.96;
    deck.style.transform='scale('+s+')';
    var vp=document.getElementById('viewport'); vp.style.bottom=notesOn?'34vh':'0'; vp.style.top=top+'px';
  }
  function clearTypers(){typers.forEach(clearInterval);typers=[]}
  function type(el){
    var txt=el.getAttribute('data-type'); if(!txt) return;
    if(reduce){el.textContent=txt;return}
    el.textContent=''; el.classList.add('caret'); var k=0;
    var t=setInterval(function(){k+=2; el.textContent=txt.slice(0,k); if(k>=txt.length){clearInterval(t); el.classList.remove('caret')}},22);
    typers.push(t);
  }
  function countUp(el){
    var target=parseInt(el.getAttribute('data-count'),10); if(reduce){el.textContent=target.toLocaleString('ru-RU');return}
    var start=null;
    function tick(ts){ if(!start) start=ts; var p=Math.min(1,(ts-start)/900); var e=1-Math.pow(1-p,3); el.textContent=Math.round(target*e).toLocaleString('ru-RU'); if(p<1) requestAnimationFrame(tick)}
    requestAnimationFrame(tick);
  }
  function setStage(sl,n){ for(var k=1;k<=12;k++) sl.classList.toggle('s'+k,k<=n); sl.setAttribute('data-stage',n); }
  function reveal(el){
    el.classList.add('on');
    if(el.hasAttribute('data-type')) type(el);
    [].forEach.call(el.querySelectorAll('[data-count]'),countUp);
  }
  function autonomyWiggle(s){
    var tr=s.querySelector('#autoTrack'); if(!tr||reduce) return;
    var act=tr.querySelector('.act'),hd=tr.querySelector('.handle'),bv=tr.querySelector('.bubbleval');
    function set(p,label){act.style.width=p+'%';hd.style.left=p+'%';bv.style.left=p+'%';bv.textContent=label}
    set(75,'Уровень 3 на старте преждевременен');
    setTimeout(function(){set(25,'Рекомендуемый старт: уровень 1')},1400);
  }
  function show(n,fromBack){
    if(isEd()) fromBack=true;
    n=Math.max(0,Math.min(slides.length-1,n));
    clearTypers();
    slides.forEach(function(s,k){s.classList.toggle('active',k===n); s.classList.toggle('back',k<n)});
    i=n;
    if(slides[i].id==='bp-solution' && window.__bpStages) window.__bpStages.set(fromBack ? 4 : -1);
    var fs=frags(slides[i]);
    if(fromBack){ fs.forEach(function(f){f.classList.add('on'); if(f.hasAttribute('data-type')) f.textContent=f.getAttribute('data-type'); [].forEach.call(f.querySelectorAll('[data-count]'),function(c){c.textContent=parseInt(c.getAttribute('data-count'),10).toLocaleString('ru-RU')})}); step=fs.length; }
    else { fs.forEach(function(f){f.classList.remove('on'); if(f.hasAttribute('data-type')) f.innerHTML='&nbsp;'}); step=0; }
    setStage(slides[i],step);
    [].forEach.call(slides[i].querySelectorAll('[data-count]'),function(c){ if(!c.closest('.f')) countUp(c); });
    var note=slides[i].querySelector('.notes');
    panel.textContent=note?note.textContent:'Нет заметок';
    document.getElementById('counter').textContent=(i+1)+' / '+slides.length;
    document.getElementById('progress').style.width=((i+1)/slides.length*100)+'%';
    try{history.replaceState(null,'','#'+(i+1))}catch(e){}
    try{document.dispatchEvent(new CustomEvent('deck:slide'))}catch(e){}
  }
  function next(){
    if(slides[i].id==='bp-solution' && window.__bpStages && window.__bpStages.next()) return;
    var fs=frags(slides[i]);
    if(step<fs.length){ reveal(fs[step]); step++; setStage(slides[i],step); }
    else if(slides[i].querySelector('#autoTrack') && !slides[i].dataset.wiggled){ slides[i].dataset.wiggled='1'; autonomyWiggle(slides[i]); }
    else show(i+1,false);
  }
  function prev(){
    if(slides[i].id==='bp-solution' && window.__bpStages && window.__bpStages.prev()) return;
    var fs=frags(slides[i]);
    if(step>0){ step--; fs[step].classList.remove('on'); setStage(slides[i],step); }
    else show(i-1,true);
  }

  /* timer */
  var tEl=document.getElementById('timer'),tVal=document.getElementById('tval'),ring=document.getElementById('tring'),tInt=null;
  function fmt(s){var m=Math.floor(s/60),x=s%60;return (m<10?'0':'')+m+':'+(x<10?'0':'')+x}
  function toggleTimer(){
    if(tInt){clearInterval(tInt);tInt=null;tEl.classList.remove('on','done');return}
    var mins=parseFloat(slides[i].getAttribute('data-timer')||'5'), total=Math.round(mins*60), left=total;
    tEl.classList.add('on'); tEl.classList.remove('done'); tVal.textContent=fmt(left); ring.style.strokeDashoffset=0;
    tInt=setInterval(function(){
      left--; tVal.textContent=fmt(Math.max(0,left)); ring.style.strokeDashoffset=(113.1*(1-Math.max(0,left)/total)).toFixed(1);
      if(left<=0){clearInterval(tInt);tInt=null;tEl.classList.add('done');tVal.textContent='Время!'}
    },1000);
  }

  function toggleTheme(){
    var r=document.documentElement, cur=r.getAttribute('data-theme');
    var dark=cur?cur==='dark':(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    r.setAttribute('data-theme',dark?'light':'dark');
  }
  function toggleNotes(){notesOn=!notesOn;panel.classList.toggle('on',notesOn);fit()}
  function toggleFs(){ if(!document.fullscreenElement){document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen()} else {document.exitFullscreen()} }

  document.getElementById('prev').onclick=prev;
  document.getElementById('next').onclick=next;
  document.getElementById('notesBtn').onclick=toggleNotes;
  document.getElementById('timerBtn').onclick=toggleTimer;
  document.getElementById('themeBtn').onclick=toggleTheme;
  document.getElementById('fsBtn').onclick=toggleFs;
  document.getElementById('viewport').addEventListener('click',function(e){ if(isEd()) return; if(e.clientX>window.innerWidth*0.3) next(); else prev(); });
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='BUTTON'&&(e.key===' '||e.key==='Enter')) return;
    var k=e.key;
    if(isEd()){
      if(e.target.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if(k==='ArrowRight'||k==='PageDown'){e.preventDefault();next()} else if(k==='ArrowLeft'||k==='PageUp'){e.preventDefault();prev()}
      return;
    }
    if(k==='ArrowRight'||k==='PageDown'||k===' '||k==='Enter'){e.preventDefault();next()}
    else if(k==='ArrowLeft'||k==='PageUp'||k==='Backspace'){e.preventDefault();prev()}
    else if(k==='n'||k==='N'||k==='т'||k==='Т'){toggleNotes()}
    else if(k==='t'||k==='T'||k==='е'||k==='Е'){toggleTimer()}
    else if(k==='f'||k==='F'||k==='а'||k==='А'){toggleFs()}
    else if(k==='d'||k==='D'||k==='в'||k==='В'){toggleTheme()}
    else if(k==='Home'){show(0,false)} else if(k==='End'){show(slides.length-1,true)}
  });
  var sx=null;
  document.addEventListener('touchstart',function(e){sx=e.touches[0].clientX},{passive:true});
  document.addEventListener('touchend',function(e){ if(sx===null||isEd())return; var d=e.changedTouches[0].clientX-sx; if(Math.abs(d)>50){ d<0?next():prev(); } sx=null; });
  window.addEventListener('resize',fit);
  (function(){
    var r=document.documentElement;
    function has(){var ok=false; try{document.fonts.forEach(function(f){ if(f.family.replace(/["']/g,'')==='Material Symbols Rounded' && f.status==='loaded') ok=true; });}catch(e){} return ok;}
    function mark(){ if(has()){r.classList.remove('noicons');r.classList.add('icons');return true} return false }
    try{ document.fonts.load('24px "Material Symbols Rounded"','home').then(mark,function(){}); document.fonts.ready.then(mark); }catch(e){}
    setTimeout(function(){ if(!mark()) r.classList.add('noicons') },3500);
  })();
  function autoFit(){
    [].forEach.call(document.querySelectorAll('#deck > .slide'),function(sl){
      var kids=[].filter.call(sl.children,function(c){
        if(c.matches('.blob,.cookie,.foot,.timechip,aside,.xbox')) return false;
        var p=getComputedStyle(c).position; return p!=='absolute'&&p!=='fixed';
      });
      kids.forEach(function(c){ c.style.zoom=''; });
      var z=1;
      for(var k=0;k<5;k++){
        var sr=sl.getBoundingClientRect(), sc=sr.height/720||1, maxB=0, maxR=0;
        [].forEach.call(sl.querySelectorAll('*'),function(el){
          if(el.closest('aside,.blob,.cookie,.foot,.timechip,.xbox')) return;
          for(var a=el.parentElement;a&&a!==sl;a=a.parentElement){ var o=getComputedStyle(a).overflow; if(o!=='visible') return; }
          var r=el.getBoundingClientRect(); if(!r.width&&!r.height) return;
          maxB=Math.max(maxB,(r.bottom-sr.top)/sc); maxR=Math.max(maxR,(r.right-sr.left)/sc);
        });
        if(maxB<=708 && maxR<=1272) break;
        z=z-0.05; if(z<0.78) break;
        kids.forEach(function(c){ c.style.zoom=z; });
      }
    });
  }
  try{ (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(function(){ setTimeout(autoFit,60); }); }catch(e){}
  window.addEventListener('load',function(){ setTimeout(autoFit,200); });
  window.__deck={
    current:function(){ return slides[i]; },
    list:function(){ return slides.slice(); },
    refresh:function(){ var cur=slides[i]; collectSlides(); var k=slides.indexOf(cur); show(k<0?Math.min(i,slides.length-1):k,true); },
    go:function(el){ collectSlides(); var k=slides.indexOf(el); if(k>=0) show(k,true); },
    fit:fit,
    setNotes:function(on){ notesOn=on; panel.classList.toggle('on',on); fit(); }
  };
  fit(); show(i,false);
})();
;

/* deck-extras */
(function(){
  var ZIP_B64="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", NAME="presentation_template.zip";
  document.addEventListener('click',function(e){
    var j=e.target.closest('.jump-end'), d=e.target.closest('.dl-zip');
    if(!j&&!d) return;
    e.stopPropagation(); e.preventDefault();
    if(j){
      var last=document.querySelector('#deck > .slide:last-child');
      if(window.__deck&&last) window.__deck.go(last);
      return;
    }
    var bin=atob(ZIP_B64), len=bin.length, buf=new Uint8Array(len);
    for(var i=0;i<len;i++) buf[i]=bin.charCodeAt(i);
    var blob=new Blob([buf],{type:'application/zip'});
    var label=d.querySelector('span:last-child')||d, orig=d.textContent;
    function ok(){ d.textContent='Готово'; setTimeout(function(){ d.innerHTML='<span class="ms">download</span>Скачать ZIP'; },2000); }
    function browserSave(){
      var url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download=NAME; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); },1500); ok();
    }
    if(window.claude&&typeof window.claude.use==='function'){
      window.claude.use('downloads').then(function(dl){
        if(!dl) return browserSave();
        dl.save({filename:NAME,data:blob}).then(ok,function(){ d.textContent='Не удалось сохранить'; setTimeout(function(){ d.innerHTML='<span class="ms">download</span>Скачать ZIP'; },2000); });
      },browserSave);
    } else browserSave();
  },true);
})();
;

/* business-plan-stages */
(function(){
const slide=document.getElementById('bp-solution');
const imageData={"/assets/platform-wizard.png":"./assets/images/screen-21897535d12e.png","/assets/platform-finance.png":"./assets/images/screen-65065a019cae.png","/assets/platform-result.png":"./assets/images/screen-058c82257738.png"};
const stages = [
  {
    image: '/assets/platform-wizard.png', width: 1556, height: 1187,
    title: 'Бизнес-план · данные заявителя',
    alt: 'Выделены правовая форма и статус бизнеса в анкете.',
    camera: [0, 80, 1400, 661], focus: [430, 295, 845, 415]
  },
  {
    image: '/assets/platform-finance.png', width: 1440, height: 1000,
    title: 'Бизнес-план · финансовый расчёт',
    alt: 'Выделен график остатка долга банку по месяцам в финансовом плане.',
    camera: [300, 230, 1120, 650], focus: [425, 363, 955, 505]
  },
  {
    image: '/assets/platform-result.png', width: 1440, height: 1000,
    title: 'Бизнес-план · готовый результат',
    alt: 'Выделено содержание готового бизнес-плана из 14 разделов.',
    camera: [0, 155, 1440, 680], focus: [28, 186, 340, 629]
  },
  {
    image: '/assets/platform-result.png', width: 1440, height: 1000,
    title: 'Бизнес-план · выгрузка документа',
    alt: 'Выделена кнопка «Скачать Word» на экране готового бизнес-плана.',
    camera: [870, 45, 560, 264], focus: [1261, 119, 151, 38]
  }
];
stages.forEach(stage => { stage.image=imageData[stage.image]; });
const tabs = [...slide.querySelectorAll('.bp-step')];
const scene = slide.querySelector('.bp-shot-scene');
const stageImage = slide.querySelector('#bp-stage-image');
const spotlight = slide.querySelector('.bp-spotlight');
let stageIndex = -1;
let stageRequest = 0;
// Preload only local presentation images so changing stages does not flash.
stages.forEach(stage => { const image = new Image(); image.src = stage.image; });
async function setStage(index, focusTab = false) {
  stageIndex = Math.max(-1, Math.min(stages.length, index));
  const request = ++stageRequest;
  const stage = stageIndex < 0 ? {
    ...stages[0],
    title: 'Бизнес-план · пошаговая анкета',
    alt: 'Общий вид анкеты платформы без выделения отдельного этапа.',
    camera: [0, 0, 1556, 735],
    focus: null
  } : stageIndex === stages.length ? {
    ...stages[stages.length - 1],
    title: 'Бизнес-план · готовый результат',
    alt: 'Общий вид готового бизнес-плана без выделения отдельного этапа.',
    camera: [0, 0, 1440, 680],
    focus: null
  } : stages[stageIndex];
  tabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === stageIndex);
    tab.setAttribute('aria-selected', String(i === stageIndex));
    tab.tabIndex = i === Math.max(0, Math.min(stages.length - 1, stageIndex)) ? 0 : -1;
  });
  slide.querySelector('#bp-stage-panel').setAttribute('aria-labelledby', !stage.focus ? 'bp-screen-title' : tabs[stageIndex].id);
  if (focusTab && stage.focus) tabs[stageIndex].focus();

  const image = new Image();
  image.src = stage.image;
  try { await image.decode(); } catch { return; }
  if (request !== stageRequest) return;
  const [x, y, width, height] = stage.camera;
  const scale = Math.min(805 / width, 380 / height);
  scene.style.width = `${stage.width}px`;
  scene.style.height = `${stage.height}px`;
  stageImage.src = stage.image;
  stageImage.alt = stage.alt;
  stageImage.width = stage.width;
  stageImage.height = stage.height;
  stageImage.style.width = `${stage.width}px`;
  scene.style.transform = `translate(${(805 - width * scale) / 2 - x * scale}px, ${(380 - height * scale) / 2 - y * scale}px) scale(${scale})`;
  spotlight.hidden = !stage.focus;
  if (stage.focus) {
    const [fx, fy, fw, fh] = stage.focus;
    Object.assign(spotlight.style, {
      left: `${fx}px`, top: `${fy}px`, width: `${fw}px`, height: `${fh}px`,
      borderWidth: `${5 / scale}px`, borderRadius: `${10 / scale}px`
    });
  }
  slide.querySelector('#bp-screen-title').textContent = stage.title;
  slide.querySelector('#bp-stage-panel').dataset.stage = String(stageIndex + 1);
}

tabs.forEach((tab,index)=>{
 tab.addEventListener('click',e=>{e.stopPropagation();setStage(index)});
 tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();setStage(e.key==='Home'?0:e.key==='End'?3:(index+(e.key==='ArrowRight'?1:3))%4,true)});
});
window.__bpStages={set:setStage,next(){if(stageIndex>=stages.length)return false;setStage(stageIndex+1);return true},prev(){if(stageIndex<0)return false;setStage(stageIndex-1);return true}};
setStage(-1);
})();
