const router=require('express').Router();
const c=require('../../controller/admin/panel-controller');
const {AppError}=require('../../utils/app-error');
router.get('/admin/login',require('../../controller/storefront/storefront-controller').auth('admin'));
router.use('/admin',(req,res,next)=>{
  res.set('X-Robots-Tag','noindex, nofollow');
  if(!req.user)return res.redirect('/admin/login');
  if(req.user.role!=='admin')return next(new AppError(403,'دسترسی مدیریت ندارید.'));
  next();
});
router.get('/admin',c.dashboard);router.get('/admin/sales',require('../../controller/admin/sales-controller').page);
router.get('/admin/settings',require('../../controller/admin/settings-controller').page);
const articles=require('../../controller/admin/article-controller');router.get('/admin/articles',articles.list);router.get('/admin/articles/new',articles.editor);router.get('/admin/articles/:id/edit',articles.editor);router.get('/admin/articles/:id/preview',require('../../controller/storefront/journal-controller').article);router.get('/admin/:resource',c.list);
router.get('/admin/:resource/new',c.form);
router.get('/admin/:resource/:id/edit',c.form);
router.get('/admin/:resource/:id',c.detail);
module.exports=router;
