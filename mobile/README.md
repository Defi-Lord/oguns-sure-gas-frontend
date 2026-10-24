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

## Native integration preparation (no launch or publishing)

Native builds now include:

- An explicit device camera/photo picker for checkout cylinder photos. The existing browser picker is retained. Uploads still use the authenticated backend and its existing size/privacy checks.
- Foreground location permissions and a native GPS bridge for branch suggestions and saved address pins. No location permission is requested on app startup.
- A system browser for external HTTPS/payment pages. Browser closure or app resume refreshes customer data; it never marks a payment successful. Customers retain the existing server-side payment check.
- Android back handling that closes open dialogs before navigating. At the shop root it minimizes the app.
- Restricted `mysuregas://app/shop/...` links for known customer screens. Query strings do not grant access or confirm a payment. Website universal links are not yet associated with the future owned domain.
- Brand icons and splash assets, Android camera/location permissions and iOS permission descriptions. `prepare-platforms.mjs` applies those settings to generated projects, with backups before writing. It does not launch an IDE or publish an app.

To prepare existing projects without opening them:

```powershell
cd mobile
npm ci
node prepare-platforms.mjs
npx cap sync
node release-readiness.mjs
```

When a new native project is generated through Initialize-Native.ps1, the platform settings are applied before sync. No signing keys, service-account keys or store credentials belong in Git.

### Remaining release verification

Native session persistence still uses the existing app-scoped auth store; migration to OS-backed secret storage has not been implemented. Real-device login/token refresh/logout and payment verification must be checked before release. Background rider tracking is not provided by the customer foreground-location integration. APNs/FCM native push requires client-owned provider credentials and backend device-token delivery work; the existing in-app/WhatsApp channels are unchanged. Store privacy URLs, account deletion requirements, support details, signing and client account ownership need final review before submission. This preparation is not a claim that a store-ready signed build has been verified.
