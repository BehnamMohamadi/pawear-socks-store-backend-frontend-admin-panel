document.addEventListener('click',event=>{
  const button=event.target.closest('[data-mock-payment],[data-pay-order],[data-cancel-order],[data-copy-tracking],[data-confirm-received]');if(!button)return;
  Pawear.run(async()=>{
    if(button.dataset.copyTracking){await navigator.clipboard.writeText(button.dataset.copyTracking);Pawear.notice('کد رهگیری کپی شد.');return;}
    if(button.dataset.payOrder)return Pawear.startPayment(button.dataset.payOrder);
    if(button.dataset.confirmReceived){if(!window.confirm('بسته را دریافت کرده‌ای؟ تأیید دریافت ثبت می‌شود.'))return;await Pawear.request('/api/orders/'+button.dataset.confirmReceived+'/received','POST');}
    if(button.dataset.mockPayment){await Pawear.request('/api/payments/mock/'+button.dataset.mockPayment+'/success','POST');if(button.dataset.returnOrder){location.href='/orders/'+button.dataset.returnOrder;return;}}
    if(button.dataset.cancelOrder)await Pawear.request('/api/orders/'+button.dataset.cancelOrder,'DELETE');
    await PawearLive.refresh(location.href,true);
  })(event);
});

(()=>{let busy=false;document.addEventListener('click',event=>{const button=event.target.closest('[data-review-delta],[data-review-remove]');if(!button)return;Pawear.run(async()=>{if(busy)return;busy=true;const pay=document.querySelector('[data-pay-order]');if(pay)pay.disabled=true;try{const control=button.closest('[data-review-item]'),{data}=await Pawear.request('/api/cart');const row=data.cart.items.find(r=>String(r.item)===control.dataset.reviewItem&&r.itemType===control.dataset.reviewType&&String(r.variantId||'')===control.dataset.reviewVariant);if(!row)throw new Error('سبد تغییر کرده است؛ از سبد خرید دوباره سفارش را بررسی کن.');const quantity=button.hasAttribute('data-review-remove')?0:row.quantity+Number(button.dataset.reviewDelta);const result=await Pawear.request('/api/cart/'+row._id,'PATCH',{quantity});Pawear.cartCount(result.data.cart);if(!result.data.cart.items.length){location.href='/cart';return;}const prepared=await Pawear.request('/api/orders','POST',{addressId:control.dataset.reviewAddress,shippingMethod:control.dataset.reviewShipping});location.replace('/orders/'+prepared.data.order._id);}catch(error){Pawear.notice(error.message+' برای بررسی مجدد به سبد خرید برو.');}finally{busy=false;}})(event);});})();
