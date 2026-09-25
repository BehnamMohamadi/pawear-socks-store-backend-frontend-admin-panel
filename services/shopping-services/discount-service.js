const rate=(product,now=Date.now())=>product.discountEnabled&&product.discount>0&&(!product.discountStart||+new Date(product.discountStart)<=now)&&(!product.discountEnd||+new Date(product.discountEnd)>now)?product.discount:0;
const price=(product,amount)=>Math.max(1,Math.round(amount*(100-rate(product))/100));
module.exports={rate,price};
