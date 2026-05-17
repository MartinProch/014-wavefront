#!/bin/bash
# Wavefront build script — kopíruje HTML, builduje APK, commituje a pushuje
# Použití: ./build.sh "popis změn"

set -e

MSG="${1:-Update wavefront-mobile features}"
DATE=$(date +%Y-%m-%d)
APK_NAME="wavefront-${DATE}.apk"

echo "🔨 Kopíruji HTML..."
cp wavefront-mobile.html www/index.html
cp wavefront-mobile.html android/app/src/main/assets/public/index.html

echo "🏗  Builduju APK..."
cd android
./gradlew assembleDebug --quiet
cd ..

echo "📦 Kopíruji APK do Downloads..."
cp android/app/build/outputs/apk/debug/app-debug.apk ~/Downloads/${APK_NAME}
echo "✅ APK: ~/Downloads/${APK_NAME}"

echo "📝 Git commit & push..."
git add wavefront-mobile.html www/index.html android/app/src/main/assets/public/index.html
git commit -m "${MSG}

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin main

echo ""
echo "🚀 Hotovo!"
echo "   APK:  ~/Downloads/${APK_NAME}"
echo "   Commit: $(git log --oneline -1)"
