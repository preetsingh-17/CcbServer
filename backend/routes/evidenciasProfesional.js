const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken, requireGestora } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Aplica autenticación y autorización solo para gestoras
router.use(authenticateToken);
router.use(requireGestora);

// GET /evidencias-profesional
// Devuelve todas las evidencias (grupales e individuales) que debe revisar el profesional autenticado
router.get('/', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    // Buscar las rutas donde el usuario es responsable (profesional o auxiliar)
    const resultResp = await executeQuery(
      'SELECT rr_id, rut_id FROM responsable_rutas WHERE usu_id = ? AND rr_activo = TRUE',
      [usuarioId]
    );
    const responsableRows = resultResp.data;
    if (responsableRows.length === 0) {
      return res.json([]);
    }
    const rrIds = responsableRows.map(r => r.rr_id);
    // Evidencias grupales
    const resultGrupales = await executeQuery(
      `SELECT eg.evi_id as id, 'grupal' as tipo_evidencia, eg.*, 
              pg.pro_tematica as title, pg.pro_fecha_formacion as date, 
              pg.pro_hora_inicio as time, pg.pro_direccion as location,
              CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as consultant
       FROM evidencias_grupales eg
       JOIN responsable_rutas rr ON eg.rr_id = rr.rr_id
       JOIN programaciones_grupales pg ON eg.pro_id = pg.pro_id
       JOIN usuarios_info ui ON eg.usu_cedula = ui.usu_cedula
       WHERE rr.usu_id = ?`, [usuarioId]
    );
    const evidenciasGrupales = resultGrupales.data;
    // Evidencias individuales
    const resultIndividuales = await executeQuery(
      `SELECT ei.eviin_id as id, 'individual' as tipo_evidencia, ei.*, 
              pi.proin_tematica as title, pi.proin_fecha_formacion as date, 
              pi.proin_hora_inicio as time, pi.proin_direccion as location,
              CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as consultant
       FROM evidencias_individuales ei
       JOIN responsable_rutas rr ON ei.rr_id = rr.rr_id
       JOIN programaciones_individuales pi ON ei.proin_id = pi.proin_id
       JOIN usuarios_info ui ON ei.usu_cedula = ui.usu_cedula
       WHERE rr.usu_id = ?`, [usuarioId]
    );
    const evidenciasIndividuales = resultIndividuales.data;
    // Unificar y adaptar formato para frontend
    const evidencias = [
      ...evidenciasGrupales.map(e => ({
        ...e,
        evidenceStatus: e.evi_estado,
        evidences: [{
          id: e.evi_id,
          name: e.evi_nombre_archivo || 'Evidencia',
          type: e.evi_tipo_archivo || 'document',
          url: `/download/evidencia-grupal/${e.evi_id}`,
        }],
        feedback: null // Se llena si hay valoración
      })),
      ...evidenciasIndividuales.map(e => ({
        ...e,
        evidenceStatus: e.eviin_estado,
        evidences: [
          {
            id: e.eviin_id,
            name: e.eviin_nombre_archivo || 'Evidencia',
            type: e.eviin_tipo_archivo || 'document',
            url: `/download/evidencia-individual/${e.eviin_id}`,
          },
          // Solo si existe el pantallazo
          ...(e.eviin_pantallazo_nombre ? [{
            id: e.eviin_id + '_pantallazo',
            name: e.eviin_pantallazo_nombre,
            type: e.eviin_pantallazo_tipo || 'image',
            url: `/download/avanza-individual/${e.eviin_id}`,
          }] : [])
        ],
        feedback: null // Se llena si hay valoración
      }))
    ];
    // Obtener feedback (valoraciones) para todas las evidencias
    const grupalIds = evidenciasGrupales.map(e => e.evi_id);
    const individualIds = evidenciasIndividuales.map(e => e.eviin_id);
    let valoraciones = [];
    if (grupalIds.length > 0 || individualIds.length > 0) {
      const resultValoraciones = await executeQuery(
        `SELECT * FROM valoraciones WHERE (evi_id IN (?) OR eviin_id IN (?)) AND rr_id IN (?)`,
        [grupalIds.length ? grupalIds : [0], individualIds.length ? individualIds : [0], rrIds]
      );
      valoraciones = resultValoraciones.data;
    }
    // Asignar feedback a cada evidencia
    evidencias.forEach(ev => {
      if (ev.tipo_evidencia === 'grupal') {
        const val = valoraciones.find(v => v.evi_id === ev.evi_id && v.rr_id === ev.rr_id);
        if (val) ev.feedback = val.val_observaciones;
      } else {
        const val = valoraciones.find(v => v.eviin_id === ev.eviin_id && v.rr_id === ev.rr_id);
        if (val) ev.feedback = val.val_observaciones;
      }
    });
    res.json(evidencias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener evidencias para profesional' });
  }
});

