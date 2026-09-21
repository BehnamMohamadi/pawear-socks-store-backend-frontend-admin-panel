process.env.NODE_ENV='test';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {selectVariant}=require('../services/shopping-services/variant-service');
test('explicit selections never silently select a different size or colour',()=>{
 const p={variants:[{_id:'a',size:'40-43',color:'سفید',price:10,stock:2,isActive:true},{_id:'b',size:'40-43',color:'مشکی',price:20,stock:1,isActive:true}],defaultVariantId:'a'};
 assert.equal(selectVariant(p).variantId,'a');
 assert.throws(()=>selectVariant(p,{variantId:'missing'}));
 assert.throws(()=>selectVariant(p,{size:'40-43'}));
 assert.throws(()=>selectVariant(p,{size:'43-46',color:'سفید'}));
 assert.equal(selectVariant(p,{size:'۴۰ - ۴۳',color:'مشکی'}).variantId,'b');
});
test('backup preserves BSON and indexes, verifies integrity and refuses overwrite',async t=>{
 const {MongoClient,ObjectId}=require('mongodb'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const {backupDatabase,verifyBackup,restoreIntoNewDatabase}=require('../utils/database-backup');
 assert.ok(process.env.TEST_MONGODB_URI,'Run through npm test with isolated MongoDB.');
 const uri=process.env.TEST_MONGODB_URI,c=await MongoClient.connect(uri);
 const name='pawear_test_backup_'+Date.now(),target=name+'_restore',root=fs.mkdtempSync(path.join(os.tmpdir(),'pawear-backup-test-'));
 t.after(async()=>{await c.db(name).dropDatabase();await c.db(target).dropDatabase();await c.close();});
 const col=c.db(name).collection('records'),id=new ObjectId(),date=new Date('2026-01-01T00:00:00Z');
 await col.insertOne({_id:id,at:date,code:'preserve'});
 await col.createIndex({code:1},{unique:true});
 const source=new URL(uri);source.pathname='/'+name;
 const backup=await backupDatabase({uri:String(source),root});
 await restoreIntoNewDatabase({directory:backup.directory,uri,database:target});
 const restored=await c.db(target).collection('records').findOne({_id:id});
 assert.equal(restored.at.getTime(),date.getTime());
 assert.equal((await c.db(target).collection('records').indexes()).find(i=>i.key.code).unique,true);
 await assert.rejects(restoreIntoNewDatabase({directory:backup.directory,uri,database:target}),/already exists/);
 await assert.rejects(restoreIntoNewDatabase({directory:backup.directory,uri,database:'pawear'}),/prohibited/);
 fs.appendFileSync(path.join(backup.directory,backup.manifest.collections[0].file),'corruption');
 await assert.rejects(verifyBackup(backup.directory),/checksum/);
 assert.equal(await col.countDocuments(),1);
});

test('missing local database files stop startup without making an empty replacement',()=>{
 const {spawnSync}=require('node:child_process'),path=require('node:path'),os=require('node:os'),fs=require('node:fs');
 const directory=path.join(os.tmpdir(),'pawear-missing-'+Date.now());
 const result=spawnSync(process.execPath,['scripts/start-local-db.js'],{encoding:'utf8',env:{...process.env,NODE_ENV:'development',MONGODB_URI:'mongodb://127.0.0.1:27028/pawear?replicaSet=pawearDev',PAWEAR_LOCAL_DATA_DIR:directory}});
 assert.equal(result.status,1);assert.match(result.stderr,/will NOT be created/);assert.equal(fs.existsSync(directory),false);
});

test('catalog cards show available stock and minimum price across variants',()=>{
 const {present}=require('../services/storefront/catalog-service');
 const p={_id:'product',slug:'sock',name:'Sock',price:10,stock:4,defaultVariantId:'a',variants:[{_id:'a',size:'S',color:'white',price:20,stock:0,isActive:true},{_id:'b',size:'M',color:'white',price:10,stock:4,isActive:true}]};
 assert.equal(present(p).stock,4);assert.equal(present(p).price,10);
 assert.equal(present(p,'Product',{record:p,price:20,stock:0}).stock,0);
});

test('catalog images have a square WebP canvas without cropping',async()=>{
 const sharp=require('sharp'),convert=require('../utils/catalog-image');
 for(const [width,height] of [[40,160],[160,40]]){
  const input=await sharp({create:{width,height,channels:3,background:'#ff0000'}}).png().toBuffer();
  const output=await convert(input).toBuffer(),meta=await sharp(output).metadata();
  assert.equal(meta.width,1000);assert.equal(meta.height,1000);assert.equal(meta.format,'webp');
  const {data}=await sharp(output).raw().toBuffer({resolveWithObject:true});
  assert.ok(data[0]>240&&data[1]>240&&data[2]>240);
 }
});

test('inline order quantity changes reprice using the selected delivery method',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');const listeners=[],calls=[],pay={disabled:false};let destination;
 const control={dataset:{reviewItem:'p',reviewType:'Product',reviewVariant:'v',reviewAddress:'a',reviewShipping:'tipax'}};
 const button={dataset:{reviewDelta:'1'},closest:()=>control,hasAttribute:()=>false};
 const cart={items:[{_id:'row',item:'p',itemType:'Product',variantId:'v',quantity:1}]};
 const context={document:{addEventListener:(n,f)=>listeners.push(f),querySelector:()=>pay},location:{replace:u=>destination=u},Pawear:{run:f=>f,cartCount:()=>{},notice:m=>{throw Error(m)},request:async(url,method,body)=>{calls.push({url,method,body});if(url==='/api/cart')return {data:{cart}};if(url==='/api/cart/row')return {data:{cart}};return {data:{order:{_id:'order'}}};}}};
 vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../public/javascript/pages/order/order.js'),'utf8'),context);
 await listeners[1]({target:{closest:()=>button}});
 // Event handler schedules its async request chain.
 for(let i=0;i<10;i++)await Promise.resolve();
 assert.equal(calls[1].body.quantity,2);assert.equal(calls[2].body.shippingMethod,'tipax');assert.equal(calls[2].body.addressId,'a');assert.equal(destination,'/orders/order');assert.equal(pay.disabled,true);
});
