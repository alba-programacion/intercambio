require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('./models/User');
const Institution = require('./models/Institution');
const Vacancy = require('./models/Vacancy');
const CV = require('./models/CV');
const Task = require('./models/Task');
const Notification = require('./models/Notification');
const Contact = require('./models/Contact');
const Fine = require('./models/Fine');
const { sendEmail } = require('./utils/mailer');

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talent-collab')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    // Seed Institutions
    if ((await Institution.countDocuments()) === 0) {
      await Institution.create([
        { _id: 'A', name: 'Institución A', profile: 'Desarrollo' },
        { _id: 'B', name: 'Institución B', profile: 'Salud' }
      ]);
      console.log('🌱 Seeded Institutions');
    }
    // Migration: user -> universidad
    await User.updateMany({ role: 'user' }, { role: 'universidad' });
    
    // Migration: CV Statuses
    await CV.updateMany({ status: 'Disponible' }, { status: null });
    await CV.updateMany({ status: 'En Proceso' }, { status: 'En trámite' });
    await CV.updateMany({ status: { $in: ['Aprobado', 'Contratado'] } }, { status: 'Aceptado' });
    
    // Ensure TTL Index for auto-deletion of rejected CVs
    await CV.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Ensure TTL Index for auto-deletion of completed tasks after 30 days
    await Task.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Manual cleanup of completed tasks that are older than 30 days and lack expiresAt
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deleteResult = await Task.deleteMany({
      status: 'COMPLETED',
      $or: [
        { expiresAt: { $lte: new Date() } },
        { updatedAt: { $lte: thirtyDaysAgo }, expiresAt: { $exists: false } }
      ]
    });
    console.log(`🧹 Cleaned up ${deleteResult.deletedCount} completed tasks older than 30 days`);
    
    console.log('🔄 Applied migrations and verified indices');
  })
  .catch((err) => console.error('❌ Failed to connect to MongoDB:', err));

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MOCK_USERS = [
  { id: 1, email: 'admin@system.com', password: 'password', role: 'admin', institutionId: null },
  { id: 2, email: 'manager@inst-a.com', password: 'password', role: 'management', institutionId: 'A' },
  { id: 3, email: 'user@inst-a.com', password: 'password', role: 'universidad', institutionId: 'A' },
  { id: 4, email: 'manager@inst-b.com', password: 'password', role: 'management', institutionId: 'B' },
];

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, institutionId, newInstitutionName, newInstitutionProfile } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Faltan datos requeridos (Nombre, correo, contraseña)' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Este correo ya se encuentra registrado.' });

    const finalRole = role && ['universidad', 'management', 'admin'].includes(role) ? role : 'universidad';
    let finalInstId = institutionId;

    if (!institutionId && newInstitutionName) {
      if (!newInstitutionProfile) return res.status(400).json({ error: 'Faltan datos de la nueva institución (giro).' });
      const instExists = await Institution.findOne({ name: { $regex: new RegExp(`^${newInstitutionName.trim()}$`, 'i') } });
      if (instExists) return res.status(400).json({ error: `La institución "${instExists.name}" ya existe. Por favor selecciónala de la lista.` });

      const newId = newInstitutionName.replace(/\s+/g, '').substring(0, 4).toUpperCase() + Math.floor(Math.random() * 1000);
      const newInst = await Institution.create({ _id: newId, name: newInstitutionName.trim(), profile: newInstitutionProfile });
      finalInstId = newInst._id;
    }

    if (!finalInstId) return res.status(400).json({ error: 'Debes seleccionar o crear una institución aportadora válida.' });

    const newUser = new User({
      name,
      email,
      password,
      role: finalRole,
      institutionId: finalInstId
    });

    await newUser.save();
    res.status(201).json({ message: 'Registro exitoso', user: { id: newUser._id, name, email, role: newUser.role, institutionId: newUser.institutionId } });
  } catch (err) { res.status(500).json({ error: 'Error interno del servidor al registrar.' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN ATTEMPT] Email: ${email}`);
    const dbUser = await User.findOne({ email }).populate('institutionId');
    if (dbUser) {
      if (await dbUser.comparePassword(password)) {
        console.log(`[LOGIN SUCCESS] Found in DB: ${email}`);
        return res.json({
          token: 'jwt-' + dbUser._id,
          user: {
            id: dbUser._id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            institutionId: dbUser.institutionId?._id || dbUser.institutionId,
            institutionName: dbUser.institutionId?.name || 'Administración Central'
          }
        });
      }
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      console.log(`[LOGIN SUCCESS] Found in Mock Users: ${email}`);
      const { password: _, ...safeUser } = user;
      return res.json({ token: 'mock-token', user: safeUser });
    }
    console.log(`[LOGIN FAILED] Credentials not found: ${email}`);
    res.status(401).json({ error: 'Credenciales inválidas' });
  } catch (err) { 
    console.error('[LOGIN ERROR DETAILS]:', err);
    res.status(500).json({ error: 'Error de servidor' }); 
  }
});

app.get('/api/metrics', async (req, res) => {
  try {
    console.log('[DEBUG metrics query]', Buffer.from('En trámite').toString('hex'));
    const [totalVacancies, totalInstitutions, totalCvs, cvsInProcess] = await Promise.all([
      Vacancy.countDocuments(),
      Institution.countDocuments(),
      CV.countDocuments({ $or: [{ targetVacancyId: { $ne: null } }, { targetInstitutionId: { $ne: null } }] }),
      CV.countDocuments({ status: 'En Proceso' })
    ]);

    // 1. Task Status Distribution (Requested, Sent, Open)
    // "Requested" = REQUEST_CVS pending
    // "Sent" = REVIEW_CV where description is 'Institución envío cv'
    // "Open" = All active tasks excluding completed ones? Or just general status?
    // Let's use a more specific logic for the prompt: "Solicitado, Enviado y Abierto"
    const requestedCount = await Task.countDocuments({ type: 'REQUEST_CVS', status: 'PENDING' });
    const sentCount = await Task.countDocuments({ description: 'Institución envío cv' });
    const openCount = await Task.countDocuments({ status: 'PENDING' });

    // 2. Vacancies by Institution
    const vacanciesByInst = await Vacancy.aggregate([
      { $group: { _id: "$institutionId", count: { $sum: 1 } } }
    ]);
    // Populate names manually or with another lookup if needed, but IDs are fine for now if we map them on frontend or here
    const instNames = await Institution.find({ _id: { $in: vacanciesByInst.map(v => v._id) } });
    const vacanciesByInstFormatted = vacanciesByInst.map(v => {
      const inst = instNames.find(i => i._id === v._id);
      return { name: inst ? inst.name : v._id, count: v.count };
    });

    // 3. CV Volume by Institution (Source)
    const cvsByInst = await CV.aggregate([
      { $group: { _id: "$sourceInstitutionId", count: { $sum: 1 } } }
    ]);
    const instNamesCvs = await Institution.find({ _id: { $in: cvsByInst.map(v => v._id) } });
    const cvsByInstFormatted = cvsByInst.map(v => {
      const inst = instNamesCvs.find(i => i._id === v._id);
      return { name: inst ? inst.name : v._id, count: v.count };
    });

    // 4. CV Debt Report (Institutions that owe CVs)
    // Filter REQUEST_CVS tasks that are PENDING
    const debt = await Task.aggregate([
      { $match: { type: 'REQUEST_CVS', status: 'PENDING' } },
      { $group: { _id: "$targetEmail", count: { $sum: 1 } } }
    ]);
    // Map targetEmail to Institution Name if possible
    const users = await User.find({ email: { $in: debt.map(d => d._id) } }).populate('institutionId');
    const debtFormatted = debt.map(d => {
      const user = users.find(u => u.email === d._id);
      return {
        name: user?.institutionId?.name || d._id,
        count: d.count
      };
    });

    // 5. Candidates In Train List (Name, Vacancy, Institution)
    const inProcessCvs = await CV.find({ status: 'En Proceso' })
      .populate({
        path: 'targetVacancyId',
        populate: { path: 'institutionId' }
      })
      .populate('sourceInstitutionId');

    const cvsInProcessList = inProcessCvs.map(c => ({
      name: c.name,
      vacancyRole: c.targetVacancyId?.role || 'Bolsa General',
      targetInstitution: c.targetVacancyId?.institutionId?.name || 'N/A',
      sourceInstitution: c.sourceInstitutionId?.name || 'Directa'
    }));

    res.json({
      totalVacancies, totalInstitutions, totalCvs, cvsInProcess,
      requestStats: { requested: requestedCount, sent: sentCount, open: openCount },
      vacanciesByInst: vacanciesByInstFormatted,
      cvsByInst: cvsByInstFormatted,
      cvDebt: debtFormatted,
      cvsInProcessList
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/institutions', async (req, res) => {
  const insts = await Institution.find();
  res.json(insts.map(i => ({ id: i._id, name: i.name, profile: i.profile, logo: i.logo })));
});

app.post('/api/institutions', upload.single('logo'), async (req, res) => {
  try {
    const { _id, name, profile } = req.body;
    let logoStr = null;
    if (req.file) {
      logoStr = req.file.filename;
    }
    const inst = await Institution.create({ _id, name, profile, logo: logoStr });
    res.status(201).json(inst);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/institutions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE INSTITUTION ATTEMPT] ID: ${id}`);
    const inst = await Institution.findById(id);
    if (!inst) {
      console.log(`[DELETE FAILED] Institution not found: ${id}`);
      return res.status(404).json({ error: 'Institución no encontrada' });
    }

    // CASCADE DELETE:
    console.log(`[DELETE STEP 1] Cleaning Users for: ${id}`);
    await User.deleteMany({ institutionId: id });
    console.log(`[DELETE STEP 2] Cleaning Vacancies for: ${id}`);
    await Vacancy.deleteMany({ institutionId: id });
    console.log(`[DELETE STEP 3] Cleaning CVs for: ${id}`);
    await mongoose.model('CV').deleteMany({ sourceInstitutionId: id });
    
    // 4. Logo File (Optional but recommended)
    if (inst.logo) {
      console.log(`[DELETE STEP 4] Removing Logo: ${inst.logo}`);
      const logoPath = path.join(__dirname, 'uploads', inst.logo);
      if (fs.existsSync(logoPath)) {
        try { fs.unlinkSync(logoPath); } catch(e) {} 
      }
    }

    const result = await mongoose.connection.db.collection('institutions').deleteOne({ _id: id });
    console.log(`[DELETE SUCCESS] Deleted count for ${id}: ${result.deletedCount}`);
    
    if (result.deletedCount === 0) {
      console.log(`[DELETE WARNING] Document not found via direct collection delete: ${id}`);
    }

    res.json({ message: 'Institución y todos sus datos asociados fueron eliminados correctamente.' });
  } catch (e) { 
    console.error('[DELETE ERROR DETAILS]:', e);
    res.status(500).json({ error: e.message }); 
  }
});

