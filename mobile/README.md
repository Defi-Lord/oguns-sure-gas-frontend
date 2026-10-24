# MySureGas: web, Android and iOS

The web frontend remains a normal Next.js/Vercel deployment. The PWA manifest enables home-screen installation on supported browsers. The service worker only keeps a public offline notice; it never caches orders, payments, account pages or API data. The app needs connectivity for transactions.

The native build bundles the same customer interface with Capacitor. It does not load the Vercel website as a remote shell.

## Prepare a native project

Use Node 22 or later. Stop the frontend dev server first. From PowerShell:

```powershell
& .\mobile\Initialize-Native.ps1 -Platform android
```

Then `cd mobile; npm run android` opens Android Studio. On a Mac, use `-Platform ios`, then `npm run ios` to open Xcode. Both platforms use the shared `out/` export. Re-run `npm run build:web` and `npx cap sync` in mobile after frontend changes. A normal `npm run build` at the frontend root restores the regular web build.

## Before release

- Confirm the client-owned permanent bundle/application ID before publishing. `com.mysuregas.customer` is a provisional development ID.
- Configure the backend's existing CORS allowlist to include the native origins `https://localhost` (Android) and `capacitor://localhost` (iOS), retaining the existing production web origin. Never change it to a blanket wildcard. This package does not change Railway settings.
- Native device tests still need to cover sign-in persistence, image selection/camera permissions, QR camera access, geolocation, payment redirects, back navigation and external links. Native push is a separate integration; web/in-app notification behavior is retained.
- Android needs Android Studio/SDK and a client signing key. iOS needs macOS, Xcode and client signing/provisioning. Store listings, privacy/data-safety declarations and store approval are not included in this source update.
- No signed APK/AAB/IPA is produced by the frontend installer. Native build/export validation does not replace emulator/device tests.

Official references: https://capacitorjs.com/docs/getting-started and https://nextjs.org/docs/app/guides/static-exports
