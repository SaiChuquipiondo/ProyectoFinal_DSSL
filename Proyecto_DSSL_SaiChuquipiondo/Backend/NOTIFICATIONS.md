# 🔔 Sistema de Notificaciones Mejorado

## Mejoras Implementadas

### ✅ Antes vs Después

| Característica               | Antes             | Después                     |
| ---------------------------- | ----------------- | --------------------------- |
| **Manejo de errores**        | ❌ No             | ✅ Try-catch con logging    |
| **Logging**                  | ❌ No             | ✅ Winston logger integrado |
| **Validación**               | ❌ No             | ✅ Validación de inputs     |
| **Funciones helper**         | ❌ Solo 1 función | ✅ 6 funciones completas    |
| **Notificaciones múltiples** | ❌ No             | ✅ notificarMultiples()     |
| **Marcar como leída**        | ⚠️ En controller  | ✅ En utility               |
| **Contar no leídas**         | ❌ No             | ✅ contarNoLeidas()         |
| **Retorno de ID**            | ❌ No             | ✅ Retorna id_notificacion  |

---

## API de Notificaciones

### Funciones Disponibles

#### 1. `notificar(id_usuario, titulo, mensaje, tipo)`

Crea una notificación para un usuario.

**Parámetros:**

- `id_usuario` (number): ID del usuario destinatario
- `titulo` (string): Título de la notificación
- `mensaje` (string): Contenido del mensaje
- `tipo` (string, opcional): "INFO", "SUCCESS", "WARNING", "ERROR" (default: "INFO")

**Retorna:** `Promise<number>` - ID de la notificación creada (o null si error)

**Ejemplo:**

```javascript
const { notificar } = require("./utils/notificar");

const id = await notificar(
  12,
  "Proyecto aprobado",
  "Tu proyecto de tesis ha sido aprobado por el asesor",
  "SUCCESS"
);
```

**Características:**

- ✅ Manejo de errores sin romper flujo principal
- ✅ Logging automático
- ✅ Validación de inputs
- ✅ Preparado para WebSockets (comentado como TODO)

---

#### 2. `notificarMultiples(ids_usuarios, titulo, mensaje)`

Envía la misma notificación a múltiples usuarios.

**Parámetros:**

- `ids_usuarios` (Array<number>): Array de IDs de usuarios
- `titulo` (string): Título
- `mensaje` (string): Mensaje

**Retorna:** `Promise<Array<number>>` - Array de IDs de notificaciones creadas

**Ejemplo:**

```javascript
// Notificar a todos los jurados
const idsJurados = [5, 8, 12];
await notificarMultiples(
  idsJurados,
  "Nueva sustentación programada",
  "Se ha programado una sustentación para el 15/01/2026"
);
```

---

#### 3. `marcarComoLeida(id_notificacion, id_usuario)`

Marca una notificación específica como leída.

**Parámetros:**

- `id_notificacion` (number): ID de la notificación
- `id_usuario` (number): ID del usuario (para validación de permisos)

**Retorna:** `Promise<boolean>` - true si se marcó exitosamente

**Ejemplo:**

```javascript
const marcada = await marcarComoLeida(45, 12);
if (marcada) {
  console.log("Notificación marcada como leída");
}
```

---

#### 4. `marcarTodasComoLeidas(id_usuario)`

Marca todas las notificaciones pendientes de un usuario como leídas.

**Parámetros:**

- `id_usuario` (number): ID del usuario

**Retorna:** `Promise<number>` - Cantidad de notificaciones marcadas

**Ejemplo:**

```javascript
const cantidad = await marcarTodasComoLeidas(12);
console.log(`${cantidad} notificaciones marcadas`);
```

---

#### 5. `obtenerNotificaciones(id_usuario, solo_no_leidas, limit)`

Obtiene las notificaciones de un usuario.

**Parámetros:**

- `id_usuario` (number): ID del usuario
- `solo_no_leidas` (boolean, opcional): Si true, solo retorna no leídas (default: false)
- `limit` (number, opcional): Límite de resultados (default: 50)

**Retorna:** `Promise<Array>` - Array de notificaciones

**Ejemplo:**

```javascript
// Obtener solo no leídas (últimas 20)
const notificaciones = await obtenerNotificaciones(12, true, 20);

// Obtener todas (últimas 50)
const todas = await obtenerNotificaciones(12);
```

---

#### 6. `contarNoLeidas(id_usuario)`

Cuenta las notificaciones no leídas de un usuario.

**Parámetros:**

- `id_usuario` (number): ID del usuario

**Retorna:** `Promise<number>` - Cantidad de notificaciones no leídas

**Ejemplo:**

```javascript
const badge = await contarNoLeidas(12);
// Mostrar badge en UI: { badge }
```

---

## Endpoints HTTP

### GET `/api/notificaciones`

Obtiene las notificaciones del usuario autenticado.

