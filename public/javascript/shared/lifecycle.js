(() => {
  // Native history may restore a frozen authenticated document despite no-store.
  window.addEventListener('pageshow', event => {
    document.documentElement.classList.remove('is-navigating');
    if (event.persisted) location.reload();
  });
  const imageFallback = image => {
    if(image instanceof HTMLImageElement && image.getAttribute('src') !== '/images/product-placeholder.svg') image.src = '/images/product-placeholder.svg';
  };
  document.addEventListener('error', event => imageFallback(event.target), true);
  document.querySelectorAll('img').forEach(image => {if(image.complete && !image.naturalWidth) imageFallback(image);});
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && 'IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}
    }),{threshold:.08});
    document.querySelectorAll('.section-head,.category-tile,.box-story__grid,.product-card,.order-card,.tracking-panel').forEach((el,i)=>{
      if(el.getBoundingClientRect().top < window.innerHeight)return;
      el.classList.add('reveal-ready');observer.observe(el);
    });
  }
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]');
    if(!link||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.target||link.download)return;
    const url=new URL(link.href,location.href);
    if(url.origin===location.origin && url.pathname!==location.pathname) document.documentElement.classList.add('is-navigating');
  });
  window.addEventListener('pagehide',()=>document.documentElement.classList.remove('is-navigating'));
})();

(()=>{document.querySelectorAll('[data-clear-search]').forEach(button=>{const input=button.parentElement.querySelector('input[type="search"]');if(!input)return;const sync=()=>button.hidden=!input.value;input.addEventListener('input',sync);button.addEventListener('click',()=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();});sync();});})();
