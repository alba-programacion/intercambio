require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');

async function run() {
  console.log('Testing Notification Save Hook...');
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talent-collab';
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Count users
    const usersCount = await User.countDocuments();
    console.log(`Current users in database: ${usersCount}`);
    
    // Find some users to see roles and institutions
    const sampleUsers = await User.find().limit(5);
    console.log('Sample Users in DB:');
    sampleUsers.forEach(u => {
      console.log(`- Email: ${u.email} | Role: ${u.role} | Institution: ${u.institutionId}`);
    });

    console.log('\nCreating a test notification for Admins (global)...');
    const notifAdmin = await Notification.create({
      targetInstitutionId: 'global',
      message: 'Test de notificación global automática por hook de Mongoose.',
      type: 'INFO',
      link: '/cvs',
      emailSubject: 'Notificación de Prueba Global',
      emailHtml: '<p>Este es un <strong>test</strong> del hook para notificaciones globales.</p>'
    });
    console.log('Created Admin Notif:', notifAdmin._id);

    // Clean it up immediately so we don't pollute the collection
    await Notification.findByIdAndDelete(notifAdmin._id);
    console.log('Cleaned up Admin Notif.');

    // If there is any user with an institution, test that too
    const instUser = sampleUsers.find(u => u.institutionId);
    if (instUser) {
      console.log(`\nCreating a test notification for Institution "${instUser.institutionId}"...`);
      const notifInst = await Notification.create({
        targetInstitutionId: instUser.institutionId,
        message: `Test de notificación para institución ${instUser.institutionId}.`,
        type: 'SUCCESS',
        link: '/tareas',
        emailSubject: 'Notificación de Prueba Institución',
        emailHtml: `<p>Este es un <strong>test</strong> del hook para la institución ${instUser.institutionId}.</p>`
      });
      console.log('Created Inst Notif:', notifInst._id);
      
      await Notification.findByIdAndDelete(notifInst._id);
      console.log('Cleaned up Inst Notif.');
    } else {
      console.log('\nNo users with institutionId found in DB to test institution targeting.');
    }

  } catch (error) {
    console.error('Hook test failed with error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