**Query Params:**

- `solo_no_leidas` (boolean): true/false
- `limit` (number): cantidad máxima a retornar

**Respuesta:**

```json
{
  "success": true,
  "notificaciones": [
    {
      "id_notificacion": 123,
      "titulo": "Proyecto aprobado",
      "mensaje": "Tu proyecto ha sido aprobado",
      "leida": false,
      "fecha_creacion": "2025-12-28T14:30:00"
    }
  ],
  "total": 15
}
```

---

### GET `/api/notificaciones/no-leidas/contar`

Obtiene el contador de notificaciones no leídas.

**Respuesta:**

```json
{
  "success": true,
  "no_leidas": 5
}
```

---

### PUT `/api/notificaciones/:id_notificacion/marcar-leida`

Marca una notificación como leída.

**Respuesta:**

```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

---

### PUT `/api/notificaciones/marcar-todas-leidas`

Marca todas las notificaciones del usuario como leídas.

**Respuesta:**

```json
{
  "success": true,
  "message": "15 notificación(es) marcada(s) como leída(s)",
  "cantidad": 15
}
```

---

## Logging

Todas las operaciones se registran en logs:

```
2025-12-28 14:30:15 [info]: Notificación creada: Proyecto aprobado {"id_notificacion":123,"id_usuario":12}
2025-12-28 14:31:20 [info]: Notificaciones masivas: 3/3
2025-12-28 14:32:10 [error]: Error al crear notificación: {"error":"id_usuario es null"}
```

---

## Migración de Código Existente

### Antes

```javascript
// Código antiguo
await notificar(id_usuario, mensaje);
```

### Después

```javascript
// Nuevo código (compatible hacia atrás si usas el orden correcto)
await notificar(id_usuario, "Título", mensaje);

// O explícitamente
await notificar(id_usuario, "Título", "Mensaje", "SUCCESS");
```

**⚠️ IMPORTANTE:** El orden de parámetros cambió:

- Antes: `(id_usuario, mensaje)`
- Ahora: `(id_usuario, titulo, mensaje, tipo?)`

---

## Preparación para Tiempo Real (WebSockets/SSE)

El código está preparado para agregar notificaciones en tiempo real:

```javascript
// En notificar.js (línea 39 - actualmente comentado)
// TODO: WebSocket/SSE para tiempo real
// emitirNotificacionTiempoReal(id_usuario, { id_notificacion, titulo, mensaje });
```

### Implementación Futura con Socket.io

```javascript
// 1. Instalar: npm install socket.io

// 2. En index.js
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });

// Conectar clientes
io.on("connection", (socket) => {
  socket.on("register", (id_usuario) => {
    socket.join(`user_${id_usuario}`);
  });
});

// 3. En utils/notificar.js
const emitirNotificacionTiempoReal = (id_usuario, notificacion) => {
  const io = require("../index").io;
  io.to(`user_${id_usuario}`).emit("nueva_notificacion", notificacion);
};

// 4. Descomentar línea 39 en notificar.js
```

### Implementación con SSE (Server-Sent Events)

```javascript
// GET /api/notificaciones/stream
const notificacionesSSE = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const id_usuario = req.user.id_usuario;

  // Enviar notificaciones cuando se crean
  const interval = setInterval(async () => {
    const count = await contarNoLeidas(id_usuario);
    res.write(`data: ${JSON.stringify({ no_leidas: count })}\n\n`);
  }, 5000); // Cada 5 segundos

  req.on("close", () => {
    clearInterval(interval);
  });
};
```

---

## Pruebas

### Probar Endpoint

```bash
# Obtener notificaciones (requiere token)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/notificaciones

# Solo no leídas
curl -H "Authorization: Bearer TOKEN" "http://localhost:3000/api/notificaciones?solo_no_leidas=true&limit=10"

# Contar no leídas
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/notificaciones/no-leidas/contar

# Marcar como leída
curl -X PUT -H "Authorization: Bearer TOKEN" http://localhost:3000/api/notificaciones/123/marcar-leida

# Marcar todas como leídas
curl -X PUT -H "Authorization: Bearer TOKEN" http://localhost:3000/api/notificaciones/marcar-todas-leidas
```

---

## ✅ Resumen de Mejoras

| Mejora                 | Implementado        |
| ---------------------- | ------------------- |
| **Manejo de errores**  | ✅ Sí               |
| **Logging completo**   | ✅ Sí               |
| **Múltiples usuarios** | ✅ Sí               |
| **Marcar leída/s**     | ✅ Sí               |
| **Contar no leídas**   | ✅ Sí               |
| **API REST completa**  | ✅ Sí               |
| **Validación inputs**  | ✅ Sí               |
| **WebSockets/SSE**     | ⏳ Preparado (TODO) |

**El sistema de notificaciones ahora es robusto, escalable y está listo para tiempo real.** 🎉
