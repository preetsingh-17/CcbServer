const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/data', authenticateToken, async (req, res) => {
    try {
        // Verificar que el usuario sea Profesional o Administrador
        if (!['Profesional', 'Administrador'].includes(req.user.tipo_original)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acceso denegado. Solo profesionales y administradores pueden acceder al dashboard.' 
            });
        }

        // Consulta filtrada por las rutas asignadas al usuario logueado
        const query = `
            SELECT 
                p.prog_id,
                p.prog_nombre,
                p.prog_total_horas AS prog_horas_propuesta,
                r.rut_id,
                r.rut_nombre,
                r.rut_total_horas AS ruta_horas_propuesta,
                r.rut_descripcion,
                COALESCE(exec_stats.horas_ejecutadas, 0) AS horas_ejecutadas,
                COALESCE(exec_stats.valor_ejecutado, 0) AS valor_ejecutado,
                COALESCE(exec_stats.consultores_unicos, 0) AS consultores_unicos,
                rr.rr_rol AS rol_responsable
            FROM programas p
            JOIN programa_ruta pr ON p.prog_id = pr.prog_id
            JOIN rutas r ON pr.rut_id = r.rut_id
            -- Filtrar solo las rutas asignadas al usuario logueado
            JOIN responsable_rutas rr ON r.rut_id = rr.rut_id 
                AND rr.usu_id = ? 
                AND rr.rr_activo = TRUE
            LEFT JOIN (
                SELECT 
                    pr_id,
                    SUM(horas) as horas_ejecutadas,
                    SUM(valor) as valor_ejecutado,
                    COUNT(DISTINCT usu_cedula) as consultores_unicos
                FROM (
                    SELECT pr_id, usu_cedula, pro_horas_dictar AS horas, pro_valor_total_hora_pagar AS valor FROM programaciones_grupales WHERE pro_estado = 'Realizada'
                    UNION ALL
                    SELECT pr_id, usu_cedula, proin_horas_dictar AS horas, proin_valor_total_hora_pagar AS valor FROM programaciones_individuales WHERE proin_estado = 'Realizada'
                ) AS programaciones_realizadas
                GROUP BY pr_id
            ) AS exec_stats ON pr.pr_id = exec_stats.pr_id
            ORDER BY p.prog_id, r.rut_id;
        `;

        const result = await executeQuery(query, [req.user.id]);

        if (!result.success) {
            throw new Error('Error al obtener los datos del dashboard desde la base de datos.');
        }

        // Si no tiene rutas asignadas, devolver estructura vacía
        if (result.data.length === 0) {
            return res.json({ 
                success: true, 
                data: {
                    'general': {
                        id: 'general',
                        name: 'Vista General',
                        icon: '📊',
                        programStats: [
                            { title: 'Total Horas Propuesta', value: 0 },
                            { title: 'Horas Ejecutadas', value: 0 },
                            { title: 'Valor Ejecutado', value: 0 },
                        ],
                        programBarData: {
                            labels: [],
                            datasets: [{ label: 'Horas Totales por Programa', data: [], backgroundColor: [] }]
                        },
                        programDoughnutData: {
                            labels: ['Horas Ejecutadas', 'Horas Pendientes'],
                            datasets: [{ data: [0, 0], backgroundColor: ['rgba(227, 25, 55, 0.8)', 'rgba(228, 228, 228, 0.8)'] }]
                        },
                        rutas: []
                    }
                },
                message: 'No tienes rutas asignadas actualmente.'
            });
        }

        const dashboardData = {};
        let vistaGeneral = {
            total_horas_propuesta: 0,
            total_valor_propuesta: 0,
            total_horas_ejecutadas: 0,
            total_valor_ejecutado: 0,
            programas: {}
        };

        // Agrupar datos por programa primero, para asegurar que solo procesamos programas con rutas
        const programasConRutas = {};
        
        result.data.forEach(row => {
            if (!programasConRutas[row.prog_id]) {
                programasConRutas[row.prog_id] = {
                    programa_info: {
                        id: row.prog_id,
                        name: row.prog_nombre,
                        horas_propuesta: row.prog_horas_propuesta
                    },
                    rutas: []
                };
            }

            programasConRutas[row.prog_id].rutas.push({
                id: row.rut_id,
                name: `RUTA: ${row.rut_nombre}`,
                rol: row.rol_responsable,
                ruta_horas_propuesta: row.ruta_horas_propuesta,
                horas_ejecutadas: row.horas_ejecutadas,
                valor_ejecutado: row.valor_ejecutado,
                consultores_unicos: row.consultores_unicos,
                descripcion: row.rut_descripcion
            });
        });

        // Ahora construir dashboardData solo con programas que tienen rutas
        Object.keys(programasConRutas).forEach(progId => {
            const programaData = programasConRutas[progId];
            
            dashboardData[progId] = {
                id: programaData.programa_info.id,
                name: programaData.programa_info.name,
                icon: getIconForProgram(progId),
                programStats: {
                    total_horas_propuesta: programaData.programa_info.horas_propuesta,
                    total_valor_propuesta: 0,
                    horas_ejecutadas: 0,
                    valor_ejecutado: 0,
                    consultores_unicos: 0
                },
                rutas: []
            };

            // Procesar cada ruta del programa
            programaData.rutas.forEach(rutaData => {
                dashboardData[progId].rutas.push({
                    id: rutaData.id,
                    name: rutaData.name,
                    rol: rutaData.rol,
                    stats: [
                        { title: 'Total Horas Ruta', value: rutaData.ruta_horas_propuesta },
                        { title: 'Horas Ejecutadas', value: rutaData.horas_ejecutadas },
                        { title: 'Valor Ejecutado', value: rutaData.valor_ejecutado },
                        { title: 'Nº Consultores', value: rutaData.consultores_unicos }
                    ],
                    barData: {
                        labels: ['Ejecutadas', 'Pendientes'],
                        datasets: [{
                            label: 'Progreso Horas',
                            data: [rutaData.horas_ejecutadas, Math.max(0, rutaData.ruta_horas_propuesta - rutaData.horas_ejecutadas)],
                            backgroundColor: ['rgba(227, 25, 55, 0.8)', 'rgba(228, 228, 228, 0.8)']
                        }]
                    },
                    doughnutData: {
                        labels: ['Ejecutadas', 'Pendientes'],
                        datasets: [{
                            data: [rutaData.horas_ejecutadas, Math.max(0, rutaData.ruta_horas_propuesta - rutaData.horas_ejecutadas)],
                            backgroundColor: ['rgba(227, 25, 55, 0.8)', 'rgba(228, 228, 228, 0.8)']
                        }]
                    },
                    areaConocimiento: rutaData.descripcion
                });

                // Acumular estadísticas del programa
                dashboardData[progId].programStats.horas_ejecutadas += parseFloat(rutaData.horas_ejecutadas);
                dashboardData[progId].programStats.valor_ejecutado += parseFloat(rutaData.valor_ejecutado);
            });
        });

        // Calcular estadísticas y gráficos para cada programa
        for (const progId in dashboardData) {
            const programa = dashboardData[progId];
            
            // Agregar gráficos a nivel de programa
            programa.programBarData = {
                labels: programa.rutas.map(ruta => ruta.name.replace('RUTA: ', '')),
                datasets: [{
                    label: 'Horas Ejecutadas por Ruta',
                    data: programa.rutas.map(ruta => ruta.stats[1].value), // Horas ejecutadas
                    backgroundColor: 'rgba(227, 25, 55, 0.8)'
                }]
            };

            programa.programDoughnutData = {
                labels: ['Horas Ejecutadas', 'Horas Pendientes'],
                datasets: [{
                    data: [
                        programa.programStats.horas_ejecutadas,
                        Math.max(0, programa.programStats.total_horas_propuesta - programa.programStats.horas_ejecutadas)
                    ],
                    backgroundColor: ['rgba(227, 25, 55, 0.8)', 'rgba(228, 228, 228, 0.8)']
                }]
            };

            vistaGeneral.total_horas_propuesta += programa.programStats.total_horas_propuesta;
            vistaGeneral.total_horas_ejecutadas += programa.programStats.horas_ejecutadas;
            vistaGeneral.total_valor_ejecutado += programa.programStats.valor_ejecutado;
            vistaGeneral.programas[programa.name] = programa.programStats.total_horas_propuesta;
        }

        // Vista general con datos agregados
        dashboardData['general'] = {
            id: 'general',
            name: 'Vista General',
            icon: '📊',
            programStats: [
                { title: 'Total Horas Propuesta', value: vistaGeneral.total_horas_propuesta },
                { title: 'Horas Ejecutadas', value: vistaGeneral.total_horas_ejecutadas },
                { title: 'Valor Ejecutado', value: vistaGeneral.total_valor_ejecutado },
                { title: 'Nº Programas', value: Object.keys(vistaGeneral.programas).length }
            ],
            programBarData: {
                labels: Object.keys(vistaGeneral.programas),
                datasets: [{
                    label: 'Horas Totales por Programa',
                    data: Object.values(vistaGeneral.programas),
                    backgroundColor: ['rgba(227, 25, 55, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(75, 192, 192, 0.8)', 'rgba(120, 120, 120, 0.8)'],
                }]
            },
            programDoughnutData: {
                labels: ['Horas Ejecutadas', 'Horas Pendientes'],
                datasets: [{ 
                    data: [
                        vistaGeneral.total_horas_ejecutadas, 
                        Math.max(0, vistaGeneral.total_horas_propuesta - vistaGeneral.total_horas_ejecutadas)
                    ], 
                    backgroundColor: ['rgba(227, 25, 55, 0.8)', 'rgba(228, 228, 228, 0.8)'] 
                }]
            },
            rutas: []
        };
        
        res.json({ success: true, data: dashboardData });

    } catch (error) {
        console.error("Error en el endpoint del dashboard:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.', error: error.message });
    }
});

// Función auxiliar para obtener iconos según el programa
function getIconForProgram(progId) {
    const iconMap = {
        1: '📈', // Crecimiento Empresarial
        2: '🚀', // Emprendimiento
        3: '🏢', // Consolidación y escalamiento
        4: '🗣️'  // Foro presidentes
    };
    return iconMap[progId] || '📋';
}

module.exports = router;
