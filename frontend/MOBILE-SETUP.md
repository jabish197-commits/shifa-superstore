# Shifa Superstore: Android and iOS

Status: native projects generated with Capacitor 8. Web production build verified. No APK, signed AAB or signed IPA has been produced. Android SDK is missing on the preparation computer; iOS requires macOS/Xcode. Launcher icons and launch screens are still Capacitor defaults; replace them with production Shifa artwork before distribution.

## Connect your server
1. Deploy the existing Django backend with HTTPS using the project's deployment instructions. Keep the SQLite database and media backed up. Do not use localhost as a phone API address.
2. Copy `.env.mobile.example` to `.env.mobile.local` inside frontend. Replace BOTH URLs with your deployed addresses, e.g. the API URL must end in `/api/`.
3. Set backend `DJANGO_ALLOWED_HOSTS` to your server hostname, and add `https://localhost,capacitor://localhost` to `DJANGO_CORS_ALLOWED_ORIGINS` alongside your website origin. Android uses https://localhost; iOS uses capacitor://localhost. Do not use a wildcard. Configure the HTTPS reverse proxy so product/category image URLs are also HTTPS.
4. Run `npm ci`, then `npm run mobile:sync`. This validates the address, builds the mobile web bundle and synchronizes both native projects. The address validation is syntactic; test actual server reachability and CORS on devices.

## Android
Install Android Studio with Android SDK platform 36, the matching build tools and its bundled JDK. Open `frontend/android` using `npm run mobile:android`. Let Gradle sync finish. Run on an emulator or USB-connected phone.
For a development APK: from frontend/android run `./gradlew assembleDebug` (Windows: `.\gradlew.bat assembleDebug`). Result: `app/build/outputs/apk/debug/app-debug.apk`.
For Google Play use Android Studio > Generate Signed App Bundle/APK > Android App Bundle. Create and protect your signing keystore outside the repository. Never commit signing passwords.

## iOS
On a Mac install Xcode and its command-line tools. Copy the frontend source and native projects, run `npm ci` then `npm run mobile:sync`. Open using `npm run mobile:ios`. The generated project uses Swift Package Manager.
Select your Apple development team under Signing & Capabilities. Confirm bundle ID `com.shifasuperstore.app` is appropriate and available for your account before first publication. Run on a simulator/device, then Product > Archive and distribute through TestFlight/App Store Connect. Apple distribution credentials and device signing are not included.

## Before release
- Replace launcher icons and splash screens on both platforms; confirm app name/version and final bundle ID.
- Test login/logout, category and product images, cart, stock validation, delivery-area checks, COD checkout and order history on real devices.
- Test Android back button, iPhone safe areas, keyboard, offline errors and photo selection for admin uploads if admin use is required.
- The app preserves the website's session-based login; persistent native secure login is not implemented.
- Prepare privacy policy, store screenshots and app-store disclosures. Store acceptance is subject to review.

## Files
capacitor.config.json: app name, ID and bundled web directory.
android/: generated Android Studio project.
ios/: generated Xcode project.
scripts/build-mobile.mjs: checks HTTPS configuration before mobile build.
src/mobile.js: Android back button and native safe-area class.

Documentation: https://capacitorjs.com/docs/getting-started/environment-setup
