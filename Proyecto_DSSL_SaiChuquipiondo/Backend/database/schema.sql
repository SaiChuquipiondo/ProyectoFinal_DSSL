CREATE DATABASE  IF NOT EXISTS `sgt` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sgt`;

-- =====================================================
-- TABLA: persona
-- Almacena información personal de todas las personas
-- =====================================================
CREATE TABLE `persona` (
  `id_persona` int NOT NULL AUTO_INCREMENT,
  `tipo_documento` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_documento` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apellido_paterno` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apellido_materno` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombres` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `sexo` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_persona`),
  UNIQUE KEY `numero_documento` (`numero_documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: rol
-- Define los roles del sistema
-- =====================================================
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: usuario
-- Usuarios del sistema con credenciales
-- =====================================================
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `id_persona` int NOT NULL,
  `id_rol` int NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`),
  KEY `id_persona` (`id_persona`),
  KEY `id_rol` (`id_rol`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`),
  CONSTRAINT `usuario_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: estudiante
-- Información específica de estudiantes
-- =====================================================
CREATE TABLE `estudiante` (
  `id_estudiante` int NOT NULL AUTO_INCREMENT,
  `id_persona` int NOT NULL,
  `codigo_estudiante` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_egreso` date DEFAULT NULL,
  `escuela_profesional` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_estudiante`),
  UNIQUE KEY `codigo_estudiante` (`codigo_estudiante`),
  KEY `id_persona` (`id_persona`),
  CONSTRAINT `estudiante_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: especialidad
-- Áreas de especialización académica
-- =====================================================
CREATE TABLE `especialidad` (
  `id_especialidad` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_especialidad`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: docente
-- Información específica de docentes
-- =====================================================
CREATE TABLE `docente` (
  `id_docente` int NOT NULL AUTO_INCREMENT,
  `id_persona` int NOT NULL,
  `categoria` enum('NOMBRADO','CONTRATADO') COLLATE utf8mb4_unicode_ci DEFAULT 'CONTRATADO',
  `grado_academico` enum('BACHILLER','MAGISTER','DOCTOR') COLLATE utf8mb4_unicode_ci DEFAULT 'MAGISTER',
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_docente`),
  KEY `id_persona` (`id_persona`),
  CONSTRAINT `docente_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: docente_especialidad
-- Relación muchos a muchos entre docentes y especialidades
-- =====================================================
CREATE TABLE `docente_especialidad` (
  `id_docente` int NOT NULL,
  `id_especialidad` int NOT NULL,
  PRIMARY KEY (`id_docente`,`id_especialidad`),
  KEY `id_especialidad` (`id_especialidad`),
  CONSTRAINT `docente_especialidad_ibfk_1` FOREIGN KEY (`id_docente`) REFERENCES `docente` (`id_docente`),
  CONSTRAINT `docente_especialidad_ibfk_2` FOREIGN KEY (`id_especialidad`) REFERENCES `especialidad` (`id_especialidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: proyecto_tesis
-- Proyectos de tesis presentados por estudiantes
-- =====================================================
CREATE TABLE `proyecto_tesis` (
  `id_proyecto` int NOT NULL AUTO_INCREMENT,
  `id_estudiante` int NOT NULL,
  `id_especialidad` int NOT NULL,
  `id_asesor` int DEFAULT NULL,
  `estado_asesor` enum('SIN_ASESOR','PROPUESTO','APROBADO','RECHAZADO') COLLATE utf8mb4_unicode_ci DEFAULT 'SIN_ASESOR',
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resumen` text COLLATE utf8mb4_unicode_ci,
  `ruta_pdf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `iteracion` int DEFAULT '1',
  `estado_proyecto` enum('PENDIENTE','OBSERVADO_FORMATO','REVISADO_FORMATO','OBSERVADO_ASESOR','APROBADO_ASESOR','ASIGNADO_JURADOS','OBSERVADO_JURADOS','APROBADO_JURADOS','APROBADO_FINAL') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDIENTE',
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_proyecto`),
  KEY `id_estudiante` (`id_estudiante`),
  KEY `id_especialidad` (`id_especialidad`),
  CONSTRAINT `proyecto_tesis_ibfk_1` FOREIGN KEY (`id_estudiante`) REFERENCES `estudiante` (`id_estudiante`),
  CONSTRAINT `proyecto_tesis_ibfk_2` FOREIGN KEY (`id_especialidad`) REFERENCES `especialidad` (`id_especialidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: proyecto_jurado
-- Asignación de jurados a proyectos
-- =====================================================
CREATE TABLE `proyecto_jurado` (
  `id_proyecto` int NOT NULL,
  `id_jurado` int NOT NULL,
  `rol_jurado` enum('PRESIDENTE','SECRETARIO','VOCAL') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_proyecto`,`id_jurado`),
  KEY `id_jurado` (`id_jurado`),
  CONSTRAINT `proyecto_jurado_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyecto_tesis` (`id_proyecto`),
  CONSTRAINT `proyecto_jurado_ibfk_2` FOREIGN KEY (`id_jurado`) REFERENCES `docente` (`id_docente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: revision_proyecto_asesor
-- Revisiones del asesor sobre proyectos
-- =====================================================
CREATE TABLE `revision_proyecto_asesor` (
  `id_revision` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `id_asesor` int NOT NULL,
  `estado_revision` enum('APROBADO','OBSERVADO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `comentarios` text COLLATE utf8mb4_unicode_ci,
  `fecha_revision` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_revision`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_asesor` (`id_asesor`),
  CONSTRAINT `revision_proyecto_asesor_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyecto_tesis` (`id_proyecto`),
  CONSTRAINT `revision_proyecto_asesor_ibfk_2` FOREIGN KEY (`id_asesor`) REFERENCES `docente` (`id_docente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: revision_proyecto_jurado
-- Revisiones de jurados sobre proyectos
-- =====================================================
CREATE TABLE `revision_proyecto_jurado` (
  `id_revision` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `id_jurado` int NOT NULL,
  `estado_revision` enum('APROBADO','OBSERVADO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `comentarios` text COLLATE utf8mb4_unicode_ci,
  `ruta_pdf` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_revision` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_revision`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_jurado` (`id_jurado`),
  CONSTRAINT `revision_proyecto_jurado_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyecto_tesis` (`id_proyecto`),
  CONSTRAINT `revision_proyecto_jurado_ibfk_2` FOREIGN KEY (`id_jurado`) REFERENCES `docente` (`id_docente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: tesis_borrador
-- Borradores de tesis subidos por estudiantes
-- =====================================================
CREATE TABLE `tesis_borrador` (
  `id_borrador` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `numero_iteracion` int NOT NULL DEFAULT '1',
  `ruta_pdf` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('PENDIENTE','OBSERVADO','APROBADO_CORD','APROBADO_ASESOR','APROBADO_JURADOS') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDIENTE',
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_borrador`),
  KEY `id_proyecto` (`id_proyecto`),
  CONSTRAINT `tesis_borrador_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyecto_tesis` (`id_proyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: revision_borrador_asesor
-- Revisiones del asesor sobre borradores
-- =====================================================
CREATE TABLE `revision_borrador_asesor` (
  `id_revision` int NOT NULL AUTO_INCREMENT,
  `id_borrador` int NOT NULL,
  `id_asesor` int NOT NULL,
  `estado_revision` enum('APROBADO','OBSERVADO','RECHAZADO') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comentarios` text COLLATE utf8mb4_unicode_ci,
  `fecha_revision` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_revision`),
  KEY `id_borrador` (`id_borrador`),
  KEY `id_asesor` (`id_asesor`),
  CONSTRAINT `revision_borrador_asesor_ibfk_1` FOREIGN KEY (`id_borrador`) REFERENCES `tesis_borrador` (`id_borrador`),
  CONSTRAINT `revision_borrador_asesor_ibfk_2` FOREIGN KEY (`id_asesor`) REFERENCES `docente` (`id_docente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: revision_borrador_jurado
-- Revisiones de jurados sobre borradores
-- =====================================================
CREATE TABLE `revision_borrador_jurado` (
  `id_revision` int NOT NULL AUTO_INCREMENT,
  `id_borrador` int NOT NULL,
  `id_jurado` int NOT NULL,
  `estado_revision` enum('APROBADO','OBSERVADO','RECHAZADO') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comentarios` text COLLATE utf8mb4_unicode_ci,
  `fecha_revision` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_revision`),
  KEY `id_borrador` (`id_borrador`),
  KEY `id_jurado` (`id_jurado`),
  CONSTRAINT `revision_borrador_jurado_ibfk_1` FOREIGN KEY (`id_borrador`) REFERENCES `tesis_borrador` (`id_borrador`),
  CONSTRAINT `revision_borrador_jurado_ibfk_2` FOREIGN KEY (`id_jurado`) REFERENCES `docente` (`id_docente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: tesis
-- Tesis finales registradas
-- =====================================================
CREATE TABLE `tesis` (
  `id_tesis` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `ruta_pdf` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('REGISTRADA','SUSTENTADA') COLLATE utf8mb4_unicode_ci DEFAULT 'REGISTRADA',
  PRIMARY KEY (`id_tesis`),
  UNIQUE KEY `id_proyecto` (`id_proyecto`),
  CONSTRAINT `tesis_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyecto_tesis` (`id_proyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: sustentacion
-- Programación de sustentaciones
-- =====================================================
CREATE TABLE `sustentacion` (
  `id_sustentacion` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `fecha_hora` datetime NOT NULL,
  `modalidad` enum('PRESENCIAL','VIRTUAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRESENCIAL',
  `lugar` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('PROGRAMADA','SUSTENTADA','CANCELADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PROGRAMADA',
  `nota` decimal(5,2) DEFAULT NULL,
  `dictamen` enum('APROBADO','DESAPROBADO') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_registro` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_sustentacion`),
  UNIQUE KEY `id_proyecto` (`id_proyecto`),
  CONSTRAINT `sustentacion_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyecto_tesis` (`id_proyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: resolucion
-- Resoluciones de sustentación generadas
-- =====================================================
CREATE TABLE `resolucion` (
  `id_resolucion` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `numero_resolucion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('SUSTENTACION') COLLATE utf8mb4_unicode_ci DEFAULT 'SUSTENTACION',
  `fecha_resolucion` date NOT NULL,
  `ruta_pdf` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` tinyint(1) DEFAULT '1',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_resolucion`),
  KEY `id_proyecto` (`id_proyecto`),
  CONSTRAINT `resolucion_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyecto_tesis` (`id_proyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: acta_sustentacion
-- Actas de sustentación generadas
-- =====================================================
CREATE TABLE `acta_sustentacion` (
  `id_acta` int NOT NULL AUTO_INCREMENT,
  `id_sustentacion` int NOT NULL,
  `ruta_pdf` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_generacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_acta`),
  UNIQUE KEY `id_sustentacion` (`id_sustentacion`),
  CONSTRAINT `acta_sustentacion_ibfk_1` FOREIGN KEY (`id_sustentacion`) REFERENCES `sustentacion` (`id_sustentacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: notificacion
-- Notificaciones para usuarios
-- =====================================================
CREATE TABLE `notificacion` (
  `id_notificacion` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci,
  `leido` tinyint(1) DEFAULT '0',
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notificacion`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `notificacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
