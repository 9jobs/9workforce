import {useEffect,useSyncExternalStore} from 'react';
import './scroll-reveals.css';

export const revealVariants = {
  up: {x:0,y:24,duration:650},
  left: {x:45,y:15,duration:800},
  right: {x:-45,y:15,duration:800},
  down: {x:0,y:-14,duration:650},
  fade: {x:0,y:0,duration:600},
};

// These elements own their transforms/entrances. Keep their containers intact;
// ordinary text inside an existing card can have its own additive entrance.
const protectedScenes = '.construction-journey,.labour-orbit,.about-coordination-scene,.about-service-coverage';
const existingReveals = [
  '.solutions-intro','.solution','.process > div:first-child',
  '.steps article','.labour-cards article','.workflow-grid article',
  '.why-grid article','.employer-tiles article','.industry-editorial article',
  '.find-work-role-card','.worker-benefits .benefit-grid article',
  '.timeline-row article','.find-work-heading','.page-hero > img','.worker-hero > img',
].join(',');
const excluded = `${protectedScenes},${existingReveals},.site-header,nav,form,[role="alert"],[role="status"],[role="dialog"],[hidden],[aria-hidden="true"],.application-progress,.application-panel,.application-brand-tagline,.application-received-page`;
const textExcluded = '.construction-journey,.about-coordination-scene,.about-service-coverage,.labour-orbit-display,.labour-orbit-sr,.site-header,nav,form,[role="alert"],[role="status"],[role="dialog"],[hidden],[aria-hidden="true"],.application-progress,.application-panel,.application-brand-tagline,.application-received-page';
const textTargets = 'h1,h2,h3,h4,p,[class*="eyebrow"],[class*="kicker"]';
const columnLayouts = [
  '.about-brand-hero-inner','.about-company-story-inner','.coverage-content',
  '.work-area-photo-card','.work-role-hero-grid','.work-role-details',
  '.worker-request-card','.worker-registration-card','.contact-studio',
  '.find-work-register-banner','.page-hero','.worker-hero','.split-cta',
  '.request-section','.hire-next-step','.hire-hero-inner',
].join(',');
const cardGroups = [
  '.about-workflow-steps','.hire-steps','.hire-support','.coverage-options',
  '.home-search-result-list','.metrics','.trust','.about-trust',
  '.site-footer-features','.site-footer-main','.legal-content','.home-hero-sectors',
].join(',');
const generalTargets = [
  'h1','h2','h3','h4','p','img','.btn',
  '[class*="eyebrow"]','[class*="kicker"]','.badge',
  '.about-quote-call','.about-quote-request','.hire-blue-button',
  '.find-work-register-button','.contact-studio-location','.site-footer-bottom',
  '.home-hero-primary','.home-hero-secondary','.home-search-submit',
  '.legal-section-block','.legal-callout-box','.legal-contact-callout',
].join(',');
const easing='cubic-bezier(.22,1,.36,1)';
const motionQuery='(prefers-reduced-motion: reduce)';
function subscribeMotionPreference(notify){
  const preference=window.matchMedia(motionQuery);
  preference.addEventListener('change',notify);
  return()=>preference.removeEventListener('change',notify);
}
const motionPreference=()=>typeof window==='undefined'||window.matchMedia(motionQuery).matches;

