@echo off
"C:\\Program Files\\Java\\jdk-17\\bin\\java" ^
  --enable-native-access ^
  ALL-UNNAMED ^
  --class-path ^
  "C:\\Users\\shyamprakash.a\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  x86_64 ^
  --os-version ^
  24 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  27 ^
  --output ^
  "C:\\Users\\SHYAMP~1.A\\AppData\\Local\\Temp\\agp-prefab-staging11491890794847586316\\staged-cli-output" ^
  "C:\\Users\\shyamprakash.a\\.gradle\\caches\\9.4.1\\transforms\\83daf106ead88e7e3c5ea19248e78529\\transformed\\react-android-0.87.1-release\\prefab" ^
  "C:\\Users\\shyamprakash.a\\.gradle\\caches\\9.4.1\\transforms\\4b1201a8cff028773266549fc58b8a24\\transformed\\hermes-android-250829098.0.17-release\\prefab" ^
  "C:\\Users\\shyamprakash.a\\.gradle\\caches\\9.4.1\\transforms\\3cb1792e16d0777e9535521c99f0b7b5\\transformed\\fbjni-0.7.0\\prefab"
