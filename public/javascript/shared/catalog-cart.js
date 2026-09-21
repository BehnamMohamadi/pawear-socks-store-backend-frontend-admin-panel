(()=>{
 const cards=[...document.querySelectorAll('.product-card')];if(!cards.length)return;
 let cart={items:[]},busy=false;
 const id=v=>String(v?._id||v||'');
 function sync(next){cart=next;Pawear.cartCount(cart);cards.forEach(card=>{
  const add=card.querySelector('[data-add-cart]');if(!add)return;
  let area=card.querySelector('.catalog-quantities');if(!area){area=document.createElement('div');area.className='catalog-quantities';card.querySelector('.product-card__body').append(area);}area.replaceChildren();
  const rows=cart.items.filter(r=>id(r.item)===add.dataset.addCart&&r.itemType===add.dataset.type&&(!add.dataset.variant||id(r.variantId)===add.dataset.variant));add.hidden=rows.length>0;add.style.display=rows.length?'none':'';
  rows.forEach(row=>{const wrap=document.createElement('div'),label=document.createElement('div');label.className='catalog-quantity-label';label.textContent=[row.size,row.color].filter(Boolean).join(' · ');wrap.append(label);const step=document.createElement('div');step.className='compact-stepper';
   for(const delta of [1,0,-1]){const el=document.createElement(delta?'button':'strong');if(delta){el.type='button';el.textContent=delta>0?'+':'−';el.setAttribute('aria-label',delta>0?'افزایش تعداد':'کاهش تعداد');el.addEventListener('click',Pawear.run(async()=>{if(busy)return;busy=true;try{const r=await Pawear.request('/api/cart/'+row._id,'PATCH',{quantity:row.quantity+delta});document.dispatchEvent(new CustomEvent('pawear:cart',{detail:r.data.cart}));}finally{busy=false;}}));}else el.textContent=row.quantity.toLocaleString('fa-IR');step.append(el);}wrap.append(step);area.append(wrap);
  });
 });}
 cards.forEach(card=>{const select=card.querySelector('.catalog-choice'),add=card.querySelector('[data-add-cart]');if(!select||!add)return;const choose=()=>{add.dataset.variant=select.value;card.querySelector('.price').textContent=Number(select.selectedOptions[0].dataset.price).toLocaleString('fa-IR')+' تومان';sync(cart);};select.addEventListener('change',choose);choose();
 const picker=document.createElement('details');picker.className='catalog-picker';picker.dataset.catalogPicker='';
 const summary=document.createElement('summary'),list=document.createElement('div');list.className='catalog-picker__options';
 summary.setAttribute('aria-label',select.getAttribute('aria-label'));picker.append(summary,list);
 const refresh=()=>{summary.textContent=select.selectedOptions[0].textContent;list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===select.value)));};
 [...select.options].forEach(option=>{const button=document.createElement('button');button.type='button';button.dataset.value=option.value;button.textContent=option.textContent;button.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));refresh();picker.open=false;summary.focus();});list.append(button);});
 picker.addEventListener('keydown',e=>{if(e.key==='Escape'){picker.open=false;summary.focus();}});
 picker.addEventListener('toggle',()=>{if(picker.open)document.querySelectorAll('[data-catalog-picker]').forEach(other=>{if(other!==picker)other.open=false;});});
 select.after(picker);select.hidden=true;refresh();});
 document.addEventListener('pawear:cart',e=>sync(e.detail));Pawear.request('/api/cart').then(r=>sync(r.data.cart)).catch(()=>{});
})();
