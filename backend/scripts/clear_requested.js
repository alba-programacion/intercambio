require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function cleanRequested() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado.\n');

    console.log('🧹 Limpiando colecciones de prueba...');
    
    const taskRes = await mongoose.connection.db.collection('tasks').deleteMany({});
    console.log(`   ✅ Tareas eliminadas: ${taskRes.deletedCount}`);
    
    const fineRes = await mongoose.connection.db.collection('fines').deleteMany({});
    console.log(`   ✅ Multas eliminadas: ${fineRes.deletedCount}`);
    
    const notifRes = await mongoose.connection.db.collection('notifications').deleteMany({});
    console.log(`   ✅ Notificaciones eliminadas: ${notifRes.deletedCount}`);

    const cvRes = await mongoose.connection.db.collection('cvs').deleteMany({});
    console.log(`   ✅ CVs eliminados: ${cvRes.deletedCount}`);

    console.log('\n🎉 Limpieza de datos de prueba completada con éxito.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB.');
  }
}

cleanRequested();
