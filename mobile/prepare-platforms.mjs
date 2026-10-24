import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=process.env.MYSUREGAS_PLATFORM_ROOT||path.dirname(fileURLToPath(import.meta.url));
const icon=path.join(root,'assets/app-icon-1024.png');
const changes=[];
function write(file,text){const bytes=Buffer.isBuffer(text)?text:Buffer.from(text);if(fs.existsSync(file)&&fs.readFileSync(file).equals(bytes))return;changes.push({file,bytes});}
const android=path.join(root,'android/app/src/main');
if(fs.existsSync(android)){
 const file=path.join(android,'AndroidManifest.xml');let xml=fs.readFileSync(file,'utf8');
 if(!xml.includes('<manifest')||!xml.includes('</manifest>')||!xml.includes('</activity>'))throw Error('Unexpected Android manifest. Nothing written.');
 for(const permission of ['android.permission.CAMERA','android.permission.ACCESS_COARSE_LOCATION','android.permission.ACCESS_FINE_LOCATION'])if(!xml.includes(`android:name="${permission}"`))xml=xml.replace('</manifest>',`    <uses-permission android:name="${permission}" />\n</manifest>`);
 for(const feature of ['android.hardware.camera','android.hardware.location.gps'])if(!xml.includes(`android:name="${feature}"`))xml=xml.replace('</manifest>',`    <uses-feature android:name="${feature}" android:required="false" />\n</manifest>`);
 xml=xml.replace(/android:allowBackup="true"/,'android:allowBackup="false"');
 if(!xml.includes('android:scheme="mysuregas"')){
  const main=xml.match(/<activity\b[^>]*android:name="\.MainActivity"[\s\S]*?<\/activity>/);if(!main)throw Error('MainActivity was not found. Nothing written.');
  const next=main[0].replace('</activity>',`<intent-filter>\n                <action android:name="android.intent.action.VIEW" />\n                <category android:name="android.intent.category.DEFAULT" />\n                <category android:name="android.intent.category.BROWSABLE" />\n                <data android:scheme="mysuregas" android:host="app" />\n            </intent-filter>\n        </activity>`);xml=xml.replace(main[0],next);
 }
 write(file,xml);
 const res=path.join(android,'res');const bytes=fs.readFileSync(icon);
 for(const dir of fs.readdirSync(res).filter(name=>/^mipmap-(mdpi|hdpi|xhdpi|xxhdpi|xxxhdpi)$/.test(name)))for(const name of ['ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png'])write(path.join(res,dir,name),bytes);
 write(path.join(res,'drawable/mysuregas_mark.png'),bytes);
 write(path.join(res,'drawable/mysuregas_splash.xml'),`<?xml version="1.0" encoding="utf-8"?>\n<layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item android:drawable="@color/mysuregas_background"/><item android:width="120dp" android:height="120dp" android:gravity="center"><bitmap android:src="@drawable/mysuregas_mark" android:gravity="fill"/></item></layer-list>\n`);
 write(path.join(res,'values/mysuregas_brand.xml'),`<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="mysuregas_background">#fffef9</color></resources>\n`);
 const styles=path.join(res,'values/styles.xml');let text=fs.readFileSync(styles,'utf8');
 if(!text.includes('mysuregas_splash'))text=text.replace('@drawable/splash','@drawable/mysuregas_splash');
 if(!text.includes('windowSplashScreenAnimatedIcon'))text=text.replace(/(<style name="AppTheme.NoActionBarLaunch"[^>]*>)/,'$1\n        <item name="windowSplashScreenBackground">@color/mysuregas_background</item>\n        <item name="windowSplashScreenAnimatedIcon">@drawable/mysuregas_mark</item>');
 write(styles,text);
}
const ios=path.join(root,'ios/App/App');
if(fs.existsSync(ios)){
 const file=path.join(ios,'Info.plist');let xml=fs.readFileSync(file,'utf8');if(!xml.includes('<plist')||!xml.includes('</dict>'))throw Error('Unexpected iOS plist. Nothing written.');
 const entries={NSCameraUsageDescription:'Take a photo of your cylinder for your MySureGas order.',NSPhotoLibraryUsageDescription:'Choose a cylinder photo for your MySureGas order.',NSPhotoLibraryAddUsageDescription:'Save a cylinder photo when you choose to do so.',NSLocationWhenInUseUsageDescription:'Find a nearby branch or add a location pin to your delivery address.',NSLocationAlwaysAndWhenInUseUsageDescription:'Find a nearby branch or add a location pin while using MySureGas.'};
 for(const [key,value]of Object.entries(entries))if(!xml.includes(`<key>${key}</key>`)){const i=xml.lastIndexOf('</dict>');xml=xml.slice(0,i)+`<key>${key}</key><string>${value}</string>\n`+xml.slice(i);}
 if(!xml.includes('<string>mysuregas</string>')){
  if(xml.includes('<key>CFBundleURLTypes</key>'))throw Error('Existing iOS URL schemes need review. Nothing written.');
  const i=xml.lastIndexOf('</dict>');xml=xml.slice(0,i)+'<key>CFBundleURLTypes</key><array><dict><key>CFBundleURLSchemes</key><array><string>mysuregas</string></array></dict></array>\n'+xml.slice(i);
 }
 write(file,xml);
 const splash=path.join(ios,'Assets.xcassets/Splash.imageset');write(path.join(splash,'mysuregas-splash.png'),fs.readFileSync(path.join(root,'assets/splash-2732.png')));write(path.join(splash,'Contents.json'),JSON.stringify({images:[{filename:'mysuregas-splash.png',idiom:'universal',scale:'1x'}],info:{author:'xcode',version:1}},null,2)+'\n');
 const folder=path.join(ios,'Assets.xcassets/AppIcon.appiconset');write(path.join(folder,'AppIcon-512@2x.png'),fs.readFileSync(icon));write(path.join(folder,'Contents.json'),JSON.stringify({images:[{filename:'AppIcon-512@2x.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'xcode',version:1}},null,2)+'\n');
}
if(changes.length){
 const backup=path.join(root,'platform-backups',new Date().toISOString().replaceAll(':','-'));
 for(const {file}of changes)if(fs.existsSync(file)){const target=path.join(backup,path.relative(root,file));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);}
 for(const {file,bytes}of changes){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
 console.log(`Prepared ${changes.length} native platform files. Originals: ${backup}`);
}else console.log('Native platform settings already prepared, or no platform project exists yet.');
