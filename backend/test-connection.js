// Script para probar conexión a MySQL
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔍 Probando conexión a MySQL...');
  console.log('📊 Configuración:');
  console.log(`   Host: ${process.env.DB_HOST || '127.0.0.1'}`);
  console.log(`   Puerto: ${process.env.DB_PORT || 3306}`);
  console.log(`   Usuario: ${process.env.DB_USER || 'root'}`);
  console.log(`   Base de datos: ${process.env.DB_NAME || 'no especificada'}`);
  console.log('');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Conexión a MySQL exitosa!');
    
    // Mostrar bases de datos disponibles
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📋 Bases de datos disponibles:');
    databases.forEach(db => {
      console.log(`   - ${db.Database}`);
    });

    // Intentar conectar a la base específica si está configurada
    if (process.env.DB_NAME) {
      try {
        await connection.execute(`USE ${process.env.DB_NAME}`);
        console.log(`✅ Conexión a base de datos '${process.env.DB_NAME}' exitosa!`);
        
        // Mostrar tablas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📋 Tablas en '${process.env.DB_NAME}':`);
        tables.forEach(table => {
          const tableName = table[`Tables_in_${process.env.DB_NAME}`];
          console.log(`   - ${tableName}`);
        });
        
      } catch (error) {
        console.log(`❌ No se pudo acceder a la base '${process.env.DB_NAME}': ${error.message}`);
      }
    }

    await connection.end();
    console.log('\n🎉 Todo listo para usar!');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('\n🔧 Soluciones posibles:');
    console.error('   1. Verifica tu password en el archivo .env');
    console.error('   2. Confirma que el usuario tenga permisos');
    console.error('   3. Verifica que la base de datos exista');
  }
}

testConnection(); 