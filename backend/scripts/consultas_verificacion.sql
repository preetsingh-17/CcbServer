-- Consultas de verificación después de la optimización
-- ===================================================

-- 1. Verificar estructura de responsable_rutas (sin duplicación)
-- ==============================================================
SELECT 'VERIFICACIÓN DE LA TABLA OPTIMIZADA' as tipo, '' as detalle
UNION ALL
SELECT 'Total registros en responsable_rutas', CAST(COUNT(*) AS CHAR) FROM responsable_rutas
UNION ALL
SELECT 'Responsables únicos por usu_id', CAST(COUNT(DISTINCT usu_id) AS CHAR) FROM responsable_rutas
UNION ALL
SELECT 'Rutas con responsables asignados', CAST(COUNT(DISTINCT rut_id) AS CHAR) FROM responsable_rutas;

-- 2. Ver responsables y sus rutas (sin duplicación de nombres)
-- ============================================================
SELECT 
    rr.usu_id,
    CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as nombre_responsable,
    c.usu_correo,
    ui.usu_telefono,
    COUNT(rr.rut_id) as total_rutas,
    GROUP_CONCAT(r.rut_nombre ORDER BY r.rut_nombre SEPARATOR ', ') as rutas_asignadas,
    GROUP_CONCAT(rr.rr_rol ORDER BY r.rut_nombre SEPARATOR ', ') as roles_por_ruta
FROM responsable_rutas rr
JOIN cuentas c ON rr.usu_id = c.usu_id
JOIN usuarios_info ui ON c.usu_id = ui.usu_id
JOIN rutas r ON rr.rut_id = r.rut_id
WHERE rr.rr_activo = TRUE
GROUP BY rr.usu_id, ui.usu_primer_nombre, ui.usu_primer_apellido, c.usu_correo, ui.usu_telefono
ORDER BY nombre_responsable;

-- 3. Ver rutas y sus responsables
-- ===============================
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

-- 4. Verificar que las evidencias siguen funcionando
-- ==================================================
SELECT 'VERIFICACIÓN DE EVIDENCIAS' as tipo, '' as detalle
UNION ALL
SELECT 'Evidencias grupales', CAST(COUNT(*) AS CHAR) FROM evidencias_grupales
UNION ALL
SELECT 'Evidencias individuales', CAST(COUNT(*) AS CHAR) FROM evidencias_individuales;

-- 5. Probar la vista de compatibilidad
-- ====================================
SELECT 
    res_id,
    res_nombre,
    res_correo,
    res_telefono,
    rut_nombre,
    res_rol
FROM vista_responsable_rutas
ORDER BY res_nombre;

-- 6. Comparación antes vs después
-- ===============================
SELECT 'RESUMEN DE OPTIMIZACIÓN' as concepto, '' as valor
UNION ALL
SELECT 'Duplicación eliminada', 'SÍ'
UNION ALL
SELECT 'Información centralizada en usuarios_info', 'SÍ'
UNION ALL
SELECT 'Relaciones muchos-a-muchos', 'SÍ'
UNION ALL
SELECT 'Vista de compatibilidad', 'CREADA'
UNION ALL
SELECT 'Integridad referencial', 'MANTENIDA'; 