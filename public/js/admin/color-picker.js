(()=>{
 const form=document.querySelector('#resourceForm'),picker=form?.querySelector('[data-color-picker]');if(!picker)return;
 const code=form.elements.code,name=form.elements.name,area=form.querySelector('[data-color-presets]');
 const presets=[['مشکی','#000000'],['سفید','#FFFFFF'],['قرمز','#E53935'],['سرمه‌ای','#001F54'],['آبی','#1976D2'],['آبی روشن','#81D4FA'],['سبز','#388E3C'],['سبز زیتونی','#808000'],['یشمی','#00695C'],['زرد','#FDD835'],['خردلی','#D4A017'],['نارنجی','#FB8C00'],['صورتی','#F48FB1'],['گلبهی','#FFAB91'],['بنفش','#8E24AA'],['یاسی','#CE93D8'],['طوسی','#9E9E9E'],['ذغالی','#37474F'],['کرم','#FFF1D6'],['بژ','#D9C3A5'],['قهوه‌ای','#795548'],['نسکافه‌ای','#A67B5B'],['زرشکی','#800020'],['فیروزه‌ای','#26C6DA']];
 function highlight(){area.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.code===code.value.toUpperCase())));}
 for(const [label,hex] of presets){const button=document.createElement('button');button.type='button';button.dataset.code=hex;button.title=label+' · '+hex;const swatch=document.createElement('span');swatch.style.backgroundColor=hex;swatch.setAttribute('aria-hidden','true');button.append(swatch,document.createTextNode(label));button.addEventListener('click',()=>{name.value=label;code.value=hex;picker.value=hex;highlight();});area.append(button);}
 picker.addEventListener('input',()=>{code.value=picker.value.toUpperCase();highlight();});
 code.addEventListener('input',()=>{if(/^#[0-9a-f]{6}$/i.test(code.value))picker.value=code.value;highlight();});
 code.addEventListener('blur',()=>{let value=code.value.trim();if(/^[0-9a-f]{6}$/i.test(value))value='#'+value;if(/^#[0-9a-f]{3}$/i.test(value))value='#'+[...value.slice(1)].map(c=>c+c).join('');code.value=value.toUpperCase();if(/^#[0-9a-f]{6}$/i.test(value))picker.value=value;highlight();});highlight();
})();
