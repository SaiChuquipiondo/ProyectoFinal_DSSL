# 📘 Sistema de Gestión de Tesis (SGT) - Documentación Completa de Flujos

## Tabla de Contenidos

- [Flujo General del Sistema](#flujo-general-del-sistema)
- [Etapa 1: Proyecto de Tesis](#etapa-1-proyecto-de-tesis)
- [Etapa 2: Borrador de Tesis](#etapa-2-borrador-de-tesis)
- [Etapa 3: Tesis Final y Sustentación](#etapa-3-tesis-final-y-sustentación)
- [Flujos Secundarios](#flujos-secundarios)

---

## Flujo General del Sistema

```mermaid
graph TB
    A[Estudiante registra cuenta] --> B[Login al sistema]
    B --> C[Subir Proyecto de Tesis]
    C --> D{Etapa 1:<br/>Proyecto}
    D -->|Aprobado| E{Etapa 2:<br/>Borrador}
    E -->|Aprobado| F{Etapa 3:<br/>Sustentación}
    F --> G[Graduación]

    D -->|Observado| C
    E -->|Observado| H[Corregir Borrador]
    H --> E
    F -->|Desaprobado| I[Fin del Proceso]
```

---

## Etapa 1: Proyecto de Tesis

### Objetivo

Aprobar el proyecto de tesis a través de revisiones del asesor y jurados.

### Participantes

- **Estudiante**: Presenta y corrige el proyecto
- **Coordinación**: Valida formato, asigna asesor y jurados
- **Asesor**: Revisa y aprueba/observa el proyecto
- **Jurados** (3): Revisan y aprueban/observan el proyecto

### Diagrama de Flujo Detallado

```mermaid
sequenceDiagram
    participant E as Estudiante
    participant C as Coordinación
    participant A as Asesor
    participant J as Jurados

    E->>C: 1. Subir Proyecto (PDF)
    Note over E,C: Estado: PENDIENTE

    C->>C: 2. Validar Formato
    alt Formato Correcto
        C->>E: ✅ Formato Aprobado
        Note over E,C: Estado: REVISADO_FORMATO
    else Formato Incorrecto
        C->>E: ❌ Observado (corregir)
        Note over E,C: Estado: OBSERVADO_FORMATO
        E->>C: Resubir proyecto
    end

    E->>C: 3. Proponer Asesor
    Note over E,C: Estado Asesor: PROPUESTO

    C->>C: 4. Validar Asesor
    alt Asesor Válido
        C->>A: ✅ Asesor Asignado
        Note over E,C: Estado Asesor: APROBADO
    else Asesor Rechazado
        C->>E: ❌ Elegir otro asesor
        Note over E,C: Estado Asesor: RECHAZADO
    end

    A->>A: 5. Revisar Proyecto
    alt Aprobado por Asesor
        A->>C: ✅ Aprobado
        Note over E,C: Estado: APROBADO_ASESOR
    else Observado por Asesor
        A->>E: ❌ Observaciones
        E->>A: Corregir y reenviar
    end

    C->>J: 6. Asignar 3 Jurados
    Note over C,J: Presidente, Secretario, Vocal
    Note over E,C: Estado: ASIGNADO_JURADOS

    J->>J: 7. Revisar Proyecto
    alt Todos Aprueban
        J->>C: ✅ Aprobado (3/3)
        Note over E,C: Estado: APROBADO_FINAL
    else Alguno Observa
        J->>E: ❌ Observaciones
        Note over E,C: Estado: OBSERVADO_JURADOS
        E->>J: Corregir y reenviar
    end
```

### Estados del Proyecto

| Estado              | Descripción                           | Siguiente Acción               |
| ------------------- | ------------------------------------- | ------------------------------ |
| `PENDIENTE`         | Proyecto subido, esperando validación | Coordinación revisa formato    |
| `OBSERVADO_FORMATO` | Formato incorrecto                    | Estudiante corrige y resubmite |
| `REVISADO_FORMATO`  | Formato aprobado                      | Estudiante propone asesor      |
| `APROBADO_ASESOR`   | Asesor aprobó el proyecto             | Coordinación asigna jurados    |
| `ASIGNADO_JURADOS`  | Jurados asignados                     | Jurados revisan                |
| `OBSERVADO_JURADOS` | Uno o más jurados observaron          | Estudiante corrige             |
| `APROBADO_JURADOS`  | Todos los jurados aprobaron           | -                              |
| `APROBADO_FINAL`    | Proyecto completamente aprobado       | Pasa a Etapa 2                 |

### API Endpoints - Etapa 1

**Estudiante:**

```
POST   /api/estudiante/proyecto/subir
POST   /api/estudiante/proyecto/:id/elegir-asesor
GET    /api/estudiante/mis-proyectos
```

**Coordinación:**

```
POST   /api/coordinacion/proyecto/:id/validar-formato
POST   /api/coordinacion/proyecto/:id/validar-asesor
POST   /api/coordinacion/proyecto/:id/asignar-jurados
GET    /api/coordinacion/proyectos-pendientes
```

**Asesor:**

```
POST   /api/asesor/proyecto/:id/revisar
GET    /api/asesor/proyectos-pendientes
```

**Jurado:**

```
POST   /api/jurado/proyecto/:id/revisar
GET    /api/jurado/proyectos-pendientes
```

---

## Etapa 2: Borrador de Tesis

### Objetivo

Iterar sobre el borrador de tesis hasta obtener aprobación de asesor y jurados.

### Características

- **Múltiples iteraciones**: El borrador puede tener varias versiones
- **Revisión secuencial**: Primero coordinación, luego asesor, finalmente jurados

### Diagrama de Flujo

```mermaid
sequenceDiagram
    participant E as Estudiante
    participant C as Coordinación
    participant A as Asesor
    participant J as Jurados

    E->>C: 1. Subir Borrador v1
    Note over E,C: Estado: PENDIENTE

    C->>C: 2. Revisar Formato
    alt Formato OK
        C->>E: ✅ Formato Aprobado
        Note over E,C: Estado: APROBADO_CORD
    else Formato Incorrecto
        C->>E: ❌ Observaciones
        Note over E,C: Estado: OBSERVADO
        E->>C: Subir Borrador v2
    end

    A->>A: 3. Revisar Borrador
    alt Asesor Aprueba
        A->>C: ✅ Aprobado
        Note over E,C: Estado: APROBADO_ASESOR
    else Asesor Observa
        A->>E: ❌ Observaciones
        E->>A: Subir nueva versión
    end

    J->>J: 4. Revisar Borrador
    alt Todos Aprueban
        J->>C: ✅ Aprobado (3/3)
        Note over E,C: Estado: APROBADO_JURADOS
        Note over E: ✅ Puede subir Tesis Final
    else Alguno Observa
        J->>E: ❌ Observaciones
        E->>J: Subir nueva versión
    end
```

### Estados del Borrador

| Estado             | Descripción                             |
| ------------------ | --------------------------------------- |
| `PENDIENTE`        | Borrador subido, esperando coordinación |
| `OBSERVADO`        | Coordinación observó el formato         |
| `APROBADO_CORD`    | Coordinación aprobó, espera asesor      |
| `APROBADO_ASESOR`  | Asesor aprobó, espera jurados           |
| `APROBADO_JURADOS` | Todos aprobaron, listo para tesis final |

### Versionamiento

Cada borrador tiene un `numero_iteracion`:

- v1, v2, v3... hasta que sea aprobado
- Se mantiene historial completo de todas las versiones

### API Endpoints - Etapa 2

**Estudiante:**

```
POST   /api/estudiante/borrador/subir
GET    /api/estudiante/mis-borradores
```

**Coordinación:**

```
POST   /api/coordinacion/borrador/:id/revisar-formato
GET    /api/coordinacion/borradores-pendientes
```

**Asesor:**

```
POST   /api/asesor/borrador/:id/revisar
GET    /api/asesor/borradores-pendientes
```

**Jurado:**

```
POST   /api/jurado/borrador/:id/revisar
GET    /api/jurado/borradores-pendientes
```

---

## Etapa 3: Tesis Final y Sustentación

### Objetivo

Completar el proceso de titulación mediante la sustentación exitosa.

### Diagrama de Flujo Completo

```mermaid
stateDiagram-v2
    [*] --> TesisFinal: Borrador Aprobado
    TesisFinal --> Programada: Coordinación programa
    Programada --> ResolucionGenerada: Generar resolución
    ResolucionGenerada --> Sustentada: Realizar sustentación
    Sustentada --> ResultadoRegistrado: Registrar nota/dictamen

    ResultadoRegistrado --> Aprobado: dictamen=APROBADO
    ResultadoRegistrado --> Desaprobado: dictamen=DESAPROBADO

    Aprobado --> ActaGenerada: Generar acta
    ActaGenerada --> [*]: Proceso Completo

    Desaprobado --> [*]: Fin del Proceso
```

### Proceso Detallado

#### 3.1 Subir Tesis Final

**Responsable:** Estudiante  
**Prerequisito:** Borrador aprobado por todos

```javascript
POST /api/estudiante/tesis-final/subir
Body: { id_proyecto, archivo: PDF }
```

**Resultado:** Tesis final registrada en base de datos

---

#### 3.2 Programar Sustentación

**Responsable:** Coordinación  
**Prerequisitos:**

- Tesis final subida
- Asesor asignado
- 3 jurados asignados

```javascript
POST /api/coordinacion/sustentacion/programar/:id_proyecto
Body: {
  fecha_hora: "2026-01-15T10:00:00",
  modalidad: "PRESENCIAL | VIRTUAL",
  lugar: "Auditorio Principal"
}
```

**Estado:** `PROGRAMADA`

**Notificaciones enviadas a:**

- ✉️ Estudiante
- ✉️ Asesor
- ✉️ 3 Jurados

---

#### 3.3 Generar Resolución

**Responsable:** Coordinación  
**Prerequisito:** Sustentación programada

```javascript
POST /api/sustentacion/generar-resolucion/:id_proyecto
```

**Proceso:**

1. Genera número único: `XXX-YYYY-FISeIC-UNU`
2. Crea PDF con datos del proyecto
3. Guarda en `/uploads/resoluciones/`
4. Notifica al estudiante

**Número de Resolución:**

- Formato: `001-2025-FISeIC-UNU`
- Correlativo anual
- **Protección contra duplicados** con `SELECT FOR UPDATE`

---

#### 3.4 Realizar Sustentación

**Responsables:** Estudiante + Asesor + Jurados  
**Fecha/Hora:** Según programación

**Evaluación:**

- Presidente del jurado conduce
- Secretario toma acta
- Vocal participa en evaluación
- Nota: 0-20
- Dictamen: APROBADO / DESAPROBADO

---

#### 3.5 Registrar Resultado

**Responsable:** Coordinación (después de la sustentación)

```javascript
POST /api/sustentacion/registrar-resultado/:id_sustentacion
Body: {
  nota: 18,
  dictamen: "APROBADO",
  observaciones: "Excelente trabajo"
}
```

**Estado:** `SUSTENTADA`

**Si APROBADO:** Continúa a generar acta  
**Si DESAPROBADO:** Fin del proceso

---

#### 3.6 Generar Acta

**Responsable:** Coordinación  
**Prerequisito:** Resultado registrado con dictamen=APROBADO

```javascript
POST /api/sustentacion/generar-acta/:id_sustentacion
```

**Proceso:**

1. Genera número único: `XXX-YYYY-FISeIC`
2. Crea PDF con todos los datos
3. Guarda en `/uploads/actas/`
4. Notifica a todos los participantes

**Número de Acta:**

- Formato: `001-2025-FISeIC`
- Correlativo anual
- **Protección contra duplicados** con `SELECT FOR UPDATE`

---

### Modalidades de Sustentación

| Modalidad    | Lugar                   | Requerimientos                |
| ------------ | ----------------------- | ----------------------------- |
| `PRESENCIAL` | Auditorio universitario | Jurados presentes físicamente |
| `VIRTUAL`    | Plataforma online       | Link de reunión requerido     |

### API Endpoints - Etapa 3

**Estudiante:**

```
POST   /api/estudiante/tesis-final/subir
GET    /api/estudiante/mis-resoluciones
GET    /api/estudiante/mi-acta
```

**Coordinación:**

```
POST   /api/coordinacion/sustentacion/programar/:id_proyecto
POST   /api/sustentacion/registrar-resultado/:id_sustentacion
POST   /api/sustentacion/generar-resolucion/:id_proyecto
POST   /api/sustentacion/generar-acta/:id_sustentacion
GET    /api/coordinacion/sustentaciones-programadas
```

**Descarga de Documentos:**

```
GET    /api/sustentacion/resolucion/:id_resolucion/descargar
GET    /api/sustentacion/acta/:id_acta/descargar
```

---

## Flujos Secundarios

### Notificaciones

Cada acción importante genera notificaciones automáticas:

```mermaid
graph LR
    A[Acción del Sistema] --> B[notificar utility]
    B --> C[Insertar en BD]
    B --> D[Logger registra]
    B --> E[TODO: WebSocket]

    C --> F[Usuario ve en UI]
    E -.-> F
```

**Ejemplos de notificaciones:**

- Proyecto aprobado por asesor
- Jurados asignados
- Borrador observado
- Sustentación programada
- Resolución generada
- Acta lista para descarga

### Sistema de Revisiones

Todas las revisiones siguen el mismo patrón:

```javascript
{
  estado: "APROBADO" | "OBSERVADO",
  observaciones: "Texto con comentarios",
  fecha_revision: timestamp
}
```

**Tablas de revisiones:**

- `revision_proyecto_asesor`
- `revision_proyecto_jurado`
- `revision_borrador_asesor`
- `revision_borrador_jurado`

---

## Resumen de Estados Globales

### Proyecto de Tesis

```
PENDIENTE → OBSERVADO_FORMATO → REVISADO_FORMATO →
APROBADO_ASESOR → ASIGNADO_JURADOS → OBSERVADO_JURADOS →
APROBADO_JURADOS → APROBADO_FINAL
```

### Borrador de Tesis

```
PENDIENTE → OBSERVADO → APROBADO_CORD →
APROBADO_ASESOR → APROBADO_JURADOS
```

### Sustentación

```
PROGRAMADA → SUSTENTADA → (APROBADO/DESAPROBADO)
```

### Tesis Final

```
PENDIENTE → SUSTENTADA → GRADUADO
```

---

## Tiempos Estimados por Etapa

| Etapa                 | Tiempo Mínimo | Tiempo Promedio |
| --------------------- | ------------- | --------------- |
| Etapa 1: Proyecto     | 2 semanas     | 1-2 meses       |
| Etapa 2: Borrador     | 1 mes         | 3-6 meses       |
| Etapa 3: Sustentación | 2 semanas     | 1 mes           |
| **Total**             | **2 meses**   | **5-9 meses**   |

---

## Diagrama Completo del Sistema

```mermaid
graph TD
    subgraph "ETAPA 1: PROYECTO"
        A1[Subir Proyecto] --> A2[Validar Formato]
        A2 --> A3[Asignar Asesor]
        A3 --> A4[Revisión Asesor]
        A4 --> A5[Asignar Jurados]
        A5 --> A6[Revisión Jurados]
        A6 --> A7[Proyecto Aprobado]
    end

    subgraph "ETAPA 2: BORRADOR"
        B1[Subir Borrador] --> B2[Revisión Coord]
        B2 --> B3[Revisión Asesor]
        B3 --> B4[Revisión Jurados]
        B4 --> B5[Borrador Aprobado]
    end

    subgraph "ETAPA 3: SUSTENTACIÓN"
        C1[Subir Tesis Final] --> C2[Programar Sustentación]
        C2 --> C3[Generar Resolución]
        C3 --> C4[Realizar Sustentación]
        C4 --> C5[Registrar Resultado]
        C5 --> C6[Generar Acta]
        C6 --> C7[Graduación]
    end

    A7 --> B1
    B5 --> C1
```

---

Para más detalles técnicos:

- **Base de Datos:** Ver `database_diagram.md`
- **Seguridad:** Ver `SECURITY.md`
- **Logging:** Ver `LOGGING.md`
- **Notificaciones:** Ver `NOTIFICATIONS.md`
- **Race Conditions:** Ver `RACE_CONDITIONS.md`
