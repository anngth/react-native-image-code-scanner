import { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import ImageCodeScanner, {
  BarcodeFormat,
  type ScanResult,
} from 'react-native-image-code-scanner';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';

interface ScanResultWithTime {
  data: ScanResult[];
  time: number;
  preprocessingUsed?: string;
}

const BARCODE_FORMATS = [
  { key: BarcodeFormat.QR_CODE, label: 'QR' },
  { key: BarcodeFormat.CODE_128, label: '128' },
  { key: BarcodeFormat.CODE_39, label: '39' },
  { key: BarcodeFormat.EAN_13, label: 'EAN-13' },
  { key: BarcodeFormat.EAN_8, label: 'EAN-8' },
  { key: BarcodeFormat.UPC_A, label: 'UPC-A' },
  { key: BarcodeFormat.UPC_E, label: 'UPC-E' },
  { key: BarcodeFormat.PDF_417, label: 'PDF417' },
  { key: BarcodeFormat.DATA_MATRIX, label: 'DM' },
  { key: BarcodeFormat.AZTEC, label: 'Aztec' },
  { key: BarcodeFormat.ITF, label: 'ITF' },
  { key: BarcodeFormat.CODABAR, label: 'Codabar' },
];

const PREPROCESSING_OPTIONS = [
  { key: 'enhanceContrast', label: 'Contrast' },
  { key: 'convertToGrayscale', label: 'Grayscale' },
  { key: 'tryRotations', label: 'Rotate' },
] as const;

type PreprocessingOption = (typeof PREPROCESSING_OPTIONS)[number]['key'];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResultWithTime | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<BarcodeFormat[]>([
    BarcodeFormat.QR_CODE,
  ]);
  const [preprocessing, setPreprocessing] = useState<
    Record<PreprocessingOption, boolean>
  >({
    enhanceContrast: true,
    convertToGrayscale: true,
    tryRotations: true,
  });

  const toggleFormat = (format: BarcodeFormat) => {
    setSelectedFormats((prev) => {
      if (prev.includes(format)) {
        if (prev.length === 1) {
          Alert.alert(
            'Format Required',
            'At least one format must be selected'
          );
          return prev;
        }
        return prev.filter((item) => item !== format);
      }
      return [...prev, format];
    });
  };

  const setPreprocessingOption = (
    option: PreprocessingOption,
    value: boolean
  ) => {
    setPreprocessing((prev) => ({
      ...prev,
      [option]: value,
    }));
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are required to use this app.'
      );
      return false;
    }
    return true;
  };

  const handleImagePicker = async (type: 'camera' | 'gallery') => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    try {
      let result: ImagePicker.ImagePickerResult;

      if (type === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setScanResult(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const scanImage = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const startTime = Date.now();

      const results = await ImageCodeScanner.scan({
        path: selectedImage,
        formats: selectedFormats,
        ...preprocessing,
      });

      const endTime = Date.now();
      const scanTime = endTime - startTime;

      setScanResult({
        data: results,
        time: scanTime,
      });

      if (results.length === 0) {
        Alert.alert('No Codes Found', 'No barcodes were detected in the image');
      }
    } catch (err) {
      Alert.alert(
        'Scan Error',
        err instanceof Error ? err.message : 'Unknown error'
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Image Code Scanner</Text>
        </View>

        {/* Image Selection */}
        <View style={styles.section}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleImagePicker('camera')}
            >
              <Text style={styles.buttonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleImagePicker('gallery')}
            >
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
              />
            </View>
          )}
        </View>

        {/* Scan Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Formats</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() =>
                  setSelectedFormats(
                    BARCODE_FORMATS.map((format) => format.key)
                  )
                }
              >
                <Text style={styles.presetText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setSelectedFormats([BarcodeFormat.QR_CODE])}
              >
                <Text style={styles.presetText}>QR</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formatGrid}>
            {BARCODE_FORMATS.map((format) => {
              const selected = selectedFormats.includes(format.key);
              return (
                <TouchableOpacity
                  key={format.key}
                  style={[styles.chip, selected && styles.selectedChip]}
                  onPress={() => toggleFormat(format.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.selectedChipText,
                    ]}
                  >
                    {format.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preprocessing</Text>
          </View>
          <View style={styles.optionGrid}>
            {PREPROCESSING_OPTIONS.map((option) => {
              const selected = preprocessing[option.key];
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.optionChip, selected && styles.selectedOption]}
                  onPress={() =>
                    setPreprocessingOption(
                      option.key,
                      !preprocessing[option.key]
                    )
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Scan Button */}
        <TouchableOpacity
          style={[styles.scanButton, !selectedImage && styles.disabledButton]}
          onPress={scanImage}
          disabled={!selectedImage || isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scanButtonText}>Scan Image</Text>
          )}
        </TouchableOpacity>

        {/* Results */}
        {scanResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results</Text>
            <Text style={styles.scanTime}>Scan time: {scanResult.time}ms</Text>

            {scanResult.data.length > 0 ? (
              <View>
                {scanResult.data.map((code, index) => (
                  <View key={index} style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Code {index + 1}:</Text>
                    <Text style={styles.formatText}>{code.format}</Text>
                    <Text style={styles.resultText}>{code.content}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noResults}>No codes found</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    resizeMode: 'contain',
    backgroundColor: '#f0f0f0',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: '#D7DEE8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  presetText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 58,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7DEE8',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectedChip: {
    backgroundColor: '#E8F2FF',
    borderColor: '#007AFF',
  },
  chipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedChipText: {
    color: '#0057C2',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginVertical: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7DEE8',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 9,
  },
  selectedOption: {
    backgroundColor: '#ECFDF3',
    borderColor: '#2EAD63',
  },
  optionText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedOptionText: {
    color: '#168046',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  resultItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  formatText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  noResults: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginVertical: 16,
  },
});
