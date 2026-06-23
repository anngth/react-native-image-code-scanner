# Changelog

## <small>1.1.2 (2025-11-19)</small>

- chore: enhance GitHub Actions workflow to fetch previous tags and generate detailed release notes ([e96ef64](https://github.com/anngth/react-native-image-code-scanner/commit/e96ef64))
- chore(ci): simplify release workflow with release-it integration ([976f9e1](https://github.com/anngth/react-native-image-code-scanner/commit/976f9e1))
- chore(deps-dev): bump @react-native-community/cli from 15.0.0 to 17.0.1 ([09068fa](https://github.com/anngth/react-native-image-code-scanner/commit/09068fa))
- chore(deps): bump js-yaml from 3.14.1 to 3.14.2 ([c676001](https://github.com/anngth/react-native-image-code-scanner/commit/c676001))
- chore(deps): update babel and ark dependencies ([14a82e0](https://github.com/anngth/react-native-image-code-scanner/commit/14a82e0))
- fix(android): barcode scan returns empty array despite successful detection ([b867af5](https://github.com/anngth/react-native-image-code-scanner/commit/b867af5))
- fix(android): replace BaseReactPackage with ReactPackage for RN 0.70-0.73 compatibility ([096b179](https://github.com/anngth/react-native-image-code-scanner/commit/096b179))
- docs: update README to include --clean option in prebuild command for clarity ([e018b18](https://github.com/anngth/react-native-image-code-scanner/commit/e018b18))

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-09-05

### Added

- **Enhanced scan results** - Now returns both content and format information
- New `ScanResult` interface with `content` and `format` properties
- Format detection for all supported barcode types (QR_CODE, CODE_128, EAN_13, etc.)
- Updated example app to display both content and barcode format
- TypeScript support for the new result format

### Changed

- **Breaking Change**: `ImageCodeScanner.scan()` now returns `ScanResult[]` instead of `string[]`
- Updated API to provide more detailed scan results
- Enhanced example app UI to show barcode format alongside content
- Improved result display with format badges

### Fixed

- Better type safety with comprehensive result interface
- Enhanced debugging capabilities with format information

[1.1.0]: https://github.com/anngth/react-native-image-code-scanner/releases/tag/v1.1.0

_This changelog will be updated with each new release to document all changes, improvements, and new features._
