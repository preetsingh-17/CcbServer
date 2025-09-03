-- ===================================================================
-- VERIFICACIÓN DE ESTRUCTURA REGIONES Y MUNICIPIOS
-- ===================================================================

-- 1. Verificar datos de regiones con sus valores
SELECT 
    'REGIONES CON VALORES' as tipo,
    r.reg_id,
    vhr.val_reg_id,
    vhr.val_reg_hora_base,
    vhr.val_reg_traslado,
    vhr.val_reg_sin_dictar,
    vhr.val_reg_dos_horas,
    vhr.val_reg_tres_horas,
    vhr.val_reg_cuatro_mas_horas
FROM regiones r
JOIN valor_horas_region vhr ON r.reg_id = vhr.reg_id
ORDER BY r.reg_id;

-- 2. Verificar municipios por región
SELECT 
    'MUNICIPIOS POR REGIÓN' as tipo,
    r.reg_id,
    m.mun_id,
    m.mun_nombre,
    COUNT(*) OVER (PARTITION BY r.reg_id) as total_municipios_region
FROM regiones r
LEFT JOIN municipios m ON r.reg_id = m.reg_id
ORDER BY r.reg_id, m.mun_nombre;

-- 3. Resumen de municipios por región
SELECT 
    'RESUMEN POR REGIÓN' as tipo,
    r.reg_id,
    COUNT(m.mun_id) as total_municipios,
    GROUP_CONCAT(m.mun_nombre ORDER BY m.mun_nombre SEPARATOR ', ') as municipios
FROM regiones r
LEFT JOIN municipios m ON r.reg_id = m.reg_id
GROUP BY r.reg_id
ORDER BY r.reg_id;

-- 4. Verificar datos de prueba para frontend
SELECT 
    'DATOS PARA FRONTEND' as tipo,
    'Estructura que envía /api/programaciones/regiones' as descripcion,
    r.reg_id,
    vhr.val_reg_id,
    CONCAT('Región ', r.reg_id) as display_name
FROM regiones r
JOIN valor_horas_region vhr ON r.reg_id = vhr.reg_id
ORDER BY r.reg_id;

-- 5. Verificar datos de prueba para municipios
SELECT 
    'DATOS MUNICIPIOS REG01' as tipo,
    'Municipios que deben aparecer al seleccionar REG01' as descripcion,
    m.mun_id,
    m.mun_nombre
FROM municipios m
WHERE m.reg_id = 'REG01'
ORDER BY m.mun_nombre; 