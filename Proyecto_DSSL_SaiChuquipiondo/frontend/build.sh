#!/bin/bash
# Script para ejecutar ng build omitiendo la verificación de versión de Node.js

# Parchear temporalmente el archivo de Angular CLI
CLI_FILE="./node_modules/@angular/cli/lib/cli/index.js"

if [ -f "$CLI_FILE" ]; then
    # Hacer backup
    cp "$CLI_FILE" "$CLI_FILE.bak"
    
    # Comentar la línea que lanza el error de versión
    sed -i 's/process.exit(1)/\/\/ process.exit(1)/g' "$CLI_FILE"
fi

# Ejecutar el build
npx ng build --configuration=production

# Restaurar el archivo original
if [ -f "$CLI_FILE.bak" ]; then
    mv "$CLI_FILE.bak" "$CLI_FILE"
fi
