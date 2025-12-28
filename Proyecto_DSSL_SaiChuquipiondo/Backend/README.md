# Sistema de Gestión de Tesis (SGT)

**Backend API REST para la gestión completa del proceso de titulación mediante tesis**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnolog%C3%ADas)
- [Instalación](#instalaci%C3%B3n)
- [Configuración](#configuración)
- [Uso](#uso)
- [Documentación](#documentación)
- [Seguridad](#seguridad)
- [Estructura del Proyecto](#estructura-del-proyecto)

---

## ✨ Características

### Gestión Completa del Proceso de Tesis

- **3 Etapas del Proceso:**

  - ✅ Proyecto de Tesis (Asesor y Jurados)
  - ✅ Borrador de Tesis (con múltiples iteraciones)
  - ✅ Tesis Final y Sustentación

- **4 Roles de Usuario:**

  - 👨‍🎓 Estudiante
  - 👨‍🏫 Asesor (Docente)
  - 👨‍⚖️ Jurado (3 por proyecto: Presidente, Secretario, Vocal)
  - 🏛️ Coordinación

- **Funcionalidades Clave:**
  - 📤 Upload de documentos PDF
  - 📝 Sistema de revisiones con observaciones
  - 🔔 Notificaciones automáticas
  - 📄 Generación automática de PDFs (Resoluciones y Actas)
  - 🔢 Numeración única correlativa anual
  - 🔐 Autenticación JWT con roles
  - 📊 Logging estructurado
  - 🛡️ Seguridad robusta

---

## 🏗️ Arquitectura

```
┌─────────────┐
│   Cliente   │ (Frontend - React/Angular/Vue)
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────────────────────────────┐
│        Backend API (Express)        │
│  ┌──────────┬──────────┬─────────┐ │
│  │ Routes   │ Middleware│ Controllers│
│  └────┬─────┴─────┬────┴────┬────┘ │
│       │           │         │      │
│       ▼           ▼         ▼      │
│  ┌─────────┬──────────┬────────┐  │
│  │ Auth    │ Validation│ Logging│  │
│  └─────────┴──────────┴────────┘  │
└────────────────┬────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  MySQL Database │
        │   (18 Tablas)   │
        └─────────────────┘
```

---

## 🚀 Tecnologías

### Core

- **Node.js** 18+ - Runtime
- **Express** 4.x - Framework web
- **MySQL** 8.0 - Base de datos relacional
- **JWT** - Autenticación

### Seguridad

- **bcryptjs** - Hash de contraseñas
- **helmet** - Headers de seguridad HTTP
- **express-rate-limit** - Protección contra fuerza bruta
- **express-validator** - Validación y sanitización

### Utilidades

- **Multer** - Upload de archivos
- **Puppeteer** - Generación de PDFs
- **Winston** - Logging estructurado
- **Morgan** - HTTP request logging
- **dotenv** - Variables de entorno

---

## 📦 Instalación

### Prerequisitos

- Node.js 18 o superior
- MySQL 8.0 o superior
- npm o yarn

### Pasos

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/sgt-backend.git
cd sgt-backend
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar base de datos**

```bash
# Crear la base de datos
mysql -u root -p < database/schema.sql
```

4. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

5. **Migrar contraseñas a bcrypt** (solo primera vez)

```bash
npm run migrate:passwords
```

6. **Iniciar el servidor**

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará disponible en: `http://localhost:3000`

---

## ⚙️ Configuración

### Variables de Entorno (`.env`)

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sgt
DB_PORT=3306

# JWT
JWT_SECRET=tu_secreto_super_seguro_de_al_menos_32_caracteres
JWT_EXPIRES=4h
```

### Generar JWT_SECRET Seguro

```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📖 Uso

### Autenticación

Todos los endpoints (excepto `/api/auth/login`) requieren un token JWT:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"usuario","password":"contraseña"}'

# Respuesta
{
  "message": "Login correcto",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id_usuario": 1,
    "rol": "ESTUDIANTE"
  }
}
```

### Usar el Token

```bash
curl -H "Authorization: Bearer TU_TOKEN_JWT" \
  http://localhost:3000/api/estudiante/mis-proyectos
```

### Ejemplos de Endpoints

**Estudiante:**

```bash
# Subir proyecto
POST /api/estudiante/proyecto/subir

# Ver mis proyectos
GET /api/estudiante/mis-proyectos

# Elegir asesor
POST /api/estudiante/proyecto/:id/elegir-asesor
```

**Coordinación:**

```bash
# Validar formato
POST /api/coordinacion/proyecto/:id/validar-formato

# Asignar jurados
POST /api/coordinacion/proyecto/:id/asignar-jurados

# Programar sustentación
POST /api/coordinacion/sustentacion/programar/:id
```

Ver documentación completa en [`BUSINESS_FLOWS.md`](BUSINESS_FLOWS.md)

---

## 📚 Documentación

| Documento                                    | Descripción                               |
| -------------------------------------------- | ----------------------------------------- |
| [`BUSINESS_FLOWS.md`](BUSINESS_FLOWS.md)     | Flujos de negocio completos con diagramas |
| [`database_diagram.md`](database_diagram.md) | Esquema de BD y relaciones                |
| [`SECURITY.md`](SECURITY.md)                 | Guía de seguridad implementada            |
| [`LOGGING.md`](LOGGING.md)                   | Sistema de logging y monitoreo            |
| [`NOTIFICATIONS.md`](NOTIFICATIONS.md)       | API de notificaciones                     |
| [`RACE_CONDITIONS.md`](RACE_CONDITIONS.md)   | Solución a condiciones de carrera         |

---

## 🔐 Seguridad

### Implementado

- ✅ **Contraseñas hasheadas** con bcrypt (salt rounds: 10)
- ✅ **Rate limiting**: 100 req/15min global, 5 login/15min
- ✅ **Headers de seguridad** con Helmet (CSP, X-Frame-Options, etc.)
- ✅ **Validación de inputs** con express-validator
- ✅ **Sanitización automática** de datos
- ✅ **Tokens JWT** con expiración
- ✅ **Transacciones de BD** con locks para evitar race conditions
- ✅ **Logging completo** de acciones sensibles

### Antes de Producción

⚠️ **CRÍTICO:**

1. Cambiar `JWT_SECRET` a un valor aleatorio de 32+ caracteres
2. Configurar `NODE_ENV=production`
3. Habilitar HTTPS
4. Configurar CORS con dominios específicos
5. Ejecutar migración de contraseñas: `npm run migrate:passwords`

Ver [`SECURITY.md`](SECURITY.md) para más detalles.

---

## 📁 Estructura del Proyecto

```
Backend/
├── config/
│   ├── database.js          # Configuración de MySQL
│   └── logger.js            # Configuración de Winston
├── controllers/
│   ├── auth.controller.js
│   ├── estudiante.controller.js
│   ├── asesore.controller.js
│   ├── jurados.controller.js
│   ├── coordinacion.controller.js
│   ├── notificacion.controller.js
│   └── sustentacion.controller.js
├── middleware/
│   ├── authMiddleware.js    # Validación JWT
│   ├── errorHandler.js      # Manejo global de errores
│   ├── validators.js        # Validaciones express-validator
│   ├── uploadProyecto.js
│   ├── uploadBorrador.js
│   └── uploadTesisFinal.js
├── routes/
│   ├── auth.routes.js
│   ├── estudiante.routes.js
│   ├── asesores.routes.js
│   ├── jurados.routes.js
│   ├── coordinacion.routes.js
│   ├── notificacion.routes.js
│   └── sustentacion.routes.js
├── utils/
│   ├── notificar.js         # Sistema de notificaciones
│   └── transaction.js       # Wrapper de transacciones
├── database/
│   └── schema.sql           # Esquema completo de BD
├── logs/                    # Logs generados automáticamente
│   ├── application-YYYY-MM-DD.log
│   ├── error-YYYY-MM-DD.log
│   ├── exceptions.log
│   └── rejections.log
├── uploads/                 # Archivos subidos
│   ├── proyectos/
│   ├── borradores/
│   ├── tesis_final/
│   ├── resoluciones/
│   └── actas/
├── templates/               # Templates HTML para PDFs
│   ├── resolucion.html
│   └── acta_sustentacion.html
├── scripts/
│   └── migrate-passwords.js # Script de migración
├── .env                     # Variables de entorno
├── .env.example             # Ejemplo de configuración
├── index.js                 # Punto de entrada
└── package.json
```

---

## 🔄 Scripts NPM

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

## 📊 Base de Datos

### Estadísticas

- **18 tablas** en total
- **7 tablas** de catálogos y usuarios
- **11 tablas** del proceso de tesis
- **3 etapas** del flujo completo

### Tablas Principales

- `usuario`, `persona`, `rol`
- `estudiante`, `docente`, `especialidad`
- `proyecto_tesis`, `tesis_borrador`, `tesis`
- `sustentacion`, `resolucion`, `acta_sustentacion`
- `notificacion`

Ver esquema completo en [`database/schema.sql`](database/schema.sql) y [`database_diagram.md`](database_diagram.md)

---

## 📝 Logging

Todos los logs se almacenan en `/logs/` con rotación diaria:

```
2025-12-28 10:30:15 [info]: 🚀 Servidor escuchando en el puerto 3000
2025-12-28 10:30:20 [info]: Login exitoso: usuario=juan, rol=ESTUDIANTE
2025-12-28 10:31:05 [warn]: Intento de login fallido para usuario inexistente: pedro
2025-12-28 10:32:10 [error]: Error al crear notificación: {"error":"id_usuario es null"}
```

Ver [`LOGGING.md`](LOGGING.md) para más detalles.

---

## 🐛 Troubleshooting

### El servidor no inicia

```bash
# Verificar que MySQL esté corriendo
# Verificar credenciales en .env
# Verificar que el puerto 3000 esté libre
```

### Errores de autenticación

```bash
# Verificar que JWT_SECRET esté configurado
# Verificar que el token no haya expirado
```

### Problemas con uploads

```bash
# Verificar que la carpeta uploads/ exista
# Verificar permisos de escritura
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 👥 Autores

- **Saí Chuquipiondo** - Desarrollo inicial

---

## 🙏 Agradecimientos

- Universidad Nacional de Ucayali
- Facultad de Ingeniería de Sistemas e Informática
- Curso: Desarrollo de Software con Seguridad en Línea (DSSL)

---

## 📞 Soporte

Para preguntas o problemas:

- 📧 Email: soporte@universidad.edu.pe
- 📚 Documentación: [BUSINESS_FLOWS.md](BUSINESS_FLOWS.md)

---

**Sistema de Gestión de Tesis** - © 2025 UNU FISeIC
