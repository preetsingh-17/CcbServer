-- Consulta para ver todos los consultores poblados en usuarios_info
-- ================================================================

SELECT 
    ui.usu_cedula,
    ui.usu_id,
    c.usu_correo,
    c.usu_tipo,
    CONCAT(ui.usu_primer_nombre, 
           CASE WHEN ui.usu_segundo_nombre IS NOT NULL THEN CONCAT(' ', ui.usu_segundo_nombre) ELSE '' END,
           ' ', ui.usu_primer_apellido, 
           ' ', ui.usu_segundo_apellido) as nombre_completo,
    ui.usu_telefono,
    ui.usu_direccion,
    ak.are_descripcion
FROM usuarios_info ui
JOIN cuentas c ON ui.usu_id = c.usu_id
JOIN areas_conocimiento ak ON ui.are_id = ak.are_id
WHERE c.usu_tipo = 'Consultor'
ORDER BY ui.usu_primer_nombre, ui.usu_primer_apellido;

-- Resumen de consultores por área de conocimiento
-- ==============================================
SELECT 
    ak.are_id,
    LEFT(ak.are_descripcion, 50) as area_conocimiento_resumida,
    COUNT(ui.usu_cedula) as total_consultores,
    GROUP_CONCAT(
        CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido)
        ORDER BY ui.usu_primer_nombre SEPARATOR ', '
    ) as consultores
FROM usuarios_info ui
JOIN cuentas c ON ui.usu_id = c.usu_id
JOIN areas_conocimiento ak ON ui.are_id = ak.are_id
WHERE c.usu_tipo = 'Consultor'
GROUP BY ak.are_id, ak.are_descripcion
ORDER BY ak.are_id;

-- Estadísticas generales
-- =====================
SELECT 'ESTADÍSTICAS DE CONSULTORES' as concepto, '' as valor
UNION ALL
SELECT 'Total consultores registrados', CAST(COUNT(*) AS CHAR)
FROM usuarios_info ui
JOIN cuentas c ON ui.usu_id = c.usu_id
WHERE c.usu_tipo = 'Consultor'
UNION ALL
SELECT 'Áreas de conocimiento cubiertas', CAST(COUNT(DISTINCT ui.are_id) AS CHAR)
FROM usuarios_info ui
JOIN cuentas c ON ui.usu_id = c.usu_id
WHERE c.usu_tipo = 'Consultor'
UNION ALL
SELECT 'Rango de cédulas', CONCAT(
    CAST(MIN(ui.usu_cedula) AS CHAR), ' - ', CAST(MAX(ui.usu_cedula) AS CHAR)
)
FROM usuarios_info ui
JOIN cuentas c ON ui.usu_id = c.usu_id
WHERE c.usu_tipo = 'Consultor';

-- Lista completa de consultores (nombres originales)
-- =================================================
SELECT 
    ROW_NUMBER() OVER (ORDER BY ui.usu_primer_nombre, ui.usu_primer_apellido) as numero,
    ui.usu_cedula,
    CONCAT(ui.usu_primer_nombre, 
           CASE WHEN ui.usu_segundo_nombre IS NOT NULL THEN CONCAT(' ', ui.usu_segundo_nombre) ELSE '' END,
           ' ', ui.usu_primer_apellido, 
           ' ', ui.usu_segundo_apellido) as nombre_completo,
    ui.usu_telefono,
    SUBSTRING(ui.usu_direccion, 1, 30) as direccion_resumida
FROM usuarios_info ui
JOIN cuentas c ON ui.usu_id = c.usu_id
WHERE c.usu_tipo = 'Consultor'
ORDER BY ui.usu_primer_nombre, ui.usu_primer_apellido; 