'use strict';
const nav=document.querySelector('[data-nav]'),toggle=nav?.querySelector('.pp-nav-toggle');
const mobileMenu=window.matchMedia('(max-width:991px)');
function closeMenu(restoreFocus=false){nav?.classList.remove('is-open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Open navigation');if(restoreFocus)toggle?.focus({preventScroll:true});syncHeaderScroll()}
nav?.querySelector('.tf-menu-close')?.addEventListener('click',()=>closeMenu(true));
if(toggle){toggle.setAttribute('aria-label','Open navigation');toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');if(open)nav.querySelector('.pp-nav-links a')?.focus({preventScroll:true})})}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('is-open')){e.preventDefault();closeMenu(true)}});
document.addEventListener('click',e=>{if(nav&&!nav.contains(e.target))closeMenu()});

nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));
mobileMenu.addEventListener('change',()=>closeMenu());
document.querySelectorAll('[role=tablist]').forEach(list=>{const tabs=[...list.querySelectorAll('[role=tab]')];function select(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active})}tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(tab));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i-1+tabs.length)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();select(tabs[n]);tabs[n].focus()}})})});

// The visible promotion is the live Futures offer verified 2026-11-02.
// Expire it automatically rather than carrying an obsolete coupon into future tasks.
const promo=document.querySelector('[data-promo-expires]');
if(promo&&Date.now()>Date.parse(promo.dataset.promoExpires)){promo.hidden=true;document.querySelector('.tf-product-rail')?.classList.remove('tf-has-promo')}
document.querySelector('[data-copy-code]')?.addEventListener('click',async e=>{const button=e.currentTarget,status=document.querySelector('.tf-code-status');try{await navigator.clipboard.writeText(button.dataset.copyCode);button.dataset.copied='true';status.textContent='Discount code '+button.dataset.copyCode+' copied';const tip=document.createElement('span');tip.className='tf-copy-tooltip';tip.textContent='Copied!';tip.setAttribute('aria-hidden','true');const rect=button.getBoundingClientRect();tip.style.left=Math.min(window.innerWidth-90,(e.clientX||rect.left)+12)+'px';tip.style.top=Math.max(4,(e.clientY||rect.top)-20)+'px';document.body.append(tip);setTimeout(()=>tip.classList.add('is-leaving'),800);setTimeout(()=>tip.remove(),1100);setTimeout(()=>delete button.dataset.copied,1800)}catch{status.textContent='Copy unavailable. Discount code: '+button.dataset.copyCode}});

const siteHeader=document.querySelector('.tf-site-header');
if(siteHeader&&'ResizeObserver' in window){new ResizeObserver(entries=>{document.documentElement.style.setProperty('--tf-header-height',entries[0].target.getBoundingClientRect().height+'px')}).observe(siteHeader)}

// Match the live mobile ticker's 0.5px/frame (~30px/s) auto-scroll speed.
const tickerRun=document.querySelector('.tf-promo-run');
function sizePromoTicker(){if(tickerRun)document.documentElement.style.setProperty('--tf-promo-duration',tickerRun.getBoundingClientRect().width/30+'s')}
document.fonts?.ready.then(sizePromoTicker);window.addEventListener('resize',sizePromoTicker);sizePromoTicker();

// Live Futures collapses the promotional rails after the first50px of scrolling.
function syncHeaderScroll(){
 if(nav?.classList.contains('is-open'))return;
 const collapsed=mobileMenu.matches&&window.scrollY>50;
 siteHeader?.classList.toggle('is-scrolled',collapsed);
 if(siteHeader){const hidden=collapsed?parseFloat(getComputedStyle(siteHeader).getPropertyValue('--tf-collapsed-rail'))||0:0;document.documentElement.style.setProperty('--tf-header-height',Math.max(0,siteHeader.getBoundingClientRect().height-hidden)+'px')}
}
window.addEventListener('scroll',syncHeaderScroll,{passive:true});window.addEventListener('resize',syncHeaderScroll);syncHeaderScroll();
// Keep keyboard traversal within the open drawer; Escape restores the opener.
document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!mobileMenu.matches||!nav?.classList.contains('is-open'))return;const items=[...nav.querySelectorAll('.pp-nav-menu-shell button,.pp-nav-menu-shell a')].filter(x=>x.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus({preventScroll:true})}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus({preventScroll:true})}});
