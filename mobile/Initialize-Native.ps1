param([ValidateSet('android','ios')][string]$Platform='android')
$ErrorActionPreference='Stop'
Push-Location $PSScriptRoot
try {
 & npm ci
 if($LASTEXITCODE -ne 0){throw 'Native dependency install failed.'}
 & npm run build:web
 if($LASTEXITCODE -ne 0){throw 'Native web export failed.'}
 if(!(Test-Path -LiteralPath (Join-Path $PSScriptRoot $Platform))){
  & npx cap add $Platform
  if($LASTEXITCODE -ne 0){throw 'Native platform creation failed.'}
 }
 & node .\prepare-platforms.mjs
 if($LASTEXITCODE -ne 0){throw 'Native platform preparation failed.'}
 & npx cap sync $Platform
 if($LASTEXITCODE -ne 0){throw 'Native synchronization failed.'}
 Write-Host "Native $Platform project prepared. Open it in Android Studio or Xcode for device testing and signing."
} finally {Pop-Location}
