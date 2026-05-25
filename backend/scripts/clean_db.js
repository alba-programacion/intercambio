require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const CV           = require('../models/CV');
const Task         = require('../models/Task');
const Notification = require('../models/Notification');
const Fine         = require('../models/Fine');
const Vacancy      = require('../models/Vacancy');

async function cleanDatabase() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado.\n');

    const [cvCount, taskCount, notifCount, fineCount, vacancyCount] = await Promise.all([
      CV.countDocuments(),
      Task.countDocuments(),
      Notification.countDocuments(),
      Fine.countDocuments(),
      Vacancy.countDocuments()
    ]);

    console.log('📊 Estado actual:');
    console.log(`   CVs:            ${cvCount}`);
    console.log(`   Tareas:         ${taskCount}`);
    console.log(`   Notificaciones: ${notifCount}`);
    console.log(`   Multas:         ${fineCount}`);
    console.log(`   Vacantes:       ${vacancyCount}`);
    console.log('');

    console.log('🧹 Limpiando colecciones...');
    const [resCv, resTask, resNotif, resFine, resVacancy] = await Promise.all([
      CV.deleteMany({}),
      Task.deleteMany({}),
      Notification.deleteMany({}),
      Fine.deleteMany({}),
      Vacancy.deleteMany({})
    ]);

    console.log(`   ✅ CVs eliminados:            ${resCv.deletedCount}`);
    console.log(`   ✅ Tareas eliminadas:         ${resTask.deletedCount}`);
    console.log(`   ✅ Notificaciones eliminadas: ${resNotif.deletedCount}`);
    console.log(`   ✅ Multas eliminadas:         ${resFine.deletedCount}`);
    console.log(`   ✅ Vacantes eliminadas:       ${resVacancy.deletedCount}`);
    console.log('');
    console.log('🎉 Limpieza completada. Instituciones y Usuarios intactos.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB.');
  }
}

cleanDatabase();
