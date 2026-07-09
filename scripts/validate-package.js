#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log(
  '🔍 Validating React Native Image Code Scanner package structure...\n'
);

const requiredFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'tsconfig.json',
  'tsconfig.build.json',
  '.npmignore',
  'RNImageCodeScanner.podspec',
  // Source files
  'src/index.tsx',
  'src/NativeImageCodeScanner.ts',
  // iOS files
  'ios/ImageCodeScanner.h',
  'ios/ImageCodeScanner.mm',
  'ios/ImageCodeScanner.swift',
  // Android files
  'android/build.gradle',
  'android/gradle.properties',
  'android/src/main/AndroidManifest.xml',
  'android/src/main/java/com/imagecodescanner/ImageCodeScannerModule.kt',
  'android/src/main/java/com/imagecodescanner/ImageCodeScannerPackage.kt',
];

const errors = [];
const warnings = [];

// Check required files
requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    errors.push(`❌ Missing required file: ${file}`);
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

// Check package.json configuration
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
  );

  if (!packageJson.name) {
    errors.push('❌ package.json: missing "name" field');
  }
  if (!packageJson.version) {
    errors.push('❌ package.json: missing "version" field');
  }
  if (!packageJson.main) {
    errors.push('❌ package.json: missing "main" field');
  }
  if (!packageJson.types) {
    errors.push('❌ package.json: missing "types" field');
  }
  if (!packageJson.repository) {
    warnings.push('⚠️  package.json: missing "repository" field');
  }
  if (!packageJson.keywords || packageJson.keywords.length === 0) {
    warnings.push('⚠️  package.json: missing or empty "keywords" field');
  }
  if (!packageJson.peerDependencies) {
    errors.push('❌ package.json: missing "peerDependencies" field');
  }
  if (!packageJson.codegenConfig) {
    warnings.push(
      '⚠️  package.json: missing "codegenConfig" for New Architecture support'
    );
  }

  console.log('✅ package.json structure validated');
} catch (error) {
  errors.push(`❌ Error reading package.json: ${error.message}`);
}

// Check for unwanted files
const unwantedDirs = ['modules', 'build', 'lib', '.turbo'];
unwantedDirs.forEach((dir) => {
  if (fs.existsSync(path.join(__dirname, '..', dir))) {
    warnings.push(`⚠️  Found directory that should be cleaned: ${dir}`);
  }
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(50));

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Package structure is valid and ready for publishing!');
} else {
  if (errors.length > 0) {
    console.log('\n❌ ERRORS (must fix before publishing):');
    errors.forEach((error) => console.log('  ' + error));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (recommended to fix):');
    warnings.forEach((warning) => console.log('  ' + warning));
  }
}

console.log('\n📦 To publish this package:');
console.log('  1. Ensure you have an npm account and are logged in: npm login');
console.log('  2. Test the package locally: yarn build && yarn test');
console.log('  3. Publish to npm: npm publish');
console.log('  4. Or use release-it for automated release: yarn release');

process.exit(errors.length > 0 ? 1 : 0);