app.get('/api/vacancies', async (req, res) => {
  const vacs = await Vacancy.find().populate('institutionId');
  const results = [];
  for (let v of vacs) {
    const cvCount = await CV.countDocuments({ targetVacancyId: v._id });
    results.push({
      id: v._id,
      institutionId: v.institutionId?._id || v.institutionId,
      institutionName: v.institutionId?.name || 'Desconocida',
      role: v.role, salary: v.salary,
      location: v.location, modality: v.modality, 
      experience: v.experience, education: v.education, observations: v.observations,
      language: v.language, activities: v.activities, confidential: v.confidential,
      age: v.age, gender: v.gender, skills: v.skills,
      status: v.status, cvCount, date: v.createdAt
    });
  }
  res.json(results);
});

app.post('/api/vacancies', async (req, res) => {
  try {
    const v = await Vacancy.create(req.body);
    res.json(v);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/vacancies/:id/status', async (req, res) => {
  try {
    const v = await Vacancy.findById(req.params.id);
    v.status = req.body.status;
    await v.save();
    res.json(v);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/vacancies/:id', async (req, res) => {
  try {
    console.log(`[UPDATE VACANCY] ID: ${req.params.id}`, req.body);
    const v = await Vacancy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!v) {
      console.log(`[UPDATE FAILED] Vacancy not found: ${req.params.id}`);
      return res.status(404).json({ error: 'Vacante no encontrada' });
    }
    res.json(v);
  } catch (e) { 
    console.error(`[UPDATE ERROR]`, e);
    res.status(400).json({ error: e.message }); 
  }
});

app.delete('/api/vacancies/:id', async (req, res) => {
  try {
    const v = await Vacancy.findByIdAndDelete(req.params.id);
    if (!v) return res.status(404).json({ error: 'Vacante no encontrada' });
    res.json({ message: 'Vacante eliminada' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/cvs', async (req, res) => {
  const cvs = await CV.find().populate('sourceInstitutionId').populate('targetVacancyId');
  res.json(cvs.map(c => ({
    ...c.toObject(), id: c._id,
    sourceInstitutionName: c.sourceInstitutionId?.name || '',
  })));
});

// CREATE CV (Local available pool)
app.post('/api/cvs', upload.single('document'), async (req, res) => {
  try {
    const { name, email, sourceInstitutionId } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Documento PDF obligatorio' });
    if (!sourceInstitutionId || sourceInstitutionId === 'null' || sourceInstitutionId === 'undefined') {
      return res.status(403).json({ error: 'Trazabilidad de origen obligatoria: Se requiere Institución de Origen para subir CVs.' });
    }

    const newCv = new CV({
      name, email, document: req.file.filename,
      sourceInstitutionId
    });
    await newCv.save();

    // Notify admins/managers of new candidate in repository
    const admins = await User.find({ role: 'admin' });
    const manager = await User.findOne({ institutionId: sourceInstitutionId, role: 'management' });
    const recipients = [...new Set([...admins.map(a => a.email), manager?.email].filter(Boolean))];
    
    for (const recipient of recipients) {
      sendEmail(
        recipient,
        'Nuevo candidato en el repositorio',
        `Se ha subido un nuevo candidato (${name}) al repositorio por la institución ${sourceInstitutionId}.`,
        `<p>Se ha subido un nuevo candidato <strong>${name}</strong> al repositorio por la institución <strong>${sourceInstitutionId}</strong>.</p>`
      ).catch(err => console.error('Error sending upload notification email:', err));
    }

    // --- NOTIFICATION FOR ADMINS ---
    await Notification.create({
      targetInstitutionId: 'global', // Global/Admin
      message: `¡Nuevo Talento! ${sourceInstitutionId} ha subido a ${name} al repositorio compartido.`,
      type: 'INFO',
      link: '/cvs'
    });

    res.status(201).json(newCv);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Phase 6: Simple Vacancy Submit (No SLA Task)
app.post('/api/cvs/vacancy', upload.single('document'), async (req, res) => {
  try {
    const { name, email, targetVacancyId, sourceInstitutionId } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Documento PDF obligatorio' });
    if (!sourceInstitutionId || sourceInstitutionId === 'null' || sourceInstitutionId === 'undefined') {
      return res.status(403).json({ error: 'Trazabilidad de origen obligatoria: Se requiere Institución de Origen para postular CVs.' });
    }

    const cv = await CV.create({
      name, email, document: req.file.filename,
      sourceInstitutionId,
      targetVacancyId, status: 'Cartera'
    });

    // --- NOTIFICATION TARGETING ---
    // Only notify the vacancy-owning institution if the applicant is from a different institution
    const vacancyInfo = await Vacancy.findById(targetVacancyId).populate('institutionId');
    if (vacancyInfo && vacancyInfo.institutionId && vacancyInfo.institutionId._id.toString() !== sourceInstitutionId.toString()) {
      const message = `¡Nueva Postulación! ${sourceInstitutionId} ha enviado a ${name} para tu vacante de ${vacancyInfo.role}.`;
      await Notification.create({
        targetInstitutionId: vacancyInfo.institutionId._id,
        message,
        type: 'SUCCESS',
        link: '/vacantes'
      });

      // Send Email to Vacancy Owner (Manager of the institution)
      const ownerManager = await User.findOne({ institutionId: vacancyInfo.institutionId._id, role: 'management' });
      if (ownerManager) {
        sendEmail(
          ownerManager.email,
          'Nueva postulación a tu vacante',
          message,
          `<p>${message}</p><p>Puedes ver los detalles en la plataforma.</p>`
        ).catch(err => console.error('Error sending vacancy apply notification email:', err));
      }
    }

    res.status(201).json({ cv });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Phase 6: Inter-Institutional Collaboration (SLA Task generation)
app.post('/api/cvs/collab', upload.single('document'), async (req, res) => {
  try {
    const { name, email, senderEmail, description, targetEmail, sourceInstitutionId, dueDate } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Documento PDF obligatorio' });
    if (!sourceInstitutionId || sourceInstitutionId === 'null' || sourceInstitutionId === 'undefined') {
      return res.status(403).json({ error: 'Trazabilidad de origen obligatoria: Se requiere Institución de Origen para colaboración.' });
    }

    const cv = await CV.create({
      name, email, document: req.file.filename,
      sourceInstitutionId,
      targetInstitutionId: targetEmail, // Save destination email for tracking rendering
      status: 'Cartera'
    });

    // SLA Date processing
    const finalDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Create an automatically tracked task
    const task = await Task.create({
      type: 'REVIEW_CV',
      senderEmail,
      targetEmail,
      cvId: cv._id,
      sourceInstitutionId, // Explicitly store origin
      description: description || 'Por favor revisa este CV.',
      dueDate: finalDueDate
    });
    res.status(201).json({ cv, task });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Legacy Bilateral Collaboration Share CV
app.post('/api/cvs/:id/share', async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id);
    if (!cv || cv.status === 'En Proceso') return res.status(400).json({ error: 'No disponible' });
    cv.status = 'En Proceso';
    cv.targetVacancyId = req.body.targetVacancyId || null;
    await cv.save();
    res.json(cv);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/cvs/:id/status', async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id);
    const { status, rejectionCode, rejectionReasonCustom, rejectedBy, targetVacancyId } = req.body;
    
    cv.status = status;

    let historyAction = `Cambiado a ${status}`;
    
    if (status === 'Rechazado') {
      historyAction = 'Rechazado';
      cv.rejectionCode = rejectionCode;
      cv.rejectionReasonCustom = rejectionReasonCustom;
      if (rejectedBy) cv.rejectedBy = rejectedBy;
      
      // Auto-delete in 30 days
      cv.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Unlink from vacancy so it moves to global pool (Gestion de CVs)
      cv.targetVacancyId = null;
    } else {
      // Clear rejection data if status changes back to something else
      cv.rejectionCode = null;
      cv.rejectionReasonCustom = null;
      cv.expiresAt = null;
      
      if (status === 'Aceptado') {
        historyAction = 'Aceptado para la vacante';
        if (targetVacancyId !== undefined) {
          cv.targetVacancyId = targetVacancyId || null;
        }
      }
    }

    cv.history.push({
      action: historyAction,
      details: status === 'Rechazado' ? `Rechazo con código ${rejectionCode}` : 'Estado actualizado'
    });

    await cv.save();

    // Auto-notification for collaboration
    if ((status === 'Rechazado' || status === 'Aceptado') && cv.sourceInstitutionId) {
      let sourceManager = await User.findOne({ institutionId: cv.sourceInstitutionId, role: { $in: ['management', 'admin'] } });
      if (!sourceManager) sourceManager = await User.findOne({ institutionId: cv.sourceInstitutionId });
      
      if (sourceManager) {
        await Task.create({
          type: 'REVIEW_CV',
          senderEmail: rejectedBy || 'sistema@talent.com',
          targetEmail: sourceManager.email,
          cvId: cv._id,
          targetVacancyId: cv.targetVacancyId,
          description: status === 'Rechazado' ? 'Institución rechazó el CV' : 'Institución aceptó el CV',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'PENDING'
        });
      }
    }

    res.json(cv);
  } catch (e) { res.status(400).json({ error: e.message }) }
});

app.delete('/api/cvs/:id', async (req, res) => {
  try {
    const cv = await CV.findByIdAndDelete(req.params.id);
    if (!cv) return res.status(404).json({ error: 'CV no encontrado' });
    res.json({ message: 'CV eliminado' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// --- TASKS API ---
app.post('/api/tasks/request-cv', async (req, res) => {
  try {
    const { targetVacancyId, senderEmail, targetInstitutionId, description, dueDate } = req.body;

    // Find manager for the strict target institution
    let manager = await User.findOne({ institutionId: targetInstitutionId, role: { $in: ['management', 'admin'] } });

    // Si no está registrado como admin o manager, probamos si hay un usuario basico al menos para que lo reciba
    if (!manager) {
      manager = await User.findOne({ institutionId: targetInstitutionId });
    }

    // Ultimo recurso: Usuarios de prueba pre-cargados
    if (!manager) {
      manager = MOCK_USERS.find(u => u.institutionId === targetInstitutionId);
    }

    if (!manager) {
      return res.status(404).json({ error: `Esa institución no tiene usuarios en el sistema. No se puede enrutar tu solicitud.` });
    }

    const finalDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const task = await Task.create({
      type: 'REQUEST_CVS',
      senderEmail,
      targetEmail: manager.email,
      targetVacancyId,
      targetInstitutionId,
      description: description || 'Por favor revisa sus CVs y postula candidatos a esta vacante.',
      dueDate: finalDueDate
    });

    try {
      const vacancyInfo = await Vacancy.findById(targetVacancyId);
      let senderInstitutionName = 'Alguien de otra institución';
      const senderUser = await User.findOne({ email: senderEmail });
      if (senderUser && senderUser.institutionId) {
        senderInstitutionName = senderUser.institutionId; // We store Name or ID directly in institutionId mostly. Wait, senderUser.institutionId is usually the String ID. 
        // We can just use the ID if we don't feel like querying the Collection.
      }
      
      await Notification.create({
        targetInstitutionId,
        message: `¡Nueva Solicitud SLA! ${senderInstitutionName} te ha solicitado CVs para la vacante "${vacancyInfo?.role || 'general'}".`,
        type: 'INFO',
        link: '/tareas'
      });

      // Send Email to Manager
      sendEmail(
        manager.email,
        'Nueva Solicitud de CVs (SLA)',
        `Te han solicitado CVs para la vacante "${vacancyInfo?.role || 'general'}".`,
        `<p>La institución ${senderInstitutionName} te ha solicitado CVs para la vacante <strong>"${vacancyInfo?.role || 'general'}"</strong>.</p><p>Fecha límite: ${finalDueDate.toLocaleDateString()}</p>`
      ).catch(err => console.error('Error sending SLA request email:', err));
    } catch(err) { console.error('Error creating task notification', err); }

    res.status(201).json(task);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/tasks/:id/fulfill-cv', upload.single('document'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, senderEmail, sourceInstitutionId } = req.body;
    
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    // 1. Create the CV
    const cv = await CV.create({
      name,
      email,
      targetVacancyId: task.targetVacancyId,
      sourceInstitutionId,
      document: req.file.filename,
      status: 'En trámite'
    });

    // 2. Mark Task as COMPLETED
    task.status = 'COMPLETED';
    task.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await task.save();

    // 3. Notify requester
    await Notification.create({
      targetInstitutionId: task.sourceInstitutionId || 'ADMIN', // Or find requester's inst
      message: `¡CV Recibido! Una institución ha enviado el perfil de "${name}" para tu solicitud.`,
      type: 'SUCCESS',
      link: '/cvs'
    });

    // 4. Create a tracking task for the requester to review
    await Task.create({
      type: 'REVIEW_CV',
      senderEmail: senderEmail,
      targetEmail: task.senderEmail,
      cvId: cv._id,
      targetVacancyId: task.targetVacancyId,
      description: 'Institución envío cv',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });

    res.json({ message: 'CV enviado y tarea completada', cv, task });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/tasks/:id/complete', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'COMPLETED',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }, 
      { new: true }
    );
    res.json(task);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/tasks', async (req, res) => {
  const { email, institutionId } = req.query;
  console.log(`[GET TASKS] Query Params - Email: ${email}, InstId: ${institutionId}`);
  let q = {};
  if (institutionId) {
    q = { $or: [{ targetInstitutionId: institutionId }, { sourceInstitutionId: institutionId }] };
  } else if (email) {
    q = { $or: [{ targetEmail: email }, { senderEmail: email }] };
  }
  
  const tasks = await Task.find(q)
    .populate({ 
      path: 'cvId', 
      populate: { path: 'targetVacancyId', populate: { path: 'institutionId' } } 
    })
    .populate({ path: 'targetVacancyId', populate: { path: 'institutionId' } })
    .sort({ createdAt: -1 });
  res.json(tasks.map(t => ({ ...t.toObject(), id: t._id, fine: t.fine })));
});

app.patch('/api/tasks/:id/complete', async (req, res) => {
  try {
    const t = await Task.findById(req.params.id);
    t.status = 'COMPLETED';
    await t.save();
    res.json(t);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/tasks/:id/fulfill-cv', upload.single('document'), async (req, res) => {
  try {
    const { name, email, sourceInstitutionId, senderEmail } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Documento PDF obligatorio' });
    if (!sourceInstitutionId || sourceInstitutionId === 'null' || sourceInstitutionId === 'undefined') {
      return res.status(403).json({ error: 'Trazabilidad de origen obligatoria: Se requiere Institución de Origen para completar trámites.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    if (task.status === 'COMPLETED') return res.status(400).json({ error: 'La tarea ya estaba completada' });

    // Encontramos quién pidió originalmente este CV para direccionar el CV y la nueva tarea a su email/institución
    let targetInstId = null;
    let targetEmail = task.senderEmail;

    // TRUCO DE RESCATE: Si la tarea no tiene email de origen (corrupta), lo sacamos a partir de la vacante!
    if (!targetEmail && task.targetVacancyId) {
      const vac = await Vacancy.findById(task.targetVacancyId);
      if (vac && vac.institutionId) {
        targetInstId = vac.institutionId;
        const manager = await User.findOne({ institutionId: targetInstId, role: { $in: ['management', 'admin'] } });
        if (manager) targetEmail = manager.email;
      }
    }

    // Si aún no tenemos targetInstId pero sí un email, lo deducimos
    if (!targetInstId && targetEmail) {
      const requester = await User.findOne({ email: targetEmail });
      if (requester && requester.institutionId) {
        targetInstId = requester.institutionId;
      } else {
        const mockReq = MOCK_USERS.find(u => u.email === targetEmail);
        if (mockReq) targetInstId = mockReq.institutionId;
      }
    }

    const cv = await CV.create({
      name, email, document: req.file.filename,
      sourceInstitutionId,
      targetInstitutionId: targetInstId,
      targetVacancyId: task.targetVacancyId,
      status: 'En Proceso',
      history: [{
        action: 'Enviado',
        details: `Enviado desde ${sourceInstitutionId} para vacante objetivo.`
      }]
    });

    task.status = 'COMPLETED';
    await task.save();
    // --- NOTIFICATION TARGETING ---
    // Si no hay targetInstId, es para el admin global. Si hay, verificamos que no sea el mismo que envía.
    const isSelf = targetInstId && sourceInstitutionId && targetInstId.toString() === sourceInstitutionId.toString();
    
    if (!isSelf) {
      const n1 = await Notification.create({
        targetInstitutionId: targetInstId || 'global',
        message: `¡SLA Cumplido! ${sourceInstitutionId} te ha enviado un CV (${name}) que solicitaste.`,
        type: 'SUCCESS',
        link: '/gestion-tareas'
      });
      console.log(`[NOTIF CREATED] Requester: ${targetInstId || 'global'} - ${n1.message}`);
    }

    const n2 = await Notification.create({
      targetInstitutionId: sourceInstitutionId,
      message: `Has enviado el CV de ${name} exitosamente a ${targetInstId || 'la institución destino'}.`,
      type: 'INFO',
      link: '/gestion-tareas'
    });
    console.log(`[NOTIF CREATED] Sender: ${sourceInstitutionId} - ${n2.message}`);

    res.status(201).json({ cv, task });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// --- USERS API ---
app.get('/api/users', async (req, res) => {
  try { res.json(await User.find().populate('institutionId')); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (req.body.role) u.role = req.body.role;
    if (req.body.institutionId !== undefined) {
      u.institutionId = req.body.institutionId === '' ? null : req.body.institutionId;
    }
    await u.save();
    res.json(u);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// --- CONTACTS API ---
app.get('/api/contacts', async (req, res) => {
  try { res.json(await Contact.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.post('/api/contacts', async (req, res) => {
  try { res.status(201).json(await Contact.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.put('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(contact);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contacto no encontrado' });
    res.json({ message: 'Contacto eliminado' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// --- NOTIFICATIONS API ---
app.get('/api/notifications/:institutionId', async (req, res) => {
  try {
    const { institutionId } = req.params;
    console.log(`[GET NOTIFICATIONS] Query InstitutionId: ${institutionId}`);
    
    let q = {};
    if (institutionId === 'global' || institutionId === 'null' || institutionId === 'undefined' || !institutionId) {
      // Admin global: show only global/admin notifications
      q = { $or: [
        { targetInstitutionId: null }, 
        { targetInstitutionId: '' }, 
        { targetInstitutionId: 'global' }
      ] };
    } else {
      // Institution user: show ONLY notifications targeted to their own institution
      // (no global admin notifications — those are not meant for them)
      q = { targetInstitutionId: institutionId };
    }
      
    const notifs = await Notification.find(q).sort({ createdAt: -1 }).limit(30);
    res.json(notifs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Falta userId' });
    
    // Add userId to readBy array if not already present
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: userId }
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- FINES API ---
app.get('/api/fines', async (req, res) => {
  try {
    const { institutionId } = req.query;
    console.log(`[GET FINES] Query InstitutionId: ${institutionId}`);
    const q = institutionId ? { institutionId } : {};
    const fines = await Fine.find(q).populate('institutionId').sort({ createdAt: -1 });
    res.json(fines);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/fines', async (req, res) => {
  try {
    const fine = await Fine.create(req.body);
    res.status(201).json(fine);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch('/api/fines/:id/status', async (req, res) => {
  try {
    const fine = await Fine.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(fine);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/', (req, res) => {
  res.send('Servidor de TalentCollab funcionando correctamente 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Backend de Colaboración de Talento (MVP) corriendo en http://localhost:${PORT}`); });