// No wrappers, layout styles, scroll handlers, or form/state changes. One shared
// observer per page registers DOM nodes and releases all effects after reveal.
export default function ScrollReveals({root}) {
  const reduce=useSyncExternalStore(subscribeMotionPreference,motionPreference,()=>true);
  useEffect(()=>{
    const page=root.current;
    if(!page||reduce||typeof IntersectionObserver==='undefined'||!Element.prototype.animate)return;
    const entries=new Map();
    let observer,mutations,scanFrame;
    let disposed=false;
    const belongsToPage=element=>element.closest('.motion-page')===page;
    const eligible=(element,text=false)=>belongsToPage(element)&&!element.closest(text?textExcluded:excluded)
      &&element.getClientRects().length>0
      &&getComputedStyle(element).animationName==='none';
    const hasSelectedAncestor=element=>{for(let node=element.parentElement;node&&node!==page;node=node.parentElement)if(entries.has(node))return true;return false;};
    const finish=entry=>{
      if(entry.state==='complete')return;
      entry.state='complete';entry.animation.cancel();
      entry.element.dataset.scrollRevealState='complete';
      observer?.unobserve(entry.element);
    };
    const play=entry=>{
      if(entry.state!=='pending')return;
      entry.state='running';entry.element.dataset.scrollRevealState='running';
      entry.animation.play();
      entry.animation.finished.then(()=>finish(entry)).catch(()=>{});
      // Start a container's text together with its entrance. At the very bottom
      // of a page, translated children cannot be scrolled farther into view.
      if(!entry.element.dataset.scrollRevealText)entries.forEach(child=>{
        if(child.element.dataset.scrollRevealText&&entry.element.contains(child.element))play(child);
      });
    };
    const register=(element,variantFor,delay=0,text=false)=>{
      if(entries.has(element)||!eligible(element,text)||(!text&&hasSelectedAncestor(element)))return;
      if(text&&element.parentElement.closest(textTargets))return;
      if([...entries.keys()].some(target=>element.contains(target)))return;
      if(element.querySelector(protectedScenes)||element.querySelector(existingReveals))return;
      const variant=variantFor();
      const opacity=Number(getComputedStyle(element).opacity);
      const frames=[
        {transform:`translate3d(${variant.x}px,${variant.y}px,0)`,easing,composite:'add'},
        {transform:'translate3d(0,0,0)',composite:'add'},
      ];
      // Separate effects keep CSS transforms (including existing hover effects)
      // additive while opacity uses normal replacement compositing.
      const animation=element.animate(frames,{duration:variant.duration,delay,fill:'both'});
      animation.pause();animation.currentTime=0;
      const fade=element.animate([{opacity:0},{opacity}],{duration:variant.duration,delay,easing,fill:'both'});
      fade.pause();fade.currentTime=0;
      const entry={element,variantFor,state:'pending',animation:{
        play(){animation.play();fade.play();},
        cancel(){animation.cancel();fade.cancel();},
        get finished(){return Promise.all([animation.finished,fade.finished]);},
        update(next){animation.effect.setKeyframes([
          {transform:`translate3d(${next.x}px,${next.y}px,0)`,easing,composite:'add'},
          {transform:'translate3d(0,0,0)',composite:'add'},
        ]);},
      }};
      entries.set(element,entry);
      element.dataset.scrollRevealState='pending';
      element.dataset.scrollRevealVariant=variant.x<0?'right':variant.x>0?'left':variant.y>0?'up':variant.y<0?'down':'fade';
      if(text)element.dataset.scrollRevealText='true';
      observer.observe(element);
    };
    const scan=()=>{
      if(disposed)return;
      try {
        page.querySelectorAll(columnLayouts).forEach(layout=>{
          if(!belongsToPage(layout)||layout.closest(protectedScenes))return;
          const columns=[...layout.children].filter(element=>!element.matches('[aria-hidden="true"],.split-cta-action')&&element.getClientRects().length);
          if(columns.length!==2)return;
          columns.forEach((column,index)=>register(column,()=>{
            const boxes=columns.map(element=>element.getBoundingClientRect());
            const stacked=window.innerWidth<=550||Math.min(boxes[0].right,boxes[1].right)-Math.max(boxes[0].left,boxes[1].left)>Math.min(boxes[0].width,boxes[1].width)*.5;
            if(stacked)return revealVariants.up;
            return boxes[index].left<boxes[1-index].left?revealVariants.right:revealVariants.left;
          },index*90));
        });
        page.querySelectorAll(cardGroups).forEach(group=>{
          [...group.children].forEach((card,index)=>register(card,()=>revealVariants.up,Math.min(index,3)*100));
        });
        page.querySelectorAll(generalTargets).forEach((element,index)=>{
          if(element.matches(textTargets))return;
          register(element,()=>{
            if(element.matches('[class*="eyebrow"],[class*="kicker"],.badge'))return index%2?revealVariants.fade:revealVariants.down;
            if(element.tagName==='IMG')return window.innerWidth<=780?revealVariants.up:revealVariants.right;
            return revealVariants.up;
          },Math.min(index%4,3)*80);
        });
        // Columns still enter from opposite sides. Their headings and copy rise
        // independently rather than being swallowed by the container reveal.
        page.querySelectorAll(textTargets).forEach(element=>{
          const siblings=[...element.parentElement.children].filter(child=>child.matches(textTargets));
          register(element,()=>revealVariants.up,Math.min(siblings.indexOf(element),3)*80,true);
        });
      }catch{
        // A failed initialization must leave every registered node visible.
        entries.forEach(finish);observer?.disconnect();
      }
    };
    const revealInteracted=event=>{
      entries.forEach(entry=>{if(entry.element.contains(event.target))finish(entry);});
    };
    const resize=()=>{
      entries.forEach(entry=>{
        if(entry.state==='running')finish(entry);
        else if(entry.state==='pending')entry.animation.update(entry.variantFor());
      });
    };
    observer=new IntersectionObserver(records=>{
      records.forEach(record=>{
        const entry=entries.get(record.target);
        const threshold=Math.min(.16,innerHeight/Math.max(record.boundingClientRect.height,1)*.16);
        if(entry&&record.isIntersecting&&record.intersectionRatio>=threshold)play(entry);
      });
    },{threshold:[0,.05,.1,.16],rootMargin:'0px 0px -3% 0px'});
    page.dataset.scrollReveals='enabled';
    scan();
    mutations=new MutationObserver(records=>{
      if(records.every(record=>record.target.parentElement?.closest(excluded)))return;
      cancelAnimationFrame(scanFrame);scanFrame=requestAnimationFrame(scan);
    });
    mutations.observe(page,{childList:true,subtree:true});
    page.addEventListener('focusin',revealInteracted,true);
    page.addEventListener('pointerdown',revealInteracted,true);
    window.addEventListener('resize',resize,{passive:true});
    return()=>{
      disposed=true;cancelAnimationFrame(scanFrame);observer.disconnect();mutations.disconnect();
      page.removeEventListener('focusin',revealInteracted,true);page.removeEventListener('pointerdown',revealInteracted,true);
      window.removeEventListener('resize',resize);
      entries.forEach(entry=>{entry.animation.cancel();delete entry.element.dataset.scrollRevealState;delete entry.element.dataset.scrollRevealVariant;delete entry.element.dataset.scrollRevealText;});
      delete page.dataset.scrollReveals;
    };
  },[root,reduce]);
  return null;
}
