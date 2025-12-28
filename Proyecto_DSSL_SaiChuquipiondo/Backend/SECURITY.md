# SEGURIDAD - Mejoras Implementadas

## ✅ Mejoras de Seguridad Implementadas

### 1. Helmet.js - Headers de Seguridad

Headers HTTP de seguridad configurados automáticamente:

- Content Security Policy (CSP)
- X-Frame-Options (protección contra clickjacking)
- X-Content-Type-Options (prevenir MIME sniffing)
- Strict-Transport-Security (HSTS)
- X-Download-Options
- X-Permitted-Cross-Domain-Policies

### 2. Rate Limiting

- **General**: 100 requests por IP cada 15 minutos
- **Login**: 5 intentos de login cada 15 minutos
- Protección contra ataques de fuerza bruta y DDoS

### 3. Bcrypt - Hash de Contraseñas

- ✅ Implementado bcrypt para hash seguro de contraseñas
- ✅ Migración automática de contraseñas en texto plano al primer login
- ✅ Script de migración masiva disponible: `npm run migrate:passwords`
- Hash con salt rounds: 10 (recomendado para producción)

### 4. Validación de Inputs (Express-Validator)

Validadores implementados para:

- ✅ Login (username y password)
- ✅ Elegir asesor
- ✅ Validaciones de coordinación
- ✅ Programar sustentación
- ✅ Revisiones de asesor/jurado
- ✅ Sanitización automática de strings

---

## 📋 Scripts NPM Disponibles

Agrega estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "migrate:passwords": "node scripts/migrate-passwords.js"
  }
}
```

---

## 🚀 Uso

### Migrar Contraseñas Existentes

**IMPORTANTE**: Ejecutar solo UNA VEZ

```bash
npm run migrate:passwords
```

Este script:

- Busca todas las contraseñas en texto plano
- Las hashea con bcrypt
- Actualiza la base de datos
- Muestra reporte de migración

### Migración Automática

Si prefieres NO ejecutar el script de migración masiva, el sistema migrará contraseñas automáticamente cuando cada usuario haga login por primera vez.

---

## 🔒 Configuración de Seguridad

### Variables de Entorno Recomendadas

Agregar a `.env`:

```env
# Seguridad JWT
JWT_SECRET=cambiar_por_secreto_aleatorio_seguro_de_al_menos_32_caracteres
JWT_EXPIRES=4h

# Entorno (development/production)
NODE_ENV=production

# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_seguro
DB_NAME=sgt
DB_PORT=3306

# Servidor
PORT=3000
```

### Generar JWT_SECRET Seguro

En producción, usa un secreto aleatorio fuerte:

```bash
# Linux/Mac
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ⚠️ Advertencias de Seguridad

### ANTES de Pasar a Producción:

1. **Cambiar JWT_SECRET**: El valor actual es inseguro
2. **Ejecutar migración de contraseñas**: Asegurarse que TODAS estén hasheadas
3. **Configurar HTTPS**: Helmet requiere HTTPS en producción
4. **Revisar CORS**: Configurar dominios permitidos en lugar de `*`
5. **Configurar NODE_ENV=production**: Desactiva stack traces en errores
6. **Límites de Rate**: Ajustar según necesidades de producción

---

## 🧪 Pruebas

### Probar Rate Limiting

```bash
# Login (debe bloquear después de 5 intentos)
for i in {1..10}; do curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"test","password":"test"}'; done
```

### Probar Validación

```bash
# Debe retornar errores de validación
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"ab","password":"123"}'
```

---

## 📊 Niveles de Seguridad Logrados

| Característica          | Antes          | Ahora                |
| ----------------------- | -------------- | -------------------- |
| Contraseñas             | ❌ Texto plano | ✅ Bcrypt hash       |
| Rate Limiting           | ❌ No          | ✅ Activo            |
| Headers de Seguridad    | ❌ No          | ✅ Helmet            |
| Validación de Inputs    | ❌ Básica      | ✅ Express-validator |
| Sanitización            | ❌ No          | ✅ Automática        |
| Protección DDoS         | ❌ No          | ✅ Rate limiter      |
| Protección Fuerza Bruta | ❌ No          | ✅ Login limiter     |

---

## 📝 Próximos Pasos Recomendados

1. **Logging Estructurado**: Implementar Winston o Pino
2. **Monitoreo**: Agregar métricas (Prometheus, Grafana)
3. **HTTPS**: Configurar certificado SSL/TLS
4. **WAF**: Considerar Web Application Firewall
5. **Auditoría**: Implementar logs de auditoría de acciones críticas
6. **2FA**: Two-Factor Authentication para coordinación
7. **Session Management**: Considerar redis para sesiones
