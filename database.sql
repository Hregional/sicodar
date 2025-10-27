CREATE DATABASE IF NOT EXISTS his_bodega CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE his_bodega;

CREATE TABLE IF NOT EXISTS especialidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO especialidades (nombre)
VALUES
  ('Cirugía'),
  ('Laboratorio'),
  ('Urgencias'),
  ('Medicina Interna'),
  ('Pediatría'),
  ('Ginecología'),
  ('Farmacia'),
  ('Estéril'),
  ('General')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','empleado') DEFAULT 'empleado',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  unidad_medida VARCHAR(50),
  stock_actual DECIMAL(10,2) DEFAULT 0.00,
  stock_minimo DECIMAL(10,2) DEFAULT 0.00,
  especialidad_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_insumo_especialidad FOREIGN KEY (especialidad_id)
    REFERENCES especialidades(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS entradas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  insumo_id INT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2) DEFAULT 0.00,
  fecha DATE NOT NULL,
  usuario_id INT NOT NULL,
  numero_referencia VARCHAR(100),
  remitente_destinatario VARCHAR(255),
  numero_lote VARCHAR(100),
  fecha_vencimiento DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_entrada_insumo FOREIGN KEY (insumo_id)
    REFERENCES insumos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_entrada_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS salidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  insumo_id INT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(10,2) DEFAULT 0.00,
  fecha DATE NOT NULL,
  usuario_id INT NOT NULL,
  numero_referencia VARCHAR(100),
  remitente_destinatario VARCHAR(255),
  numero_lote VARCHAR(100),
  fecha_vencimiento DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_salida_insumo FOREIGN KEY (insumo_id)
    REFERENCES insumos(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_salida_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alertas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  insumo_id INT NOT NULL,
  mensaje TEXT NOT NULL,
  fecha DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alerta_insumo FOREIGN KEY (insumo_id)
    REFERENCES insumos(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  accion VARCHAR(255) NOT NULL,
  detalle TEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Usuario de ejemplo (reemplaza password_hash con el generado por passlib)
-- INSERT INTO usuarios (nombre, email, password_hash, rol)
-- VALUES ('Administrador', 'admin@ejemplo.com', '<hash_generado>', 'admin');
