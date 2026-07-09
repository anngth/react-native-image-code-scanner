import Foundation
import React
import Vision
import UIKit
import CoreImage
import CoreGraphics

@objc(ImageCodeScanner)
class ImageCodeScanner: NSObject, RCTBridgeModule {
  
  static func moduleName() -> String! { "ImageCodeScanner" }
  static func requiresMainQueueSetup() -> Bool { false }
  
  // Shared CIContext for reuse across image processing operations
  private let sharedCIContext = CIContext(options: nil)

  // MARK: - Image Preprocessing Methods
  
  private func convertToGrayscale(_ image: UIImage) -> UIImage? {
    guard let currentCGImage = image.cgImage else { return nil }
    let currentCIImage = CIImage(cgImage: currentCGImage)
    
    let filter = CIFilter(name: "CIColorMonochrome")
    filter?.setValue(currentCIImage, forKey: "inputImage")
    filter?.setValue(CIColor(red: 0.7, green: 0.7, blue: 0.7), forKey: "inputColor")
    filter?.setValue(1.0, forKey: "inputIntensity")
    
    guard let outputImage = filter?.outputImage else { return nil }
    
    guard let cgImage = sharedCIContext.createCGImage(outputImage, from: outputImage.extent) else { return nil }
    
    return UIImage(cgImage: cgImage, scale: image.scale, orientation: image.imageOrientation)
  }
  
  private func enhanceContrast(_ image: UIImage) -> UIImage? {
    guard let currentCGImage = image.cgImage else { return nil }
    let currentCIImage = CIImage(cgImage: currentCGImage)
    
    let filter = CIFilter(name: "CIColorControls")
    filter?.setValue(currentCIImage, forKey: "inputImage")
    filter?.setValue(2.0, forKey: "inputContrast") // Increase contrast
    filter?.setValue(-0.2, forKey: "inputBrightness") // Slightly decrease brightness
    filter?.setValue(1.0, forKey: "inputSaturation")
    
    guard let outputImage = filter?.outputImage else { return nil }
    
    guard let cgImage = sharedCIContext.createCGImage(outputImage, from: outputImage.extent) else { return nil }
    
    return UIImage(cgImage: cgImage, scale: image.scale, orientation: image.imageOrientation)
  }
  
  private func rotateImage(_ image: UIImage, degrees: CGFloat) -> UIImage? {
    let radians = degrees * CGFloat.pi / 180
    
    var newSize = CGRect(origin: CGPoint.zero, size: image.size)
      .applying(CGAffineTransform(rotationAngle: radians))
      .size
    
    newSize.width = floor(newSize.width)
    newSize.height = floor(newSize.height)
    
    UIGraphicsBeginImageContextWithOptions(newSize, false, image.scale)
    defer { UIGraphicsEndImageContext() }
    
    guard let context = UIGraphicsGetCurrentContext() else { return nil }
    
    context.translateBy(x: newSize.width / 2, y: newSize.height / 2)
    context.rotate(by: radians)
    
    image.draw(in: CGRect(
      x: -image.size.width / 2,
      y: -image.size.height / 2,
      width: image.size.width,
      height: image.size.height
    ))
    
    return UIGraphicsGetImageFromCurrentImageContext()
  }

  private func scaleImageIfNeeded(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
    let pixelW = CGFloat(image.cgImage?.width ?? Int(image.size.width * image.scale))
    let pixelH = CGFloat(image.cgImage?.height ?? Int(image.size.height * image.scale))
    guard max(pixelW, pixelH) > maxDimension else { return image }
    let ratio = maxDimension / max(pixelW, pixelH)
    let newW = floor(pixelW * ratio), newH = floor(pixelH * ratio)
    let newSizePx = CGSize(width: newW, height: newH)
    let format = UIGraphicsImageRendererFormat.default()
    format.scale = 1 // render size is in pixels
    let rendered = UIGraphicsImageRenderer(size: newSizePx, format: format).image { _ in
      image.draw(in: CGRect(origin: .zero, size: newSizePx))
    }
    return UIImage(cgImage: rendered.cgImage!, scale: image.scale, orientation: image.imageOrientation)
  }

  private func cgImagePropertyOrientation(from o: UIImage.Orientation) -> CGImagePropertyOrientation {
    switch o {
    case .up: return .up
    case .down: return .down
    case .left: return .left
    case .right: return .right
    case .upMirrored: return .upMirrored
    case .downMirrored: return .downMirrored
    case .leftMirrored: return .leftMirrored
    case .rightMirrored: return .rightMirrored
    @unknown default: return .up
    }
  }

