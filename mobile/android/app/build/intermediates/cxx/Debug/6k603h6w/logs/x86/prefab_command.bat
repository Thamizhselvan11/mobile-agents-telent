@echo off
"C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\java" ^
  --enable-native-access ^
  ALL-UNNAMED ^
  --class-path ^
  "C:\\Users\\thamizhselvan.p\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  x86 ^
  --os-version ^
  24 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  27 ^
  --output ^
  "C:\\Users\\THAMIZ~1.P\\AppData\\Local\\Temp\\agp-prefab-staging4269208067310217100\\staged-cli-output" ^
  "C:\\Users\\thamizhselvan.p\\.gradle\\caches\\9.4.1\\transforms\\2f3f04f29a7d86f4d7cc17e86688042f\\transformed\\react-android-0.87.1-debug\\prefab" ^
  "C:\\Users\\thamizhselvan.p\\.gradle\\caches\\9.4.1\\transforms\\cb74f671c90fd9062c26e633f1d2a6cd\\transformed\\hermes-android-250829098.0.17-debug\\prefab" ^
  "C:\\Users\\thamizhselvan.p\\.gradle\\caches\\9.4.1\\transforms\\3cb1792e16d0777e9535521c99f0b7b5\\transformed\\fbjni-0.7.0\\prefab"
