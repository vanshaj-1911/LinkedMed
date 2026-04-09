// server/routes/appointments.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/appointments - book appointment (status = pending_approval)
router.post('/', auth, async (req, res) => {
  const { doctor_id, appointment_date, appointment_time, consultation_type, symptoms } = req.body;
  const patient_id = req.user.id;

  if (!doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ message: 'Doctor, date, and time are required' });
  }

  try {
    const conflict = await pool.query(
      `SELECT id FROM appointments WHERE doctor_id=$1 AND appointment_date=$2 AND appointment_time=$3 AND status NOT IN ('cancelled','rejected')`,
      [doctor_id, appointment_date, appointment_time]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ message: 'This slot is already booked. Please choose another time.' });
    }

    // Status starts as pending_approval — doctor must accept
    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, consultation_type, symptoms, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending_approval') RETURNING *`,
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
             d.specialization, d.consultation_fee,
             pr.medicines, pr.instructions, pr.diagnosis
      FROM appointments a
      JOIN users u_doc ON a.doctor_id = u_doc.id
      JOIN doctors d ON u_doc.id = d.user_id
      LEFT JOIN prescriptions pr ON a.id = pr.appointment_id
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
             u_pat.email AS patient_email,
             pt.age, pt.gender, pt.blood_group
      FROM appointments a
      JOIN users u_pat ON a.patient_id = u_pat.id
      LEFT JOIN patients pt ON a.patient_id = pt.user_id
      WHERE a.doctor_id = $1
      ORDER BY a.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// PATCH /api/appointments/:id/status - generic status update
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE appointments SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

// PATCH /api/appointments/:id/accept - doctor accepts appointment
router.patch('/:id/accept', auth, requireRole('doctor'), async (req, res) => {
  const { doctor_note } = req.body;
  try {
    const result = await pool.query(
      `UPDATE appointments SET status='confirmed', doctor_note=$1 WHERE id=$2 AND doctor_id=$3 RETURNING *`,
      [doctor_note || null, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Appointment not found or not yours' });
    res.json({ message: 'Appointment accepted', appointment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error accepting appointment' });
  }
});

// PATCH /api/appointments/:id/reject - doctor rejects appointment
router.patch('/:id/reject', auth, requireRole('doctor'), async (req, res) => {
  const { doctor_note } = req.body;
  try {
    const result = await pool.query(
      `UPDATE appointments SET status='rejected', doctor_note=$1 WHERE id=$2 AND doctor_id=$3 RETURNING *`,
      [doctor_note || 'Doctor unavailable for this slot', req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });

    // If payment was already made, trigger auto refund
    const appt = result.rows[0];
    if (appt.payment_id && appt.payment_status === 'paid') {
      await pool.query(
        `UPDATE appointments SET refund_status='pending', refund_reason='Doctor rejected appointment' WHERE id=$1`,
        [req.params.id]
      );
    }

    res.json({ message: 'Appointment rejected', appointment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error rejecting appointment' });
  }
});

// POST /api/appointments/:id/request-refund - patient requests refund
router.post('/:id/request-refund', auth, async (req, res) => {
  const { reason } = req.body;
  try {
    const appt = await pool.query(`SELECT * FROM appointments WHERE id=$1 AND patient_id=$2`, [req.params.id, req.user.id]);
    if (appt.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });

    const a = appt.rows[0];
    if (!a.payment_id) return res.status(400).json({ message: 'No payment found for this appointment' });
    if (a.refund_status === 'completed') return res.status(400).json({ message: 'Refund already processed' });

    await pool.query(
      `UPDATE appointments SET status='refund_requested', refund_reason=$1, refund_status='pending' WHERE id=$2`,
      [reason || 'Patient requested refund', req.params.id]
    );
    res.json({ message: 'Refund requested successfully. Will be processed within 3-5 business days.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error requesting refund' });
  }
});

module.exports = router;
