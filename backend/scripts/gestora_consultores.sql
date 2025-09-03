-- ====================================================================
-- TABLA DE ASIGNACIÓN GESTORA-CONSULTORES
-- ====================================================================

-- Tabla para asignar consultores específicos a gestoras/profesionales
CREATE TABLE gestora_consultores (
    gc_id INT AUTO_INCREMENT PRIMARY KEY,
    gestora_cedula BIGINT NOT NULL, -- Cédula de la gestora/profesional
    consultor_cedula BIGINT NOT NULL, -- Cédula del consultor asignado
    gc_fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gc_activo BOOLEAN DEFAULT TRUE,
    gc_observaciones TEXT,
    
    -- Foreign keys
    FOREIGN KEY (gestora_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    FOREIGN KEY (consultor_cedula) REFERENCES usuarios_info(usu_cedula) ON DELETE CASCADE,
    
    -- Evitar duplicación: una gestora no puede tener el mismo consultor asignado dos veces activo
    UNIQUE KEY unique_gestora_consultor_activo (gestora_cedula, consultor_cedula, gc_activo)
);

-- ====================================================================
-- DATOS DE EJEMPLO - ASIGNACIONES
-- ====================================================================

-- Asignaciones para Andreína Ustate (cédula: 2000000001)
INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
VALUES 
(2000000001, 1010219918, 'Consultor especializado en transformación digital'),
(2000000001, 1018425430, 'Experta en consultoría empresarial'),
(2000000001, 1001234567, 'Especialista en desarrollo de negocios'),
(2000000001, 1002345678, 'Experto en finanzas corporativas'),
(2000000001, 1003456789, 'Consultor en gestión organizacional'),
(2000000001, 1004567890, 'Profesional en marketing digital'),
(2000000001, 1005678901, 'Especialista en innovación'),
(2000000001, 1006789012, 'Experto en logística'),
(2000000001, 1007890123, 'Consultor en transformación organizacional'),
(2000000001, 1008901234, 'Profesional en gestión de calidad');

-- Asignaciones para Alejandra Buitrago (cédula: 2000000002)
INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
VALUES 
(2000000002, 1009012345, 'Especialista en inteligencia de negocios'),
(2000000002, 1010123456, 'Experta en gestión financiera'),
(2000000002, 1011234567, 'Consultor en tecnología'),
(2000000002, 1012345678, 'Profesional en desarrollo sostenible'),
(2000000002, 1013456789, 'Especialista en comercio internacional'),
(2000000002, 1014567890, 'Experta en gestión del talento humano'),
(2000000002, 1015678901, 'Consultora en marketing estratégico'),
(2000000002, 1016789012, 'Profesional en educación corporativa'),
(2000000002, 1017890123, 'Especialista en gestión de proyectos'),
(2000000002, 1018901234, 'Experto en transformación digital');

-- Asignaciones para Julie Sáenz (cédula: 2000000003)
INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
VALUES 
(2000000003, 1022345678, 'Consultor en innovación digital'),
(2000000003, 1023456789, 'Especialista en gestión empresarial'),
(2000000003, 1024567890, 'Experta en desarrollo de negocios'),
(2000000003, 1025678901, 'Consultor en finanzas'),
(2000000003, 1026789012, 'Profesional en recursos humanos'),
(2000000003, 1027890123, 'Especialista en marketing'),
(2000000003, 1028901234, 'Experto en logística'),
(2000000003, 1029012345, 'Consultor en calidad'),
(2000000003, 1030123456, 'Profesional en análisis de datos'),
(2000000003, 1031234567, 'Especialista en tecnología');

-- Asignaciones para Tatiana Prieto (cédula: 2000000004)
INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
VALUES 
(2000000004, 1032345678, 'Consultor en desarrollo organizacional'),
(2000000004, 1033456789, 'Especialista en sistemas'),
(2000000004, 1034567890, 'Experto en gestión de proyectos'),
(2000000004, 1035678901, 'Profesional en marketing'),
(2000000004, 1036789012, 'Consultor en finanzas'),
(2000000004, 1037890123, 'Especialista en operaciones'),
(2000000004, 1038901234, 'Experto en calidad'),
(2000000004, 1039012345, 'Profesional en recursos humanos'),
(2000000004, 1040123456, 'Consultora en análisis financiero'),
(2000000004, 1041234567, 'Especialista en gestión empresarial');

-- ====================================================================
-- VISTAS PARA FACILITAR CONSULTAS
-- ====================================================================

-- Vista para obtener consultores asignados a una gestora
CREATE VIEW vista_gestora_consultores AS
SELECT 
    gc.gc_id,
    gc.gestora_cedula,
    gc.consultor_cedula,
    -- Información de la gestora
    CONCAT(g.usu_primer_nombre, ' ', 
           COALESCE(g.usu_segundo_nombre, ''), ' ',
           g.usu_primer_apellido, ' ', 
           g.usu_segundo_apellido) as gestora_nombre,
    cg.usu_correo as gestora_correo,
    g.usu_telefono as gestora_telefono,
    -- Información del consultor
    CONCAT(c.usu_primer_nombre, ' ', 
           COALESCE(c.usu_segundo_nombre, ''), ' ',
           c.usu_primer_apellido, ' ', 
           c.usu_segundo_apellido) as consultor_nombre,
    cc.usu_correo as consultor_correo,
    c.usu_telefono as consultor_telefono,
    ac.are_descripcion as consultor_area_conocimiento,
    -- Información de la asignación
    gc.gc_fecha_asignacion,
    gc.gc_activo,
    gc.gc_observaciones
FROM gestora_consultores gc
JOIN usuarios_info g ON gc.gestora_cedula = g.usu_cedula
JOIN cuentas cg ON g.usu_id = cg.usu_id
JOIN usuarios_info c ON gc.consultor_cedula = c.usu_cedula
JOIN cuentas cc ON c.usu_id = cc.usu_id
JOIN areas_conocimiento ac ON c.are_id = ac.are_id
WHERE gc.gc_activo = TRUE
  AND cg.usu_tipo IN ('Profesional', 'Administrador')
  AND cc.usu_tipo = 'Consultor'
  AND cg.usu_activo = TRUE
  AND cc.usu_activo = TRUE;

-- Vista para resumen de asignaciones por gestora
CREATE VIEW resumen_asignaciones_gestora AS
SELECT 
    gc.gestora_cedula,
    CONCAT(g.usu_primer_nombre, ' ', g.usu_primer_apellido) as gestora_nombre,
    cg.usu_correo as gestora_correo,
    COUNT(gc.consultor_cedula) as total_consultores_asignados,
    GROUP_CONCAT(
        CONCAT(c.usu_primer_nombre, ' ', c.usu_primer_apellido)
        ORDER BY c.usu_primer_nombre SEPARATOR ', '
    ) as consultores_asignados
FROM gestora_consultores gc
JOIN usuarios_info g ON gc.gestora_cedula = g.usu_cedula
JOIN cuentas cg ON g.usu_id = cg.usu_id
JOIN usuarios_info c ON gc.consultor_cedula = c.usu_cedula
JOIN cuentas cc ON c.usu_id = cc.usu_id
WHERE gc.gc_activo = TRUE
  AND cg.usu_tipo IN ('Profesional', 'Administrador')
  AND cc.usu_tipo = 'Consultor'
  AND cg.usu_activo = TRUE
  AND cc.usu_activo = TRUE
GROUP BY gc.gestora_cedula, g.usu_primer_nombre, g.usu_primer_apellido, cg.usu_correo;

-- ====================================================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ====================================================================

-- Procedimiento para asignar un consultor a una gestora
DELIMITER $$
CREATE PROCEDURE AsignarConsultor(
    IN p_gestora_cedula BIGINT,
    IN p_consultor_cedula BIGINT,
    IN p_observaciones TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Verificar que la gestora existe y es del tipo correcto
    IF NOT EXISTS (
        SELECT 1 FROM usuarios_info ui
        JOIN cuentas c ON ui.usu_id = c.usu_id
        WHERE ui.usu_cedula = p_gestora_cedula 
        AND c.usu_tipo IN ('Profesional', 'Administrador')
        AND c.usu_activo = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La gestora no existe o no es válida';
    END IF;
    
    -- Verificar que el consultor existe y es del tipo correcto
    IF NOT EXISTS (
        SELECT 1 FROM usuarios_info ui
        JOIN cuentas c ON ui.usu_id = c.usu_id
        WHERE ui.usu_cedula = p_consultor_cedula 
        AND c.usu_tipo = 'Consultor'
        AND c.usu_activo = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El consultor no existe o no es válido';
    END IF;
    
    -- Insertar o actualizar la asignación
    INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
    VALUES (p_gestora_cedula, p_consultor_cedula, p_observaciones)
    ON DUPLICATE KEY UPDATE
        gc_activo = TRUE,
        gc_observaciones = p_observaciones,
        gc_fecha_asignacion = CURRENT_TIMESTAMP;
    
    COMMIT;
END$$
DELIMITER ;

-- Procedimiento para desasignar un consultor de una gestora
DELIMITER $$
CREATE PROCEDURE DesasignarConsultor(
    IN p_gestora_cedula BIGINT,
    IN p_consultor_cedula BIGINT
)
BEGIN
    UPDATE gestora_consultores 
    SET gc_activo = FALSE
    WHERE gestora_cedula = p_gestora_cedula 
      AND consultor_cedula = p_consultor_cedula;
END$$
DELIMITER ;

-- ====================================================================
-- CONSULTAS DE EJEMPLO PARA EL FRONTEND
-- ====================================================================

-- Obtener consultores asignados a una gestora específica (para usar en NuevaProgramacionPage.js)
-- SELECT consultor_cedula, consultor_nombre, consultor_correo, consultor_area_conocimiento
-- FROM vista_gestora_consultores
-- WHERE gestora_cedula = ? -- Parámetro de la gestora logueada
-- ORDER BY consultor_nombre;

-- Verificar si una gestora tiene un consultor específico asignado
-- SELECT COUNT(*) as tiene_asignado
-- FROM gestora_consultores
-- WHERE gestora_cedula = ? AND consultor_cedula = ? AND gc_activo = TRUE; 