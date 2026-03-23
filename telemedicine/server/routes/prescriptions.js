// server/routes/prescriptions.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/prescriptions - doctor creates prescription
router.post('/', auth, requireRole('doctor'), async (req, res) => {
  const { appointment_id, patient_id, medicines, instructions, diagnosis, follow_up_date } = req.body;
  const doctor_id = req.user.id;

  try {
    const result = await pool.query(
      `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, medicines, instructions, diagnosis, follow_up_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [appointment_id, doctor_id, patient_id, medicines, instructions, diagnosis, follow_up_date || null]
    );
    // Mark appointment as completed
    await pool.query(`UPDATE appointments SET status='completed' WHERE id=$1`, [appointment_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating prescription' });
  }
});

// GET /api/prescriptions/my - patient gets their prescriptions
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pr.*, u.full_name AS doctor_name, d.specialization
      FROM prescriptions pr
      JOIN users u ON pr.doctor_id = u.id
      JOIN doctors d ON u.id = d.user_id
      WHERE pr.patient_id = $1
      ORDER BY pr.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching prescriptions' });
  }
});

module.exports = router;
