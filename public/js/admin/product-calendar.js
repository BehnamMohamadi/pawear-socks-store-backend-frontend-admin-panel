(()=>{
 const form=document.querySelector('#resourceForm');if(form?.dataset.resource!=='products')return;
 const fmt=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric'}),fa=n=>n.toLocaleString('fa-IR',{useGrouping:false}),months=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
 const parts=date=>{const p=Object.fromEntries(fmt.formatToParts(date).map(v=>[v.type,v.value]));return {year:+p.year,month:+p.month,day:+p.day};};
 const local=date=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 for(const key of ['discountStart','discountEnd']){
 const hidden=form.elements[key];if(!hidden)continue;hidden.type='hidden';
 const host=document.createElement('div');host.className='persian-calendar';hidden.after(host);
 const trigger=document.createElement('button');trigger.type='button';trigger.className='btn btn-secondary calendar-trigger';trigger.setAttribute('aria-expanded','false');
 const panel=document.createElement('div');panel.className='calendar-panel';panel.hidden=true;const bar=document.createElement('div');bar.className='calendar-nav';
 const prev=document.createElement('button'),next=document.createElement('button'),title=document.createElement('strong');prev.type=next.type='button';prev.textContent='ماه قبل';next.textContent='ماه بعد';bar.append(prev,title,next);
 const grid=document.createElement('div');grid.className='calendar-grid';const time=document.createElement('input');time.type='time';time.value=hidden.value.split('T')[1]?.slice(0,5)||'00:00';time.setAttribute('aria-label','ساعت '+(key==='discountStart'?'شروع':'پایان')+' تخفیف');
 const note=document.createElement('small');note.textContent='ساعت بر اساس منطقه زمانی دستگاه شما';
 const clear=document.createElement('button');clear.type='button';clear.className='btn btn-secondary';clear.textContent='پاک کردن تاریخ';panel.append(bar,grid,time,note,clear);host.append(trigger,panel);
 let selected=hidden.value?new Date(hidden.value):null,view=selected||new Date();view=new Date(view.getFullYear(),view.getMonth(),view.getDate(),12);
 function update(){trigger.textContent=selected?(()=>{const p=parts(selected);return fa(p.day)+' '+months[p.month-1]+' '+fa(p.year)+' · '+time.value;})():'انتخاب تاریخ شمسی (اختیاری)';}
 function commit(){hidden.value=selected?local(selected)+'T'+time.value:'';hidden.dispatchEvent(new Event('change',{bubbles:true}));update();}
 function draw(){const p=parts(view);title.textContent=months[p.month-1]+' '+fa(p.year);grid.replaceChildren();for(const day of ['ش','ی','د','س','چ','پ','ج']){const span=document.createElement('span');span.textContent=day;grid.append(span);}const first=new Date(view);first.setDate(first.getDate()-p.day+1);for(let i=0;i<(first.getDay()+1)%7;i++)grid.append(document.createElement('span'));
 for(let i=0;i<31;i++){const date=new Date(first);date.setDate(first.getDate()+i);if(parts(date).month!==p.month)break;const button=document.createElement('button');button.type='button';button.textContent=fa(i+1);button.setAttribute('aria-label',fa(i+1)+' '+months[p.month-1]+' '+fa(p.year));button.setAttribute('aria-pressed',String(!!selected&&local(date)===local(selected)));button.onclick=()=>{selected=date;commit();draw();};grid.append(button);}}
 function shift(direction){const p=parts(view);view.setDate(view.getDate()-p.day+1);view.setDate(view.getDate()+(direction<0?-1:32));draw();}
 prev.onclick=()=>shift(-1);next.onclick=()=>shift(1);trigger.onclick=()=>{panel.hidden=!panel.hidden;trigger.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)draw();};time.onchange=()=>{if(!time.value)time.value='00:00';commit();};clear.onclick=()=>{selected=null;commit();draw();};host.addEventListener('keydown',e=>{if(e.key==='Escape'){panel.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}});update();
 }
})();
