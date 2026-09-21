const os=require('node:os'),path=require('node:path'),fs=require('node:fs');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {backupDatabase,verifyBackup}=require('../utils/database-backup');
async function backupLocalDatabase({oncePerDay=false}={}){
 const uri=process.env.MONGODB_URI,target=new URL(uri);
 if(target.hostname!=='127.0.0.1'||target.port!=='27028'||target.pathname!=='/pawear'||target.searchParams.get('replicaSet')!=='pawearDev')throw Error('Local backup only supports the PAWEAR local database.');
 const root=process.env.PAWEAR_BACKUP_DIR||path.join(os.homedir(),'.pawear-backups');
 if(oncePerDay&&fs.existsSync(root)){
  const candidates=fs.readdirSync(root).filter(name=>!name.endsWith('.partial')&&/^\d{4}-/.test(name)).sort().reverse();
  for(const name of candidates){
   try{
    const directory=path.join(root,name),manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'));
    const age=Date.now()-Date.parse(manifest.createdAt);
    if(manifest.database==='pawear'&&age>=0&&age<86400000){await verifyBackup(directory);return {directory,reused:true};}
   }catch{/* A damaged backup does not count as a successful daily backup. */}
  }
 }
 const result=await backupDatabase({uri,root});
 console.log('Verified PAWEAR backup: '+result.directory);
 return result;
}
module.exports={backupLocalDatabase};
if(require.main===module)backupLocalDatabase().catch(error=>{console.error('BACKUP FAILED: '+error.message);process.exitCode=1;});
