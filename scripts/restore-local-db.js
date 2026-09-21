const path=require('node:path');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {restoreIntoNewDatabase}=require('../utils/database-backup');
(async()=>{
 const [directory,database]=process.argv.slice(2);
 if(!directory||!database)throw Error('Usage: node scripts/restore-local-db.js BACKUP_DIRECTORY pawear_restore_NAME. Existing databases are never overwritten.');
 const target=new URL(process.env.MONGODB_URI);
 if(target.hostname!=='127.0.0.1')throw Error('This restoration tool is local only.');
 const result=await restoreIntoNewDatabase({directory,uri:process.env.MONGODB_URI,database});console.log('Restored and verified:',result.database,result.collections,'collections');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
