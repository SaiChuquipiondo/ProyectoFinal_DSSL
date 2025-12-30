-- ========================================
-- SCRIPT DE LIMPIEZA PARA PRUEBAS
-- Base de datos: sgt
-- ========================================

SET FOREIGN_KEY_CHECKS = 0;

-- ====================
-- TABLAS DE NOTIFICACIONES
-- ====================
TRUNCATE TABLE notificacion;

-- ====================
-- TABLAS DE SUSTENTACIÓN (orden de dependencias)
-- ====================
TRUNCATE TABLE acta_sustentacion;
TRUNCATE TABLE sustentacion;

-- ====================
-- TABLAS DE REVISIONES
-- ====================
TRUNCATE TABLE revision_proyecto_asesor;
TRUNCATE TABLE revision_proyecto_jurado;
TRUNCATE TABLE revision_borrador_asesor;
TRUNCATE TABLE revision_borrador_jurado;

-- ====================
-- TABLAS DE JURADOS
-- ====================
TRUNCATE TABLE proyecto_jurado;

-- ====================
-- TABLAS DE DOCUMENTOS
-- ====================
TRUNCATE TABLE resolucion;
TRUNCATE TABLE tesis;
TRUNCATE TABLE tesis_borrador;

-- ====================
-- TABLA PRINCIPAL DE PROYECTOS
-- ====================
TRUNCATE TABLE proyecto_tesis;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================
-- VERIFICACIÓN
-- ====================
SELECT 
    'Limpieza completada exitosamente' AS mensaje,
    NOW() AS fecha_hora;

-- Verificar conteo de registros en tablas críticas
SELECT 
    'notificacion' AS tabla, 
    COUNT(*) AS registros 
FROM notificacion

UNION ALL

SELECT 
    'proyecto_tesis', 
    COUNT(*) 
FROM proyecto_tesis

UNION ALL

SELECT 
    'tesis_borrador', 
    COUNT(*) 
FROM tesis_borrador

UNION ALL

SELECT 
    'revision_proyecto_asesor', 
    COUNT(*) 
FROM revision_proyecto_asesor;

-- ====================
-- INFORMACIÓN DE USUARIOS DE PRUEBA
-- ====================
SELECT 
    u.id_usuario,
    u.username,
    r.nombre AS rol,
    CONCAT(p.nombres, ' ', p.apellido_paterno) AS nombre_completo
FROM usuario u
JOIN persona p ON u.id_persona = p.id_persona
JOIN rol r ON u.id_rol = r.id_rol
WHERE u.username IN ('saichuquipiondo', 'coordinacion', 'augurto')
ORDER BY r.id_rol;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
