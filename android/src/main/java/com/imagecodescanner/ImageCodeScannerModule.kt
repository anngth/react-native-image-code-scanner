package com.imagecodescanner

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Matrix
import android.graphics.Paint
import android.net.Uri
import com.imagecodescanner.NativeImageCodeScannerSpec
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.io.File
import java.io.FileNotFoundException
import java.io.FileInputStream
import java.io.InputStream
import java.util.concurrent.atomic.AtomicBoolean

@ReactModule(name = ImageCodeScannerModule.NAME)
class ImageCodeScannerModule(reactContext: ReactApplicationContext) :
  NativeImageCodeScannerSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  private fun debugLog(message: String) {
    if (BuildConfig.DEBUG) {
      android.util.Log.d(TAG, message)
    }
  }

  private fun debugWarn(message: String) {
    if (BuildConfig.DEBUG) {
      android.util.Log.w(TAG, message)
    }
  }

  private fun debugError(message: String, throwable: Throwable) {
    if (BuildConfig.DEBUG) {
      android.util.Log.e(TAG, message, throwable)
    }
  }

  private fun scaleBitmapIfNeeded(bitmap: Bitmap): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    
    if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION) {
      return bitmap
    }
    
    val scale = if (width > height) {
      MAX_IMAGE_DIMENSION.toFloat() / width
    } else {
      MAX_IMAGE_DIMENSION.toFloat() / height
    }
    
    val newWidth = (width * scale).toInt()
    val newHeight = (height * scale).toInt()
    
    return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
  }
  
  private fun enhanceContrast(bitmap: Bitmap): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    val config = bitmap.config ?: Bitmap.Config.ARGB_8888
    val enhancedBitmap = Bitmap.createBitmap(width, height, config)
    
    val canvas = Canvas(enhancedBitmap)
    val paint = Paint()
    
    // Increase contrast
    val colorMatrix = ColorMatrix()
    val contrast = 2f // Increase contrast by 2x
    val brightness = -50f // Decrease brightness slightly
    val scale = contrast
    val translate = (-.5f * scale + .5f) * 255f + brightness
    
    colorMatrix.set(floatArrayOf(
      scale, 0f, 0f, 0f, translate,
      0f, scale, 0f, 0f, translate,
      0f, 0f, scale, 0f, translate,
      0f, 0f, 0f, 1f, 0f
    ))
    
    paint.colorFilter = ColorMatrixColorFilter(colorMatrix)
    canvas.drawBitmap(bitmap, 0f, 0f, paint)
    
    return enhancedBitmap
  }
  
  private fun convertToGrayscale(bitmap: Bitmap): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    val config = bitmap.config ?: Bitmap.Config.ARGB_8888
    val grayscaleBitmap = Bitmap.createBitmap(width, height, config)
    
    val canvas = Canvas(grayscaleBitmap)
    val paint = Paint()
    
    val colorMatrix = ColorMatrix()
    colorMatrix.setSaturation(0f)
    
    paint.colorFilter = ColorMatrixColorFilter(colorMatrix)
    canvas.drawBitmap(bitmap, 0f, 0f, paint)
    
    return grayscaleBitmap
  }
  
  private fun rotateBitmap(bitmap: Bitmap, degrees: Float): Bitmap {
    val matrix = Matrix()
    matrix.postRotate(degrees)
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
  }

  private fun readBooleanOption(options: ReadableMap, key: String, defaultValue: Boolean): Boolean {
    if (!options.hasKey(key) || options.isNull(key)) {
      return defaultValue
    }

    return when (options.getType(key)) {
      ReadableType.Boolean -> options.getBoolean(key)
      ReadableType.Number -> options.getDouble(key) != 0.0
      else -> defaultValue
    }
  }

  private fun openImageInputStream(path: String): InputStream {
    val uri = Uri.parse(path)
    return when (uri.scheme?.lowercase()) {
      null, "" -> FileInputStream(File(Uri.decode(path)))
      "file" -> {
        val filePath = uri.path ?: Uri.decode(path.removePrefix("file://"))
        FileInputStream(File(filePath))
      }
      else -> reactApplicationContext.contentResolver.openInputStream(uri)
        ?: throw IllegalArgumentException("Cannot open image URI: $path")
    }
  }

  private fun decodeBitmapFromPath(path: String): Bitmap? {
    val boundsOptions = BitmapFactory.Options()
    boundsOptions.inJustDecodeBounds = true
    openImageInputStream(path).use { input ->
      BitmapFactory.decodeStream(input, null, boundsOptions)
    }

    if (boundsOptions.outWidth <= 0 || boundsOptions.outHeight <= 0) {
      return null
    }

    var sampleSize = 1
    while (boundsOptions.outWidth / sampleSize > MAX_IMAGE_DIMENSION || boundsOptions.outHeight / sampleSize > MAX_IMAGE_DIMENSION) {
      sampleSize *= 2
    }

    val bitmapOptions = BitmapFactory.Options()
    bitmapOptions.inSampleSize = sampleSize
    return openImageInputStream(path).use { input ->
      BitmapFactory.decodeStream(input, null, bitmapOptions)
    }
  }
  
  override fun scanFromPath(path: String, formats: ReadableArray, options: ReadableMap, promise: Promise) {
    debugLog("scanFromPath called with path: $path")
    val shouldEnhanceContrast = readBooleanOption(options, "enhanceContrast", true)
    val shouldConvertToGrayscale = readBooleanOption(options, "convertToGrayscale", true)
    val shouldTryRotations = readBooleanOption(options, "tryRotations", true)
    debugLog(
      "Starting scan with preprocessing options: enhanceContrast=$shouldEnhanceContrast, convertToGrayscale=$shouldConvertToGrayscale, tryRotations=$shouldTryRotations"
    )

    var baseBitmap: Bitmap? = null
    val hasResolved = AtomicBoolean(false)

    fun safeResolve(value: Any?) {
      if (hasResolved.compareAndSet(false, true)) {
        promise.resolve(value)
      }
    }

    fun safeReject(code: String, message: String, error: Throwable?) {
      if (hasResolved.compareAndSet(false, true)) {
        promise.reject(code, message, error)
      }
    }

    fun cleanupBitmaps() {
      baseBitmap?.let { bitmap ->
        if (!bitmap.isRecycled) {
          bitmap.recycle()
        }
      }
      baseBitmap = null
    }

    fun cleanupAttemptBitmap(bitmap: Bitmap) {
      if (bitmap !== baseBitmap && !bitmap.isRecycled) {
        bitmap.recycle()
      }
    }

    try {
      val originalBitmap = decodeBitmapFromPath(path)
      if (originalBitmap == null) {
        safeReject("INVALID_IMAGE", "Cannot decode image file: $path", null)
        return
      }
      
      // Scale if needed for better processing
      baseBitmap = scaleBitmapIfNeeded(originalBitmap)
      if (baseBitmap !== originalBitmap && !originalBitmap.isRecycled) {
        originalBitmap.recycle()
      }

      // Convert formats array to ML Kit barcode formats
      val barcodeFormats = mutableListOf<Int>()
      
      for (i in 0 until formats.size()) {
        val format = formats.getString(i)
        when (format) {
          "QR_CODE" -> barcodeFormats.add(Barcode.FORMAT_QR_CODE)
          "CODE_128" -> barcodeFormats.add(Barcode.FORMAT_CODE_128)
          "CODE_39" -> barcodeFormats.add(Barcode.FORMAT_CODE_39)
          "CODE_93" -> barcodeFormats.add(Barcode.FORMAT_CODE_93)
          "EAN_13" -> barcodeFormats.add(Barcode.FORMAT_EAN_13)
          "EAN_8" -> barcodeFormats.add(Barcode.FORMAT_EAN_8)
          "UPC_A" -> barcodeFormats.add(Barcode.FORMAT_UPC_A)
          "UPC_E" -> barcodeFormats.add(Barcode.FORMAT_UPC_E)
          "PDF_417" -> barcodeFormats.add(Barcode.FORMAT_PDF417)
          "DATA_MATRIX" -> barcodeFormats.add(Barcode.FORMAT_DATA_MATRIX)
          "AZTEC" -> barcodeFormats.add(Barcode.FORMAT_AZTEC)
          "ITF" -> barcodeFormats.add(Barcode.FORMAT_ITF)
          "CODABAR" -> barcodeFormats.add(Barcode.FORMAT_CODABAR)
          else -> {
            // Log unsupported format but continue
            debugWarn("Unsupported format: $format")
          }
        }
      }
      
      // If no formats specified, default to QR_CODE
      if (barcodeFormats.isEmpty()) {
        barcodeFormats.add(Barcode.FORMAT_QR_CODE)
      }
      
      // Configure barcode scanner with specified formats
      val scannerOptions = BarcodeScannerOptions.Builder()
        .setBarcodeFormats(barcodeFormats.first(), *barcodeFormats.drop(1).toIntArray())
        .build()

      val attempts = mutableListOf<Pair<String, () -> Bitmap>>()
      attempts.add("Original" to { baseBitmap ?: throw IllegalStateException("Base bitmap has been recycled") })

      if (shouldConvertToGrayscale) {
        attempts.add("Grayscale" to {
          convertToGrayscale(baseBitmap ?: throw IllegalStateException("Base bitmap has been recycled"))
        })
      }
      
      if (shouldEnhanceContrast) {
        attempts.add("Enhanced contrast" to {
          enhanceContrast(baseBitmap ?: throw IllegalStateException("Base bitmap has been recycled"))
        })
      }
      
      if (shouldTryRotations) {
        attempts.add("Rotated 90°" to {
          rotateBitmap(baseBitmap ?: throw IllegalStateException("Base bitmap has been recycled"), 90f)
        })
        attempts.add("Rotated 180°" to {
          rotateBitmap(baseBitmap ?: throw IllegalStateException("Base bitmap has been recycled"), 180f)
        })
        attempts.add("Rotated 270°" to {
          rotateBitmap(baseBitmap ?: throw IllegalStateException("Base bitmap has been recycled"), 270f)
        })
      }
      
      var currentIndex = 0
      
      fun tryNextImage() {
        if (currentIndex >= attempts.size) {
          // No more images to try, return empty result
          val arr = Arguments.fromList(emptyList<String>())
          cleanupBitmaps()
          safeResolve(arr)
          return
        }
        
        val (description, createBitmap) = attempts[currentIndex]
        currentIndex++

        val currentBitmap = try {
          createBitmap()
        } catch (e: Exception) {
          debugWarn("Failed to create $description image: ${e.message}")
          tryNextImage()
          return
        }
        
        val image = InputImage.fromBitmap(currentBitmap, 0)
        val scanner = BarcodeScanning.getClient(scannerOptions)
        
        scanner.process(image)
          .addOnSuccessListener { barcodes ->
            try {
              if (barcodes.isNotEmpty()) {
                // Found barcodes, process and return
                val codes = barcodes
                  .mapNotNull { barcode -> 
                    val value = barcode.displayValue ?: barcode.rawValue
                    if (value != null && value.isNotEmpty()) {
                      val format = when (barcode.format) {
                        Barcode.FORMAT_QR_CODE -> "QR_CODE"
                        Barcode.FORMAT_CODE_128 -> "CODE_128"
                        Barcode.FORMAT_CODE_39 -> "CODE_39"
                        Barcode.FORMAT_CODE_93 -> "CODE_93"
                        Barcode.FORMAT_EAN_13 -> "EAN_13"
                        Barcode.FORMAT_EAN_8 -> "EAN_8"
                        Barcode.FORMAT_UPC_A -> "UPC_A"
                        Barcode.FORMAT_UPC_E -> "UPC_E"
                        Barcode.FORMAT_PDF417 -> "PDF_417"
                        Barcode.FORMAT_DATA_MATRIX -> "DATA_MATRIX"
                        Barcode.FORMAT_AZTEC -> "AZTEC"
                        Barcode.FORMAT_ITF -> "ITF"
                        Barcode.FORMAT_CODABAR -> "CODABAR"
                        else -> "UNKNOWN"
                      }
                      val resultMap = Arguments.createMap()
                      resultMap.putString("content", value)
                      resultMap.putString("format", format)
                      resultMap
                    } else null
                  }
                
                val arr = Arguments.createArray()
                codes.forEach { code -> arr.pushMap(code) }
                cleanupAttemptBitmap(currentBitmap)
                cleanupBitmaps()
                safeResolve(arr)
              } else {
                // No barcodes found, try next preprocessing
                cleanupAttemptBitmap(currentBitmap)
                tryNextImage()
              }
            } catch (e: Exception) {
              debugError("Error processing results for $description", e)
              cleanupAttemptBitmap(currentBitmap)
              tryNextImage()
            } finally {
              scanner.close()
            }
          }
          .addOnFailureListener { exception ->
            debugError("Scan failed for $description: ${exception.message}", exception)
            cleanupAttemptBitmap(currentBitmap)
            scanner.close()
            tryNextImage()
          }
      }
      
      // Start the scanning process
      tryNextImage()
        
    } catch (e: Exception) {
      cleanupBitmaps()
      if (e is FileNotFoundException || e is SecurityException) {
        safeReject("INVALID_PATH", "Image file does not exist or cannot be opened: $path", e)
      } else {
        safeReject("IMAGE_LOAD_ERROR", "Error loading image: ${e.message}", e)
      }
    }
  }

  companion object {
    const val NAME = "ImageCodeScanner"
    private const val TAG = "ImageCodeScanner"
    private const val MAX_IMAGE_DIMENSION = 2048
  }
}
