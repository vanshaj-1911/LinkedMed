// server/routes/appointments.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

// POST /api/appointments - book appointment
router.post('/', auth, async (req, res) => {
  const { doctor_id, appointment_date, appointment_time, consultation_type, symptoms } = req.body;
  const patient_id = req.user.id;

  if (!doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ message: 'Doctor, date, and time are required' });
  }

  try {
    // Check for conflict
    const conflict = await pool.query(
      `SELECT id FROM appointments WHERE doctor_id=$1 AND appointment_date=$2 AND appointment_time=$3 AND status != 'cancelled'`,
      [doctor_id, appointment_date, appointment_time]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ message: 'This slot is already booked. Please choose another time.' });
    }

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, consultation_type, symptoms, status)
       VALUES ($1,$2,$3,$4,$5,$6,'confirmed') RETURNING *`,
      [patient_id, doctor_id, appointment_date, appointment_time, consultation_type || 'video', symptoms || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error booking appointment' });
  }
});

// GET /api/appointments/my - patient's appointments
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
             u_doc.full_name AS doctor_name,
             d.specialization,
             p.full_name AS prescription_note,
             pr.medicines, pr.instructions, pr.diagnosis
      FROM appointments a
      JOIN users u_doc ON a.doctor_id = u_doc.id
      JOIN doctors d ON u_doc.id = d.user_id
      LEFT JOIN prescriptions pr ON a.id = pr.appointment_id
      LEFT JOIN users p ON a.patient_id = p.id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// GET /api/appointments/doctor - doctor's appointments
router.get('/doctor', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*,
             u_pat.full_name AS patient_name,
             u_pat.phone AS patient_phone,
             pt.age, pt.gender, pt.blood_group
      FROM appointments a
      JOIN users u_pat ON a.patient_id = u_pat.id
      LEFT JOIN patients pt ON a.patient_id = pt.user_id
      WHERE a.doctor_id = $1
      ORDER BY a.appointment_date DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE appointments SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

module.exports = router;
