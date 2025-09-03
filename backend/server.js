const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./config/database');

// Importar servicios
const cronogramaScheduler = require('./services/cronogramaScheduler');

// Importar rutas
const authRoutes = require('./routes/auth');
const consultoresRoutes = require('./routes/consultores');
const eventosRoutes = require('./routes/eventos');
const pagosRoutes = require('./routes/pagos');
const evidenciasRoutes = require('./routes/evidencias');
const vacantesRoutes = require('./routes/vacantes');
const programacionesRoutes = require('./routes/programaciones');
const gestorasRoutes = require('./routes/gestoras');
const usuariosRoutes = require('./routes/usuarios');
const areasRoutes = require('./routes/areas');
const informesRoutes = require('./routes/informes');
const responsablesRoutes = require('./routes/responsables');
const dashboardRoutes = require('./routes/dashboard');
const downloadRoutes = require('./routes/download');
const evidenciasProfesionalRoutes = require('./routes/evidenciasProfesional');
const cronogramaRoutes = require('./routes/cronograma');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/consultores', consultoresRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/evidencias', evidenciasRoutes);
app.use('/api/vacantes', vacantesRoutes);
app.use('/api/programaciones', programacionesRoutes);
app.use('/api/gestores', gestorasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/areas-conocimiento', areasRoutes);
app.use('/api/informes', informesRoutes);
app.use('/api/responsables', responsablesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/evidencias-profesional', evidenciasProfesionalRoutes);
app.use('/api/cronograma', cronogramaRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir frontend estático en producción
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));

  // Entregar index.html para rutas no-API
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}
// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Servidor CCB funcionando correctamente',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// Ruta para probar conexión a base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      res.json({ 
        message: 'Conexión a MySQL exitosa',
        status: 'OK'
      });
    } else {
      res.status(500).json({ 
        message: 'Error conectando a MySQL',
        status: 'ERROR'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      message: 'Error del servidor',
      error: error.message,
      status: 'ERROR'
    });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ No se pudo conectar a MySQL. Verifica la configuración.');
      process.exit(1);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en el puerto ${PORT}`);
      console.log(`📡 API disponible en: http://localhost:${PORT}/api`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Test DB: http://localhost:${PORT}/api/test-db`);
      
      // Iniciar el scheduler de cronograma CCB
      setTimeout(() => {
        try {
          cronogramaScheduler.start();
          console.log(`📅 Cronograma Scheduler iniciado correctamente`);
        } catch (error) {
          console.error('❌ Error iniciando Cronograma Scheduler:', error);
        }
      }, 2000); // Esperar 2 segundos para que el servidor se estabilice
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  cronogramaScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  cronogramaScheduler.stop();
  process.exit(0);
});

// Iniciar servidor
startServer(); 