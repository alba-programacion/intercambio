const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  targetInstitutionId: { type: String }, // Can be null for global/admin notifications
  message: { type: String, required: true },
  type: { type: String, enum: ['INFO', 'SUCCESS', 'ALERT'], default: 'INFO' },
  readBy: [{ type: String }], // Array of user emails or IDs who have read it
  link: { type: String, default: null }, // Optional UI route
  emailSubject: { type: String, default: null }, // Custom email subject
  emailHtml: { type: String, default: null }, // Custom HTML for email body (will be wrapped in premium template)
  targetUserEmail: { type: String, default: null } // Explicit user email to notify directly
}, { timestamps: true });

// Post-save hook to automatically send email notifications to registered users
notificationSchema.post('save', async function (doc) {
  try {
    const User = mongoose.models.User || mongoose.model('User');
    const { sendEmail } = require('../utils/mailer');

    let recipients = [];

    if (doc.targetUserEmail) {
      recipients.push(doc.targetUserEmail);
    }
    
    if (doc.targetInstitutionId === 'global') {
      // Global notification: send to all users in the system (admins and institution users)
      const allUsers = await User.find({});
      recipients = recipients.concat(allUsers.map(u => u.email));
    } else if (!doc.targetInstitutionId || doc.targetInstitutionId === 'null' || doc.targetInstitutionId === 'undefined') {
      // Admin global: show only global/admin notifications, send to all admins
      const admins = await User.find({ role: 'admin' });
      recipients = recipients.concat(admins.map(a => a.email));
    } else {
      // Institution user: send only notifications targeted to their own institution
      const users = await User.find({ institutionId: doc.targetInstitutionId });
      recipients = recipients.concat(users.map(u => u.email));
    }

    // Filter duplicates and invalid emails
    recipients = [...new Set(recipients.filter(Boolean))];

    if (recipients.length === 0) {
      console.log(`[NOTIFICATION HOOK] No registered emails found to notify for target: ${doc.targetInstitutionId || 'global'}`);
      return;
    }

    console.log(`[NOTIFICATION HOOK] Dispatching notification emails to: ${recipients.join(', ')}`);

    const subject = doc.emailSubject || `Nueva notificación: ${doc.message}`;
    const textContent = doc.message;
    const htmlContent = doc.emailHtml || `<p>${doc.message}</p>`;

    for (const recipient of recipients) {
      sendEmail(recipient, subject, textContent, htmlContent, doc.link)
        .catch(err => console.error(`[NOTIFICATION HOOK] Error sending email to ${recipient}:`, err));
    }
  } catch (error) {
    console.error('[NOTIFICATION HOOK] Error in post-save notification hook:', error);
  }
});

module.exports = mongoose.model('Notification', notificationSchema);

