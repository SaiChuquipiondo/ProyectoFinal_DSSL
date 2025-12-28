# 📊 Logging y Manejo de Errores - Guía Técnica

## Winston Logger - Configuración

### Niveles de Log

El sistema utiliza 5 niveles de logging:

| Nivel   | Propósito           | Ejemplo                                   |
| ------- | ------------------- | ----------------------------------------- |
| `error` | Errores críticos    | Fallas de BD, excepciones                 |
| `warn`  | Advertencias        | Login fallido, recursos no encontrados    |
| `info`  | Información general | Inicio del servidor, operaciones exitosas |
| `http`  | Requests HTTP       | Logs de Morgan                            |
| `debug` | Debugging           | Queries, transacciones                    |

### Archivos de Log

Los logs se almacenan en `./logs/` con rotación diaria:

```
logs/
├── application-2025-12-28.log    # Todos los logs (info+)
├── error-2025-12-28.log           # Solo errores
├── exceptions.log                 # Excepciones no capturadas
└── rejections.log                 # Promesas rechazadas
```

**Rotación:**

- Archivos nuevos cada día
- application-\*.log: Retención de 14 días (máx 20MB por archivo)
- error-\*.log: Retención de 30 días (máx 20MB por archivo)

### Uso en Código

```javascript
const logger = require("./config/logger");

// Logs básicos
logger.error("Error crítico", { error: err.message });
logger.warn("Advertencia de seguridad");
logger.info("Operación completada");
logger.debug("Query ejecutado", { sql: query });

// Con metadatos
logger.info("Usuario autenticado", {
  username: "juan",
  rol: "ESTUDIANTE",
  ip: req.ip,
});
```

---

## Clases de Error Personalizadas

### AppError (Error Base)

```javascript
const { AppError } = require("./middleware/errorHandler");

throw new AppError("Mensaje de error", 400, true);
// isOperational = true indica error esperado
```

### ValidationError (400)

```javascript
const { ValidationError } = require("./middleware/errorHandler");

if (!data.email) {
  throw new ValidationError("Email es obligatorio");
}
```

### AuthenticationError (401)

```javascript
const { AuthenticationError } = require("./middleware/errorHandler");

if (!token) {
  throw new AuthenticationError("Token requerido");
}
```

### AuthorizationError (403)

```javascript
const { AuthorizationError } = require("./middleware/errorHandler");

if (user.rol !== "COORDINACION") {
  throw new AuthorizationError("Rol insuficiente");
}
```

### NotFoundError (404)

```javascript
const { NotFoundError } = require("./middleware/errorHandler");

if (!proyecto) {
  throw new NotFoundError("Proyecto");
}
```

### ConflictError (409)

```javascript
const { ConflictError } = require("./middleware/errorHandler");

throw new ConflictError("El usuario ya existe");
```

### DatabaseError (500)

```javascript
const { DatabaseError } = require("./middleware/errorHandler");

throw new DatabaseError("Error en consulta");
```

---

## Async Error Handler

Wrapper automático para capturarerores en funciones async:

```javascript
const { asyncHandler } = require("./middleware/errorHandler");

// En routes
router.post(
  "/proyecto",
  asyncHandler(async (req, res) => {
    const proyecto = await crearProyecto(req.body);
    res.json(proyecto);

    // Cualquier error se captura automáticamente
    // No necesitas try-catch
  })
);
```

---

## Transacciones de Base de Datos

Uso del wrapper de transacciones:

```javascript
const { withTransaction } = require("./utils/transaction");
const pool = require("./config/database");

// Ejemplo: Asignar jurados con transacción
const result = await withTransaction(pool, async (connection) => {
  // Todas estas operaciones son atómicas
  await connection.query(
    "UPDATE proyecto_tesis SET estado_proyecto = ? WHERE id_proyecto = ?",
    ["ASIGNADO_JURADOS", id_proyecto]
  );

  await connection.query(
    "INSERT INTO proyecto_jurado (id_proyecto, id_jurado, rol_jurado) VALUES (?, ?, ?)",
    [id_proyecto, id_jurado_1, "PRESIDENTE"]
  );

  await connection.query(
    "INSERT INTO proyecto_jurado (id_proyecto, id_jurado, rol_jurado) VALUES (?, ?, ?)",
    [id_proyecto, id_jurado_2, "SECRETARIO"]
  );

  await connection.query(
    "INSERT INTO proyecto_jurado (id_proyecto, id_jurado, rol_jurado) VALUES (?, ?, ?)",
    [id_proyecto, id_jurado_3, "VOCAL"]
  );

  // Si cualquier query falla, TODAS se revierten automáticamente
  return { success: true };
});
```

**Características:**

- ✅ Auto-commit si todo es exitoso
- ✅ Auto-rollback en caso de error
- ✅ Liberación automática de conexión
- ✅ Logging de transacciones

