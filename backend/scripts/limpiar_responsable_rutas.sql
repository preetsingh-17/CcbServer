-- Script para limpiar duplicación en responsable_rutas
-- ====================================================

-- PASO 1: Analizar datos actuales y duplicaciones
-- ================================================
SELECT 'ANÁLISIS DE DUPLICACIONES ACTUALES' as tipo, '' as detalle
UNION ALL
SELECT 'Total registros en responsable_rutas', CAST(COUNT(*) AS CHAR) FROM responsable_rutas
UNION ALL
SELECT 'Responsables únicos por nombre', CAST(COUNT(DISTINCT res_nombre) AS CHAR) FROM responsable_rutas
UNION ALL
SELECT 'Responsables únicos por usu_id', CAST(COUNT(DISTINCT usu_id) AS CHAR) FROM responsable_rutas;

-- Ver duplicaciones específicas
SELECT 
    res_nombre,
    res_telefono,
    COUNT(*) as veces_repetido,
    GROUP_CONCAT(rut_id ORDER BY rut_id) as rutas_asignadas
FROM responsable_rutas 
GROUP BY res_nombre, res_telefono
HAVING COUNT(*) > 1
ORDER BY veces_repetido DESC;

-- PASO 2: Crear nueva estructura sin duplicación
-- ==============================================

-- Crear tabla temporal para mapeo de responsables
CREATE TEMPORARY TABLE temp_responsables_unicos (
    usu_id INT,
    res_nombre VARCHAR(255),
    res_telefono VARCHAR(255),
    INDEX(usu_id)
);

-- Insertar responsables únicos
INSERT INTO temp_responsables_unicos (usu_id, res_nombre, res_telefono)
SELECT DISTINCT usu_id, res_nombre, res_telefono 
FROM responsable_rutas;

-- PASO 3: Crear nueva tabla optimizada (solo relaciones)
-- ======================================================
CREATE TABLE responsable_rutas_nuevas (
    rr_id INT AUTO_INCREMENT PRIMARY KEY,
    usu_id INT NOT NULL,
    rut_id INT NOT NULL,
    rr_rol ENUM('Profesional', 'Auxiliar') DEFAULT 'Profesional',
    rr_fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rr_activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usu_id) REFERENCES cuentas(usu_id) ON DELETE CASCADE,
    FOREIGN KEY (rut_id) REFERENCES rutas(rut_id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_ruta (usu_id, rut_id)
);

-- PASO 4: Migrar datos sin duplicación
-- ====================================
INSERT INTO responsable_rutas_nuevas (usu_id, rut_id, rr_rol)
SELECT DISTINCT 
    rr.usu_id,
    rr.rut_id,
    'Profesional' as rr_rol
FROM responsable_rutas rr;

-- PASO 5: Completar información en usuarios_info si falta
-- =======================================================

-- Verificar si existen usuarios_info para todos los responsables
SELECT 'VERIFICACIÓN usuarios_info' as tipo, '' as detalle
UNION ALL
SELECT 'Responsables con cuenta pero sin info', 
       CAST(COUNT(*) AS CHAR)
FROM temp_responsables_unicos tru
LEFT JOIN usuarios_info ui ON tru.usu_id = ui.usu_id
WHERE ui.usu_cedula IS NULL;

-- Insertar información faltante en usuarios_info
INSERT INTO usuarios_info (
    usu_cedula, 
    usu_id, 
    are_id, 
    usu_primer_nombre, 
    usu_segundo_nombre, 
    usu_primer_apellido, 
    usu_segundo_apellido, 
    usu_telefono, 
    usu_direccion
)
SELECT 
    (@cedula := @cedula + 1) as usu_cedula,
    tru.usu_id,
    1 as are_id, -- Área por defecto
    SUBSTRING_INDEX(tru.res_nombre, ' ', 1) as usu_primer_nombre,
    CASE 
        WHEN CHAR_LENGTH(tru.res_nombre) - CHAR_LENGTH(REPLACE(tru.res_nombre, ' ', '')) >= 2 
        THEN SUBSTRING_INDEX(SUBSTRING_INDEX(tru.res_nombre, ' ', 2), ' ', -1)
        ELSE NULL 
    END as usu_segundo_nombre,
    CASE 
        WHEN CHAR_LENGTH(tru.res_nombre) - CHAR_LENGTH(REPLACE(tru.res_nombre, ' ', '')) >= 2 
        THEN SUBSTRING_INDEX(SUBSTRING_INDEX(tru.res_nombre, ' ', 3), ' ', -1)
        ELSE SUBSTRING_INDEX(tru.res_nombre, ' ', -1)
    END as usu_primer_apellido,
    CASE 
        WHEN CHAR_LENGTH(tru.res_nombre) - CHAR_LENGTH(REPLACE(tru.res_nombre, ' ', '')) >= 3 
        THEN SUBSTRING_INDEX(tru.res_nombre, ' ', -1)
        ELSE 'Sin Apellido'
    END as usu_segundo_apellido,
    tru.res_telefono,
    'Dirección no especificada' as usu_direccion
