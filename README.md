# React Native Image Code Scanner

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-image-code-scanner">
    <img src="https://img.shields.io/npm/v/react-native-image-code-scanner.svg" alt="npm version">
  </a>
  <a href="https://github.com/anngth/react-native-image-code-scanner/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/anngth/react-native-image-code-scanner.svg" alt="license">
  </a>
  <a href="https://www.npmjs.com/package/react-native-image-code-scanner">
    <img src="https://img.shields.io/npm/dm/react-native-image-code-scanner.svg" alt="downloads">
  </a>
  <a href="https://github.com/anngth/react-native-image-code-scanner/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/anngth/react-native-image-code-scanner/ci.yml" alt="CI Status">
  </a>
  <a href="https://github.com/anngth/react-native-image-code-scanner/issues">
    <img src="https://img.shields.io/github/issues/anngth/react-native-image-code-scanner" alt="Issues">
  </a>
</p>

Scan QR codes and barcodes from local image files in React Native (iOS Vision + Android ML Kit), with Expo prebuild support.

- Multi-barcode detection in a single image
- Mixed formats in one scan flow
- Auto preprocessing: grayscale, contrast boost, rotation retry (`0°`–`270°`)
- TypeScript support

## Requirements

- React Native `>=0.70.0`, React `>=17.0.0`, Node `>=18`
- iOS `13.4+`, Android `minSdkVersion 21+`

## Installation

### Expo (recommended)

Native module — works with Expo prebuild, not Expo Go.

```bash
npx expo install react-native-image-code-scanner
npx expo prebuild --clean
npx expo run:ios   # or: npx expo run:android
```

### React Native CLI

```bash
npm install react-native-image-code-scanner
cd ios && pod install
```

If your app picks images from camera, add to `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan barcodes</string>
```

## Usage

Works with any image picker — pass the local file URI to `scan()`:

```ts
import * as ImagePicker from 'expo-image-picker';
import ImageCodeScanner, { BarcodeFormat } from 'react-native-image-code-scanner';

async function pickAndScan() {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });

  if (picked.canceled || !picked.assets?.[0]?.uri) return [];

  const results = await ImageCodeScanner.scan({
    path: picked.assets[0].uri,
    formats: [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128],
  });

  // results is ScanResult[] — may contain 0, 1, or many barcodes
  return results;
}
```

Also compatible with `react-native-image-picker` and other pickers that return a local URI.

## API

```ts
ImageCodeScanner.scan(options: ScanOptions): Promise<ScanResult[]>

interface ScanOptions {
  path: string;
  formats?: BarcodeFormat[]; // default: [QR_CODE]
}

interface ScanResult {
  content: string;
  format: string; // no bounding-box coordinates
}
```

**Multi-barcode:** `scan()` returns all barcodes found in one image — no extra option needed. Preprocessing stops once at least one code is detected, but every code from that pass is returned.

**Supported formats:** `QR_CODE`, `CODE_128`, `CODE_39`, `CODE_93`, `EAN_13`, `EAN_8`, `UPC_A`, `UPC_E`, `PDF_417`, `DATA_MATRIX`, `AZTEC`, `ITF`, `CODABAR`

Preprocessing runs automatically: original → grayscale → contrast enhancement → rotation retries.

## Tips

- Resize very large images before scanning; pass only the `formats` you need.
- Process batch jobs sequentially to reduce memory spikes.
- Test on both iOS and Android for critical flows.

## Troubleshooting

- **No result:** check image quality/resolution, limit `formats`, crop closer to the barcode.
- **iOS build:** `cd ios && pod install`; deployment target `13.4+`.
- **Android build:** `cd android && ./gradlew clean`; `minSdkVersion >= 21`.
- **Expo:** requires prebuild; not supported in Expo Go.

## Example App

See [example app](./example) and [example README](./example/README.md).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## Feedback & Support

- [Report a bug](https://github.com/anngth/react-native-image-code-scanner/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/anngth/react-native-image-code-scanner/discussions/new?category=ideas)
- [Ask a question](https://github.com/anngth/react-native-image-code-scanner/discussions)

## License

MIT