  private func isLikelyUPCA(fromEAN13 payload: String) -> Bool {
    guard payload.count == 13, payload.hasPrefix("0") else { return false }
    return payload.allSatisfy(\.isNumber)
  }

  private func boolOption(_ options: NSDictionary, key: String, default defaultValue: Bool) -> Bool {
    guard let value = options[key] else { return defaultValue }
    if let boolValue = value as? Bool {
      return boolValue
    }
    if let numberValue = value as? NSNumber {
      return numberValue.boolValue
    }
    return defaultValue
  }

  private func filePath(from path: String) -> String {
    if let url = URL(string: path), url.isFileURL {
      return url.path
    }
    return path.removingPercentEncoding ?? path
  }

  private func debugLog(_ message: @autoclosure () -> String) {
    #if DEBUG
      print(message())
    #endif
  }

  @objc(scanFromPath:formats:options:resolver:rejecter:)
  func scanFromPath(_ path: String,
                    formats: [String],
                    options: NSDictionary,
                    resolver: @escaping RCTPromiseResolveBlock,
                    rejecter: @escaping RCTPromiseRejectBlock) {

    let shouldEnhanceContrast = boolOption(options, key: "enhanceContrast", default: true)
    let shouldConvertToGrayscale = boolOption(options, key: "convertToGrayscale", default: true)
    let shouldTryRotations = boolOption(options, key: "tryRotations", default: true)

    debugLog("ImageCodeScanner iOS - Starting scan with preprocessing options: enhanceContrast=\(shouldEnhanceContrast), convertToGrayscale=\(shouldConvertToGrayscale), tryRotations=\(shouldTryRotations)")

    // Use atomic flag to prevent multiple promise calls
    var hasResolved = false
    let resolveQueue = DispatchQueue(label: "ImageCodeScanner.resolve")

    func safeResolve(_ result: Any) {
      resolveQueue.sync {
        guard !hasResolved else { return }
        hasResolved = true
        resolver(result)
      }
    }

    func safeReject(_ code: String, _ message: String, _ error: Error?) {
      resolveQueue.sync {
        guard !hasResolved else { return }
        hasResolved = true
        rejecter(code, message, error)
      }
    }
    
    let cleanPath = filePath(from: path)
    
    guard let originalImage = UIImage(contentsOfFile: cleanPath) else {
      safeReject("INVALID_IMAGE", "Cannot load image from path: \(path)", nil)
      return
    }
    
    let baseImage = scaleImageIfNeeded(originalImage, maxDimension: 2048)
    var imagesToTry: [(String, UIImage)] = [("Original", baseImage)]

    if shouldConvertToGrayscale {
      if let grayscaleImage = convertToGrayscale(baseImage) {
        imagesToTry.append(("Grayscale", grayscaleImage))
        debugLog("ImageCodeScanner iOS - Added grayscale version")
      }
    }
    
    if shouldEnhanceContrast {
      if let contrastImage = enhanceContrast(baseImage) {
        imagesToTry.append(("Enhanced contrast", contrastImage))
        debugLog("ImageCodeScanner iOS - Added contrast enhanced version")
      }
    }
    
    if shouldTryRotations {
      if let rotated90 = rotateImage(baseImage, degrees: 90) {
        imagesToTry.append(("Rotated 90°", rotated90))
      }
      if let rotated180 = rotateImage(baseImage, degrees: 180) {
        imagesToTry.append(("Rotated 180°", rotated180))
      }
      if let rotated270 = rotateImage(baseImage, degrees: 270) {
        imagesToTry.append(("Rotated 270°", rotated270))
      }
      debugLog("ImageCodeScanner iOS - Added rotated versions")
    }
    
    // Convert formats array to Vision symbologies
    var symbologies: [VNBarcodeSymbology] = []
    let requestedUPCA = formats.contains("UPC_A")
    let requestedEAN13 = formats.contains("EAN_13")
    // Normalize EAN-13 payloads with leading zero to UPC-A only when caller
    // explicitly requests UPC-A without also requesting EAN-13.
    let shouldNormalizeUPCA = requestedUPCA && !requestedEAN13
    
    for format in formats {
      switch format {
      case "QR_CODE":
        symbologies.append(.qr)
      case "CODE_128":
        symbologies.append(.code128)
      case "CODE_39":
        symbologies.append(.code39)
      case "CODE_93":
        symbologies.append(.code93)
      case "EAN_13":
        symbologies.append(.ean13)
      case "EAN_8":
        symbologies.append(.ean8)
      case "UPC_A":
        symbologies.append(contentsOf: [.ean13, .upce])  // UPC-A via EAN-13 + UPC-E
      case "UPC_E":
        symbologies.append(.upce)
      case "PDF_417":
        symbologies.append(.pdf417)
      case "DATA_MATRIX":
        symbologies.append(.dataMatrix)
      case "AZTEC":
        symbologies.append(.aztec)
      case "ITF":
        symbologies.append(.itf14) // ITF14 format
      case "CODABAR":
        symbologies.append(.codabar)
      default:
        break
      }
    }
    
    // If no formats specified, default to QR
    if symbologies.isEmpty {
      symbologies.append(.qr)
    }
    
    // Function to try scanning with a specific image
    func tryScanning(images: [(String, UIImage)], index: Int) {
      guard index < images.count else {
        // No more images to try, return empty result
        debugLog("ImageCodeScanner iOS - No barcodes found after trying all preprocessing options")
        safeResolve([])
        return
      }
      
      let (description, currentImage) = images[index]
      debugLog("ImageCodeScanner iOS - Attempting scan with: \(description)")
      
      guard let cgImage = currentImage.cgImage else {
        // Try next image if this one fails
        tryScanning(images: images, index: index + 1)
        return
      }
      
      // Create Vision request for barcode detection
      let request = VNDetectBarcodesRequest { request, error in
        DispatchQueue.main.async {
          if let error = error {
            debugLog("ImageCodeScanner iOS - \(description) failed: \(error.localizedDescription)")
            // Try next image
            tryScanning(images: images, index: index + 1)
            return
          }
          
          guard let results = request.results as? [VNBarcodeObservation] else {
            // Try next image
            tryScanning(images: images, index: index + 1)
            return
          }
          
          // Extract barcode payload strings with format information
          let barcodeResults = results.compactMap { observation -> [String: Any]? in
            guard let payload = observation.payloadStringValue else { return nil }
            
            let format: String
            let normalizedPayload: String
            switch observation.symbology {
            case .qr:
              format = "QR_CODE"
              normalizedPayload = payload
            case .code128:
              format = "CODE_128"
              normalizedPayload = payload
            case .code39:
              format = "CODE_39"
              normalizedPayload = payload
            case .code93:
              format = "CODE_93"
              normalizedPayload = payload
            case .ean13:
              if shouldNormalizeUPCA && self.isLikelyUPCA(fromEAN13: payload) {
                format = "UPC_A"
                normalizedPayload = String(payload.dropFirst())
              } else {
                format = "EAN_13"
                normalizedPayload = payload
              }
            case .ean8:
              format = "EAN_8"
              normalizedPayload = payload
            case .upce:
              format = "UPC_E"
              normalizedPayload = payload
            case .pdf417:
              format = "PDF_417"
              normalizedPayload = payload
            case .dataMatrix:
              format = "DATA_MATRIX"
              normalizedPayload = payload
            case .aztec:
              format = "AZTEC"
              normalizedPayload = payload
            case .itf14:
              format = "ITF"
              normalizedPayload = payload
            case .codabar:
              format = "CODABAR"
              normalizedPayload = payload
            default:
              format = "UNKNOWN"
              normalizedPayload = payload
            }
            
            return [
              "content": normalizedPayload,
              "format": format
            ]
          }
          
          if barcodeResults.isEmpty {
            debugLog("ImageCodeScanner iOS - \(description): No barcodes found")
            // Try next image
            tryScanning(images: images, index: index + 1)
          } else {
            debugLog("ImageCodeScanner iOS - Success with \(description)! Found \(barcodeResults.count) codes")
            safeResolve(barcodeResults)
          }
        }
      }
      
      #if targetEnvironment(simulator)
        request.revision = VNDetectBarcodesRequestRevision1
      #endif
      
      // Configure supported symbologies
      request.symbologies = symbologies
      
      // Create handler and perform request
      let handler = VNImageRequestHandler(
        cgImage: cgImage,
        orientation: cgImagePropertyOrientation(from: currentImage.imageOrientation),
        options: [:]
      )

      DispatchQueue.global(qos: .userInitiated).async {
        do {
          try handler.perform([request])
        } catch {
          DispatchQueue.main.async {
            debugLog("ImageCodeScanner iOS - \(description) perform error: \(error.localizedDescription)")
            // Try next image
            tryScanning(images: images, index: index + 1)
          }
        }
      }
    }
    
    // Start scanning with the first image
    tryScanning(images: imagesToTry, index: 0)
  }
  

}
