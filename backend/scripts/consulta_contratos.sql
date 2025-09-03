-- Consulta para verificar todos los contratos con consecutivos asignados
-- ==================================================================

SELECT 
    c.oamp,
    c.oamp_consecutivo,
    c.usu_cedula,
    CONCAT(ui.usu_primer_nombre, ' ', 
           COALESCE(ui.usu_segundo_nombre, ''), ' ',
           ui.usu_primer_apellido, ' ', 
           ui.usu_segundo_apellido) as nombre_consultor,
    c.oamp_valor_total,
    c.oamp_estado,
    LEFT(c.oamp_terminos, 50) as terminos_resumidos,
    c.oamp_fecha_generacion
FROM contratos c
JOIN usuarios_info ui ON c.usu_cedula = ui.usu_cedula
ORDER BY c.oamp_consecutivo;

-- Resumen de contratos por estado
-- ===============================
SELECT 
    oamp_estado,
    COUNT(*) as total_contratos,
    SUM(oamp_valor_total) as valor_total,
    AVG(oamp_valor_total) as valor_promedio
FROM contratos
GROUP BY oamp_estado;

-- Lista de consecutivos asignados
-- ==============================
SELECT 
    ROW_NUMBER() OVER (ORDER BY oamp_consecutivo) as numero,
    oamp_consecutivo,
    usu_cedula,
    CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as consultor,
    FORMAT(oamp_valor_total, 0) as valor_formateado
FROM contratos c
JOIN usuarios_info ui ON c.usu_cedula = ui.usu_cedula
ORDER BY oamp_consecutivo;

-- Verificación de consecutivos únicos
-- ===================================
SELECT 'VERIFICACIÓN DE CONSECUTIVOS' as tipo, '' as valor
UNION ALL
SELECT 'Total contratos', CAST(COUNT(*) AS CHAR) FROM contratos
UNION ALL
SELECT 'Consecutivos únicos', CAST(COUNT(DISTINCT oamp_consecutivo) AS CHAR) FROM contratos
UNION ALL
SELECT 'Hay duplicados?', 
       CASE WHEN COUNT(*) = COUNT(DISTINCT oamp_consecutivo) 
            THEN 'NO' 
            ELSE 'SÍ' 
       END
FROM contratos; 