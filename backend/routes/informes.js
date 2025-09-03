const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// El endpoint no cambia
router.get('/por-ruta/:rutaId', authenticateToken, async (req, res) => {
    const { rutaId } = req.params;

    if (!rutaId) {
        return res.status(400).json({ success: false, message: "El ID de la ruta es requerido." });
    }

    try {
        // --- 1. Obtener detalles de la ruta y programa (sin cambios) ---
        const rutaInfoQuery = executeQuery(
            `SELECT r.rut_nombre, p.prog_nombre 
             FROM rutas r 
             JOIN programa_ruta pr ON r.rut_id = pr.rut_id
             JOIN programas p ON pr.prog_id = p.prog_id
             WHERE r.rut_id = ?`,
            [rutaId]
        );

        // --- 2. Obtener TODAS las evidencias INDIVIDUALES con los campos nuevos ---
        const individualesQuery = executeQuery(
            `SELECT 
                pi.proin_id, pi.proin_fecha_formacion, pi.proin_codigo_agenda, pi.proin_hora_inicio, pi.proin_hora_fin, pi.proin_enlace, pi.proin_nombre_empresario, pi.proin_identificacion_empresario,
                ei.*,
                ui.usu_primer_nombre, ui.usu_primer_apellido
             FROM evidencias_individuales ei
             JOIN programaciones_individuales pi ON ei.proin_id = pi.proin_id
             JOIN programa_ruta pr ON pi.pr_id = pr.pr_id
             JOIN usuarios_info ui ON ei.usu_cedula = ui.usu_cedula
             WHERE pr.rut_id = ?`,
            [rutaId]
        );

        // --- 3. Obtener TODAS las evidencias GRUPALES con los campos nuevos ---
        const grupalesQuery = executeQuery(
            `SELECT 
                pg.pro_id, pg.pro_fecha_formacion, pg.pro_codigo_agenda, pg.pro_hora_inicio, pg.pro_hora_fin, pg.pro_tematica, pg.pro_enlace,
                eg.*,
                ui.usu_primer_nombre, ui.usu_primer_apellido
             FROM evidencias_grupales eg
             JOIN programaciones_grupales pg ON eg.pro_id = pg.pro_id
             JOIN programa_ruta pr ON pg.pr_id = pr.pr_id
             JOIN usuarios_info ui ON eg.usu_cedula = ui.usu_cedula
             WHERE pr.rut_id = ?`,
            [rutaId]
        );

        // --- 4. NUEVA CONSULTA: Obtener datos de la tabla informes para esta ruta ---
        const informesQuery = executeQuery(
            `SELECT 
                i.info_valor_total_contrato,
                i.info_valor_facturar,
                i.info_ejecutado_acumulado,
                i.info_valor_saldo_contrato,
                i.info_total_horas,
                i.info_horas_facturadas,
                i.info_horas_ejecutadas_acumulado,
                i.info_horas_saldo_contrato,
                i.info_seg_mes,
                i.info_seg_ejecucion_horas,
                c.oamp_consecutivo,
                CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as consultor_nombre
             FROM informes i
             JOIN contratos c ON i.oamp = c.oamp
             JOIN usuarios_info ui ON i.usu_cedula = ui.usu_cedula
             JOIN (
                 SELECT DISTINCT pi.oamp 
                 FROM programaciones_individuales pi
                 JOIN programa_ruta pr ON pi.pr_id = pr.pr_id
                 WHERE pr.rut_id = ?
                 UNION
                 SELECT DISTINCT pg.oamp 
                 FROM programaciones_grupales pg
                 JOIN programa_ruta pr ON pg.pr_id = pr.pr_id
                 WHERE pr.rut_id = ?
             ) contratos_ruta ON i.oamp = contratos_ruta.oamp
             ORDER BY i.info_id DESC`,
            [rutaId, rutaId]
        );
        
        const [rutaInfoResult, individualesResult, grupalesResult, informesResult] = await Promise.all([
            rutaInfoQuery, 
            individualesQuery,
            grupalesQuery,
            informesQuery
        ]);

        if (!rutaInfoResult.success || !individualesResult.success || !grupalesResult.success || !informesResult.success) {
            throw new Error("Error al obtener los datos del informe desde la base de datos.");
        }

        const allIndividualEvidences = individualesResult.data;
        const allGrupalEvidences = grupalesResult.data;
        const informesData = informesResult.data;
        
        // --- 5. Agrupar Evidencias por Programación con los nuevos campos ---
        const groupEvidences = (evidences, idKey, type) => {
            const programmingData = evidences.reduce((acc, ev) => {
                const key = ev[idKey];
                if (!acc[key]) {
                    // Inicializa la programación con sus datos
                    acc[key] = {
                        id: key,
                        evidencias: [],
                        // Se agregan los campos específicos de cada tipo
                        ...(type === 'individual' && {
                            fecha: ev.proin_fecha_formacion,
                            codigo_agenda: ev.proin_codigo_agenda,
                            hora_inicio: ev.proin_hora_inicio,
                            hora_fin: ev.proin_hora_fin,
                            link_ingreso: ev.proin_enlace,
                            nombre_empresario: ev.proin_nombre_empresario,
                            id_empresario: ev.proin_identificacion_empresario
                        }),
                        ...(type === 'grupal' && {
                            fecha: ev.pro_fecha_formacion,
                            // CORRECCIÓN APLICADA AQUÍ:
                            codigo_agenda: ev.pro_codigo_agenda, 
                            hora_inicio: ev.pro_hora_inicio,
                            hora_fin: ev.pro_hora_fin,
                            tematica: ev.pro_tematica,
                        })
                    };
                }
                acc[key].evidencias.push(ev);
                return acc;
            }, {});

            // Calcula el total de horas dictadas por programación y lo convierte a array
            return Object.values(programmingData).map(prog => {
                const totalHorasDictadas = prog.evidencias.reduce((sum, ev) => sum + (ev.eviin_horas_dictar || ev.evi_horas_dictar), 0);
                return { ...prog, total_horas_dictadas: totalHorasDictadas };
            });
        };
        
        const asesoriasIndividualesAgrupadas = groupEvidences(allIndividualEvidences, 'proin_id', 'individual');
        const talleresGrupalesAgrupados = groupEvidences(allGrupalEvidences, 'pro_id', 'grupal');
        
        // --- 6. Calcular Resúmenes y Seguimiento por Mes (lógica sin cambios) ---
        const horasPorMes = {};
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        monthNames.forEach(m => horasPorMes[m] = 0); // Inicializar todos los meses
        const allEvidences = [...allIndividualEvidences, ...allGrupalEvidences];

        allEvidences.forEach(ev => {
            const fechaEjecucion = new Date(ev.eviin_fecha || ev.evi_fecha);
            const mesNombre = monthNames[fechaEjecucion.getUTCMonth()]; // Usar getUTCMonth para evitar problemas de zona horaria
            const horasEjecutadas = ev.eviin_horas_dictar || ev.evi_horas_dictar;
            if (mesNombre && typeof horasEjecutadas === 'number') {
                horasPorMes[mesNombre] += horasEjecutadas;
            }
        });

        // --- 7. CALCULAR RESUMEN COMPLETO CON DATOS DE INFORMES ---
        // Calcular totales básicos de evidencias
        const totalHorasEjecutadas = allEvidences.reduce((sum, item) => sum + (item.eviin_horas_dictar || item.evi_horas_dictar), 0);
        const valorTotalEjecutado = allEvidences.reduce((sum, item) => sum + (item.eviin_valor_total_horas || item.evi_valor_total_horas), 0);
        
        // Calcular resumen agregado de la tabla informes
        const resumenInformes = informesData.reduce((acc, informe) => {
            return {
                valorContratoTotal: acc.valorContratoTotal + (informe.info_valor_total_contrato || 0),
                valorEjecutadoAcumulado: Math.max(acc.valorEjecutadoAcumulado, informe.info_ejecutado_acumulado || 0),
                valorFacturar: acc.valorFacturar + (informe.info_valor_facturar || 0),
                saldoValorContrato: Math.max(acc.saldoValorContrato, informe.info_valor_saldo_contrato || 0),
                totalHoras: Math.max(acc.totalHoras, informe.info_total_horas || 0),
                horasFacturadas: acc.horasFacturadas + (informe.info_horas_facturadas || 0),
                horasEjecutadasAcumulado: Math.max(acc.horasEjecutadasAcumulado, informe.info_horas_ejecutadas_acumulado || 0),
                saldoHoras: Math.max(acc.saldoHoras, informe.info_horas_saldo_contrato || 0)
            };
        }, {
            valorContratoTotal: 0,
            valorEjecutadoAcumulado: 0,
            valorFacturar: 0,
            saldoValorContrato: 0,
            totalHoras: 0,
            horasFacturadas: 0,
            horasEjecutadasAcumulado: 0,
            saldoHoras: 0
        });

        // --- 8. CONSTRUIR RESPUESTA COMPLETA ---
        res.json({
            success: true,
            data: {
                rutaInfo: rutaInfoResult.data[0] || {},
                resumen: { 
                    // Datos básicos calculados de evidencias (compatibilidad hacia atrás)
                    totalHoras: totalHorasEjecutadas, 
                    valorTotal: valorTotalEjecutado, 
                    horasPorMes,
                    
                    // NUEVOS DATOS COMPLETOS DE LA TABLA INFORMES
                    informacionContrato: {
                        valorContratoTotal: resumenInformes.valorContratoTotal,
                        valorEjecutadoAcumulado: resumenInformes.valorEjecutadoAcumulado,
                        valorFacturar: resumenInformes.valorFacturar,
                        saldoValorContrato: resumenInformes.saldoValorContrato,
                        totalHoras: resumenInformes.totalHoras,
                        horasFacturadas: resumenInformes.horasFacturadas,
                        horasEjecutadasAcumulado: resumenInformes.horasEjecutadasAcumulado,
                        saldoHoras: resumenInformes.saldoHoras
                    },
                    
                    // Detalle de informes por consultor/contrato
                    detalleInformes: informesData.map(informe => ({
                        consultor: informe.consultor_nombre,
                        contrato: informe.oamp_consecutivo,
                        mes: informe.info_seg_mes,
                        horasEjecutadas: informe.info_seg_ejecucion_horas,
                        valorContratoTotal: informe.info_valor_total_contrato,
                        valorFacturar: informe.info_valor_facturar,
                        valorEjecutadoAcumulado: informe.info_ejecutado_acumulado,
                        saldoValorContrato: informe.info_valor_saldo_contrato,
                        totalHoras: informe.info_total_horas,
                        horasFacturadas: informe.info_horas_facturadas,
                        horasEjecutadasAcumulado: informe.info_horas_ejecutadas_acumulado,
                        saldoHoras: informe.info_horas_saldo_contrato
                    }))
                },
                asesoriasIndividuales: asesoriasIndividualesAgrupadas,
                talleresGrupales: talleresGrupalesAgrupados
            }
        });

    } catch (error) {
        console.error("Error generando el informe por ruta:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// Endpoint para obtener lista de programas disponibles
router.get('/programas', async (req, res) => {
    try {
        const programasQuery = `
            SELECT 
                p.prog_id,
                p.prog_nombre,
                p.prog_total_horas,
                COUNT(pr.rut_id) as total_rutas,
                GROUP_CONCAT(r.rut_nombre ORDER BY r.rut_nombre SEPARATOR ' | ') as rutas_asociadas
            FROM programas p
            LEFT JOIN programa_ruta pr ON p.prog_id = pr.prog_id
            LEFT JOIN rutas r ON pr.rut_id = r.rut_id
            GROUP BY p.prog_id, p.prog_nombre, p.prog_total_horas
            ORDER BY p.prog_nombre
        `;

        const programas = await executeQuery(programasQuery);
        res.json(programas);
    } catch (error) {
        console.error('Error al obtener programas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para generar informe por programa
router.get('/por-programa/:programaId', async (req, res) => {
    try {
        const { programaId } = req.params;
        const { mes, año, gestoraCedula } = req.query;

        // Validar parámetros requeridos
        if (!programaId) {
            return res.status(400).json({ error: 'ID del programa es requerido' });
        }

        // 1. Obtener información del programa
        const programaInfoQuery = `
            SELECT 
                p.prog_id,
                p.prog_nombre,
                p.prog_total_horas,
                COUNT(pr.rut_id) as total_rutas
            FROM programas p
            LEFT JOIN programa_ruta pr ON p.prog_id = pr.prog_id
            WHERE p.prog_id = ?
            GROUP BY p.prog_id, p.prog_nombre, p.prog_total_horas
        `;

        // 2. Obtener todas las rutas asociadas al programa
        const rutasDelProgramaQuery = `
            SELECT 
                r.rut_id,
                r.rut_nombre,
                r.rut_descripcion,
                r.rut_total_horas,
                r.rut_candidatos
            FROM programa_ruta pr
            JOIN rutas r ON pr.rut_id = r.rut_id
            WHERE pr.prog_id = ?
            ORDER BY r.rut_nombre
        `;

        // 3. Query principal de programaciones grupales (adaptado para múltiples rutas)
        let programacionesQuery = `
            SELECT 
                pg.pro_id,
                pg.usu_cedula,
                CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as consultor_nombre,
                pg.pr_id,
                pr.prog_id,
                pr.rut_id,
                r.rut_nombre,
                pg.pro_tematica,
                pg.pro_mes,
                pg.pro_fecha_formacion,
                CONCAT(pg.pro_hora_inicio, ' - ', pg.pro_hora_fin) as horario,
                pg.pro_horas_dictar,
                pg.pro_estado,
                pg.pro_valor_hora,
                pg.pro_valor_total_hora_pagar as valor_total,
                pg.pro_coordinador_ccb,
                pg.pro_direccion,
                pg.pro_entregables,
                pg.pro_observaciones,
                m.mod_nombre as modalidad,
                a.act_tipo as tipo_actividad
            FROM programaciones_grupales pg
            JOIN programa_ruta pr ON pg.pr_id = pr.pr_id
            JOIN rutas r ON pr.rut_id = r.rut_id
            JOIN usuarios_info ui ON pg.usu_cedula = ui.usu_cedula
            JOIN modalidades m ON pg.mod_id = m.mod_id
            JOIN actividades a ON pg.act_id = a.act_id
            WHERE pr.prog_id = ?
        `;

        // 4. Query de programaciones individuales (adaptado para múltiples rutas)
        let individualesQuery = `
            SELECT 
                pi.proin_id,
                pi.usu_cedula,
                CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as consultor_nombre,
                pi.pr_id,
                pr.prog_id,
                pr.rut_id,
                r.rut_nombre,
                pi.proin_tematica as pro_tematica,
                pi.proin_mes as pro_mes,
                pi.proin_fecha_formacion as pro_fecha_formacion,
                CONCAT(pi.proin_hora_inicio, ' - ', pi.proin_hora_fin) as horario,
                pi.proin_horas_dictar as pro_horas_dictar,
                pi.proin_estado as pro_estado,
                pi.proin_valor_hora as pro_valor_hora,
                pi.proin_valor_total_hora_pagar as valor_total,
                pi.proin_coordinador_ccb as pro_coordinador_ccb,
                pi.proin_direccion as pro_direccion,
                pi.proin_entregables as pro_entregables,
                pi.proin_observaciones as pro_observaciones,
                pi.proin_nombre_empresario,
                pi.proin_identificacion_empresario,
                m.mod_nombre as modalidad,
                a.act_tipo as tipo_actividad
            FROM programaciones_individuales pi
            JOIN programa_ruta pr ON pi.pr_id = pr.pr_id
            JOIN rutas r ON pr.rut_id = r.rut_id
            JOIN usuarios_info ui ON pi.usu_cedula = ui.usu_cedula
            JOIN modalidades m ON pi.mod_id = m.mod_id
            JOIN actividades a ON pi.act_id = a.act_id
            WHERE pr.prog_id = ?
        `;

        // 5. Query de evidencias grupales CON ESTRUCTURA IGUAL AL ENDPOINT POR RUTA
        let evidenciasGrupalesQuery = `
            SELECT 
                pg.pro_id, pg.pro_fecha_formacion, pg.pro_codigo_agenda, pg.pro_hora_inicio, pg.pro_hora_fin, pg.pro_tematica, pg.pro_enlace,
                eg.*,
                ui.usu_primer_nombre, ui.usu_primer_apellido
            FROM evidencias_grupales eg
            JOIN programaciones_grupales pg ON eg.pro_id = pg.pro_id
            JOIN programa_ruta pr ON pg.pr_id = pr.pr_id
            JOIN usuarios_info ui ON eg.usu_cedula = ui.usu_cedula
            WHERE pr.prog_id = ?
        `;

        // 6. Query de evidencias individuales CON ESTRUCTURA IGUAL AL ENDPOINT POR RUTA  
        let evidenciasIndividualesQuery = `
            SELECT 
                pi.proin_id, pi.proin_fecha_formacion, pi.proin_codigo_agenda, pi.proin_hora_inicio, pi.proin_hora_fin, pi.proin_enlace, pi.proin_nombre_empresario, pi.proin_identificacion_empresario,
                ei.*,
                ui.usu_primer_nombre, ui.usu_primer_apellido
            FROM evidencias_individuales ei
            JOIN programaciones_individuales pi ON ei.proin_id = pi.proin_id
            JOIN programa_ruta pr ON pi.pr_id = pr.pr_id
            JOIN usuarios_info ui ON ei.usu_cedula = ui.usu_cedula
            WHERE pr.prog_id = ?
        `;

        // 7. Query de informes consolidados
        const informesQuery = `
            SELECT
                i.info_valor_total_contrato,
                i.info_valor_facturar,
                i.info_ejecutado_acumulado,
                i.info_valor_saldo_contrato,
                i.info_total_horas,
                i.info_horas_facturadas,
                i.info_horas_ejecutadas_acumulado,
                i.info_horas_saldo_contrato,
                i.info_seg_mes,
                i.info_seg_ejecucion_horas,
                c.oamp_consecutivo,
                CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as consultor_nombre,
                rutas_info.rut_nombre
            FROM informes i
            JOIN contratos c ON i.oamp = c.oamp
            JOIN usuarios_info ui ON i.usu_cedula = ui.usu_cedula
            JOIN (
                SELECT DISTINCT pi.oamp, pr.prog_id
                FROM programaciones_individuales pi
                JOIN programa_ruta pr ON pi.pr_id = pr.pr_id
                WHERE pr.prog_id = ?
                UNION
                SELECT DISTINCT pg.oamp, pr.prog_id
                FROM programaciones_grupales pg
                JOIN programa_ruta pr ON pg.pr_id = pr.pr_id
                WHERE pr.prog_id = ?
            ) contratos_programa ON i.oamp = contratos_programa.oamp
            LEFT JOIN (
                SELECT DISTINCT pr.prog_id, r.rut_nombre
                FROM programa_ruta pr
                JOIN rutas r ON pr.rut_id = r.rut_id
                WHERE pr.prog_id = ?
            ) rutas_info ON rutas_info.prog_id = contratos_programa.prog_id
            ORDER BY i.info_id DESC
        `;

        // Aplicar filtros de mes y gestora si se proporcionan
        const queryParams = [programaId];
        
        if (mes) {
            programacionesQuery += ` AND pg.pro_mes = ?`;
            individualesQuery += ` AND pi.proin_mes = ?`;
            evidenciasGrupalesQuery += ` AND eg.evi_mes = ?`;
            evidenciasIndividualesQuery += ` AND ei.eviin_mes = ?`;
            queryParams.push(mes);
        }

        if (gestoraCedula) {
            // Filtrar por consultores asignados a la gestora
            const consultoresGestoraQuery = `
                SELECT consultor_cedula 
                FROM gestora_consultores 
                WHERE gestora_cedula = ? AND gc_activo = TRUE
            `;
            const consultoresAsignados = await executeQuery(consultoresGestoraQuery, [gestoraCedula]);
            
            if (consultoresAsignados.length > 0) {
                const cedulasString = consultoresAsignados.map(c => c.consultor_cedula).join(',');
                programacionesQuery += ` AND pg.usu_cedula IN (${cedulasString})`;
                individualesQuery += ` AND pi.usu_cedula IN (${cedulasString})`;
                evidenciasGrupalesQuery += ` AND eg.usu_cedula IN (${cedulasString})`;
                evidenciasIndividualesQuery += ` AND ei.usu_cedula IN (${cedulasString})`;
            }
        }

        // Ordenar resultados
        programacionesQuery += ` ORDER BY pg.pro_fecha_formacion DESC`;
        individualesQuery += ` ORDER BY pi.proin_fecha_formacion DESC`;
        evidenciasGrupalesQuery += ` ORDER BY eg.evi_fecha DESC`;
        evidenciasIndividualesQuery += ` ORDER BY ei.eviin_fecha DESC`;

        // Ejecutar todas las consultas en paralelo
        const [
            programaInfo,
            rutasDelPrograma,
            programaciones,
            individuales,
            evidenciasGrupalesResult,
            evidenciasIndividualesResult,
            informes
        ] = await Promise.all([
            executeQuery(programaInfoQuery, [programaId]),
            executeQuery(rutasDelProgramaQuery, [programaId]),
            executeQuery(programacionesQuery, queryParams),
            executeQuery(individualesQuery, queryParams),
            executeQuery(evidenciasGrupalesQuery, queryParams),
            executeQuery(evidenciasIndividualesQuery, queryParams),
            executeQuery(informesQuery, [programaId, programaId, programaId])
        ]);

        // Validar que las consultas fueron exitosas
        if (!evidenciasGrupalesResult.success || !evidenciasIndividualesResult.success) {
            throw new Error("Error al obtener las evidencias desde la base de datos.");
        }

        const allGrupalEvidences = evidenciasGrupalesResult.data;
        const allIndividualEvidences = evidenciasIndividualesResult.data;

        // --- USAR LA MISMA FUNCIÓN groupEvidences DEL ENDPOINT POR RUTA ---
        const groupEvidences = (evidences, idKey, type) => {
            const programmingData = evidences.reduce((acc, ev) => {
                const key = ev[idKey];
                if (!acc[key]) {
                    // Inicializa la programación con sus datos
                    acc[key] = {
                        id: key,
                        evidencias: [],
                        // Se agregan los campos específicos de cada tipo
                        ...(type === 'individual' && {
                            fecha: ev.proin_fecha_formacion,
                            codigo_agenda: ev.proin_codigo_agenda,
                            hora_inicio: ev.proin_hora_inicio,
                            hora_fin: ev.proin_hora_fin,
                            link_ingreso: ev.proin_enlace,
                            nombre_empresario: ev.proin_nombre_empresario,
                            id_empresario: ev.proin_identificacion_empresario
                        }),
                        ...(type === 'grupal' && {
                            fecha: ev.pro_fecha_formacion,
                            codigo_agenda: ev.pro_codigo_agenda, 
                            hora_inicio: ev.pro_hora_inicio,
                            hora_fin: ev.pro_hora_fin,
                            tematica: ev.pro_tematica,
                        })
                    };
                }
                acc[key].evidencias.push(ev);
                return acc;
            }, {});

            // Calcula el total de horas dictadas por programación y lo convierte a array
            return Object.values(programmingData).map(prog => {
                const totalHorasDictadas = prog.evidencias.reduce((sum, ev) => sum + (ev.eviin_horas_dictar || ev.evi_horas_dictar), 0);
                return { ...prog, total_horas_dictadas: totalHorasDictadas };
            });
        };
        
        const asesoriasIndividualesAgrupadas = groupEvidences(allIndividualEvidences, 'proin_id', 'individual');
        const talleresGrupalesAgrupados = groupEvidences(allGrupalEvidences, 'pro_id', 'grupal');
        
        // --- CALCULAR HORAS POR MES IGUAL QUE EN EL ENDPOINT POR RUTA ---
        const horasPorMes = {};
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        monthNames.forEach(m => horasPorMes[m] = 0); // Inicializar todos los meses
        const allEvidences = [...allIndividualEvidences, ...allGrupalEvidences];

        allEvidences.forEach(ev => {
            const fechaEjecucion = new Date(ev.eviin_fecha || ev.evi_fecha);
            const mesNombre = monthNames[fechaEjecucion.getUTCMonth()]; // Usar getUTCMonth para evitar problemas de zona horaria
            const horasEjecutadas = ev.eviin_horas_dictar || ev.evi_horas_dictar;
            if (mesNombre && typeof horasEjecutadas === 'number') {
                horasPorMes[mesNombre] += horasEjecutadas;
            }
        });

        // Calcular totales del programa USANDO LAS EVIDENCIAS
        const totalHorasEjecutadas = allEvidences.reduce((sum, item) => sum + (item.eviin_horas_dictar || item.evi_horas_dictar), 0);
        const valorTotalEjecutado = allEvidences.reduce((sum, item) => sum + (item.eviin_valor_total_horas || item.evi_valor_total_horas), 0);

        // Calcular totales de informes
        const informacionContrato = (informes.data || []).reduce((acc, informe) => {
            acc.valorContratoTotal += informe.info_valor_total_contrato || 0;
            acc.valorEjecutadoAcumulado += informe.info_ejecutado_acumulado || 0;
            acc.valorFacturar += informe.info_valor_facturar || 0;
            acc.saldoValorContrato += informe.info_valor_saldo_contrato || 0;
            acc.totalHoras += informe.info_total_horas || 0;
            acc.horasFacturadas += informe.info_horas_facturadas || 0;
            acc.horasEjecutadasAcumulado += informe.info_horas_ejecutadas_acumulado || 0;
            acc.saldoHoras += informe.info_horas_saldo_contrato || 0;
            return acc;
        }, {
            valorContratoTotal: 0,
            valorEjecutadoAcumulado: 0,
            valorFacturar: 0,
            saldoValorContrato: 0,
            totalHoras: 0,
            horasFacturadas: 0,
            horasEjecutadasAcumulado: 0,
            saldoHoras: 0
        });

        // Preparar detalle de informes
        const detalleInformes = (informes.data || []).map(informe => ({
            consultor: informe.consultor_nombre,
            contrato: informe.oamp_consecutivo,
            ruta: informe.rut_nombre,
            mes: informe.info_seg_mes,
            horasEjecutadas: informe.info_seg_ejecucion_horas,
            valorFacturar: informe.info_valor_facturar,
            valorEjecutadoAcumulado: informe.info_ejecutado_acumulado,
            saldoValorContrato: informe.info_valor_saldo_contrato
        }));

        // Estructurar respuesta CON LA MISMA ESTRUCTURA QUE EL ENDPOINT POR RUTA
        const response = {
            programa: (programaInfo.data && programaInfo.data[0]) || {},
            rutasAsociadas: rutasDelPrograma.data || [],
            resumen: {
                // Datos básicos calculados de evidencias (compatibilidad hacia atrás)
                totalHoras: totalHorasEjecutadas,
                valorTotal: valorTotalEjecutado,
                horasPorMes,
                
                // NUEVOS DATOS COMPLETOS DE LA TABLA INFORMES
                informacionContrato,
                
                // Detalle de informes por consultor/contrato
                detalleInformes
            },
            // USAR LA MISMA ESTRUCTURA QUE EL ENDPOINT POR RUTA
            asesoriasIndividuales: asesoriasIndividualesAgrupadas,
            talleresGrupales: talleresGrupalesAgrupados,
            filtros: {
                mes: mes || 'Todos',
                año: año || 'Todos',
                gestoraCedula: gestoraCedula || 'Todas'
            }
        };

        res.json(response);

    } catch (error) {
        console.error('Error al generar informe por programa:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;