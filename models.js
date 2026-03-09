// ═══════════════════════════════════════
//  DIVYA PUBLIC SCHOOL — MongoDB Models
// ═══════════════════════════════════════
const mongoose = require('mongoose');

// ── 1. ADMISSION FORM ──────────────────
const admissionSchema = new mongoose.Schema({
  // Student Info
  studentName:    { type: String, required: true, trim: true },
  dateOfBirth:    { type: Date,   required: true },
  gender:         { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  classApplying:  { type: String, required: true },
  previousSchool: { type: String, default: '' },

  // Parent Info
  fatherName:  { type: String, required: true },
  motherName:  { type: String, default: '' },
  mobile:      { type: String, required: true },
  email:       { type: String, default: '' },

  // Address
  address:   { type: String, required: true },
  transport: { type: String, default: 'No' },

  // Status
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  submittedAt: { type: Date, default: Date.now }
});

// ── 2. NOTICE ──────────────────────────
const noticeSchema = new mongoose.Schema({
  text:        { type: String, required: true },
  publishedAt: { type: Date,   default: Date.now },
  isActive:    { type: Boolean, default: true }
});

// ── 3. STUDENT RECORD ──────────────────
const studentSchema = new mongoose.Schema({
  studentId:   { type: String, unique: true },
  name:        { type: String, required: true },
  class:       { type: String, required: true },
  section:     { type: String, default: 'A' },
  rollNumber:  { type: Number },
  fatherName:  { type: String },
  motherName:  { type: String },
  mobile:      { type: String },
  email:       { type: String },
  address:     { type: String },
  dateOfBirth: { type: Date },
  gender:      { type: String },
  transport:   { type: String, default: 'No' },
  feesStatus:  { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Pending' },
  admissionDate: { type: Date, default: Date.now },
  isActive:    { type: Boolean, default: true },
  photo:       { type: String, default: '' }
});

// Auto-generate studentId before save
studentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = 'DPS' + String(count + 1).padStart(4, '0');
  }
  next();
});

// ── 4. GALLERY ─────────────────────────
const gallerySchema = new mongoose.Schema({
  title:       { type: String, required: true },
  imageUrl:    { type: String, required: true },
  category:    {
    type: String,
    enum: ['Sports Day', 'Annual Function', 'Classrooms', 'Events', 'Other'],
    default: 'Other'
  },
  uploadedAt:  { type: Date, default: Date.now },
  isActive:    { type: Boolean, default: true }
});

// ── EXPORT ─────────────────────────────
module.exports = {
  Admission: mongoose.model('Admission', admissionSchema),
  Notice:    mongoose.model('Notice',    noticeSchema),
  Student:   mongoose.model('Student',   studentSchema),
  Gallery:   mongoose.model('Gallery',   gallerySchema)
};