// POST /evidencias-profesional/valoracion
// Enviar feedback (devolver evidencia)
router.post('/valoracion', async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { tipo_evidencia, id, feedback } = req.body;
    // Buscar rr_id del profesional para la evidencia
    let rr_id = null;
    if (tipo_evidencia === 'grupal') {
      const result = await executeQuery('SELECT rr_id FROM evidencias_grupales WHERE evi_id = ?', [id]);
      if (result.data.length) rr_id = result.data[0].rr_id;
    } else {
      const result = await executeQuery('SELECT rr_id FROM evidencias_individuales WHERE eviin_id = ?', [id]);
      if (result.data.length) rr_id = result.data[0].rr_id;
    }
    if (!rr_id) return res.status(404).json({ message: 'Evidencia no encontrada' });
    // Insertar o actualizar valoración
    if (tipo_evidencia === 'grupal') {
      await executeQuery(
        `INSERT INTO valoraciones (rr_id, evi_id, val_puntuacion, val_observaciones) VALUES (?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE val_observaciones = VALUES(val_observaciones)`,
        [rr_id, id, feedback]
      );
      // Cambiar estado de la evidencia a 'Evidencias Devueltas'
      await executeQuery('UPDATE evidencias_grupales SET evi_estado = ? WHERE evi_id = ?', ['Evidencias Devueltas', id]);
    } else {
      await executeQuery(
        `INSERT INTO valoraciones (rr_id, eviin_id, val_puntuacion, val_observaciones) VALUES (?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE val_observaciones = VALUES(val_observaciones)`,
        [rr_id, id, feedback]
      );
      await executeQuery('UPDATE evidencias_individuales SET eviin_estado = ? WHERE eviin_id = ?', ['Evidencias Devueltas', id]);
    }
    res.json({ message: 'Feedback enviado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al enviar feedback' });
  }
});

// PUT /evidencias-profesional/confirmar
// Confirmar (aceptar) evidencia
router.put('/confirmar', async (req, res) => {
  try {
    const { tipo_evidencia, id } = req.body;
    if (tipo_evidencia === 'grupal') {
      await executeQuery('UPDATE evidencias_grupales SET evi_estado = ? WHERE evi_id = ?', ['Evidencias Aceptadas', id]);
    } else {
      await executeQuery('UPDATE evidencias_individuales SET eviin_estado = ? WHERE eviin_id = ?', ['Evidencias Aceptadas', id]);
    }
    res.json({ message: 'Evidencia confirmada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al confirmar evidencia' });
  }
});

// ENDPOINT: Descargar evidencia grupal
router.get('/grupal/:id/descargar', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await executeQuery('SELECT evi_nombre_archivo, evi_ruta_archivo FROM evidencias_grupales WHERE evi_id = ?', [id]);
    if (!result.data.length) return res.status(404).json({ message: 'Archivo no encontrado' });
    const { evi_nombre_archivo, evi_ruta_archivo } = result.data[0];
    const filePath = path.resolve(__dirname, '..', 'uploads', evi_ruta_archivo);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Archivo no existe en el servidor' });
    res.download(filePath, evi_nombre_archivo || 'evidencia');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al descargar el archivo' });
  }
});

// ENDPOINT: Descargar evidencia individual
router.get('/individual/:id/descargar', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await executeQuery('SELECT eviin_nombre_archivo, eviin_ruta_archivo FROM evidencias_individuales WHERE eviin_id = ?', [id]);
    if (!result.data.length) return res.status(404).json({ message: 'Archivo no encontrado' });
    const { eviin_nombre_archivo, eviin_ruta_archivo } = result.data[0];
    const filePath = path.resolve(__dirname, '..', 'uploads', eviin_ruta_archivo);
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Archivo no existe en el servidor' });
    res.download(filePath, eviin_nombre_archivo || 'evidencia');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al descargar el archivo' });
  }
});

module.exports = router; 