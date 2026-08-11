"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";

export default function InphintSite() {
  const rootRef = useRef(null);

  useEffect(() => {
    const cleanups = [];
    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover:none),(pointer:coarse)').matches;
    const isSmall = window.matchMedia('(max-width:900px)').matches;
    const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
    const map=(v,a,b,c,d)=>c+((v-a)/(b-a))*(d-c);
    const range=(p,a,b)=>clamp((p-a)/(b-a),0,1);

    /* ---------- Preloader ---------- */
    (function(){
      const loader=document.getElementById('loader');
      const lc=document.getElementById('lc');
      const bar=loader.querySelector('.l-bar i');
      const logo=loader.querySelector('.l-logo');
      if(reduce){ gsap.set(logo,{opacity:1}); }
      const tl=gsap.timeline();
      tl.to(logo,{opacity:1,y:0,duration:.6,ease:'power2.out'})
        .to(bar,{scaleX:1,duration:1.1,ease:'power2.inOut'},'<')
        .to({v:0},{v:100,duration:1.1,ease:'power2.inOut',onUpdate:function(){lc.textContent=Math.round(this.targets()[0].v);}},'<')
        .to(loader,{yPercent:-100,duration:.9,ease:'expo.inOut',delay:.15,onComplete:()=>{document.documentElement.classList.add('loaded');loader.style.display='none';ScrollTrigger.refresh();}});
    })();

    /* ---------- Lenis smooth scroll (skip on touch/reduced) ---------- */
    let lenis=null;
    if(!reduce && !isTouch){
      lenis=new Lenis({lerp:0.1, wheelMultiplier:1, smoothWheel:true});
      lenis.on('scroll', ()=>ScrollTrigger.update());
      const _lenisRaf=(t)=>lenis.raf(t*1000);
      gsap.ticker.add(_lenisRaf);
      cleanups.push(()=>gsap.ticker.remove(_lenisRaf));
      gsap.ticker.lagSmoothing(0);
      cleanups.push(()=>{try{lenis && lenis.destroy();}catch(e){}});
    }
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('gsap-ready'); /* engine confirmed → enable reveal choreography */

    /* smooth anchor + quote scroll */
    function scrollToEl(el){
      if(lenis){lenis.scrollTo(el,{offset:0,duration:1.4});}
      else{el.scrollIntoView({behavior:reduce?'auto':'smooth'});}
    }
    document.querySelectorAll('[data-quote]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();scrollToEl(document.getElementById('quote'));}));
    document.querySelectorAll('a[href^="#"]:not([data-quote])').forEach(a=>{
      a.addEventListener('click',e=>{const id=a.getAttribute('href');if(id.length>1){const el=document.querySelector(id);if(el){e.preventDefault();scrollToEl(el);}}});
    });

    /* ---------- Custom cursor ---------- */
    if(!isTouch){
      const dot=document.getElementById('cursorDot');
      const ring=document.getElementById('cursorRing');
      const lbl=document.getElementById('cursorLbl');
      let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
      const qx=gsap.quickTo(dot,'x',{duration:.15,ease:'power3'});
      const qy=gsap.quickTo(dot,'y',{duration:.15,ease:'power3'});
      const _onMove=e=>{mx=e.clientX;my=e.clientY;qx(mx);qy(my);lbl.style.transform=`translate(${mx}px,${my}px)`;};
      window.addEventListener('mousemove',_onMove);
      cleanups.push(()=>window.removeEventListener('mousemove',_onMove));
      const _ringTick=()=>{rx+=(mx-rx)*0.16;ry+=(my-ry)*0.16;ring.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`;};
      gsap.ticker.add(_ringTick);
      cleanups.push(()=>gsap.ticker.remove(_ringTick));
      document.querySelectorAll('[data-cursor]').forEach(el=>{
        el.addEventListener('mouseenter',()=>{document.body.classList.add('cursor-lg','cursor-lbl-on');lbl.textContent=el.getAttribute('data-cursor');});
        el.addEventListener('mouseleave',()=>{document.body.classList.remove('cursor-lg','cursor-lbl-on');});
      });
    }

    /* ---------- Navbar ---------- */
    ScrollTrigger.create({start:80,onUpdate:self=>{
      document.getElementById('nav').classList.toggle('scrolled', self.scroll()>60);
    }});
    // ensure initial
    const _onScroll=()=>{const n=document.getElementById('nav'); if(n) n.classList.toggle('scrolled', (window.scrollY||0)>60);};
    window.addEventListener('scroll',_onScroll,{passive:true});
    cleanups.push(()=>window.removeEventListener('scroll',_onScroll));

    /* ---------- Mobile menu ---------- */
    (function(){
      const burger=document.getElementById('burger');
      const menu=document.getElementById('mmenu');
      if(!burger) return;
      function close(){menu.classList.remove('open');document.body.classList.remove('menu-open');burger.setAttribute('aria-expanded','false');if(lenis)lenis.start();}
      burger.addEventListener('click',()=>{
        const open=menu.classList.toggle('open');
        document.body.classList.toggle('menu-open',open);
        burger.setAttribute('aria-expanded',open);
        if(lenis){open?lenis.stop():lenis.start();}
      });
      menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>close()));
    })();

    /* ============================================================
       HERO — scroll-driven cinematic sequence
    ============================================================ */
    (function(){
      const scene=document.getElementById('heroScene');
      const L={
        front:scene.querySelector('[data-h="front"]'),
        left:scene.querySelector('[data-h="left"]'),
        right:scene.querySelector('[data-h="right"]'),
        close:scene.querySelector('[data-h="close"]'),
        open:scene.querySelector('[data-h="open"]'),
        half:scene.querySelector('[data-h="half"]'),
        seal:scene.querySelector('[data-h="seal"]'),
      };
      const copy=document.getElementById('heroCopy');
      const hud=document.getElementById('heroHud');
      const ang=document.getElementById('heroAng');
      const cue=document.getElementById('scrollcue');
      const lights=document.getElementById('heroLights');
      const speed=document.getElementById('heroSpeed');
      const vig=document.getElementById('heroVig');
      const trans=document.getElementById('heroTrans');
      const transH=trans.querySelector('h2');

      // reduced / mobile: static hero, just show front + copy
      if(reduce || isSmall){
        gsap.set(L.front,{opacity:1,scale:1.02});
        gsap.set([copy,hud,cue],{opacity:1});
        return;
      }

      // helper: set a layer with crossfade + orbit-ish transform
      function lset(el,{o=0,s=1,x=0,ry=0,blur=0,z=1}){
        el.style.opacity=o;
        el.style.zIndex=z;
        el.style.transform=`translate3d(${x}%,0,0) rotateY(${ry}deg) scale(${s})`;
        el.style.filter=blur?`blur(${blur}px)`:'none';
      }

      // cinematic crossfade between two angles with opposite-side arc
      function orbit(p,a,b,outEl,inEl,z){
        const t=range(p,a,b);
        const e=t<.5? 2*t*t : 1-Math.pow(-2*t+2,2)/2; // easeInOutQuad
        lset(outEl,{o:1-e, s:1.06+ e*0.06, x:-e*7, ry:-e*16, blur:e*3.5, z:z});
        lset(inEl ,{o:e,   s:1.12- e*0.06, x:(1-e)*7, ry:(1-e)*16, blur:(1-e)*3.5, z:z+1});
      }

      function render(p){
        // hide all initially each frame (cheap, 7 layers)
        Object.values(L).forEach(el=>{el.style.opacity=0;});
        lights.style.opacity=0; speed.style.opacity=0; vig.style.opacity=0; trans.style.opacity=0;

        // A intro 0 - .10 : front dolly-in, copy out
        if(p<0.12){
          const t=range(p,0,0.12);
          lset(L.front,{o:1,s:1.04+t*0.09,x:0,ry:0,z:5});
          const co=1-range(p,0.02,0.10);
          gsap.set(copy,{opacity:co, y:-range(p,0,0.12)*40});
          gsap.set([hud,cue],{opacity:1-range(p,0.03,0.10)});
          ang.textContent='FRONT';
        }
        // B front -> left .12 - .27
        else if(p<0.27){ orbit(p,0.12,0.27,L.front,L.left,5); gsap.set(copy,{opacity:0}); gsap.set([hud],{opacity:.9}); gsap.set(cue,{opacity:0}); ang.textContent='LEFT'; }
        // C left -> right .27 - .42
        else if(p<0.42){ orbit(p,0.27,0.42,L.left,L.right,5); ang.textContent='RIGHT'; gsap.set(hud,{opacity:.9}); }
        // D right -> rear(closed) .42 - .55
        else if(p<0.55){ orbit(p,0.42,0.55,L.right,L.close,5); ang.textContent='REAR'; gsap.set(hud,{opacity:.9}); }
        // E rear closed -> open (reveal load) .55 - .66
        else if(p<0.66){
          const t=range(p,0.55,0.66);
          lset(L.close,{o:1-t, s:1.0+t*0.02, x:0, z:5});
          lset(L.open ,{o:t,   s:1.06 - t*0.02, x:0, z:6, blur:(1-t)*2});
          ang.textContent='THE LOAD';
        }
        // F dwell inside load .66 - .76 (slow push)
        else if(p<0.76){
          const t=range(p,0.66,0.76);
          lset(L.open,{o:1, s:1.04+t*0.06, x:0, z:6});
          ang.textContent='THE LOAD';
        }
        // G open -> half .76 - .84
        else if(p<0.84){
          const t=range(p,0.76,0.84);
          lset(L.open,{o:1-t,s:1.10,z:5});
          lset(L.half,{o:t,s:1.06,z:6});
          ang.textContent='SEALING';
        }
        // H half -> sealed .84 - .90  + taillights on
        else if(p<0.90){
          const t=range(p,0.84,0.90);
          lset(L.half,{o:1-t,s:1.06,z:5});
          lset(L.seal,{o:t,s:1.04,z:6});
          lights.style.opacity=t*0.9;
          ang.textContent='SEALED';
        }
        // I drive away .90 - 1
        else{
          const t=range(p,0.90,1);
          const e=t*t;
          lset(L.seal,{o:1, s:1.04-e*0.72, x:0, z:6});
          L.seal.style.transform=`translate3d(0,${-e*20}%,0) scale(${1.04-e*0.72})`;
          L.seal.style.filter=`blur(${e*4}px) brightness(${1-e*0.25})`;
          lights.style.opacity=0.9;
          speed.style.opacity=e*0.5;
          vig.style.opacity=e*0.92;
          trans.style.opacity=range(p,0.945,1);
          gsap.set(transH,{y:(1-range(p,0.945,1))*30});
          ang.textContent='DEPARTING';
        }
      }
      render(0);

      ScrollTrigger.create({
        trigger:'#hero',
        start:'top top',
        end:'bottom bottom',
        scrub:0.6,
        onUpdate:self=>render(self.progress),
        onRefresh:self=>render(self.progress)
      });
    })();

    /* ============================================================
       SECTION 02 — kinetic typography
    ============================================================ */
    (function(){
      const bg=document.getElementById('kinBg');
      // build subtle boxes
      const boxes=[];
      if(bg.children.length===0){
      const spec=[[6,10,120,80],[80,18,90,120],[14,70,150,100],[70,66,110,90],[44,40,70,70],[30,24,60,60]];
      spec.forEach((s,i)=>{const d=document.createElement('div');d.className='kin-box';
        d.style.left=s[0]+'%';d.style.top=s[1]+'%';d.style.width=s[2]+'px';d.style.height=s[3]+'px';
        d.dataset.sp=(i%3+1);bg.appendChild(d);boxes.push(d);});
      } else { bg.querySelectorAll('.kin-box').forEach(b=>boxes.push(b)); }

      if(reduce||isSmall){
        gsap.set('#kinReveal',{opacity:1});
        return;
      }
      const l1=document.getElementById('kinL1'), l2=document.getElementById('kinL2'), rev=document.getElementById('kinReveal');
      ScrollTrigger.create({
        trigger:'#kin', start:'top top', end:'bottom bottom', scrub:0.6,
        onUpdate:self=>{
          const p=self.progress;
          const a=range(p,0.15,0.6);
          gsap.set(l1,{xPercent:-a*60, yPercent:-a*30, opacity:1-range(p,0.45,0.7)});
          gsap.set(l2,{xPercent:a*60, yPercent:a*30, opacity:1-range(p,0.45,0.7)});
          gsap.set(rev,{opacity:range(p,0.5,0.72)});
          boxes.forEach(b=>{gsap.set(b,{yPercent:-(p*40)*b.dataset.sp, opacity:0.4+p*0.3});});
        }
      });
    })();

    /* ============================================================
       ABOUT — parallax, reveals, purple rule, counters
    ============================================================ */
    (function(){
      if(!reduce){
        gsap.to('#aboutImg',{yPercent:-14,ease:'none',scrollTrigger:{trigger:'#about',start:'top bottom',end:'bottom top',scrub:true}});
      }
      ScrollTrigger.create({trigger:'#aboutRule',start:'top 85%',onEnter:()=>gsap.to('#aboutRule',{scaleX:1,duration:1.2,ease:'power3.inOut'})});
    })();

    /* ---------- generic reveal ---------- */
    (function(){
      if(reduce){document.querySelectorAll('.reveal').forEach(el=>{el.style.opacity=1;el.style.transform='none';});return;}
      gsap.utils.toArray('.reveal').forEach(el=>{
        gsap.to(el,{opacity:1,y:0,duration:.9,ease:'power3.out',
          scrollTrigger:{trigger:el,start:'top 88%'}});
      });
    })();

    /* ---------- counters ---------- */
    function runCount(el){
      if(el.dataset.done)return; el.dataset.done=1;
      if(el.dataset.text){el.textContent=el.dataset.text;return;}
      const to=parseFloat(el.dataset.count), suf=el.dataset.suffix||'', comma=el.dataset.comma;
      const proxy={v:0};
      gsap.to(proxy,{v:to,duration:2,ease:'power2.out',
        onUpdate:function(){let v=Math.round(proxy.v);
          el.textContent=(comma?v.toLocaleString():v)+suf;}});
    }
    gsap.utils.toArray('[data-count],[data-text]').forEach(el=>{
      ScrollTrigger.create({trigger:el,start:'top 90%',onEnter:()=>runCount(el)});
    });

    /* ============================================================
       SERVICES — horizontal journey (desktop)
    ============================================================ */
    (function(){
      if(reduce||isSmall) return;
      const track=document.getElementById('svcTrack');
      const panels=track.children.length;
      const bar=document.getElementById('svcBar');
      const count=document.getElementById('svcCount');
      const dist=()=>track.scrollWidth - window.innerWidth;
      gsap.to(track,{x:()=>-dist(),ease:'none',
        scrollTrigger:{trigger:'#svcPin',start:'top top',end:()=>'+='+dist(),
          pin:true,scrub:0.7,invalidateOnRefresh:true,
          onUpdate:self=>{
            gsap.set(bar,{scaleX:self.progress});
            const idx=Math.min(panels,Math.floor(self.progress*panels)+1);
            count.textContent=String(idx).padStart(2,'0')+' / 0'+panels;
          }}});
      // parallax within each panel image
      gsap.utils.toArray('.svc-panel .media img').forEach(img=>{
        gsap.fromTo(img,{scale:1.12,xPercent:6},{xPercent:-6,ease:'none',
          scrollTrigger:{trigger:'#svcPin',start:'top top',end:()=>'+='+dist(),scrub:true}});
      });
    })();

    /* ============================================================
       PROCESS — horizontal timeline (desktop)
    ============================================================ */
    (function(){
      if(reduce||isSmall) return;
      const track=document.getElementById('procTrack');
      const line=document.getElementById('procLine');
      const truck=document.getElementById('procTruck');
      const dist=()=>track.scrollWidth - window.innerWidth + (window.innerWidth*0.24);
      gsap.to(track,{x:()=>-(track.scrollWidth-window.innerWidth+40),ease:'none',
        scrollTrigger:{trigger:'#procPin',start:'top top',end:()=>'+='+(track.scrollWidth-window.innerWidth+40),
          pin:true,scrub:0.7,invalidateOnRefresh:true,
          onUpdate:self=>{
            gsap.set(line,{scaleX:self.progress});
            truck.style.left=(self.progress*100)+'%';
          }}});
    })();

    /* ============================================================
       WHY US — 3D object cards
    ============================================================ */
    (function(){
      const grid=document.getElementById('whyGrid');
      const icons={
        shield:'<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
        hand:'<path d="M6 12V7a2 2 0 0 1 4 0M10 11V5a2 2 0 0 1 4 0v6M14 11V7a2 2 0 0 1 4 0v6c0 4-3 7-7 7-3 0-5-2-6-4l-2-4a2 2 0 0 1 3-2z"/>',
        clock:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
        truck:'<path d="M3 7h11v8H3zM14 10h4l3 3v2h-6z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17.5" cy="17" r="1.6"/>',
        lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
        heart:'<path d="M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.5-7 9-7 9z"/>'
      };
      const data=[
        ['shield','Professional Team','Trained, uniformed, and accountable on every job.'],
        ['hand','Careful Handling','Padding, wrapping, and a genuinely steady hand.'],
        ['clock','Reliable Scheduling','We arrive on time and finish when we said we would.'],
        ['truck','Modern Equipment','Well-kept vehicles and the right tools for the load.'],
        ['lock','Secure Transportation','Strapped, monitored, and locked end to end.'],
        ['heart','Customer First','Your move, your terms — communication throughout.']
      ];
      if(grid.children.length===0){
      data.forEach((d,i)=>{
        const c=document.createElement('div');c.className='why-card';c.setAttribute('data-cursor','EXPLORE');
        c.innerHTML=`<div class="why-top"><div class="why-obj"><div class="spin"><svg viewBox="0 0 24 24">${icons[d[0]]}</svg></div></div><span class="idx">0${i+1}</span></div>
          <div><h3>${d[1]}</h3><p>${d[2]}</p></div>`;
        grid.appendChild(c);
      });
      }
      if(reduce) return;
      gsap.utils.toArray('.why-obj .spin').forEach((s,i)=>{
        gsap.fromTo(s,{rotateY:-24,rotateX:8},{rotateY:24,rotateX:-8,ease:'none',
          scrollTrigger:{trigger:'#why',start:'top bottom',end:'bottom top',scrub:1.2}});
      });
      gsap.utils.toArray('.why-card').forEach((c,i)=>{
        gsap.from(c,{y:40,opacity:0,duration:.7,ease:'power3.out',
          scrollTrigger:{trigger:c,start:'top 90%'}});
      });
    })();

    /* ============================================================
       FLEET — connector lines draw + parallax
    ============================================================ */
    (function(){
      if(reduce||window.matchMedia('(max-width:760px)').matches) return;
      gsap.to('#fleetImg',{scale:1.06,ease:'none',scrollTrigger:{trigger:'#fleet',start:'top bottom',end:'bottom top',scrub:true}});
      document.querySelectorAll('#fleetSvg path').forEach(p=>{const len=p.getTotalLength();p.style.strokeDasharray=len;p.style.strokeDashoffset=len;
        gsap.to(p,{strokeDashoffset:0,ease:'power2.out',scrollTrigger:{trigger:'#fleet',start:'top 60%'}});});
      gsap.from('.fleet-label',{opacity:0,scale:.85,duration:.6,stagger:.12,ease:'power3.out',
        scrollTrigger:{trigger:'#fleet',start:'top 55%'}});
      gsap.from('.fleet-node',{opacity:0,scale:0,duration:.5,stagger:.12,ease:'back.out(2)',
        scrollTrigger:{trigger:'#fleet',start:'top 60%'}});
    })();

    /* ============================================================
       BEFORE / AFTER — scroll wipe
    ============================================================ */
    (function(){
      const wipe=document.getElementById('baWipe');
      const tags=document.querySelectorAll('.ba-tags span');
      if(reduce){gsap.set(wipe,{scaleX:0});return;}
      ScrollTrigger.create({
        trigger:'#ba', start:'top 70%', end:'bottom 70%', scrub:0.6,
        onUpdate:self=>{
          gsap.set(wipe,{scaleX:1-self.progress});
          const i=clamp(Math.floor(self.progress*3),0,2);
          tags.forEach((t,ti)=>t.classList.toggle('on',ti<=i));
        }
      });
    })();

    /* ============================================================
       TESTIMONIALS — slider
    ============================================================ */
    (function(){
      const track=document.getElementById('tstTrack');
      const slides=track.children.length; let i=0;
      const go=n=>{i=(n+slides)%slides;track.style.transform=`translateX(-${i*100}%)`;};
      document.getElementById('tNext').addEventListener('click',()=>go(i+1));
      document.getElementById('tPrev').addEventListener('click',()=>go(i-1));
      const T={auto:setInterval(()=>go(i+1),6500)};
      track.addEventListener('mouseenter',()=>clearInterval(T.auto));
      track.addEventListener('mouseleave',()=>{T.auto=setInterval(()=>go(i+1),6500);});
      cleanups.push(()=>clearInterval(T.auto));
    })();

    /* ============================================================
       AREA — animate route dashes
    ============================================================ */
    (function(){
      const g=document.getElementById('areaGrid');
      if(g.children.length===0){
      for(let x=0;x<=400;x+=40){g.insertAdjacentHTML('beforeend',`<line class="grid-l" x1="${x}" y1="0" x2="${x}" y2="300"/>`);}
      for(let y=0;y<=300;y+=40){g.insertAdjacentHTML('beforeend',`<line class="grid-l" x1="0" y1="${y}" x2="400" y2="${y}"/>`);}
      }
      if(reduce) return;
      document.querySelectorAll('#areaSvg .route').forEach((p,idx)=>{const len=p.getTotalLength();
        p.style.strokeDasharray=len;p.style.strokeDashoffset=len;
        gsap.to(p,{strokeDashoffset:0,duration:2,ease:'power2.out',
          scrollTrigger:{trigger:'#area',start:'top 65%'},delay:idx*0.25});});
    })();

    /* ============================================================
       FAQ
    ============================================================ */
    document.querySelectorAll('.faq-item .faq-q').forEach(q=>{
      q.addEventListener('click',()=>{
        const item=q.closest('.faq-item');
        const open=item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(o=>{if(o!==item)o.classList.remove('open');});
        item.classList.toggle('open',!open);
        if(lenis)setTimeout(()=>ScrollTrigger.refresh(),300);
      });
    });

    /* ============================================================
       FINAL CTA — copy reveal
    ============================================================ */
    (function(){
      const sec=document.getElementById('quote');
      const copy=document.getElementById('finalCopy');
      /* the old truck-to-horizon track needed a tall section; without it, shrink
         the desktop section to one screen so there's no empty scroll before the footer */
      if(sec && !isSmall) sec.style.height='100vh';
      if(reduce||isSmall){gsap.set(copy,{opacity:1,y:0});return;}
      gsap.set(copy,{opacity:0,y:40});
      ScrollTrigger.create({
        trigger:'#quote', start:'top 65%',
        onEnter:()=>gsap.to(copy,{opacity:1,y:0,duration:1,ease:'power3.out'})
      });
    })();

    /* ============================================================
       MOBILE — touch-friendly animations
       Runs ONLY on small screens with motion allowed. The desktop
       code path above is never entered on mobile and is untouched here,
       so laptop/desktop behaviour is unchanged.
    ============================================================ */
    (function(){
      if(!isSmall || reduce) return;

      // Hero: keep the main image painted (no opacity flash on the LCP image);
      // give it a slow "breathing" zoom and float the copy in.
      const front=document.querySelector('#heroScene [data-h="front"]');
      if(front){
        const _z=gsap.fromTo(front,{scale:1.06},{scale:1.12,duration:9,ease:'sine.inOut',repeat:-1,yoyo:true});
        cleanups.push(()=>_z.kill());
      }
      const hc=document.getElementById('heroCopy');
      if(hc) gsap.from(hc.children,{y:26,opacity:0,duration:.7,stagger:.09,ease:'power3.out',delay:.15});

      // Kinetic typography
      const l1=document.getElementById('kinL1'), l2=document.getElementById('kinL2'), kr=document.getElementById('kinReveal');
      if(l1) gsap.from(l1,{x:-38,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:'#kin',start:'top 80%'}});
      if(l2) gsap.from(l2,{x:38,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:'#kin',start:'top 74%'}});
      if(kr){ gsap.set(kr,{opacity:0,y:14}); gsap.to(kr,{opacity:1,y:0,duration:.8,ease:'power2.out',scrollTrigger:{trigger:'#kin',start:'top 56%'}}); }

      // Services (stacked panels): reveal + gentle image parallax
      gsap.utils.toArray('.svc-m-panel').forEach(p=>{
        gsap.from(p,{y:44,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:p,start:'top 84%'}});
        const im=p.querySelector('img');
        if(im) gsap.fromTo(im,{scale:1.18},{scale:1,ease:'none',scrollTrigger:{trigger:p,start:'top bottom',end:'bottom top',scrub:true}});
      });

      // Process (vertical timeline): steps slide in
      gsap.utils.toArray('.proc-step').forEach(s=>{
        gsap.from(s,{x:-26,opacity:0,duration:.7,ease:'power3.out',scrollTrigger:{trigger:s,start:'top 85%'}});
      });

      // Fleet (only where the desktop callout is hidden, <=760px)
      if(window.matchMedia('(max-width:760px)').matches){
        const fi=document.getElementById('fleetImg');
        if(fi) gsap.from(fi,{scale:1.12,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:'#fleet',start:'top 78%'}});
        gsap.from('.fleet-labels-m > div',{y:22,opacity:0,duration:.6,stagger:.1,ease:'power3.out',scrollTrigger:{trigger:'.fleet-labels-m',start:'top 88%'}});
      }

      // Final CTA copy
      const fc=document.getElementById('finalCopy');
      if(fc){ gsap.set(fc,{opacity:0,y:30}); gsap.to(fc,{opacity:1,y:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:'#quote',start:'top 72%'}}); }

      ScrollTrigger.refresh();
    })();

    /* refresh after fonts/images settle */
    const _onLoad=()=>{setTimeout(()=>ScrollTrigger.refresh(),400);};
    window.addEventListener('load',_onLoad);
    cleanups.push(()=>window.removeEventListener('load',_onLoad));
    setTimeout(()=>ScrollTrigger.refresh(),1500);

    return () => {
      cleanups.forEach(fn => { try { fn(); } catch (e) {} });
      try { ScrollTrigger.getAll().forEach(t => t.kill()); } catch (e) {}
      try { gsap.globalTimeline.clear(); } catch (e) {}
    };
  }, []);

  return (
    <div className="inphint-root" ref={rootRef}>
      <div id="loader" aria-hidden="true">
        <img className="l-logo" src="/images/logo.png" alt="inphint" />
        <div className="l-bar"><i></i></div>
        <div className="l-count">LOADING <span id="lc">0</span></div>
      </div>


      <div className="cursor-ring" id="cursorRing"></div>
      <div className="cursor" id="cursorDot"></div>
      <div className="cursor-lbl" id="cursorLbl">EXPLORE</div>


      <header className="nav" id="nav">
        <a href="#top" className="nav-logo" data-cursor="LET'S MOVE"><img src="/images/logo.png" alt="inphint" /></a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#top" className="active">Home</a>
          <a href="#" aria-disabled="true">Services</a>
          <a href="#" aria-disabled="true">About</a>
          <a href="#" aria-disabled="true">Why Us</a>
          <a href="#" aria-disabled="true">Moving Process</a>
          <a href="#" aria-disabled="true">Contact</a>
        </nav>
        <a href="#quote" className="nav-cta" data-cursor="LET'S MOVE" data-quote="">Get A Free Quote <span className="arw">→</span></a>
        <button className="nav-burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
      </header>


      <nav className="mmenu" id="mmenu" aria-label="Mobile">
        <a href="#top" className="active">Home</a>
        <a href="#" aria-disabled="true">Services</a>
        <a href="#" aria-disabled="true">About</a>
        <a href="#" aria-disabled="true">Why Us</a>
        <a href="#" aria-disabled="true">Moving Process</a>
        <a href="#" aria-disabled="true">Contact</a>
        <a href="#quote" className="btn btn-primary m-cta" data-quote="">Get A Free Quote <span className="arw">→</span></a>
        <div className="m-contact">hello@inphint.com · +1 (000) 000-0000</div>
      </nav>

      <main id="top">


      <section className="hero" id="hero">
        <div className="hero-track" id="heroTrack">
          <div className="hero-stage">
            <div className="hero-scene" id="heroScene">
              <div className="hero-layer" data-h="front"><img src="/images/truck_front.jpg" alt="inphint moving truck, front" fetchPriority="high" /></div>
              <div className="hero-layer" data-h="left"><img src="/images/truck_left.jpg" alt="inphint truck, left profile" /></div>
              <div className="hero-layer" data-h="right"><img src="/images/truck_right.jpg" alt="inphint truck, right profile" /></div>
              <div className="hero-layer" data-h="close"><img src="/images/truck_close.jpg" alt="inphint truck rear, sealed" /></div>
              <div className="hero-layer" data-h="open"><img src="/images/truck_open.jpg" alt="inphint truck rear, doors open, loaded" /></div>
              <div className="hero-layer" data-h="half"><img src="/images/truck_half.jpg" alt="inphint truck rear, shutter half closed" /></div>
              <div className="hero-layer" data-h="seal"><img src="/images/truck_close.jpg" alt="inphint truck rear, shutter closed" /></div>
            </div>
            <div className="hero-grade"></div>
            <div className="speed" id="heroSpeed"></div>
            <div className="hero-lights" id="heroLights"><div className="tail l"></div><div className="tail r"></div></div>
            <div className="hero-vignette" id="heroVig"></div>

            <div className="hero-hud" id="heroHud"><div>INPHINT · UNIT 01</div><div className="ang" id="heroAng">FRONT</div></div>

            <div className="hero-copy" id="heroCopy">
              <span className="eyebrow">The Future Of Moving</span>
              <h1 className="hero-h">Moving isn't just about getting there.<br /><em>It's about getting there right.</em></h1>
              <p className="hero-sub">Professional moving solutions designed around your home, your business, and everything that matters.</p>
              <div className="hero-actions">
                <a href="#quote" className="btn btn-primary" data-cursor="LET'S MOVE" data-quote="">Get A Free Quote <span className="arw">→</span></a>
                <a href="#services" className="btn btn-ghost" data-cursor="EXPLORE">Explore Our Services</a>
              </div>
            </div>

            <div className="hero-transition" id="heroTrans"><h2>A Better Way<br />To <span>Move.</span></h2></div>
            <div className="scrollcue" id="scrollcue"><span>SCROLL</span><span className="rail"><i></i></span></div>
          </div>
        </div>
      </section>


      <section className="kin" id="kin">
        <div className="kin-track" id="kinTrack">
          <div className="kin-stage">
            <div className="kin-bg" id="kinBg"></div>
            <div className="kin-lines">
              <div className="kin-l1" id="kinL1">Moving Shouldn't</div>
              <div className="kin-l2" id="kinL2">Feel Complicated.</div>
            </div>
            <div className="kin-reveal" id="kinReveal"><p>So we engineered every step to feel effortless.</p></div>
          </div>
        </div>
      </section>


      <section className="about" id="about">
        <div className="wrap about-grid">
          <div className="about-media" data-cursor="VIEW">
            <img src="/images/about.jpg" alt="inphint moving crew" id="aboutImg" />
            <span className="tag">The inphint Crew</span>
          </div>
          <div className="about-copy">
            <span className="eyebrow reveal">About inphint</span>
            <h2 className="about-h reveal">Moving with <em>purpose.</em></h2>
            <p className="about-p reveal">inphint began with a simple conviction: a move should feel like progress, not upheaval. We treat every home and every business as a story worth handling with care — planned precisely, packed properly, and delivered on time. From the first box to the final placement, the details are the promise.</p>
            <div className="about-rule reveal"><i id="aboutRule"></i></div>
            <div className="about-stats">
              <div className="st reveal"><div className="n" data-count="15" data-suffix="+">0</div><div className="l">Experienced Team</div></div>
              <div className="st reveal"><div className="n" data-count="100" data-suffix="%">0</div><div className="l">Professional Equipment</div></div>
              <div className="st reveal"><div className="n" data-count="24" data-suffix="/7">0</div><div className="l">Reliable Service</div></div>
              <div className="st reveal"><div className="n" data-count="99" data-suffix="%">0</div><div className="l">Careful Handling</div></div>
            </div>
          </div>
        </div>
      </section>


      <section className="svc" id="services">
        <div className="wrap svc-head">
          <span className="eyebrow reveal">What We Do</span>
          <h2 className="display reveal" style={{marginTop:'18px'}}>Travel through <em>every service.</em></h2>
          <p className="reveal">Six disciplines, one standard. Scroll to move through the inphint logistics world — each room, each craft, each careful hand-off.</p>
        </div>

  
        <div className="svc-pin" id="svcPin">
          <div className="svc-track" id="svcTrack">
      
            <div className="svc-panel"><div className="media"><img src="/images/svc_residential.jpg" alt="Residential removals" /></div><div className="veil"></div>
              <div className="svc-inner"><div className="svc-idx">SERVICE 01</div><h3 className="svc-name">Residential Removals</h3><p className="svc-desc">Moving your home without the stress — planned, protected, and handled like it's our own.</p></div></div>
            <div className="svc-panel"><div className="media"><img src="/images/svc_commercial.jpg" alt="Commercial removals" /></div><div className="veil"></div>
              <div className="svc-inner"><div className="svc-idx">SERVICE 02</div><h3 className="svc-name">Commercial Removals</h3><p className="svc-desc">Offices relocated with minimal downtime. Equipment packed, tracked, and back to work fast.</p></div></div>
            <div className="svc-panel"><div className="media"><img src="/images/svc_styling.jpg" alt="Property styling logistics" /></div><div className="veil"></div>
              <div className="svc-inner"><div className="svc-idx">SERVICE 03</div><h3 className="svc-name">Property Styling Logistics</h3><p className="svc-desc">Furniture delivered and placed to make a space sell — precise, punctual, presentation-ready.</p></div></div>
            <div className="svc-panel"><div className="media"><img src="/images/svc_packing.jpg" alt="Packing and unpacking" /></div><div className="veil"></div>
              <div className="svc-inner"><div className="svc-idx">SERVICE 04</div><h3 className="svc-name">Packing &amp; Unpacking</h3><p className="svc-desc">Every item wrapped, labelled, and unpacked into place. You arrive to a home, not a to-do list.</p></div></div>
            <div className="svc-panel"><div className="media"><img src="/images/svc_finefurniture.jpg" alt="Fine furniture removals" /></div><div className="veil"></div>
              <div className="svc-inner"><div className="svc-idx">SERVICE 05</div><h3 className="svc-name">Fine Furniture Removals</h3><p className="svc-desc">Art, antiques, and heirlooms handled with precision, custom crating, and a very steady hand.</p></div></div>
            <div className="svc-panel"><div className="media"><img src="/images/svc_storage.jpg" alt="Secure storage" /></div><div className="veil"></div>
              <div className="svc-inner"><div className="svc-idx">SERVICE 06</div><h3 className="svc-name">Secure Storage</h3><p className="svc-desc">Climate-considered, monitored storage for a week or a year — access when you need it.</p></div></div>
          </div>
          <div className="svc-progress"><span className="count" id="svcCount">01 / 06</span><div className="bar"><i id="svcBar"></i></div><span className="count">TRAVEL</span></div>
        </div>

  
        <div className="svc-mobile">
          <div className="svc-m-panel"><img src="/images/svc_residential.jpg" alt="" /><div className="veil"></div><div className="inner"><div className="svc-idx">SERVICE 01</div><h3 className="svc-name" style={{fontSize:'2rem'}}>Residential Removals</h3><p className="svc-desc">Moving your home without the stress.</p></div></div>
          <div className="svc-m-panel"><img src="/images/svc_commercial.jpg" alt="" /><div className="veil"></div><div className="inner"><div className="svc-idx">SERVICE 02</div><h3 className="svc-name" style={{fontSize:'2rem'}}>Commercial Removals</h3><p className="svc-desc">Offices relocated with minimal downtime.</p></div></div>
          <div className="svc-m-panel"><img src="/images/svc_styling.jpg" alt="" /><div className="veil"></div><div className="inner"><div className="svc-idx">SERVICE 03</div><h3 className="svc-name" style={{fontSize:'2rem'}}>Property Styling Logistics</h3><p className="svc-desc">Delivered and placed, presentation-ready.</p></div></div>
          <div className="svc-m-panel"><img src="/images/svc_packing.jpg" alt="" /><div className="veil"></div><div className="inner"><div className="svc-idx">SERVICE 04</div><h3 className="svc-name" style={{fontSize:'2rem'}}>Packing &amp; Unpacking</h3><p className="svc-desc">Wrapped, labelled, unpacked into place.</p></div></div>
          <div className="svc-m-panel"><img src="/images/svc_finefurniture.jpg" alt="" /><div className="veil"></div><div className="inner"><div className="svc-idx">SERVICE 05</div><h3 className="svc-name" style={{fontSize:'2rem'}}>Fine Furniture Removals</h3><p className="svc-desc">Handled with precision.</p></div></div>
          <div className="svc-m-panel"><img src="/images/svc_storage.jpg" alt="" /><div className="veil"></div><div className="inner"><div className="svc-idx">SERVICE 06</div><h3 className="svc-name" style={{fontSize:'2rem'}}>Secure Storage</h3><p className="svc-desc">Monitored storage, access when you need it.</p></div></div>
        </div>
      </section>


      <section className="proc" id="process">
        <div className="proc-head">
          <span className="eyebrow reveal">The Moving Process</span>
          <h2 className="reveal">Six steps. One smooth journey.</h2>
        </div>
        <div className="proc-pin" id="procPin">
          <div className="proc-line"><i id="procLine"></i></div>
          <div className="proc-truck" id="procTruck"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z"/><circle cx="7" cy="17" r="1.6"/><circle cx="17.5" cy="17" r="1.6"/></svg></div>
          <div className="proc-track" id="procTrack">
            <div className="proc-step"><div className="dot"></div><div className="no">01</div><h3>Book</h3><p>Pick a date and get a clear, upfront quote. No surprises.</p></div>
            <div className="proc-step"><div className="dot"></div><div className="no">02</div><h3>Pack</h3><p>We arrive with materials and pack everything with care.</p></div>
            <div className="proc-step"><div className="dot"></div><div className="no">03</div><h3>Load</h3><p>Items are secured, mapped, and loaded to protect every piece.</p></div>
            <div className="proc-step"><div className="dot"></div><div className="no">04</div><h3>Move</h3><p>Your belongings travel safe, tracked, and on schedule.</p></div>
            <div className="proc-step"><div className="dot"></div><div className="no">05</div><h3>Deliver</h3><p>We reach your new address ready to unload and place.</p></div>
            <div className="proc-step"><div className="dot"></div><div className="no">06</div><h3>Settle In</h3><p>Furniture positioned, boxes unpacked — you're home.</p></div>
          </div>
        </div>
      </section>


      <section className="why" id="why">
        <div className="wrap">
          <div className="why-head">
            <div>
              <span className="eyebrow reveal">Why Choose Us</span>
              <h2 className="reveal" style={{marginTop:'16px'}}>The details <em>matter.</em></h2>
            </div>
            <p className="reveal">Anyone can move a box. We move it like it's the only one that counts — six reasons the difference shows.</p>
          </div>
          <div className="why-grid" id="whyGrid">
      
          </div>
        </div>
      </section>


      <section className="fleet" id="fleet">
        <div className="wrap fleet-head">
          <span className="eyebrow reveal" style={{justifyContent:'center'}}>Our Fleet</span>
          <h2 className="reveal" style={{marginTop:'16px'}}>Built to move <em>what matters.</em></h2>
          <p className="reveal">A closer look at the vehicle behind every safe delivery.</p>
        </div>
        <div className="wrap">
          <div className="fleet-stage" id="fleetStage">
            <div className="fleet-img"><img src="/images/truck_right.jpg" alt="inphint truck" id="fleetImg" /></div>
            <svg className="fleet-svg" id="fleetSvg" viewBox="0 0 100 60" preserveAspectRatio="none">
              <path d="M40,28 L40,10"/><path d="M18,42 L18,54"/><path d="M78,26 L92,14"/><path d="M62,44 L78,54"/>
            </svg>
            <div className="fleet-node" style={{left:'40%', top:'47%'}}><span className="dot"></span></div>
            <div className="fleet-node" style={{left:'18%', top:'70%'}}><span className="dot"></span></div>
            <div className="fleet-node" style={{left:'78%', top:'43%'}}><span className="dot"></span></div>
            <div className="fleet-node" style={{left:'62%', top:'73%'}}><span className="dot"></span></div>
            <div className="fleet-label" style={{left:'40%', top:'8%', transform:'translate(-50%,-100%)'}}><b>CAPACITY</b>Generous Load Space</div>
            <div className="fleet-label" style={{left:'18%', top:'90%', transform:'translate(-50%,0)'}}><b>PROTECTION</b>Padded &amp; Strapped</div>
            <div className="fleet-label" style={{left:'92%', top:'22%', transform:'translate(-50%,-100%)'}}><b>EQUIPMENT</b>Professional Gear</div>
            <div className="fleet-label" style={{left:'78%', top:'90%', transform:'translate(-50%,0)'}}><b>SECURE</b>Locked Transport</div>
          </div>
          <div className="fleet-labels-m">
            <div><b>CAPACITY</b><br />Generous load space</div><div><b>PROTECTION</b><br />Padded &amp; strapped</div>
            <div><b>EQUIPMENT</b><br />Professional gear</div><div><b>SECURE</b><br />Locked transport</div>
          </div>
        </div>
      </section>


      <section className="ba" id="ba">
        <div className="wrap">
          <div className="ba-head">
            <span className="eyebrow reveal" style={{justifyContent:'center'}}>The Transformation</span>
            <h2 className="reveal" style={{marginTop:'16px'}}>Transforming spaces. <em>Delivering peace of mind.</em></h2>
            <p className="reveal">From careful packing to perfect placement — scroll to watch a space change.</p>
          </div>
          <div className="ba-frame" data-cursor="VIEW">
            <img src="/images/beforeafter.jpg" alt="Before, during move, and after" />
            <div className="ba-wipe" id="baWipe"></div>
          </div>
          <div className="ba-tags"><span className="on" data-ba="0">Before</span><span data-ba="1">During Move</span><span data-ba="2">After</span></div>
        </div>
      </section>


      <section className="tst" id="tst">
        <div className="wrap">
          <div className="tst-head">
            <div><span className="eyebrow">Client Stories</span><h2 style={{fontSize:'clamp(1.8rem,4vw,3rem)', marginTop:'14px'}}>What people say.</h2></div>
            <div className="tst-nav"><button id="tPrev" aria-label="Previous">←</button><button id="tNext" aria-label="Next">→</button></div>
          </div>
          <div className="tst-viewport">
            <div className="tst-track" id="tstTrack">
              <div className="tst-slide">
                <div className="tst-media"><img src="/images/movers_sofa.jpg" alt="Happy client move" /></div>
                <div className="tst-body">
                  <p className="tst-quote">"They moved our entire home in a day and <em>nothing</em> — not a single glass — was out of place. It felt like magic, but it was clearly a system."</p>
                  <div className="tst-meta"><div className="who"><b>Sarah &amp; James M.</b><span>Family relocation</span></div><span className="tst-stars">★★★★★</span><span className="tst-tag">Residential Removals</span></div>
                </div>
              </div>
              <div className="tst-slide">
                <div className="tst-media"><img src="/images/svc_commercial.jpg" alt="Office move" /></div>
                <div className="tst-body">
                  <p className="tst-quote">"We relocated 40 desks over a weekend and opened for business Monday morning. <em>Zero downtime.</em> That's not luck — that's inphint."</p>
                  <div className="tst-meta"><div className="who"><b>Daniel R.</b><span>Operations Lead</span></div><span className="tst-stars">★★★★★</span><span className="tst-tag">Commercial Removals</span></div>
                </div>
              </div>
              <div className="tst-slide">
                <div className="tst-media"><img src="/images/svc_finefurniture.jpg" alt="Fine furniture handling" /></div>
                <div className="tst-body">
                  <p className="tst-quote">"I trusted them with a painting that's been in my family for generations. It arrived <em>flawless.</em> The care was genuinely moving."</p>
                  <div className="tst-meta"><div className="who"><b>Elena V.</b><span>Private collector</span></div><span className="tst-stars">★★★★★</span><span className="tst-tag">Fine Furniture Removals</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="num" id="numbers">
        <div className="wrap">
          <div className="num-grid">
            <div className="num-cell"><div className="big" data-count="10000" data-suffix="+" data-comma="1">0</div><div className="lbl">Moves Completed</div></div>
            <div className="num-cell"><div className="big" data-count="98" data-suffix="%">0</div><div className="lbl">Customer Satisfaction</div></div>
            <div className="num-cell"><div className="big" data-count="15" data-suffix="+">0</div><div className="lbl">Years Experience</div></div>
            <div className="num-cell"><div className="big" data-text="24/7">24/7</div><div className="lbl">Support Available</div></div>
          </div>
        </div>
      </section>


      <section className="area" id="area">
        <div className="wrap area-grid">
          <div className="area-copy">
            <span className="eyebrow reveal">Service Area</span>
            <h2 className="reveal">Wherever you're headed, <em>we cover it.</em></h2>
            <p className="reveal">Live routes across the metro and beyond — moving families and businesses between the places that matter.</p>
            <div className="area-list">
              <div className="reveal">City Central &amp; Inner Suburbs</div>
              <div className="reveal">Harbour &amp; Waterfront Districts</div>
              <div className="reveal">Metro North &amp; Business Parks</div>
              <div className="reveal">Regional &amp; Interstate Corridors</div>
            </div>
          </div>
          <div className="area-map" id="areaMap">
            <svg viewBox="0 0 400 300" id="areaSvg" preserveAspectRatio="xMidYMid slice">
              <g id="areaGrid"></g>
              <path className="route" d="M70,220 C120,180 160,200 210,150 S300,90 340,80"/>
              <path className="route" d="M90,90 C140,120 180,110 240,180 S320,230 350,210" style={{opacity:'.55'}}/>
              <path className="route" d="M70,220 C110,240 200,250 260,220 S330,150 340,80" style={{opacity:'.35'}}/>
              <circle className="city" cx="70" cy="220" r="4"/><circle className="city" cx="210" cy="150" r="3.5"/>
              <circle className="city" cx="340" cy="80" r="4"/><circle className="city" cx="90" cy="90" r="3.5"/>
              <circle className="city" cx="260" cy="220" r="3.5"/>
              <circle className="area-mover" r="3" id="mover1"><animateMotion dur="6s" repeatCount="indefinite" path="M70,220 C120,180 160,200 210,150 S300,90 340,80"/></circle>
              <circle className="area-mover" r="2.6" id="mover2"><animateMotion dur="8s" repeatCount="indefinite" path="M90,90 C140,120 180,110 240,180 S320,230 350,210"/></circle>
            </svg>
          </div>
        </div>
      </section>


      <section className="faq" id="faq">
        <div className="wrap">
          <div className="faq-head"><span className="eyebrow reveal">Questions</span><h2 className="reveal">Good to know.</h2></div>
          <div id="faqList">
            <div className="faq-item"><button className="faq-q">How far in advance should I book?<span className="pm"></span></button><div className="faq-a"><div><p>Two to three weeks is ideal for a home or office move, especially around month-ends and weekends. That said, we keep capacity for short-notice moves — reach out and we'll find a slot that works.</p></div></div></div>
            <div className="faq-item"><button className="faq-q">Do you provide packing materials?<span className="pm"></span></button><div className="faq-a"><div><p>Yes. Boxes, wrapping, padding, straps and specialty crating for fragile or high-value items all come with our full-service option. You can also choose to pack yourself and we'll handle the rest.</p></div></div></div>
            <div className="faq-item"><button className="faq-q">Are my belongings protected during the move?<span className="pm"></span></button><div className="faq-a"><div><p>Every item is padded, strapped and mapped inside the vehicle. Our transport is secure and monitored, and we handle fine furniture and fragile pieces with dedicated protection and, where needed, custom crating.</p></div></div></div>
            <div className="faq-item"><button className="faq-q">Can you store my things between moves?<span className="pm"></span></button><div className="faq-a"><div><p>Absolutely. Our secure storage is available for a few days or several months, with monitored access whenever you need to retrieve or add items. It's a seamless bridge between one home and the next.</p></div></div></div>
            <div className="faq-item"><button className="faq-q">How is my quote calculated?<span className="pm"></span></button><div className="faq-a"><div><p>We assess volume, distance, access and any specialty handling, then give you a clear, upfront figure. No hidden fees, no surprises on the day — the number we agree is the number you pay.</p></div></div></div>
          </div>
        </div>
      </section>


      <section className="final" id="quote">
        <div className="final-stage">
          <div className="final-sky"></div>
          <div className="final-road"></div>
          <div className="final-copy" id="finalCopy">
            <span className="eyebrow" style={{justifyContent:'center', marginBottom:'22px'}}>Ready When You Are</span>
            <h2>Your next move<br /><em>starts here.</em></h2>
            <p>Let's make your move simple, secure, and stress-free.</p>
            <div className="final-actions">
              <a href="mailto:hello@inphint.com?subject=Free%20Moving%20Quote" className="btn btn-primary" data-cursor="LET'S MOVE">Get A Free Quote <span className="arw">→</span></a>
              <a href="tel:+10000000000" className="btn btn-ghost" data-cursor="CALL">Call Now</a>
            </div>
          </div>
        </div>
      </section>

      </main>


      <footer className="foot">
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <img src="/images/logo.png" alt="inphint" />
              <p>Professional moving and logistics, designed around your home, your business, and everything that matters.</p>
              <a href="#quote" className="btn btn-primary fcta" data-cursor="LET'S MOVE" data-quote="">Get A Free Quote <span className="arw">→</span></a>
            </div>
            <div className="foot-col">
              <h4>Company</h4>
              <span className="dim">About</span><span className="dim">Why Us</span><span className="dim">Moving Process</span><span className="dim">Contact</span>
            </div>
            <div className="foot-col">
              <h4>Services</h4>
              <span className="dim">Residential</span><span className="dim">Commercial</span><span className="dim">Fine Furniture</span><span className="dim">Secure Storage</span>
            </div>
            <div className="foot-col">
              <h4>Get In Touch</h4>
              <a href="mailto:hello@inphint.com">hello@inphint.com</a>
              <a href="tel:+10000000000">+1 (000) 000-0000</a>
              <div className="foot-social">
                <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></a>
                <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 11v5M8 8v.5M12 16v-3a2 2 0 0 1 4 0v3"/></svg></a>
                <a href="#" aria-label="X"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6"><path d="M5 5l14 14M19 5L5 19"/></svg></a>
              </div>
            </div>
          </div>
          <div className="foot-bottom">
            <p className="mono">All Rights Reserved © Inphint – Creative Agency | Pakistan</p>
            <p>Designed as the digital experience of moving, 2040.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
