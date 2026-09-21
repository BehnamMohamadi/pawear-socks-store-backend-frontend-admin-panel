const {AppError}=require('../../utils/app-error');
const normalizeSize=value=>String(value||'free-size').trim().replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/[–—]/g,'-').replace(/\s*-\s*/g,'-').toUpperCase();
const normalizeColor=value=>String(value||'').trim().replace(/\s+/g,' ');
function selectVariant(product,{variantId,size,color}={}){
 if(product.variants?.length){
  const explicit=Boolean(variantId||size||color);
  let selected;
  if(variantId)selected=product.variants.find(v=>String(v._id)===String(variantId));
  else if(size||color){
   const matches=product.variants.filter(v=>(!size||normalizeSize(v.size)===normalizeSize(size))&&(!color||normalizeColor(v.color).toLowerCase()===normalizeColor(color).toLowerCase()));
   if(matches.length===1)selected=matches[0];
  }
  else selected=product.variants.find(v=>String(v._id)===String(product.defaultVariantId)&&v.isActive)||product.variants.find(v=>v.isActive&&v.stock>0)||product.variants.find(v=>v.isActive);
  if(!selected||!selected.isActive)throw new AppError(400,explicit?'رنگ و سایز انتخاب‌شده دیگر موجود نیست؛ دوباره انتخاب کنید.':'تنوع فعالی برای این محصول وجود ندارد.',null,'VARIANT_UNAVAILABLE');
  return {variantId:String(selected._id),size:normalizeSize(selected.size),color:normalizeColor(selected.color),colorCode:selected.colorCode||'',sku:selected.sku||product.sku,price:selected.price,stock:selected.stock};
 }
 if(variantId)throw new AppError(400,'تنوع انتخاب‌شده متعلق به این محصول نیست.',null,'VARIANT_UNAVAILABLE');
 if(product.sizes?.length){
  const selected=size?product.sizes.find(v=>normalizeSize(v.label)===normalizeSize(size)&&v.isActive):product.sizes.find(v=>v.isActive&&v.stock>0)||product.sizes.find(v=>v.isActive);
  if(!selected||color)throw new AppError(400,'سایز انتخاب‌شده معتبر نیست؛ دوباره انتخاب کنید.',null,'SIZE_REQUIRED');
  return {variantId:null,size:selected.label,color:'',colorCode:'',sku:product.sku,price:selected.price,stock:selected.stock};
 }
 if((size&&normalizeSize(size)!=='FREE-SIZE')||color)throw new AppError(400,'این محصول فقط فری‌سایز است.',null,'SIZE_REQUIRED');
 return {variantId:null,size:'free-size',color:'',colorCode:'',sku:product.sku,price:product.price,stock:product.stock};
}
module.exports={normalizeSize,normalizeColor,selectVariant};
