# Shifa Superstore: Android and iOS

Status: Android and iOS projects are synchronized with the deployed HTTPS Shifa API. Shifa launcher icons and launch screens were generated from assets/logo.png. Native HTTP is enabled for API requests. The iOS project requires iOS 15 or newer and macOS/Xcode for signing; iOS 12 devices can use the compatible website. Android debug APK was built and its APK Signature Scheme v2 signature, package ID, Android 7 minimum version and bundled HTTPS API configuration were verified. Real-device login/cart/checkout tests are still pending. No signed App Store or Play Store release has been produced.

## Connect your server
1. Deploy the existing Django backend with HTTPS using the project's deployment instructions. Keep the SQLite database and media backed up. Do not use localhost as a phone API address.
2. Copy `.env.mobile.example` to `.env.mobile.local` inside frontend. Replace BOTH URLs with your deployed addresses, e.g. the API URL must end in `/api/`.
3. Native API requests use CapacitorHttp (enabled in capacitor.config.json); HTTPS certificate checks and API token authentication still apply. Browser requests continue to use the website CORS policy. Product/category image URLs must also use HTTPS.
4. Run `npm ci`, then `npm run mobile:sync`. This validates the address, builds the mobile web bundle and synchronizes both native projects. The address validation is syntactic; test actual server reachability and CORS on devices.

## Android
Install Android Studio with Android SDK platform 36, the matching build tools and its bundled JDK. Open `frontend/android` using `npm run mobile:android`. Let Gradle sync finish. Run on an emulator or USB-connected phone.
For a development APK: from frontend/android run `./gradlew assembleDebug` (Windows: `.\gradlew.bat assembleDebug`). Result: `app/build/outputs/apk/debug/app-debug.apk`.
For Google Play use Android Studio > Generate Signed App Bundle/APK > Android App Bundle. Create and protect your signing keystore outside the repository. Never commit signing passwords.

## iOS
On a Mac install Xcode and its command-line tools. Copy the frontend source and native projects, run `npm ci` then `npm run mobile:sync`. Open using `npm run mobile:ios`. The generated project uses Swift Package Manager.
Select your Apple development team under Signing & Capabilities. Confirm bundle ID `com.shifasuperstore.app` is appropriate and available for your account before first publication. Run on a simulator/device, then Product > Archive and distribute through TestFlight/App Store Connect. Apple distribution credentials and device signing are not included.

## Before release
- Shifa icons and splash screens are included. Confirm the app name, version and bundle ID before store submission.
- Test login/logout, category and product images, cart, stock validation, delivery-area checks, COD checkout and order history on real devices.
- Test Android back button, iPhone safe areas, keyboard, offline errors and photo selection for admin uploads if admin use is required.
- Version 1.0.1 persists login tokens in local storage across app restarts (passwords are not stored). Network failures retain the login; invalid or expired refresh tokens require sign-in. The backend rotates refresh tokens with a 30-day lifetime. Native encrypted keychain storage is not implemented.
- Prepare privacy policy, store screenshots and app-store disclosures. Store acceptance is subject to review.

## Files
capacitor.config.json: app name, ID and bundled web directory.
android/: generated Android Studio project.
ios/: generated Xcode project.
scripts/build-mobile.mjs: checks HTTPS configuration before mobile build.
src/mobile.js: Android back button and native safe-area class.

Documentation: https://capacitorjs.com/docs/getting-started/environment-setup



