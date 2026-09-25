const path=require('node:path');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const mongoose=require('mongoose');
const Brand=require('../models/product-models/brand-model');

const brands=[
 ['ROPAPA-MALE','ropapa-ma','جوراب مردانه روپا'],
 ['LEO-MALE','leo-ma','جوراب مردانه لئو'],
 ['AROOCO_MALE','arooco-ma','جوراب مردانه آروکو'],
 ['GANDO-MALE','gando-ma','جوراب مردانه گاندو'],
 ['FIGARO-MALE','figaro-ma','جوراب مردانه فیگارو'],
 ['LEO-FEMALE','leo-fe','جوراب زنانه لئو'],
 ['AROOCO_FEMALE','arooco-fe','جوراب زنانه آروکو'],
 ['FIGARO-FEMALE','figaro-fe','جوراب زنانه فیگارو']
].map(([name,slug,description])=>({name,slug,description,isActive:true}));

(async()=>{
 if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is not configured.');
 await mongoose.connect(process.env.MONGODB_URI);
 let created=0,updated=0;
 for(const data of brands){
  const existing=await Brand.findOne({$or:[{name:data.name},{slug:data.slug}]});
  if(existing){
   existing.name=data.name;existing.slug=data.slug;existing.description=data.description;existing.isActive=true;
   await existing.save();updated++;console.log('Updated:',data.name);
  }else{
   await Brand.create(data);created++;console.log('Created:',data.name);
  }
 }
 console.log('Done. Created:',created,'Updated:',updated);
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
