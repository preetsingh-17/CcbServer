const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1', // Usar IPv4 explícitamente
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ccb_database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
  // Removidas las opciones que causaban warnings: acquireTimeout, timeout, reconnect
};

// Crear el pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MySQL');
    console.log(`📊 Conectado a: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`🗄️  Base de datos: ${dbConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    console.error('🔍 Verifica que:');
    console.error('   - MySQL esté corriendo');
    console.error('   - Los datos de conexión en .env sean correctos');
    console.error('   - La base de datos exista');
    return false;
  }
};

// Función para ejecutar queries
const executeQuery = async (query, params = []) => {
  try {
    const [rows] = await pool.execute(query, params);
    return { success: true, data: rows };
  } catch (error) {
    console.error('Error ejecutando query:', error);
    return { success: false, error: error.message };
  }
};

// Función para transacciones
const executeTransaction = async (queries) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params || []);
      results.push(result);
    }
    
    await connection.commit();
    return { success: true, data: results };
  } catch (error) {
    await connection.rollback();
    console.error('Error en transacción:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction
}; 