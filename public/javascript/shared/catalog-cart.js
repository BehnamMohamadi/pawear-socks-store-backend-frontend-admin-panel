// Color photos replace swatches only after the photo has loaded successfully.
document.querySelectorAll('.product-card').forEach(card=>{
 const image=card.querySelector('.card-cover'),original=image?.getAttribute('src');
 const reset=()=>{if(image&&original)image.src=original;card.classList.remove('is-color-preview');};
 card.querySelectorAll('[data-color-preview]').forEach(link=>{
  const thumbnail=link.querySelector('img');if(!thumbnail)return;
  const loaded=()=>{if(thumbnail.naturalWidth>0)thumbnail.classList.add('is-loaded');};
  const failed=()=>{thumbnail.classList.remove('is-loaded');thumbnail.hidden=true;link.removeAttribute('data-color-preview');reset();};
  thumbnail.addEventListener('load',loaded);thumbnail.addEventListener('error',failed);
  if(thumbnail.complete){if(thumbnail.naturalWidth>0)loaded();else failed();}
  const preview=()=>{if(!image||!thumbnail.classList.contains('is-loaded'))return;image.src=link.dataset.colorPreview;card.classList.add('is-color-preview');};
  link.addEventListener('mouseenter',preview);link.addEventListener('focus',preview);
 });
 card.addEventListener('mouseleave',reset);
 card.addEventListener('focusout',e=>{if(!card.contains(e.relatedTarget))reset();});
});
