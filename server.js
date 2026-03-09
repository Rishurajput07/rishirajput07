// ═══════════════════════════════════════
//  DIVYA PUBLIC SCHOOL — Express Server
// ═══════════════════════════════════════
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const { Admission, Notice, Student, Gallery } = require('./models');

const app = express();

// ── MIDDLEWARE ──────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
// Create uploads folder if not exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ── FILE UPLOAD SETUP ───────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only images allowed!'));
  }
});

// ── MONGODB CONNECTION ──────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ── AUTH MIDDLEWARE ─────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ═══════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════

// ── ADMIN LOGIN ─────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Wrong username or password' });
  }
});
// Also accept /api/admissions (with s)
app.post('/api/admissions', async (req, res) => {
  try {
    const admission = new Admission(req.body);
    await admission.save();
    res.json({ success: true, message: 'Admission form submitted successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// ═══════════════════════════════════════
//  ADMISSION ROUTES
// ═══════════════════════════════════════

// Submit admission form (public)
app.post('/api/admission', async (req, res) => {
  try {
    const admission = new Admission(req.body);
    await admission.save();
    res.json({ success: true, message: 'Admission form submitted successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all admissions (admin only)
app.get('/api/admissions', authMiddleware, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { studentName: new RegExp(search, 'i') },
      { fatherName:  new RegExp(search, 'i') },
      { mobile:      new RegExp(search, 'i') }
    ];
    const admissions = await Admission.find(query).sort({ submittedAt: -1 });
    res.json({ success: true, data: admissions, total: admissions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update admission status (admin)
app.put('/api/admission/:id', authMiddleware, async (req, res) => {
  try {
    const admission = await Admission.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, data: admission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete admission (admin)
app.delete('/api/admission/:id', authMiddleware, async (req, res) => {
  try {
    await Admission.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════
//  NOTICE ROUTES
// ═══════════════════════════════════════

// Get all active notices (public)
app.get('/api/notices', async (req, res) => {
  try {
    const notices = await Notice.find({ isActive: true }).sort({ publishedAt: -1 });
    res.json({ success: true, data: notices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add notice (admin)
app.post('/api/notice', authMiddleware, async (req, res) => {
  try {
    const notice = new Notice({ text: req.body.text });
    await notice.save();
    res.json({ success: true, data: notice });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete notice (admin)
app.delete('/api/notice/:id', authMiddleware, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════
//  STUDENT RECORDS ROUTES
// ═══════════════════════════════════════

// Get all students (admin)
app.get('/api/students', authMiddleware, async (req, res) => {
  try {
    const { class: cls, search, feesStatus } = req.query;
    let query = { isActive: true };
    if (cls) query.class = cls;
    if (feesStatus) query.feesStatus = feesStatus;
    if (search) query.$or = [
      { name:       new RegExp(search, 'i') },
      { studentId:  new RegExp(search, 'i') },
      { fatherName: new RegExp(search, 'i') },
      { mobile:     new RegExp(search, 'i') }
    ];
    const students = await Student.find(query).sort({ class: 1, rollNumber: 1 });
    res.json({ success: true, data: students, total: students.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add student (admin)
app.post('/api/student', authMiddleware, async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.json({ success: true, data: student, message: `Student ID: ${student.studentId}` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update student (admin)
app.put('/api/student/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete student (admin)
app.delete('/api/student/:id', authMiddleware, async (req, res) => {
  try {
    await Student.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Student removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════
//  GALLERY ROUTES
// ═══════════════════════════════════════

// Get all gallery (public)
app.get('/api/gallery', async (req, res) => {
  try {
    const { category } = req.query;
    let query = { isActive: true };
    if (category && category !== 'All Photos') query.category = category;
    const photos = await Gallery.find(query).sort({ uploadedAt: -1 });
    res.json({ success: true, data: photos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload gallery photo (admin)
app.post('/api/gallery', authMiddleware, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const gallery = new Gallery({
      title:    req.body.title || 'School Photo',
      imageUrl,
      category: req.body.category || 'Other'
    });
    await gallery.save();
    res.json({ success: true, data: gallery });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete gallery photo (admin)
app.delete('/api/gallery/:id', authMiddleware, async (req, res) => {
  try {
    await Gallery.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Photo removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DASHBOARD STATS ─────────────────────
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const [admissions, pending, students, notices, gallery] = await Promise.all([
      Admission.countDocuments(),
      Admission.countDocuments({ status: 'Pending' }),
      Student.countDocuments({ isActive: true }),
      Notice.countDocuments({ isActive: true }),
      Gallery.countDocuments({ isActive: true })
    ]);
    res.json({ success: true, data: { admissions, pending, students, notices, gallery } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── START SERVER ────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 MongoDB: ${process.env.MONGODB_URI}`);
});
