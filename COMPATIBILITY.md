# React Native Image Code Scanner - Compatibility Guide

## Version Compatibility Matrix

### React Native Versions

| React Native | Package Version | Architecture Support           | Notes                 |
| ------------ | --------------- | ------------------------------ | --------------------- |
| 0.70.x       | ✅ 1.1.x        | Old Architecture               | Full support          |
| 0.71.x       | ✅ 1.1.x        | Old Architecture               | Full support          |
| 0.72.x       | ✅ 1.1.x        | Old Architecture               | Full support          |
| 0.73.x       | ✅ 1.1.x        | Old & New Architecture         | Full support          |
| 0.74.x       | ✅ 1.1.x        | Old & New Architecture         | Full support          |
| 0.75.x       | ✅ 1.1.x        | Old & New Architecture         | Full support          |
| 0.76.x       | ✅ 1.1.x        | New Architecture (default)     | Full support          |
| 0.77.x       | ✅ 1.1.x        | New Architecture (default)     | Full support          |
| 0.78.x       | ✅ 1.1.x        | New Architecture (default)     | Full support          |
| **0.79.x**   | ✅ **1.1.x**    | **New Architecture (default)** | **Full support**      |
| 0.80.x+      | 🔜 1.1.x        | New Architecture               | Compatibility pending |

### React Versions

| React Version | Compatibility              |
| ------------- | -------------------------- |
| 17.x          | ✅ Supported               |
| 18.x          | ✅ Supported (Recommended) |
| 19.x          | ✅ Supported (Beta)        |

### Expo SDK Compatibility

| Expo SDK   | React Native | Package Version | Status                                       |
| ---------- | ------------ | --------------- | -------------------------------------------- |
| SDK 49     | 0.72.x       | ✅ 1.1.x        | Supported (requires prebuild)                |
| SDK 50     | 0.73.x       | ✅ 1.1.x        | Supported (requires prebuild)                |
| SDK 51     | 0.74.x       | ✅ 1.1.x        | Supported (requires prebuild)                |
| **SDK 52** | **0.76.x**   | ✅ **1.1.x**    | **Example app baseline (requires prebuild)** |

**Note**: This library requires prebuild for Expo projects as it uses native modules.

## Platform Requirements

### iOS Requirements

- **Minimum iOS Version**: 13.4
- **Xcode**: 14.0 or higher
- **Swift**: 5.0 or higher
- **Frameworks Required**:
  - Vision Framework (iOS 11+)
  - Core Image (iOS 5+)
  - UIKit (iOS 2+)
  - Core Graphics (iOS 2+)

### Android Requirements

- **Minimum SDK**: 21 (Android 5.0 Lollipop)
- **Target SDK**: 34+ (Android 14+)
- **Compile SDK**: 35+
- **Kotlin**: 1.6.0+
- **Gradle**: 7.0+
- **Android Gradle Plugin**: 7.0+
- **Dependencies**:
  - Google ML Kit Barcode Scanning: 17.3.0+
  - AndroidX Camera Core: 1.3.1+

### Node.js Requirements

- **Node.js**: >=18.0.0 (LTS recommended)
- **npm**: >=8.0.0
- **Yarn**: >=1.22.0 or >=3.0.0 (Berry)

## Build and CI Compatibility

### Recent Improvements (v1.0.0+)

- **Enhanced CI Pipeline**: Improved GitHub Actions workflow stability
- **Android Build Fixes**: Resolved JVM compatibility issues
- **Yarn Lockfile**: Consistent dependency management across platforms
- **Cross-Platform Reliability**: Better build success rates on all supported platforms

### Build Tools

- **React Native CLI**: 15.0.0+
- **Metro**: Latest stable version
- **Babel**: 7.x with React Native preset
- **TypeScript**: 5.3.0+

## New Architecture Support

### Turbo Modules (React Native 0.68+)

This library is built as a Turbo Module and fully supports the New Architecture:

```typescript
// Automatically uses Turbo Module when New Architecture is enabled
import ImageCodeScanner from 'react-native-image-code-scanner';
```

### Fabric (React Native 0.68+)

The library is compatible with Fabric renderer but doesn't include UI components, so Fabric configuration is not required.

### Enabling New Architecture

#### For React Native 0.70-0.75

```bash
# iOS
cd ios && RCT_NEW_ARCH_ENABLED=1 pod install

# Android - in gradle.properties
newArchEnabled=true
```

#### For React Native 0.76+

New Architecture is enabled by default. To disable:

```bash
# iOS
cd ios && RCT_NEW_ARCH_ENABLED=0 pod install

# Android - in gradle.properties
newArchEnabled=false
```

## Migration Guide

### From React Native 0.6x to 0.7x

If you're upgrading from React Native 0.6x:

1. Update peer dependencies:

   ```json
   {
     "react": ">=17.0.0",
     "react-native": ">=0.70.0"
   }
   ```

2. Update package version reference to 1.1.x in your project

3. Update iOS deployment target to 13.4 or higher

4. Update Android minSdkVersion to 21 or higher

### From Old to New Architecture

No code changes required! The library automatically detects and uses the appropriate architecture:

```typescript
// Same API for both architectures
const results = await ImageCodeScanner.scan({
  path: imagePath,
  formats: [BarcodeFormat.QR_CODE],
});
```

## Testing Compatibility

### Test Matrix

Run tests across different React Native versions:

```bash
# Test with specific React Native version
npx react-native init TestApp --version 0.79.2
cd TestApp
npm install react-native-image-code-scanner
```

### Automated Testing

The library is tested against:

- React Native 0.70.x (Old Architecture)
- React Native 0.75.x (Both Architectures)
- React Native 0.79.x (New Architecture)
- Latest React Native release

## Known Issues and Workarounds

### Issue: Build fails on React Native 0.70.x with New Architecture

**Solution**: New Architecture requires React Native 0.68+. For 0.70.x, ensure Old Architecture is used.

### Issue: Expo Go doesn't work

**Solution**: This is expected. The library uses native modules that require prebuild:

```bash
npx expo prebuild
npx expo run:ios # or run:android
```

### Issue: TypeScript errors with React Native 0.7x

**Solution**: Ensure you have the correct @types/react-native:

```bash
npm install --save-dev @types/react@^18.0.0 @types/react-native@^0.72.0
```

## Support Policy

- **Active Support**: Latest 3 minor versions of React Native
- **Security Updates**: Latest 6 minor versions of React Native
- **Best Effort**: Older versions on case-by-case basis

## Reporting Compatibility Issues

If you encounter compatibility issues:

1. Check this compatibility guide
2. Search [existing issues](https://github.com/anngth/react-native-image-code-scanner/issues)
3. Create a new issue with:
   - React Native version
   - Package version
   - Platform (iOS/Android)
   - Architecture (Old/New)
   - Error messages/logs

## Resources

- [React Native Releases](https://github.com/facebook/react-native/releases)
- [React Native New Architecture](https://reactnative.dev/docs/new-architecture-intro)
- [Expo SDK Versions](https://docs.expo.dev/versions/latest/)
- [Package Changelog](./CHANGELOG.md)
