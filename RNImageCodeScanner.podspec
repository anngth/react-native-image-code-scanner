require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "RNImageCodeScanner"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.4" }
  s.source       = { :git => "https://github.com/anngth/react-native-image-code-scanner.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,cpp,swift}"
  s.swift_version = "5.0"
  
  # Required frameworks for Vision and image processing
  s.frameworks = "Vision", "CoreImage", "UIKit", "CoreGraphics"

  # Pod target configuration for Swift
  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "SWIFT_OPTIMIZATION_LEVEL" => "-O",
    "SWIFT_COMPILATION_MODE" => "wholemodule"
  }

  install_modules_dependencies(s)
end
