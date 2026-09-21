const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {Readable}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const {createGzip,createGunzip}=require('node:zlib');
const readline=require('node:readline');
const {MongoClient,BSON}=require('mongodb');
async function digest(file){const hash=crypto.createHash('sha256');for await(const bytes of fs.createReadStream(file))hash.update(bytes);return hash.digest('hex');}
async function backupDatabase({uri,root}){
 const c=await MongoClient.connect(uri,{serverSelectionTimeoutMS:5000});
 const id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(4).toString('hex');
 const partial=path.join(path.resolve(root),id+'.partial'),complete=path.join(path.resolve(root),id);
 let session;
 try{
  fs.mkdirSync(partial,{recursive:true});const db=c.db();
  const infos=await db.listCollections({},{nameOnly:false}).toArray();
  if(infos.some(info=>info.type!=='collection'))throw Error('Backup stopped: unsupported view or collection type.');
  const hello=await c.db('admin').command({hello:1});session=c.startSession();
  if(hello.setName)session.startTransaction({readConcern:{level:'snapshot'}});
  const manifest={format:'pawear-ejson-v1',database:db.databaseName,createdAt:new Date().toISOString(),collections:[]};
  for(const [index,info] of infos.entries()){
   const col=db.collection(info.name),file=index+'.ndjson.gz';let count=0;
   const indexes=await col.listIndexes().toArray();
   async function* documents(){for await(const doc of col.find({},{session})){count++;yield BSON.EJSON.stringify(doc,{relaxed:false})+'\n';}}
   await pipeline(Readable.from(documents()),createGzip(),fs.createWriteStream(path.join(partial,file),{flags:'wx'}));
   manifest.collections.push({name:info.name,file,count,indexes,options:info.options,sha256:await digest(path.join(partial,file))});
  }
  if(session.inTransaction())await session.commitTransaction();
  fs.writeFileSync(path.join(partial,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx'});
  await verifyBackup(partial);
  fs.renameSync(partial,complete);return {directory:complete,manifest};
 }finally{if(session){if(session.inTransaction())await session.abortTransaction();await session.endSession();}await c.close();}
}
async function verifyBackup(directory){
 const root=path.resolve(directory),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 if(manifest.format!=='pawear-ejson-v1'||!Array.isArray(manifest.collections))throw Error('Unknown backup format.');
 const names=new Set();
 for(const entry of manifest.collections){
  if(names.has(entry.name)||typeof entry.name!=='string'||entry.name.startsWith('system.'))throw Error('Invalid collection manifest.');names.add(entry.name);
  if(!/^\d+\.ndjson\.gz$/.test(entry.file)||!Number.isSafeInteger(entry.count)||entry.count<0)throw Error('Unsafe backup entry.');
  const file=path.join(root,entry.file);if(await digest(file)!==entry.sha256)throw Error('Backup checksum failed: '+entry.name);
  let count=0;const reader=readline.createInterface({input:fs.createReadStream(file).pipe(createGunzip()),crlfDelay:Infinity});
  for await(const line of reader){BSON.EJSON.parse(line,{relaxed:false});count++;}
  if(count!==entry.count)throw Error('Backup count failed: '+entry.name);
 }
 return manifest;
}
async function restoreIntoNewDatabase({directory,uri,database}){
 if(!/^pawear_(test|restore)_[a-z0-9_]+$/.test(database))throw Error('Restore requires a NEW pawear_restore_* or pawear_test_* database; in-place overwrite is prohibited.');
 const manifest=await verifyBackup(directory),c=await MongoClient.connect(uri,{serverSelectionTimeoutMS:5000});
 try{
  const databases=await c.db('admin').admin().listDatabases({nameOnly:true});
  if(databases.databases.some(db=>db.name===database))throw Error('Target database already exists. Nothing was overwritten.');
  const db=c.db(database);
  for(const entry of manifest.collections){
   const col=await db.createCollection(entry.name,entry.options||{});
   const reader=readline.createInterface({input:fs.createReadStream(path.join(directory,entry.file)).pipe(createGunzip()),crlfDelay:Infinity});
   let batch=[];for await(const line of reader){batch.push(BSON.EJSON.parse(line,{relaxed:false}));if(batch.length===500){await col.insertMany(batch);batch=[];}}if(batch.length)await col.insertMany(batch);
   if(await col.countDocuments()!==entry.count)throw Error('Restore count mismatch: '+entry.name);
   for(const {key,v,ns,...options} of entry.indexes||[])if(options.name!=='_id_')await col.createIndex(key,options);
  }
  return {database,collections:manifest.collections.length};
 }finally{await c.close();}
}
module.exports={backupDatabase,verifyBackup,restoreIntoNewDatabase};
