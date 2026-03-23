// server/routes/doctors.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

// GET /api/doctors - list all doctors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.phone,
             d.specialization, d.qualification, d.experience_years,
             d.consultation_fee, d.rating, d.total_consultations,
             d.available_slots, d.is_available
      FROM users u
      JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor' AND d.is_available = true
      ORDER BY d.rating DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.phone,
             d.specialization, d.qualification, d.experience_years,
             d.consultation_fee, d.rating, d.total_consultations,
             d.available_slots, d.is_available
      FROM users u
      JOIN doctors d ON u.id = d.user_id
      WHERE u.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Doctor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching doctor' });
  }
});

module.exports = router;
