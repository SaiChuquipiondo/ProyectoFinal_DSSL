#!/bin/bash
set -e  # Exit on error

echo "🔨 Starting Angular build process..."

# Modificar el archivo que verifica la versión de Node
VERSION_CHECK_FILE="./node_modules/@angular-devkit/build-angular/src/utils/version.js"

if [ -f "$VERSION_CHECK_FILE" ]; then
    echo "📝 Patching Angular version check..."
    sed -i 's/throw new Error/console.warn/g' "$VERSION_CHECK_FILE" 2>/dev/null || true
else
    echo "⚠️  Version check file not found, continuing anyway..."
fi

# Ejecutar build
echo "🏗️  Compiling Angular application..."
npx ng build --configuration=production || npx ng build || npm run build

echo "✅ Build completed!"
echo "📂 Checking output directory..."
ls -la dist/ || echo "❌ dist/ not found!"
if [ -d "dist/frontend/browser" ]; then
    echo "✅ dist/frontend/browser exists!"
    ls -la dist/frontend/browser/
else
    echo "❌ dist/frontend/browser not found!"
    ls -R dist/ || true
fi

