# 🏫 Divya Public School — Backend Setup

## Folder Structure
```
school-backend/
├── server.js      ← Main server
├── models.js      ← MongoDB models
├── .env           ← Config (change passwords here!)
├── package.json   ← Dependencies
└── uploads/       ← Gallery photos (auto-created)
```

## ⚡ Setup Steps

### Step 1 — MongoDB Install karo
- Download: https://www.mongodb.com/try/download/community
- Install karke run karo

### Step 2 — Node.js Install karo
- Download: https://nodejs.org
- LTS version lo

### Step 3 — Backend Start karo
```bash
cd school-backend
npm install
npm start
```

Server chalega: http://localhost:5000

---

## 🌐 API Endpoints

### Public (koi bhi call kar sakta hai)
| Method | URL | Kaam |
|--------|-----|------|
| POST | /api/admission | Admission form submit |
| GET | /api/notices | Sabhi notices lao |
| GET | /api/gallery | Gallery photos lao |

### Admin (login token chahiye)
| Method | URL | Kaam |
|--------|-----|------|
| POST | /api/admin/login | Admin login |
| GET | /api/admissions | Sabhi admission forms |
| PUT | /api/admission/:id | Status change (Approve/Reject) |
| DELETE | /api/admission/:id | Delete admission |
| POST | /api/notice | Notice add karo |
| DELETE | /api/notice/:id | Notice delete karo |
| GET | /api/students | Student records |
| POST | /api/student | Student add karo |
| PUT | /api/student/:id | Student update |
| DELETE | /api/student/:id | Student remove |
| POST | /api/gallery | Photo upload |
| DELETE | /api/gallery/:id | Photo delete |
| GET | /api/stats | Dashboard stats |

---

## 🔐 .env File (ZAROOR CHANGE KARO!)
```
MONGODB_URI=mongodb://localhost:27017/divya_public_school
PORT=5000
JWT_SECRET=apna_secret_yahan_likho
ADMIN_USERNAME=admin
ADMIN_PASSWORD=apna_password_yahan_likho
```

---

## 📱 Website ke saath connect karna

`admission.html` mein form submit hone pe ye code use karo:
```javascript
const API = 'http://localhost:5000';

// Admission submit
fetch(`${API}/api/admission`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});

// Notices fetch
fetch(`${API}/api/notices`)
  .then(r => r.json())
  .then(data => console.log(data.data));
```
