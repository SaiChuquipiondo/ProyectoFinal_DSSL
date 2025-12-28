-- ============================================
-- TABLAS PARA SEGURIDAD AVANZADA
-- ============================================

-- Tabla de Auditoría de Acciones Críticas
CREATE TABLE IF NOT EXISTS audit_log (
  id_audit BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT,
  accion VARCHAR(100) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  id_entidad INT,
  detalles JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuario (id_usuario),
  INDEX idx_fecha (fecha_hora),
  INDEX idx_accion (accion),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de 2FA (Two-Factor Authentication)
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id_2fa INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT UNIQUE NOT NULL,
  secret VARCHAR(255) NOT NULL,
  habilitado BOOLEAN DEFAULT FALSE,
  fecha_habilitacion TIMESTAMP NULL,
  backup_codes JSON,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Intentos de Login (para análisis de seguridad)
CREATE TABLE IF NOT EXISTS login_attempts (
  id_attempt BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  successful BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  fecha_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_fecha (fecha_intento),
  INDEX idx_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Sesiones (para OAuth2 y gestión avanzada)
CREATE TABLE IF NOT EXISTS user_sessions (
  id_session VARCHAR(255) PRIMARY KEY,
  id_usuario INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion TIMESTAMP NOT NULL,
  activa BOOLEAN DEFAULT TRUE,
  INDEX idx_usuario (id_usuario),
  INDEX idx_expiracion (fecha_expiracion),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
