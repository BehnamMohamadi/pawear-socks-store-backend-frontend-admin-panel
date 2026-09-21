const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {MongoClient}=require('mongodb');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const dataRoot=path.resolve(process.env.PAWEAR_LOCAL_DATA_DIR||path.join(os.homedir(),'.pawear-local'));
const dataPath=path.join(dataRoot,'mongo');
const markerPath=path.join(dataRoot,'database-initialized.json');
const samePath=(a,b)=>path.resolve(a).toLowerCase()===path.resolve(b).toLowerCase();
async function startLocalDatabase({initializeEmpty=false}={}){
 if(process.env.NODE_ENV==='production')throw Error('Local MongoDB helper is disabled in production.');
 const target=new URL(process.env.MONGODB_URI);
 if(target.hostname!=='127.0.0.1'||target.port!=='27028'||target.searchParams.get('replicaSet')!=='pawearDev')throw Error('Local helper only manages 127.0.0.1:27028 / pawearDev.');
 const exists=fs.existsSync(path.join(dataPath,'WiredTiger'));
 if(!exists&&!initializeEmpty)throw Error('PAWEAR data is missing at '+dataPath+'. Startup stopped; restore the existing data. An empty database will NOT be created automatically.');
 if(initializeEmpty&&(exists||fs.existsSync(markerPath)))throw Error('Initialization refused: existing data or its marker must never be overwritten.');
 if(initializeEmpty)fs.mkdirSync(dataPath,{recursive:true});
 let client;
 try{client=await MongoClient.connect('mongodb://127.0.0.1:27028/?directConnection=true',{serverSelectionTimeoutMS:600});}
 catch{
  const binary=process.env.MONGOD_BINARY||(process.platform==='win32'?'C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe':'mongod');
  const child=spawn(binary,['--dbpath',dataPath,'--bind_ip','127.0.0.1','--port','27028','--replSet','pawearDev','--logpath',path.join(dataRoot,'mongo.log'),'--logappend'],{detached:true,stdio:'ignore',windowsHide:true});
  let spawnError;child.on('error',error=>{spawnError=error;});child.unref();
  for(let attempt=0;attempt<30;attempt++){if(spawnError)throw spawnError;try{client=await MongoClient.connect('mongodb://127.0.0.1:27028/?directConnection=true',{serverSelectionTimeoutMS:400});break;}catch{await new Promise(resolve=>setTimeout(resolve,200));}}
 }
 if(!client)throw Error('MongoDB could not start. See '+path.join(dataRoot,'mongo.log'));
 try{
  const options=await client.db('admin').command({getCmdLineOpts:1});
  if(!options.parsed?.storage?.dbPath||!samePath(options.parsed.storage.dbPath,dataPath))throw Error('Another MongoDB data directory owns port 27028: '+options.parsed?.storage?.dbPath+'. No data was moved or replaced.');
  const hello=await client.db('admin').command({hello:1});
  if(hello.setName!=='pawearDev'&&!initializeEmpty)throw Error('Unexpected replica set; refusing automatic reconfiguration.');
  try{await client.db('admin').command({replSetGetStatus:1});}
  catch(error){if(error.code!==94||!initializeEmpty)throw error;await client.db('admin').command({replSetInitiate:{_id:'pawearDev',members:[{_id:0,host:'127.0.0.1:27028'}]}});}
  for(let attempt=0;attempt<60;attempt++){
   if((await client.db('admin').command({hello:1})).isWritablePrimary){
    if(!fs.existsSync(markerPath))fs.writeFileSync(markerPath,JSON.stringify({app:'PAWEAR',replicaSet:'pawearDev',dataPath,initializedAt:new Date().toISOString()},null,2),{flag:'wx'});
    console.log('PAWEAR MongoDB ready at 127.0.0.1:27028; data: '+dataPath);return;
   }
   await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw Error('Replica set primary is not ready.');
 }finally{await client.close();}
}
module.exports={startLocalDatabase};
if(require.main===module)startLocalDatabase({initializeEmpty:process.argv.includes('--initialize-empty')}).catch(error=>{console.error(error.message);process.exitCode=1;});
