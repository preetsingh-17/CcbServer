    const express = require('express');
    const router = express.Router();
    const { executeQuery } = require('../config/database');

    // ====================================================================
    // ENDPOINT: Obtener consultores asignados a una gestora
    // ====================================================================
    router.get('/consultores/:gestoraCedula', async (req, res) => {
        try {
            const { gestoraCedula } = req.params;
            
            if (!gestoraCedula) {
                return res.status(400).json({ 
                    success: false, error: 'La cédula de la gestora es requerida' 
                });
            }

            const query = `
                SELECT 
                    consultor_cedula, consultor_nombre, consultor_correo,
                    consultor_telefono, consultor_area_conocimiento,
                    gc_fecha_asignacion, gc_observaciones
                FROM vista_gestora_consultores
                WHERE gestora_cedula = ?
                ORDER BY consultor_nombre
            `;
            
            // USAMOS executeQuery en lugar de crear una conexión nueva
            const result = await executeQuery(query, [gestoraCedula]);
            
            if (!result.success) {
                throw new Error(result.error);
            }

            const consultores = result.data;
            
            res.json({
                success: true,
                data: consultores,
                total: consultores.length
            });
            
        } catch (error) {
            console.error('Error al obtener consultores asignados:', error);
            res.status(500).json({ 
                success: false, error: 'Error interno del servidor', details: error.message 
            });
        }
    });

    // ====================================================================
    // ENDPOINT: Asignar y desasignar consultor a gestora
    // ====================================================================
    router.post('/asignar-consultor', async (req, res) => {
        try {
            const { gestoraCedula, consultorCedula, observaciones } = req.body;
            
            if (!gestoraCedula || !consultorCedula) {
                return res.status(400).json({ error: 'La cédula de la gestora y del consultor son requeridas' });
            }
            
            // Usamos executeQuery para llamar al procedimiento
            await executeQuery('CALL AsignarConsultor(?, ?, ?)', [gestoraCedula, consultorCedula, observaciones || null]);
            
            res.json({ success: true, message: 'Consultor asignado exitosamente' });
            
        } catch (error) {
            console.error('Error al asignar consultor:', error);
            res.status(500).json({ error: 'Error al asignar consultor', details: error.message });
        }
    });

    router.delete('/desasignar-consultor', async (req, res) => {
        try {
            const { gestoraCedula, consultorCedula } = req.body;
            
            if (!gestoraCedula || !consultorCedula) {
                return res.status(400).json({ error: 'La cédula de la gestora y del consultor son requeridas' });
            }
            
            // Usamos executeQuery para llamar al procedimiento
            await executeQuery('CALL DesasignarConsultor(?, ?)', [gestoraCedula, consultorCedula]);
            
            res.json({ success: true, message: 'Consultor desasignado exitosamente' });
            
        } catch (error) {
            console.error('Error al desasignar consultor:', error);
            res.status(500).json({ error: 'Error al desasignar consultor', details: error.message });
        }
    });


    // ====================================================================
    // ENDPOINT: Obtener resumen de asignaciones por gestora
    // ====================================================================
    router.get('/resumen-asignaciones', async (req, res) => {
        try {
            const connection = await mysql.createConnection(dbConfig);
            
            const query = `
                SELECT 
                    gestora_cedula,
                    gestora_nombre,
                    gestora_correo,
                    total_consultores_asignados,
                    consultores_asignados
                FROM resumen_asignaciones_gestora
                ORDER BY gestora_nombre
            `;
            
            const [resumen] = await connection.execute(query);
            
            await connection.end();
            
            res.json({
                success: true,
                data: resumen
            });
            
        } catch (error) {
            console.error('Error al obtener resumen de asignaciones:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor',
                details: error.message 
            });
        }
    });

    // ====================================================================
    // ENDPOINT: Obtener todos los consultores disponibles (para asignar)
    // ====================================================================
    router.get('/consultores-disponibles', async (req, res) => {
        try {
            const connection = await mysql.createConnection(dbConfig);
            
            const query = `
                SELECT 
                    ui.usu_cedula as consultor_cedula,
                    CONCAT(ui.usu_primer_nombre, ' ', 
                        COALESCE(ui.usu_segundo_nombre, ''), ' ',
                        ui.usu_primer_apellido, ' ', 
                        ui.usu_segundo_apellido) as consultor_nombre,
                    c.usu_correo as consultor_correo,
                    ui.usu_telefono as consultor_telefono,
                    ac.are_descripcion as area_conocimiento
                FROM usuarios_info ui
                JOIN cuentas c ON ui.usu_id = c.usu_id
                JOIN areas_conocimiento ac ON ui.are_id = ac.are_id
                WHERE c.usu_tipo = 'Consultor'
                AND c.usu_activo = TRUE
                ORDER BY ui.usu_primer_nombre, ui.usu_primer_apellido
            `;
            
            const [consultores] = await connection.execute(query);
            
            await connection.end();
            
            res.json({
                success: true,
                data: consultores,
                total: consultores.length
            });
            
        } catch (error) {
            console.error('Error al obtener consultores disponibles:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor',
                details: error.message 
            });
        }
    });

    // ====================================================================
    // ENDPOINT: Verificar si un consultor está asignado a una gestora
    // ====================================================================
    router.get('/verificar-asignacion/:gestoraCedula/:consultorCedula', async (req, res) => {
        try {
            const { gestoraCedula, consultorCedula } = req.params;
            
            const connection = await mysql.createConnection(dbConfig);
            
            const query = `
                SELECT COUNT(*) as tiene_asignado
                FROM gestora_consultores
                WHERE gestora_cedula = ? AND consultor_cedula = ? AND gc_activo = TRUE
            `;
            
            const [result] = await connection.execute(query, [gestoraCedula, consultorCedula]);
            
            await connection.end();
            
            res.json({
                success: true,
                asignado: result[0].tiene_asignado > 0
            });
            
        } catch (error) {
            console.error('Error al verificar asignación:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor',
                details: error.message 
            });
        }
    });

    module.exports = router; 