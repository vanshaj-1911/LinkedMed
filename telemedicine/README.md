# 🏥 Telemedicine Platform For Remote Consultation
### SRMS College, Bareilly | B.Tech Project
**Team:** Kritika Sharma • Saket Juneja • Vanshaj Goel

---

## 📋 PROJECT OVERVIEW
A full-stack telemedicine web application allowing patients to consult doctors online via video, audio, or chat. Features appointment booking, digital prescriptions, medical records, and AI symptom pre-assessment.

**Tech Stack:**
- **Frontend:** React.js + React Router
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL on Neon (Cloud)
- **Auth:** JWT (JSON Web Tokens) + bcrypt
- **API:** RESTful JSON API

---

## 🔑 ADMIN LOGIN CREDENTIALS
```
Email:    vanshaj7770@gmail.com
Password: Pfl@82732
Role:     ADMIN (full access)
```

**Other Demo Accounts:**
```
Patient:  patient@demo.com     / Patient@1234
Doctor:   dr.sharma@telemedicine.com / Doctor@1234
Doctor:   dr.priya@telemedicine.com  / Doctor@1234
Doctor:   dr.anil@telemedicine.com   / Doctor@1234
Doctor:   dr.meena@telemedicine.com  / Doctor@1234
```

---

## 🚀 SETUP & RUNNING INSTRUCTIONS

### STEP 1 — Prerequisites
Make sure you have these installed:
```bash
node --version    # Must be v16 or higher
npm --version     # Must be v8 or higher
```
If not installed, download from: https://nodejs.org

---

### STEP 2 — Get Neon Database URL (FREE)
1. Go to https://console.neon.tech
2. Sign up with Google (free)
3. Click **"New Project"** → name it `telemedicine`
4. After creation, copy the **Connection String** that looks like:
   ```
   postgresql://neondb_owner:abc123@ep-cool-dawn-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Open the file `.env` in the project root and replace `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://YOUR_ACTUAL_CONNECTION_STRING_HERE
   ```

---

### STEP 3 — Install Dependencies
Open terminal in the project folder and run:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

---

### STEP 4 — Setup Database (Run ONCE)
```bash
node server/db/setup.js
```

You should see:
```
🔗 Connected to Neon PostgreSQL...
✅ users table created
✅ patients table created
✅ doctors table created
✅ appointments table created
✅ prescriptions table created
✅ medical_records table created
✅ Admin user seeded: vanshaj7770@gmail.com / Pfl@82732
🎉 DATABASE SETUP COMPLETE!
```

---

### STEP 5 — Run the Application

**Terminal 1 — Start Backend Server:**
```bash
npm start
```
Server runs at: http://localhost:5000

**Terminal 2 — Start Frontend:**
```bash
cd client
npm start
```
App opens at: http://localhost:3000

---

### STEP 6 — Open in Browser
Go to: **http://localhost:3000**

Login with admin credentials:
- Email: `vanshaj7770@gmail.com`
- Password: `Pfl@82732`

---

## 📁 PROJECT STRUCTURE
```
telemedicine/
├── .env                        # Environment variables (add your Neon URL here)
├── package.json                # Backend dependencies
├── server/
│   ├── index.js                # Express server entry point
│   ├── db/
│   │   ├── pool.js             # Neon DB connection pool
│   │   └── setup.js            # Database setup + seed data
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   └── routes/
│       ├── auth.js             # Login / Register APIs
│       ├── doctors.js          # Doctors listing API
│       ├── appointments.js     # Booking & appointment APIs
│       └── prescriptions.js    # Prescription APIs
└── client/
    ├── package.json            # Frontend dependencies
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js              # Routes and App structure
        ├── index.js            # React entry point
        ├── api.js              # Axios API helper
        ├── context/
        │   └── AuthContext.js  # Authentication state
        ├── components/
        │   └── Navbar.js       # Navigation bar
        └── pages/
            ├── Home.js         # Landing page
            ├── Login.js        # Login page (with quick demo buttons)
            ├── Register.js     # Patient registration
            ├── Doctors.js      # Browse doctors + search/filter
            ├── BookAppointment.js  # Book appointment flow
            └── Dashboard.js    # Patient/Doctor/Admin dashboard
```

---

## 🔌 API ENDPOINTS

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new patient | No |
| POST | /api/auth/login | Login any user | No |
| GET | /api/doctors | List all doctors | No |
| GET | /api/doctors/:id | Get doctor details | No |
| POST | /api/appointments | Book appointment | Yes |
| GET | /api/appointments/my | Patient's appointments | Yes |
| GET | /api/appointments/doctor | Doctor's appointments | Yes |
| PATCH | /api/appointments/:id/status | Update status | Yes |
| POST | /api/prescriptions | Create prescription | Doctor |
| GET | /api/prescriptions/my | Patient's prescriptions | Yes |
| GET | /api/health | Server health check | No |

---

## ❗ TROUBLESHOOTING

**Error: Cannot connect to database**
→ Make sure your `DATABASE_URL` in `.env` is correct (copy from Neon console)
→ Make sure you ran `node server/db/setup.js`

**Error: Port 5000 already in use**
→ Change `PORT=5001` in `.env`, then update `client/package.json`: `"proxy": "http://localhost:5001"`

**Error: npm not found**
→ Install Node.js from https://nodejs.org (LTS version)

**React app not loading doctors**
→ Make sure backend server is running on port 5000
→ Check browser console for CORS errors

---

## 📊 DATABASE SCHEMA

```sql
users          → id, email, password, role, full_name, phone
patients       → id, user_id, age, gender, blood_group, address
doctors        → id, user_id, specialization, qualification, experience_years, fee, rating
appointments   → id, patient_id, doctor_id, date, time, type, status, symptoms
prescriptions  → id, appointment_id, doctor_id, patient_id, medicines, diagnosis
medical_records → id, patient_id, record_type, description, file_url
```

---

*Telemedicine Platform For Remote Consultation — SRMS College B.Tech Project 2024*
