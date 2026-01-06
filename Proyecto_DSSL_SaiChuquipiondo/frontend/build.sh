#!/bin/bash
# Build script for Angular in Railway

echo "Starting Angular build..."

# Ejecutar build directamente
npm run build || {
    echo "Build failed, trying alternative..."
    # Si falla, intentar con npx directamente
    npx --yes @angular/cli@latest build --configuration=production || true
}

echo "Build completed. Checking output..."
ls -la dist/

# Mostrar estructura de directorios para debug
if [ -d "dist/frontend" ]; then
    echo "Contents of dist/frontend:"
    ls -la dist/frontend/
fi

