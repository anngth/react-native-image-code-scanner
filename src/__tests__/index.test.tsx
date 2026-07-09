import ImageCodeScanner, { BarcodeFormat } from '../index';
import NativeImageCodeScanner from '../NativeImageCodeScanner';

jest.mock('../NativeImageCodeScanner', () => ({
  __esModule: true,
  default: {
    scanFromPath: jest.fn(),
  },
}));

const scanFromPathMock = jest.mocked(NativeImageCodeScanner.scanFromPath);

describe('ImageCodeScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects when path is missing', async () => {
    await expect(ImageCodeScanner.scan({ path: '' })).rejects.toThrowError(
      'Image path is required'
    );
  });

  it('uses QR_CODE by default when formats are not provided', async () => {
    scanFromPathMock.mockResolvedValueOnce([]);

    await ImageCodeScanner.scan({ path: 'file:///tmp/example.png' });

    expect(scanFromPathMock).toHaveBeenCalledWith(
      'file:///tmp/example.png',
      [BarcodeFormat.QR_CODE],
      {
        enhanceContrast: true,
        convertToGrayscale: true,
        tryRotations: true,
      }
    );
  });

  it('falls back to QR_CODE when formats is an empty array', async () => {
    scanFromPathMock.mockResolvedValueOnce([]);

    await ImageCodeScanner.scan({
      path: 'file:///tmp/example.png',
      formats: [],
    });

    expect(scanFromPathMock).toHaveBeenCalledWith(
      'file:///tmp/example.png',
      [BarcodeFormat.QR_CODE],
      {
        enhanceContrast: true,
        convertToGrayscale: true,
        tryRotations: true,
      }
    );
  });

  it('passes selected formats through to native', async () => {
    scanFromPathMock.mockResolvedValueOnce([]);

    await ImageCodeScanner.scan({
      path: 'file:///tmp/example.png',
      formats: [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128],
    });

    expect(scanFromPathMock).toHaveBeenCalledWith(
      'file:///tmp/example.png',
      [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128],
      {
        enhanceContrast: true,
        convertToGrayscale: true,
        tryRotations: true,
      }
    );
  });

  it('passes preprocessing options through to native', async () => {
    scanFromPathMock.mockResolvedValueOnce([]);

    await ImageCodeScanner.scan({
      path: 'file:///tmp/example.png',
      formats: [BarcodeFormat.QR_CODE],
      enhanceContrast: false,
      convertToGrayscale: false,
      tryRotations: false,
    });

    expect(scanFromPathMock).toHaveBeenCalledWith(
      'file:///tmp/example.png',
      [BarcodeFormat.QR_CODE],
      {
        enhanceContrast: false,
        convertToGrayscale: false,
        tryRotations: false,
      }
    );
  });

  it('passes UPC_A as the only requested format', async () => {
    scanFromPathMock.mockResolvedValueOnce([]);

    await ImageCodeScanner.scan({
      path: 'file:///tmp/upc-only.png',
      formats: [BarcodeFormat.UPC_A],
    });

    expect(scanFromPathMock).toHaveBeenCalledWith(
      'file:///tmp/upc-only.png',
      [BarcodeFormat.UPC_A],
      {
        enhanceContrast: true,
        convertToGrayscale: true,
        tryRotations: true,
      }
    );
  });

  it('keeps both UPC_A and EAN_13 when both are requested', async () => {
    scanFromPathMock.mockResolvedValueOnce([]);

    await ImageCodeScanner.scan({
      path: 'file:///tmp/upc-and-ean.png',
      formats: [BarcodeFormat.UPC_A, BarcodeFormat.EAN_13],
    });

    expect(scanFromPathMock).toHaveBeenCalledWith(
      'file:///tmp/upc-and-ean.png',
      [BarcodeFormat.UPC_A, BarcodeFormat.EAN_13],
      {
        enhanceContrast: true,
        convertToGrayscale: true,
        tryRotations: true,
      }
    );
  });
});