---

## Logging HTTP con Morgan

Morgan está integrado con Winston para capturar todos los requests HTTP:

```
2025-12-28 09:30:45 [http]: POST /api/auth/login 200 45ms
2025-12-28 09:30:50 [http]: GET /api/estudiante/mis-resoluciones 200 12ms
2025-12-28 09:31:00 [http]: POST /api/coordinacion/proyecto/validar-asesor/1 403 5ms
```

**Formato:**

- **Desarrollo:** `dev` (colorizado, legible)
- **Producción:** `combined` (Apache combined log format)

---

## Ejemplos de Uso Completos

### Ejemplo 1: Controller con Logging y Errores

```javascript
const logger = require("../config/logger");
const {
  asyncHandler,
  NotFoundError,
  ValidationError,
} = require("../middleware/errorHandler");
const { withTransaction } = require("../utils/transaction");
const pool = require("../config/database");

const asignarJurados = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const { id_jurado_1, id_jurado_2, id_jurado_3 } = req.body;

  logger.info(`Asignando jurados al proyecto ${id_proyecto}`);

  // Validar que el proyecto existe
  const [rows] = await pool.query(
    "SELECT * FROM proyecto_tesis WHERE id_proyecto = ?",
    [id_proyecto]
  );

  if (rows.length === 0) {
    throw new NotFoundError("Proyecto");
  }

  // Validar que los jurados sean diferentes
  if (
    id_jurado_1 === id_jurado_2 ||
    id_jurado_2 === id_jurado_3 ||
    id_jurado_1 === id_jurado_3
  ) {
    throw new ValidationError("Los jurados deben ser diferentes");
  }

  // Usar transacción
  await withTransaction(pool, async (connection) => {
    await connection.query(
      "UPDATE proyecto_tesis SET estado_proyecto = ? WHERE id_proyecto = ?",
      ["ASIGNADO_JURADOS", id_proyecto]
    );

    const jurados = [
      [id_proyecto, id_jurado_1, "PRESIDENTE"],
      [id_proyecto, id_jurado_2, "SECRETARIO"],
      [id_proyecto, id_jurado_3, "VOCAL"],
    ];

    for (const [pid, jid, rol] of jurados) {
      await connection.query(
        "INSERT INTO proyecto_jurado (id_proyecto, id_jurado, rol_jurado) VALUES (?, ?, ?)",
        [pid, jid, rol]
      );
    }
  });

  logger.info(`Jurados asignados exitosamente al proyecto ${id_proyecto}`);

  res.json({
    success: true,
    message: "Jurados asignados correctamente",
  });
});

module.exports = { asignarJurados };
```

### Ejemplo 2: Ruta con AsyncHandler

```javascript
const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");
const { asignarJurados } = require("../controllers/coordinacion.controller");
const { validateAsignarJurados } = require("../middleware/validators");

router.post(
  "/proyecto/asignar-jurados/:id_proyecto",
  auth,
  validateAsignarJurados,
  asyncHandler(asignarJurados)
);

module.exports = router;
```

---

## Estructura de Respuestas de Error

### Error Operacional (Esperado)

```json
{
  "success": false,
  "error": {
    "message": "Proyecto no encontrado"
  }
}
```

### Error en Desarrollo

```json
{
  "success": false,
  "error": {
    "message": "Error en la base de datos",
    "stack": "Error: ... at ...",
    "details": { ... }
  }
}
```

---

## Monitoreo de Logs

### Ver logs en tiempo real

```bash
# Todos los logs
tail -f logs/application-2025-12-28.log

# Solo errores
tail -f logs/error-2025-12-28.log

# Filtrar por nivel
grep "error" logs/application-2025-12-28.log
```

### Búsqueda de errores

```bash
# Buscar errores de login
grep "login" logs/error-2025-12-28.log

# Buscar por usuario
grep "username=juan" logs/application-2025-12-28.log
```

---

## Best Practices

1. **Siempre usar logger** en lugar de console.log
2. **Usar asyncHandler** en routes para capturar errores automáticamente
3. **Usar transacciones** para operaciones de múltiples tablas
4. **Usar clases de error** apropiadas para contexto claro
5. **Incluir metadatos** útiles en logs (username, IP, IDs)
6. **No logear datos sensibles** (contraseñas, tokens completos)
7. **Usar nivel apropiado**: error > warn > info > debug

---

## Integración con Monitoreo

Para producción, considera integrar:

- **Sentry**: Tracking de errores en tiempo real
- **LogStash**: Agregación de logs
- **Grafana**: Visualización de métricas
- **Prometheus**: Métricas de aplicación

---

Esta configuración proporciona observabilidad completa del sistema para debugging y monitoreo en producción.