FROM temp_responsables_unicos tru
CROSS JOIN (SELECT @cedula := 2000000000) as init
LEFT JOIN usuarios_info ui ON tru.usu_id = ui.usu_id
WHERE ui.usu_cedula IS NULL;

-- PASO 6: Crear vista para compatibilidad con código existente
-- ============================================================
CREATE VIEW vista_responsable_rutas AS
SELECT 
    rrn.rr_id as res_id,
    rrn.usu_id,
    rrn.rut_id,
    CONCAT(ui.usu_primer_nombre, ' ', 
           COALESCE(ui.usu_segundo_nombre, ''), ' ',
           ui.usu_primer_apellido, ' ', 
           ui.usu_segundo_apellido) as res_nombre,
    rrn.rr_rol as res_rol,
    c.usu_correo as res_correo,
    ui.usu_telefono as res_telefono,
    r.rut_nombre,
    rrn.rr_activo,
    rrn.rr_fecha_asignacion
FROM responsable_rutas_nuevas rrn
JOIN cuentas c ON rrn.usu_id = c.usu_id
JOIN usuarios_info ui ON c.usu_id = ui.usu_id
JOIN rutas r ON rrn.rut_id = r.rut_id
WHERE rrn.rr_activo = TRUE;

-- PASO 7: Backup y reemplazo de tabla original
-- =============================================

-- Crear backup de la tabla original
CREATE TABLE responsable_rutas_backup AS SELECT * FROM responsable_rutas;

-- Eliminar tabla original
DROP TABLE responsable_rutas;

-- Renombrar nueva tabla
RENAME TABLE responsable_rutas_nuevas TO responsable_rutas;

-- PASO 8: Actualizar referencias en tablas dependientes
-- =====================================================

-- Verificar qué tablas referencian responsable_rutas
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME = 'responsable_rutas'
AND TABLE_SCHEMA = DATABASE();

-- PASO 9: Consultas de verificación
-- =================================

-- Ver estructura limpia
SELECT 'ESTRUCTURA DESPUÉS DE LIMPIEZA' as tipo, '' as detalle
UNION ALL
SELECT 'Total registros en responsable_rutas', CAST(COUNT(*) AS CHAR) FROM responsable_rutas
UNION ALL
SELECT 'Responsables únicos', CAST(COUNT(DISTINCT usu_id) AS CHAR) FROM responsable_rutas
UNION ALL
SELECT 'Rutas con responsables', CAST(COUNT(DISTINCT rut_id) AS CHAR) FROM responsable_rutas;

-- Ver responsables y sus rutas asignadas
SELECT 
    ui.usu_cedula,
    CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as nombre_responsable,
    c.usu_correo,
    ui.usu_telefono,
    COUNT(rr.rut_id) as total_rutas,
    GROUP_CONCAT(r.rut_nombre ORDER BY r.rut_nombre SEPARATOR ', ') as rutas_asignadas
FROM responsable_rutas rr
JOIN cuentas c ON rr.usu_id = c.usu_id
JOIN usuarios_info ui ON c.usu_id = ui.usu_id
JOIN rutas r ON rr.rut_id = r.rut_id
WHERE rr.rr_activo = TRUE
GROUP BY ui.usu_cedula, ui.usu_primer_nombre, ui.usu_primer_apellido, c.usu_correo, ui.usu_telefono
ORDER BY nombre_responsable;

-- Ver rutas y sus responsables
SELECT 
    r.rut_id,
    r.rut_nombre,
    COUNT(rr.usu_id) as total_responsables,
    GROUP_CONCAT(
        CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido, ' (', rr.rr_rol, ')')
        ORDER BY ui.usu_primer_nombre SEPARATOR ', '
    ) as responsables_asignados
FROM rutas r
LEFT JOIN responsable_rutas rr ON r.rut_id = rr.rut_id AND rr.rr_activo = TRUE
LEFT JOIN cuentas c ON rr.usu_id = c.usu_id
LEFT JOIN usuarios_info ui ON c.usu_id = ui.usu_id
GROUP BY r.rut_id, r.rut_nombre
ORDER BY r.rut_nombre;

-- Limpiar tabla temporal
DROP TEMPORARY TABLE temp_responsables_unicos;

-- PASO 10: Resumen final
-- ======================
SELECT 'RESUMEN DE LIMPIEZA COMPLETADA' as estado, '' as detalle
UNION ALL
SELECT 'Tabla responsable_rutas', 'OPTIMIZADA SIN DUPLICACIÓN'
UNION ALL
SELECT 'Vista vista_responsable_rutas', 'CREADA PARA COMPATIBILIDAD'
UNION ALL
SELECT 'Backup tabla original', 'responsable_rutas_backup'; 