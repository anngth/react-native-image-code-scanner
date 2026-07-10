# Image Code Scanner Example (Expo)

This app demonstrates how to use `react-native-image-code-scanner` in an Expo project.

## What this example includes

- Pick image from camera or gallery (`expo-image-picker`)
- Select barcode formats before scanning
- Scan with automatic preprocessing (built into the library)
- Show scan results and execution time

## Requirements

- Node.js `>=18`
- Yarn `3.6.1` via Corepack
- iOS: Xcode (for native build)
- Android: Android Studio + SDK (for native build)

Use Yarn for this workspace. Do not mix npm installs with the generated native projects.

## Install

From the repository root:

```bash
yarn install
```

## Metro / Fast Refresh

Run Metro from the example folder:

```bash
yarn expo start --clear --dev-client --host localhost
```

- Press `i` for iOS simulator.
- Press `a` for Android emulator.
- If the app was opened before Metro started, terminate the app and open it again from Metro.
- JS/TSX changes use Fast Refresh. Native, Podfile, Gradle, or architecture changes require rebuild.

## New Architecture

`app.json` is the source of truth:

```json
{
  "expo": {
    "newArchEnabled": true
  }
}
```

After changing this value, run `prebuild --clean` and rebuild the native app.

## iOS Build

Clean regenerate iOS and build:

```bash
cd example
yarn expo prebuild --clean --platform ios
yarn expo run:ios --no-build-cache
```

With Metro running in another terminal:

```bash
cd example
yarn expo run:ios --no-bundler --no-build-cache
```

Verify New Architecture:

```bash
cat ios/Podfile.properties.json
# expect: "newArchEnabled": "true"
```

## Android Build

Clean regenerate Android and build:

```bash
cd example
yarn expo prebuild --clean --platform android
yarn expo run:android --no-build-cache
```

With Metro running in another terminal:

```bash
cd example
yarn expo run:android --no-bundler --no-build-cache
```

Verify New Architecture:

```bash
grep newArchEnabled android/gradle.properties
# expect: newArchEnabled=true
```

## Notes

- Preprocessing options are configurable in the UI: contrast, grayscale, rotations.
- At least one barcode format must stay selected.
- Permissions for camera and media library are requested at runtime.
- Expo Go is not enough for scanning because this package uses native modules.

## Troubleshooting

- White screen: Metro is probably not running or the app opened before Metro. Start Metro, terminate the app, then press `i`/`a`.
- No Fast Refresh: confirm `http://127.0.0.1:8081/status` works and open the app from Metro.
- iOS native issue after config changes: run `yarn expo prebuild --clean --platform ios`.
- Android native issue after config changes: run `yarn expo prebuild --clean --platform android`.
- Metro cache issue: run `yarn expo start --clear --dev-client --host localhost`.

## Scripts

- `yarn start`: Start Expo dev server
- `yarn ios`: Build and run on iOS
- `yarn android`: Build and run on Android
- `yarn prebuild`: Generate native projects
- `yarn prebuild:clean`: Regenerate native projects from scratch

## Related docs

- [Main package README](../README.md)
- [Expo docs](https://docs.expo.dev/)
- [Expo image picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
