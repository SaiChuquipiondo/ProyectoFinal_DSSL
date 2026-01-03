CREATE DATABASE  IF NOT EXISTS `sgt` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `sgt`;
-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: sgt
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `acta_sustentacion`
--

DROP TABLE IF EXISTS `acta_sustentacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acta_sustentacion` (
  `id_acta` int NOT NULL AUTO_INCREMENT,
  `id_sustentacion` int NOT NULL,
  `ruta_pdf` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_generacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_acta`),
  UNIQUE KEY `id_sustentacion` (`id_sustentacion`),
  CONSTRAINT `acta_sustentacion_ibfk_1` FOREIGN KEY (`id_sustentacion`) REFERENCES `sustentacion` (`id_sustentacion`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acta_sustentacion`
--

LOCK TABLES `acta_sustentacion` WRITE;
/*!40000 ALTER TABLE `acta_sustentacion` DISABLE KEYS */;
INSERT INTO `acta_sustentacion` VALUES (1,1,'acta_001-2025-FISeIC.pdf','2025-12-31 20:58:07');
/*!40000 ALTER TABLE `acta_sustentacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `docente`
--

DROP TABLE IF EXISTS `docente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docente` (
  `id_docente` int NOT NULL AUTO_INCREMENT,
  `id_persona` int NOT NULL,
  `categoria` enum('NOMBRADO','CONTRATADO') COLLATE utf8mb4_unicode_ci DEFAULT 'CONTRATADO',
  `grado_academico` enum('BACHILLER','MAGISTER','DOCTOR') COLLATE utf8mb4_unicode_ci DEFAULT 'MAGISTER',
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_docente`),
  KEY `id_persona` (`id_persona`),
  CONSTRAINT `docente_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `docente`
--

LOCK TABLES `docente` WRITE;
/*!40000 ALTER TABLE `docente` DISABLE KEYS */;
INSERT INTO `docente` VALUES (1,1,'NOMBRADO','DOCTOR',1),(2,2,'NOMBRADO','MAGISTER',1),(3,3,'CONTRATADO','MAGISTER',1),(4,4,'CONTRATADO','MAGISTER',1),(5,5,'CONTRATADO','MAGISTER',1),(6,6,'CONTRATADO','MAGISTER',1),(7,7,'CONTRATADO','MAGISTER',1),(8,8,'NOMBRADO','DOCTOR',1),(9,9,'CONTRATADO','MAGISTER',1),(10,10,'CONTRATADO','MAGISTER',1),(11,11,'CONTRATADO','MAGISTER',1);
/*!40000 ALTER TABLE `docente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `docente_especialidad`
--

DROP TABLE IF EXISTS `docente_especialidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docente_especialidad` (
  `id_docente` int NOT NULL,
  `id_especialidad` int NOT NULL,
  PRIMARY KEY (`id_docente`,`id_especialidad`),
  KEY `id_especialidad` (`id_especialidad`),
  CONSTRAINT `docente_especialidad_ibfk_1` FOREIGN KEY (`id_docente`) REFERENCES `docente` (`id_docente`),
  CONSTRAINT `docente_especialidad_ibfk_2` FOREIGN KEY (`id_especialidad`) REFERENCES `especialidad` (`id_especialidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `docente_especialidad`
--

LOCK TABLES `docente_especialidad` WRITE;
/*!40000 ALTER TABLE `docente_especialidad` DISABLE KEYS */;
INSERT INTO `docente_especialidad` VALUES (1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1),(8,1),(9,1),(10,1),(1,2),(2,2),(3,2),(4,2),(5,2),(6,2),(7,2),(10,2),(11,2),(1,3),(3,3),(4,3),(5,3),(8,3),(2,4),(8,4),(9,4),(10,4);
/*!40000 ALTER TABLE `docente_especialidad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `especialidad`
--

DROP TABLE IF EXISTS `especialidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `especialidad` (
  `id_especialidad` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_especialidad`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `especialidad`
--

LOCK TABLES `especialidad` WRITE;
/*!40000 ALTER TABLE `especialidad` DISABLE KEYS */;
INSERT INTO `especialidad` VALUES (1,'Gestión de Tecnologías de Información','GTI',1),(2,'Redes y Telecomunicaciones','Redes',1),(3,'Ingeniería del Software','Software',1),(4,'Ciencias de la Computación','CC',1);
/*!40000 ALTER TABLE `especialidad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estudiante`
--

DROP TABLE IF EXISTS `estudiante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estudiante`
--

LOCK TABLES `estudiante` WRITE;
/*!40000 ALTER TABLE `estudiante` DISABLE KEYS */;
INSERT INTO `estudiante` VALUES (1,12,'0002211267','2024-12-15','Ingeniería de Sistemas',1),(2,14,'0002210863','2024-12-20','Ingeniería de Sistemas',1);
/*!40000 ALTER TABLE `estudiante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacion`
--

DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
INSERT INTO `notificacion` VALUES (1,3,'Propuesta de asesoría','Has sido propuesto como asesor del proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 01:06:38'),(2,13,'Nuevo proyecto registrado','Se ha registrado un nuevo proyecto: \"Sistema de Gestion de Tesis\". Se propuso como asesor a RICHARD PIERO BARDALES LINARES.',1,'2025-12-30 01:06:38'),(3,12,'Asesor aprobado','Tu asesor RICHARD PIERO BARDALES LINARES fue aprobado para el proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 06:19:30'),(4,3,'Asignación aprobada','Has sido aprobado como asesor del proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 06:19:30'),(5,12,'Proyecto observado','Tu proyecto \"Sistema de Gestion de Tesis\" (Iteración 1) fue observado por la coordinación. Motivo: no es el adecuado. Por favor, corrige y vuelve a subir.',1,'2025-12-30 06:44:49'),(6,13,'Proyecto corregido','El estudiante ha resubido el proyecto \"Sistema de Gestion de Tesis\" (Iteración 2).',1,'2025-12-30 17:29:55'),(7,12,'Proyecto aprobado','Tu proyecto \"Sistema de Gestion de Tesis\" (Iteración 2) fue aprobado por la coordinación. ¡Felicidades!',1,'2025-12-30 17:44:35'),(8,12,'Proyecto observado por asesor','Tu proyecto \"Sistema de Gestion de Tesis\" fue observado por tu asesor. Comentarios: esta mal el marco teorico. Por favor, corrige y vuelve a subir.',1,'2025-12-30 21:15:47'),(9,13,'Revisión de asesor completada','El proyecto \"Sistema de Gestion de Tesis\" del estudiante SAÍ CHUQUIPIONDO PINCHI fue observado por el asesor.',1,'2025-12-30 21:15:47'),(10,3,'Proyecto corregido','El estudiante ha resubido el proyecto \"Sistema de Gestion de Tesis\" con las correcciones solicitadas.',1,'2025-12-30 21:35:47'),(11,12,'Proyecto aprobado por asesor','¡Felicitaciones! Tu proyecto \"Sistema de Gestion de Tesis\" fue aprobado por tu asesor.',1,'2025-12-30 21:36:33'),(12,13,'Revisión de asesor completada','El proyecto \"Sistema de Gestion de Tesis\" del estudiante SAÍ CHUQUIPIONDO PINCHI fue aprobado por el asesor.',1,'2025-12-30 21:36:33'),(13,4,'Designación como jurado','Ha sido designado como PRESIDENTE y debe revisar el proyecto.',1,'2025-12-30 22:40:06'),(14,5,'Designación como jurado','Ha sido designado como SECRETARIO y debe revisar el proyecto.',1,'2025-12-30 22:40:06'),(15,1,'Designación como jurado','Ha sido designado como VOCAL y debe revisar el proyecto.',1,'2025-12-30 22:40:06'),(16,12,'Revisión de jurado','Un jurado revisó tu proyecto \"Sistema de Gestion de Tesis\". Estado: OBSERVADO.',1,'2025-12-30 23:02:16'),(17,13,'Revisión de jurado registrada','Un jurado ha registrado revisión para el proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 23:02:16'),(18,12,'Revisión de jurado','Un jurado revisó tu proyecto \"Sistema de Gestion de Tesis\". Estado: OBSERVADO.',1,'2025-12-30 23:03:30'),(19,13,'Revisión de jurado registrada','Un jurado ha registrado revisión para el proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 23:03:30'),(20,12,'Revisión de jurado','Un jurado revisó tu proyecto \"Sistema de Gestion de Tesis\". Estado: OBSERVADO.',1,'2025-12-30 23:03:54'),(21,13,'Revisión de jurado registrada','Un jurado ha registrado revisión para el proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 23:03:54'),(22,12,'Revisión de jurado','Un jurado revisó tu proyecto \"Sistema de Gestion de Tesis\". Estado: OBSERVADO.',1,'2025-12-30 23:24:37'),(23,13,'Revisión de jurado registrada','Un jurado ha registrado revisión para el proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 23:24:37'),(24,12,'Revisión de jurado','Un jurado revisó tu proyecto \"Sistema de Gestion de Tesis\". Estado: OBSERVADO.',1,'2025-12-30 23:24:59'),(25,13,'Revisión de jurado registrada','Un jurado ha registrado revisión para el proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 23:24:59'),(26,12,'Revisión de jurado','Un jurado revisó tu proyecto \"Sistema de Gestion de Tesis\". Estado: OBSERVADO.',1,'2025-12-30 23:25:29'),(27,13,'Revisión de jurado registrada','Un jurado ha registrado revisión para el proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 23:25:29'),(28,12,'Proyecto observado por jurados','Tu proyecto \"Sistema de Gestion de Tesis\" fue observado por la mayoría de jurados. Revisa los comentarios, corrige y vuelve a subir la nueva versión.',1,'2025-12-30 23:25:29'),(29,1,'Proyecto corregido para revisión','El estudiante ha resubido el proyecto \"Sistema de Gestion de Tesis\" con las correcciones. Por favor revísalo nuevamente.',1,'2025-12-30 23:38:13'),(30,4,'Proyecto corregido para revisión','El estudiante ha resubido el proyecto \"Sistema de Gestion de Tesis\" con las correcciones. Por favor revísalo nuevamente.',1,'2025-12-30 23:38:13'),(31,5,'Proyecto corregido para revisión','El estudiante ha resubido el proyecto \"Sistema de Gestion de Tesis\" con las correcciones. Por favor revísalo nuevamente.',1,'2025-12-30 23:38:13'),(32,12,'Revisión de jurado','Un jurado revisó tu proyecto \"Sistema de Gestion de Tesis\". Estado: APROBADO.',1,'2025-12-30 23:39:08'),(33,13,'Revisión de jurado registrada','Un jurado ha registrado revisión para el proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 23:39:08'),(34,12,'Revisión de jurado','Un jurado revisó tu proyecto \"Sistema de Gestion de Tesis\". Estado: APROBADO.',1,'2025-12-30 23:39:39'),(35,13,'Revisión de jurado registrada','Un jurado ha registrado revisión para el proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 23:39:39'),(36,12,'Revisión de jurado','Un jurado revisó tu proyecto \"Sistema de Gestion de Tesis\". Estado: OBSERVADO.',1,'2025-12-30 23:40:00'),(37,13,'Revisión de jurado registrada','Un jurado ha registrado revisión para el proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-30 23:40:00'),(38,12,'Evaluación de jurados completada','¡Felicidades! Tu proyecto \"Sistema de Gestion de Tesis\" fue aprobado por la mayoría de jurados.',1,'2025-12-30 23:40:00'),(39,12,'Proyecto aprobado - Puede subir borrador de tesis','¡Felicitaciones! Tu proyecto \"Sistema de Gestion de Tesis\" ha sido aprobado por los jurados. Ahora puedes proceder a subir el borrador de tu tesis para revisión.',1,'2025-12-31 03:39:47'),(40,3,'Proyecto aprobado - Borrador próximo','El proyecto \"Sistema de Gestion de Tesis\" ha sido aprobado por los jurados. El estudiante procederá a enviar el borrador de tesis para tu revisión.',1,'2025-12-31 03:39:47'),(41,13,'Nuevo borrador enviado','El estudiante ha subido un nuevo borrador del proyecto.',1,'2025-12-31 04:07:44'),(42,3,'Nuevo borrador disponible','El estudiante subió un nuevo borrador para revisión.',1,'2025-12-31 04:07:44'),(43,12,'Formato observado','La coordinación observó el formato del borrador. Corrige y vuelve a subir.',1,'2025-12-31 05:06:11'),(44,13,'Nuevo borrador enviado','El estudiante ha subido un nuevo borrador del proyecto.',1,'2025-12-31 05:40:45'),(45,3,'Nuevo borrador disponible','El estudiante subió un nuevo borrador para revisión.',1,'2025-12-31 05:40:45'),(46,13,'Borrador corregido','El estudiante ha corregido y reenviado un borrador para revisión.',1,'2025-12-31 07:35:53'),(47,12,'Formato observado','La coordinación observó el formato del borrador. Corrige y vuelve a subir.',1,'2025-12-31 07:38:12'),(48,13,'Borrador corregido','El estudiante ha corregido y reenviado un borrador para revisión.',1,'2025-12-31 07:51:35'),(49,12,'Formato aprobado','La coordinación aprobó el formato del borrador. Pasa a revisión del asesor.',1,'2025-12-31 07:52:00'),(50,12,'Observación del asesor','Tu borrador del proyecto \"Sistema de Gestion de Tesis\" fue observado por el asesor. Debes corregir y subir una nueva versión.',1,'2025-12-31 08:19:37'),(51,12,'Observación del asesor','Tu borrador del proyecto \"Sistema de Gestion de Tesis\" fue observado por el asesor. Debes corregir y subir una nueva versión.',1,'2025-12-31 08:27:30'),(52,13,'Borrador corregido','El estudiante ha corregido y reenviado un borrador para revisión.',1,'2025-12-31 13:10:10'),(53,1,'Borrador listo para revisión','El borrador del proyecto \"Sistema de Gestion de Tesis\" ha sido aprobado por el asesor. Debe proceder con la revisión.',0,'2025-12-31 13:23:21'),(54,4,'Borrador listo para revisión','El borrador del proyecto \"Sistema de Gestion de Tesis\" ha sido aprobado por el asesor. Debe proceder con la revisión.',1,'2025-12-31 13:23:21'),(55,5,'Borrador listo para revisión','El borrador del proyecto \"Sistema de Gestion de Tesis\" ha sido aprobado por el asesor. Debe proceder con la revisión.',1,'2025-12-31 13:23:21'),(56,12,'Observación de jurado','Un jurado observó el borrador de la tesis \"Sistema de Gestion de Tesis\".',1,'2025-12-31 13:45:00'),(57,3,'Observación de jurado','Un jurado observó el borrador de la tesis \"Sistema de Gestion de Tesis\".',1,'2025-12-31 13:45:00'),(58,12,'Borrador observado por jurados','Tu borrador de tesis \"Sistema de Gestion de Tesis\" ha sido observado por la mayoría de los jurados (2 de 3). Revisa los comentarios y vuelve a enviar.',1,'2025-12-31 14:08:18'),(59,13,'Borrador observado por jurados','El borrador de la tesis \"Sistema de Gestion de Tesis\" ha sido observado por la mayoría de los jurados (2 de 3).',1,'2025-12-31 14:08:18'),(60,13,'Borrador corregido','El estudiante ha corregido y reenviado un borrador para revisión.',1,'2025-12-31 14:24:43'),(61,12,'Borrador aprobado por jurados','Tu borrador de tesis \"Sistema de Gestion de Tesis\" ha sido aprobado por la mayoría de los jurados (2 de 3).',1,'2025-12-31 14:25:42'),(62,13,'Borrador aprobado por jurados','El borrador de la tesis \"Sistema de Gestion de Tesis\" ha sido aprobado por la mayoría de los jurados (2 de 3).',1,'2025-12-31 14:25:42'),(63,13,'Nueva tesis final registrada','El estudiante subió la tesis final del proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-31 15:27:08'),(64,12,'Borrador aprobado - Listo para sustentación','¡Felicitaciones! El borrador de tu tesis \"Sistema de Gestion de Tesis\" ha sido aprobado por la coordinación. Ahora puedes proceder a programar tu sustentación.',1,'2025-12-31 17:30:08'),(65,3,'Borrador aprobado - Sustentación próxima','El borrador de la tesis \"Sistema de Gestion de Tesis\" ha sido aprobado. El estudiante procederá a programar su sustentación.',1,'2025-12-31 17:30:08'),(66,13,'Nueva tesis final registrada','El estudiante subió la tesis final del proyecto \"Sistema de Gestion de Tesis\".',1,'2025-12-31 18:56:03'),(67,12,'Sustentación programada','Tu sustentación fue programada para 13/01/2026, 06:24 p. m.. Modalidad: PRESENCIAL. Lugar: Adutiorio de la facultad. Tesis: \"Sistema de Gestion de Tesis\".',1,'2025-12-31 20:00:13'),(68,3,'Sustentación programada','Se programó la sustentación del proyecto \"Sistema de Gestion de Tesis\" para 13/01/2026, 06:24 p. m.. Modalidad: PRESENCIAL. Lugar: Adutiorio de la facultad.',1,'2025-12-31 20:00:13'),(69,1,'Sustentación programada','Se programó la sustentación del proyecto \"Sistema de Gestion de Tesis\" para 13/01/2026, 06:24 p. m.. Modalidad: PRESENCIAL. Lugar: Adutiorio de la facultad. Cargo: VOCAL.',0,'2025-12-31 20:00:13'),(70,4,'Sustentación programada','Se programó la sustentación del proyecto \"Sistema de Gestion de Tesis\" para 13/01/2026, 06:24 p. m.. Modalidad: PRESENCIAL. Lugar: Adutiorio de la facultad. Cargo: PRESIDENTE.',0,'2025-12-31 20:00:13'),(71,5,'Sustentación programada','Se programó la sustentación del proyecto \"Sistema de Gestion de Tesis\" para 13/01/2026, 06:24 p. m.. Modalidad: PRESENCIAL. Lugar: Adutiorio de la facultad. Cargo: SECRETARIO.',0,'2025-12-31 20:00:13'),(72,12,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC para tu tesis. Dictamen: APROBADO.',0,'2025-12-31 20:52:04'),(73,3,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC del proyecto \"Sistema de Gestion de Tesis\". Dictamen: APROBADO.',1,'2025-12-31 20:52:04'),(74,1,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC. Dictamen: APROBADO.',0,'2025-12-31 20:52:04'),(75,4,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC. Dictamen: APROBADO.',0,'2025-12-31 20:52:04'),(76,5,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC. Dictamen: APROBADO.',0,'2025-12-31 20:52:04'),(77,12,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC para tu tesis. Dictamen: APROBADO.',0,'2025-12-31 20:55:02'),(78,3,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC del proyecto \"Sistema de Gestion de Tesis\". Dictamen: APROBADO.',1,'2025-12-31 20:55:02'),(79,1,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC. Dictamen: APROBADO.',0,'2025-12-31 20:55:02'),(80,4,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC. Dictamen: APROBADO.',0,'2025-12-31 20:55:02'),(81,5,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC. Dictamen: APROBADO.',0,'2025-12-31 20:55:02'),(82,12,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC para tu tesis. Dictamen: APROBADO.',0,'2025-12-31 20:58:07'),(83,3,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC del proyecto \"Sistema de Gestion de Tesis\". Dictamen: APROBADO.',1,'2025-12-31 20:58:07'),(84,1,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC. Dictamen: APROBADO.',0,'2025-12-31 20:58:07'),(85,4,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC. Dictamen: APROBADO.',0,'2025-12-31 20:58:07'),(86,5,'Acta de sustentación generada','Se generó el Acta 001-2025-FISeIC. Dictamen: APROBADO.',0,'2025-12-31 20:58:07');
/*!40000 ALTER TABLE `notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `persona`
--

DROP TABLE IF EXISTS `persona`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `persona`
--

LOCK TABLES `persona` WRITE;
/*!40000 ALTER TABLE `persona` DISABLE KEYS */;
INSERT INTO `persona` VALUES (1,'DNI','70010001','AUGURTO','CHERRE','CESAR AUGUSTO',NULL,'M','900111111','cesar.augurto@gmail.com','-',1,'2025-12-02 04:12:35'),(2,'DNI','70010002','AYRA','APAC','NILTON CESAR',NULL,'M','900222222','nilton.ayra@gmail.com','-',1,'2025-12-02 04:12:35'),(3,'DNI','70010003','BARDALES','LINARES','RICHARD PIERO',NULL,'M','900333333','richard.bardales@gmail.com','-',1,'2025-12-02 04:12:35'),(4,'DNI','70010004','DIAZ','ESTRADA','DIANA MARGARITA',NULL,'F','900444444','diana.diaz@gmail.com','-',1,'2025-12-02 04:12:35'),(5,'DNI','70010005','FERRARI','FERNANDEZ','FREDDY ELAR',NULL,'M','900555555','freddy.ferrari@gmail.com','-',1,'2025-12-02 04:12:35'),(6,'DNI','70010006','HILARIO','RIVAS','JORGE LUIS',NULL,'M','900666666','jorge.hilario@gmail.com','-',1,'2025-12-02 04:12:35'),(7,'DNI','70010007','PANDURO','PADILLA','EUCLIDES',NULL,'M','900777777','euclides.panduro@gmail.com','-',1,'2025-12-02 04:12:35'),(8,'DNI','70010008','RIOS HIDALGO DE','CERNA','CLOTILDE',NULL,'F','900888888','clotilde.rios@gmail.com','-',1,'2025-12-02 04:12:35'),(9,'DNI','70010009','ULLOA','GALVEZ','RONALD HAROLD',NULL,'M','900999999','ronald.ulloa@gmail.com','-',1,'2025-12-02 04:12:35'),(10,'DNI','70010010','YUPANQUI','VILLANUEVA','ARTURO',NULL,'M','901000000','arturo.yupanqui@gmail.com','-',1,'2025-12-02 04:12:35'),(11,'DNI','70010011','RUIZ','TORRES','OSCAR AMADO',NULL,'M','901111111','oscar.ruiz@gmail.com','-',1,'2025-12-02 04:12:35'),(12,'DNI','73143136','CHUQUIPIONDO','PINCHI','SAÍ','2003-01-18','M','945065611','sai.chuquipiondo@gmail.com','Jr. Los Pinos 345',1,'2025-12-02 04:12:35'),(13,'DNI','76011223','RAMÍREZ','FLORES','ANDRES','1985-03-22','M','987654321','andres.coordinacion@gmail.com','Av. Universitaria 1500',1,'2025-12-02 04:12:35'),(14,'DNI','71423549','Barranca','Segura','Mirelly',NULL,NULL,'933411195','mirelly.goyeth.2003@gmail.com','jr. las almendras',1,'2026-01-03 15:55:02');
/*!40000 ALTER TABLE `persona` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proyecto_jurado`
--

DROP TABLE IF EXISTS `proyecto_jurado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proyecto_jurado` (
  `id_proyecto` int NOT NULL,
  `id_jurado` int NOT NULL,
  `rol_jurado` enum('PRESIDENTE','SECRETARIO','VOCAL') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_proyecto`,`id_jurado`),
  KEY `id_jurado` (`id_jurado`),
  CONSTRAINT `proyecto_jurado_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyecto_tesis` (`id_proyecto`),
  CONSTRAINT `proyecto_jurado_ibfk_2` FOREIGN KEY (`id_jurado`) REFERENCES `docente` (`id_docente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proyecto_jurado`
--

LOCK TABLES `proyecto_jurado` WRITE;
/*!40000 ALTER TABLE `proyecto_jurado` DISABLE KEYS */;
INSERT INTO `proyecto_jurado` VALUES (1,1,'VOCAL'),(1,4,'PRESIDENTE'),(1,5,'SECRETARIO');
/*!40000 ALTER TABLE `proyecto_jurado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proyecto_tesis`
--

DROP TABLE IF EXISTS `proyecto_tesis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proyecto_tesis`
--

LOCK TABLES `proyecto_tesis` WRITE;
/*!40000 ALTER TABLE `proyecto_tesis` DISABLE KEYS */;
INSERT INTO `proyecto_tesis` VALUES (1,1,3,3,'APROBADO','Sistema de Gestion de Tesis','Este proyecto busca implementar un sistema digital que centralice la gestión de tesis universitarias. Se empleará una metodología descriptiva y de desarrollo de software para modelar las etapas de egreso, sustentación y revisión. Se espera obtener una herramienta eficiente que permita el registro de proyectos, la validación de requisitos documentales y una comunicación fluida entre tesistas, asesores y jurados, garantizando la transparencia en el proceso académico.','proyecto_1767137893108.pdf',2,'APROBADO_FINAL','2025-12-30 23:38:13');
/*!40000 ALTER TABLE `proyecto_tesis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resolucion`
--

DROP TABLE IF EXISTS `resolucion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resolucion`
--

LOCK TABLES `resolucion` WRITE;
/*!40000 ALTER TABLE `resolucion` DISABLE KEYS */;
INSERT INTO `resolucion` VALUES (1,1,'001-2025-FISeIC-UNU','SUSTENTACION','2025-12-31','resolucion_001-2025-FISeIC-UNU.pdf',1,'2025-12-31 19:53:48');
/*!40000 ALTER TABLE `resolucion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `revision_borrador_asesor`
--

DROP TABLE IF EXISTS `revision_borrador_asesor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_borrador_asesor`
--

LOCK TABLES `revision_borrador_asesor` WRITE;
/*!40000 ALTER TABLE `revision_borrador_asesor` DISABLE KEYS */;
INSERT INTO `revision_borrador_asesor` VALUES (1,1,3,'OBSERVADO','le falta','2025-12-31 08:19:37'),(2,1,3,'OBSERVADO','mal','2025-12-31 08:27:30'),(3,1,3,'APROBADO',NULL,'2025-12-31 13:23:21');
/*!40000 ALTER TABLE `revision_borrador_asesor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `revision_borrador_jurado`
--

DROP TABLE IF EXISTS `revision_borrador_jurado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_borrador_jurado`
--

LOCK TABLES `revision_borrador_jurado` WRITE;
/*!40000 ALTER TABLE `revision_borrador_jurado` DISABLE KEYS */;
INSERT INTO `revision_borrador_jurado` VALUES (4,1,4,'APROBADO',NULL,'2025-12-31 14:25:06'),(5,1,5,'APROBADO',NULL,'2025-12-31 14:25:21'),(6,1,1,'OBSERVADO','malo','2025-12-31 14:25:42');
/*!40000 ALTER TABLE `revision_borrador_jurado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `revision_proyecto_asesor`
--

DROP TABLE IF EXISTS `revision_proyecto_asesor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_proyecto_asesor`
--

LOCK TABLES `revision_proyecto_asesor` WRITE;
/*!40000 ALTER TABLE `revision_proyecto_asesor` DISABLE KEYS */;
INSERT INTO `revision_proyecto_asesor` VALUES (1,1,3,'OBSERVADO','esta mal el marco teorico','2025-12-30 21:15:47'),(2,1,3,'APROBADO','bien hecho','2025-12-30 21:36:33');
/*!40000 ALTER TABLE `revision_proyecto_asesor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `revision_proyecto_jurado`
--

DROP TABLE IF EXISTS `revision_proyecto_jurado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revision_proyecto_jurado`
--

LOCK TABLES `revision_proyecto_jurado` WRITE;
/*!40000 ALTER TABLE `revision_proyecto_jurado` DISABLE KEYS */;
INSERT INTO `revision_proyecto_jurado` VALUES (4,1,4,'APROBADO','ta bien',NULL,'2025-12-30 23:39:08'),(5,1,5,'APROBADO','chevere',NULL,'2025-12-30 23:39:39'),(6,1,1,'OBSERVADO','mal',NULL,'2025-12-30 23:40:00');
/*!40000 ALTER TABLE `revision_proyecto_jurado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
INSERT INTO `rol` VALUES (3,'COORDINACION'),(2,'DOCENTE'),(1,'ESTUDIANTE');
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sustentacion`
--

DROP TABLE IF EXISTS `sustentacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sustentacion`
--

LOCK TABLES `sustentacion` WRITE;
/*!40000 ALTER TABLE `sustentacion` DISABLE KEYS */;
INSERT INTO `sustentacion` VALUES (1,1,'2025-12-31 15:10:00','PRESENCIAL','Adutiorio de la facultad','SUSTENTADA',15.00,'APROBADO','','2025-12-31 20:00:12');
/*!40000 ALTER TABLE `sustentacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tesis`
--

DROP TABLE IF EXISTS `tesis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tesis` (
  `id_tesis` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `ruta_pdf` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('REGISTRADA','SUSTENTADA') COLLATE utf8mb4_unicode_ci DEFAULT 'REGISTRADA',
  PRIMARY KEY (`id_tesis`),
  UNIQUE KEY `id_proyecto` (`id_proyecto`),
  CONSTRAINT `tesis_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyecto_tesis` (`id_proyecto`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tesis`
--

LOCK TABLES `tesis` WRITE;
/*!40000 ALTER TABLE `tesis` DISABLE KEYS */;
INSERT INTO `tesis` VALUES (1,1,'tesis_1767207362969.pdf','2025-12-31 18:56:03','SUSTENTADA');
/*!40000 ALTER TABLE `tesis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tesis_borrador`
--

DROP TABLE IF EXISTS `tesis_borrador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tesis_borrador` (
  `id_borrador` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `numero_iteracion` int NOT NULL DEFAULT '1',
  `ruta_pdf` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('PENDIENTE','OBSERVADO','APROBADO_CORD','APROBADO_ASESOR','APROBADO_JURADOS','APROBADO_FINAL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'PENDIENTE',
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_borrador`),
  KEY `id_proyecto` (`id_proyecto`),
  CONSTRAINT `tesis_borrador_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyecto_tesis` (`id_proyecto`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tesis_borrador`
--

LOCK TABLES `tesis_borrador` WRITE;
/*!40000 ALTER TABLE `tesis_borrador` DISABLE KEYS */;
INSERT INTO `tesis_borrador` VALUES (1,1,5,'borrador_1767191082808.pdf','APROBADO_FINAL','2025-12-31 14:24:43');
/*!40000 ALTER TABLE `tesis_borrador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,1,2,'augurto','$2b$10$O583Uoz2aLaoIuqrwgYMPu2y/SC8UjmRfV87qCCA6N.z2RaugvHhi',1,'2025-12-02 04:12:35'),(2,2,2,'ayra','$2b$10$Qk0wDP5I2GlPizlZ8QgYZeimQy8XODhUf/PXZ/gipdmvv11YwQ.iG',1,'2025-12-02 04:12:35'),(3,3,2,'bardales','$2b$10$TCzV1U8oywBo.3zzziucfOZEx21Dr6nVkGB6loegYNgsYDaa6qa1e',1,'2025-12-02 04:12:35'),(4,4,2,'diana','$2b$10$P0q17ckTqRm.zgUIAwIq3u9k3NIau3j0cB5j/O31U7DX9JeCMLhzG',1,'2025-12-02 04:12:35'),(5,5,2,'ferrari','$2b$10$/Loj3Y1lYYPZfIuwwMy/FOOBBKwF2CoAMkxIcdfiT0K9adAttt6qq',1,'2025-12-02 04:12:35'),(6,6,2,'hilario','$2b$10$CN9chkIXc1t/sWHGLdH1WeNXMSszPjXO7RZ0xU51rRqQt171JPJX6',1,'2025-12-02 04:12:35'),(7,7,2,'panduro','$2b$10$XmlTn17AdWmGsTxNrH4y7umbngVUBtvaQovXECZgm9nmScWTb9IN2',1,'2025-12-02 04:12:35'),(8,8,2,'clotilde','$2b$10$dSWx31j8iPNZ8276G0U0POLGYiXJfUjmSKrY4G2xE8PhpzfkmoQP6',1,'2025-12-02 04:12:35'),(9,9,2,'ulloa','$2b$10$e25A8IZev2chxj8kSe9NsubCK.jMOs0tK3YB1lKyyc8KVCQWNE19u',1,'2025-12-02 04:12:35'),(10,10,2,'yupanqui','$2b$10$8g2QX1ebrP50TNpKiAoGjO3aQuK.X5Kuneyy7sCQzVphL.nno3xpS',1,'2025-12-02 04:12:35'),(11,11,2,'ruiz','$2b$10$u3im5WFZPqocSSgCmlp1OudX1FHDPWvqpkhrMs0PqLsKZkuDkBTXu',1,'2025-12-02 04:12:35'),(12,12,1,'saichuquipiondo','$2b$10$J8BfNMozc4wBGjrUQ2ra8uy0miNB3C2Jh0y.DtbGF6wF3teBRtQja',1,'2025-12-02 04:12:35'),(13,13,3,'coordinacion','$2b$10$4aHgoFh6MwLhZrFVzafe5OGca5ZjQHy6q5sobndKLKhHT/UPD4Vee',1,'2025-12-02 04:12:35'),(14,14,1,'mirelly','$2b$10$moUyMlKuDWHgt/9Krz8m8e5f7VvozXx9p4VtBcwSMB24D27i2RRz2',1,'2026-01-03 15:55:03');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-03 16:56:06
