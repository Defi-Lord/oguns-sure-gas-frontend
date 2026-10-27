import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const root=process.cwd();
function load(relative){
 const file=path.join(root,relative),compiled={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module:compiled,exports:compiled.exports,URL,Set},{filename:relative});return compiled.exports;
}
const native=load('lib/native/navigation.ts'),access=load('lib/portal-access.ts'),support=load('components/support/support-links.ts');
for(const [current,expected] of [['/staff/orders','/staff'],['/rider/tips','/rider'],['/admin/settings','/admin/dashboard'],['/shop/orders','/shop'],['/shop/checkout/','/shop'],['/staff/orders?x=1','/staff']])assert.equal(native.nativeBackDestination(current),expected);
for(const current of ['/staff','/staff/login','/rider','/rider/login','/admin','/admin/dashboard','/admin/login','/shop','/shop/login','/shop/register','/','/preview/reactions','/staffish'])assert.equal(native.nativeBackDestination(current),null,current);
for(const current of ['/staff','/staff/orders','/staff/login','/rider','/rider/profile','/admin/dashboard','/admin/login','/preview/reactions'])assert.equal(native.nativeDestination('mysuregas://app/shop/orders',current),null,current);
for(const current of ['/','/shop','/shop/checkout'])assert.equal(native.nativeDestination('mysuregas://app/shop/orders',current),'/shop/orders');
for(const url of ['mysuregas://app/admin/login','mysuregas://app/staff/login','mysuregas://app/rider/login','https://example.test/shop','mysuregas://wrong/shop','mysuregas://app/shop/../admin/login'])assert.equal(native.nativeDestination(url,'/shop'),null,url);
for(const [portal,roles,home] of [['staff',['STAFF'],'/staff'],['rider',['RIDER'],'/rider'],['admin',['SUPER_ADMIN','BRANCH_MANAGER'],'/admin/dashboard']]){
 assert.equal(access.portalHome(portal),home);
 for(const role of ['CUSTOMER','STAFF','RIDER','BRANCH_MANAGER','SUPER_ADMIN'])for(const status of ['ACTIVE','SUSPENDED','INACTIVE'])assert.equal(access.canAccessPortal({role,status},portal),status==='ACTIVE'&&roles.includes(role));
}
const caseId='10000000-0000-4000-8000-000000000001';
for(const [portal,prefix] of [['customer','/shop'],['staff','/staff'],['admin','/admin']])assert.equal(support.orderSupportNotificationHref({event:'ORDER_SUPPORT_REPLIED',supportCaseId:caseId},portal),prefix+'/support?case='+caseId);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):/\.[cm]?[jt]sx?$/.test(e.name)?[path.join(dir,e.name)]:[]);}
const portals=['admin','staff','rider','shop'];let files=0,routeFiles=0;const failures=[];
for(const top of ['app','components','lib'])for(const file of walk(path.join(root,top))){
 files++;const relative=path.relative(root,file).replaceAll('\\','/'),source=fs.readFileSync(file,'utf8');
 if(relative.startsWith('app/')&&relative.endsWith('/page.tsx'))routeFiles++;
 const owner=relative.startsWith('app/shop/')||relative.startsWith('components/customer/')?'shop':portals.find(p=>relative.startsWith('components/'+p+'/')||new RegExp('^app/[^/]+/'+p+'/').test(relative));
 if(!owner)continue;
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 function visit(node){
  if(ts.isStringLiteralLike(node)||ts.isTemplateExpression(node)){
   const value=ts.isTemplateExpression(node)?node.head.text:node.text;
   // Skip API calls (/riders, /staff profile API), imports and prose; these exact roots are UI routes.
   const match=value.match(/^\/(admin|staff|rider|shop)(?:[/?#]|$)/);
   if(match&&match[1]!==owner){const at=ast.getLineAndCharacterOfPosition(node.getStart());failures.push(`${relative}:${at.line+1}: ${value}`);}
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);
}
assert.deepEqual(failures,[],'Cross-portal route literal found in a portal-owned module');
console.log(`PORTAL NAVIGATION: PASS (${files} source modules, ${routeFiles} page files; role destinations, native fallbacks, deep links and support destinations checked).`);
console.log('Shared components select destinations by their explicit portal or verified role. This check does not replace server authorization or physical-device testing.');
