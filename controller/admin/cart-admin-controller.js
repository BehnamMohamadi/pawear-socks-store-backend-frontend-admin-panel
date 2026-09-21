const mongoose=require('mongoose');
const Joi=require('joi');
const Cart=require('../../models/shopping-models/cart-model');
const Audit=require('../../models/shopping-models/cart-admin-audit-model');
const {getSellable,buildCartSnapshot}=require('../../services/shopping-services/catalog-service');
const {AppError}=require('../../utils/app-error');
const {catchAsync}=require('../../utils/catch-async');
const id=Joi.string().hex().length(24).required();
const validate=(schema,value)=>{const result=schema.validate(value);if(result.error)throw new AppError(400,'شناسه کالا، تنوع و تعداد را بررسی کنید.');return result.value;};
const snapshot=cart=>cart.toObject({depopulate:true});
const mutate=(action,fn)=>catchAsync(async(req,res)=>{
 validate(id,req.params.cartId);
 const cart=await mongoose.connection.transaction(async session=>{
  const cart=await Cart.findById(req.params.cartId).session(session);
  if(!cart)throw new AppError(404,'سبد پیدا نشد.');
  const before=snapshot(cart);
  await fn(cart,req,session);
  cart.revision+=1;await cart.save({session});
  await Audit.create([{admin:req.user._id,user:cart.user,cart:cart._id,action:typeof action==='function'?action(req):action,before,after:snapshot(cart)}],{session});
  return cart;
 });
 res.json({status:'success',data:{cart}});
});
exports.clear=mutate('clear',async cart=>{cart.items=[];});
exports.setQuantity=mutate(req=>req.body.quantity===0?'remove':'set_quantity',async(cart,req,session)=>{
 validate(id,req.params.itemId);const {quantity}=validate(Joi.object({quantity:Joi.number().integer().min(0).max(100).required()}).unknown(false),req.body);
 const row=cart.items.id(req.params.itemId);if(!row)throw new AppError(404,'ردیف سبد پیدا نشد.');
 if(quantity===0)row.deleteOne();else{row.quantity=quantity;await buildCartSnapshot(cart,session);}
});
exports.add=mutate('add',async(cart,req,session)=>{
 const body=validate(Joi.object({product:id,variantId:Joi.string().hex().length(24),size:Joi.string().max(30),color:Joi.string().max(60),quantity:Joi.number().integer().min(1).max(100).default(1)}).unknown(false),req.body);
 const selected=await getSellable('Product',body.product,session,body);
 const row=cart.items.find(i=>i.itemType==='Product'&&String(i.item)===body.product&&String(i.variantId||'')===String(selected.variantId||'')&&(i.size||'free-size')===selected.size);
 if(row)row.quantity+=body.quantity;
 else{if(cart.items.length>=100)throw new AppError(400,'حداکثر ۱۰۰ ردیف در سبد مجاز است.');cart.items.push({itemType:'Product',item:body.product,variantId:selected.variantId||null,size:selected.size,color:selected.color||'',quantity:body.quantity});}
 await buildCartSnapshot(cart,session);
});
exports.audit=catchAsync(async(req,res)=>{validate(id,req.params.cartId);res.json({status:'success',data:{audit:await Audit.find({cart:req.params.cartId}).populate('admin','firstname lastname').sort('-createdAt').limit(100).lean()}});});
