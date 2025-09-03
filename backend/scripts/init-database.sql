-- Script de inicialización para la base de datos CCB
-- Ejecutar este script para crear las tablas necesarias

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS ccb_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ccb_database;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('gestora', 'consultor', 'reclutador') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de consultores
CREATE TABLE IF NOT EXISTS consultores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    especialidad VARCHAR(100),
    tarifa_hora DECIMAL(10,2),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    lugar VARCHAR(200),
    tipo_evento VARCHAR(100),
    estado ENUM('programado', 'en_curso', 'completado', 'cancelado') DEFAULT 'programado',
    consultor_id INT,
    gestora_id INT,
    max_participantes INT DEFAULT 0,
    participantes_actuales INT DEFAULT 0,
    presupuesto DECIMAL(12,2),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE SET NULL,
    FOREIGN KEY (gestora_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultor_id INT NOT NULL,
    evento_id INT,
    monto DECIMAL(10,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    estado ENUM('pendiente', 'pagado', 'cancelado') DEFAULT 'pendiente',
    metodo_pago VARCHAR(50),
    referencia VARCHAR(100),
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL
);

-- Tabla de evidencias
CREATE TABLE IF NOT EXISTS evidencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evento_id INT NOT NULL,
    consultor_id INT NOT NULL,
    tipo_evidencia VARCHAR(100) NOT NULL,
    archivo_url VARCHAR(500),
    descripcion TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    comentarios TEXT,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE
);

-- Tabla de vacantes (para el módulo de reclutamiento)
CREATE TABLE IF NOT EXISTS vacantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    empresa VARCHAR(150),
    ubicacion VARCHAR(200),
    salario_min DECIMAL(12,2),
    salario_max DECIMAL(12,2),
    tipo_contrato ENUM('tiempo_completo', 'tiempo_parcial', 'contrato', 'freelance'),
    estado ENUM('activa', 'pausada', 'cerrada') DEFAULT 'activa',
    fecha_publicacion DATE DEFAULT (CURRENT_DATE),
    fecha_cierre DATE,
    reclutador_id INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reclutador_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla de postulaciones
CREATE TABLE IF NOT EXISTS postulaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vacante_id INT NOT NULL,
    consultor_id INT NOT NULL,
    estado ENUM('postulado', 'revisando', 'entrevista', 'aceptado', 'rechazado') DEFAULT 'postulado',
    fecha_postulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cv_url VARCHAR(500),
    carta_presentacion TEXT,
    comentarios_reclutador TEXT,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    FOREIGN KEY (consultor_id) REFERENCES consultores(id) ON DELETE CASCADE,
    UNIQUE KEY unique_postulacion (vacante_id, consultor_id)
);

-- Insertar usuarios de prueba
INSERT IGNORE INTO usuarios (username, email, password_hash, rol) VALUES
('testgestora', 'gestora@ccb.com', '$2a$10$rWHzYJ/TbpJNL8O4xD8P7uJpY1wU.YB8VWXGHjK3M9pN5qR7sT6vW', 'gestora'),
('testconsultor', 'consultor@ccb.com', '$2a$10$rWHzYJ/TbpJNL8O4xD8P7uJpY1wU.YB8VWXGHjK3M9pN5qR7sT6vW', 'consultor'),
('testreclutador', 'reclutador@ccb.com', '$2a$10$rWHzYJ/TbpJNL8O4xD8P7uJpY1wU.YB8VWXGHjK3M9pN5qR7sT6vW', 'reclutador');

-- Insertar consultor de prueba
INSERT IGNORE INTO consultores (usuario_id, cedula, nombre, apellido, telefono, especialidad, tarifa_hora) VALUES
((SELECT id FROM usuarios WHERE username = 'testconsultor'), '12345678', 'Juan', 'Pérez', '+57 300 123 4567', 'Desarrollo Web', 50000.00);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_eventos_fecha ON eventos(fecha_inicio);
CREATE INDEX idx_eventos_consultor ON eventos(consultor_id);
CREATE INDEX idx_pagos_consultor ON pagos(consultor_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);
CREATE INDEX idx_evidencias_evento ON evidencias(evento_id);
CREATE INDEX idx_vacantes_estado ON vacantes(estado);
CREATE INDEX idx_postulaciones_vacante ON postulaciones(vacante_id);

-- Comentarios para documentación
-- La contraseña para todos los usuarios de prueba es: "password"
-- Cambiar las contraseñas en producción 