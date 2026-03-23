// server/routes/payment.js
// Stripe Payment Gateway Integration
require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

// Initialize Stripe — only if key is present
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY') {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {}

// POST /api/payment/create-intent
// Creates a Stripe PaymentIntent for consultation fee
router.post('/create-intent', auth, async (req, res) => {
  const { doctor_id, consultation_fee, doctor_name, consultation_type } = req.body;

  if (!stripe) {
    // Demo mode — return a fake client secret for testing without real Stripe keys
    return res.json({
      clientSecret: 'demo_secret_' + Date.now(),
      paymentIntentId: 'demo_pi_' + Date.now(),
      demo: true,
      message: 'Demo mode: Add your STRIPE_SECRET_KEY in .env to enable real payments'
    });
  }

  try {
    const amountInPaise = Math.round(parseFloat(consultation_fee) * 100); // Stripe uses smallest currency unit

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: 'inr',
      metadata: {
        doctor_id,
        patient_id: req.user.id,
        patient_email: req.user.email,
        doctor_name,
        consultation_type,
      },
      description: `Telemedicine Consultation with ${doctor_name} (${consultation_type})`,
      receipt_email: req.user.email,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      demo: false
    });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ message: 'Payment initiation failed: ' + err.message });
  }
});

// POST /api/payment/confirm
// Called after successful Stripe payment to save payment record
router.post('/confirm', auth, async (req, res) => {
  const { payment_intent_id, appointment_id, amount, doctor_name } = req.body;

  try {
    // Verify payment with Stripe (if real keys configured)
    let paymentStatus = 'succeeded';
    if (stripe && !payment_intent_id.startsWith('demo_')) {
      const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
      paymentStatus = intent.status;
      if (paymentStatus !== 'succeeded') {
        return res.status(400).json({ message: 'Payment not completed yet' });
      }
    }

    // Update appointment as paid in DB
    if (appointment_id) {
      await pool.query(
        `UPDATE appointments SET notes = COALESCE(notes,'') || ' | Payment: ₹' || $1 || ' (ID: ' || $2 || ')' WHERE id = $3`,
        [amount, payment_intent_id, appointment_id]
      );
    }

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      payment_id: payment_intent_id,
      amount
    });
  } catch (err) {
    console.error('Payment confirm error:', err);
    res.status(500).json({ message: 'Error confirming payment' });
  }
});

// GET /api/payment/history
// Patient's payment history
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.appointment_date, a.appointment_time, a.consultation_type, a.notes,
             u.full_name AS doctor_name, d.specialization, d.consultation_fee
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      JOIN doctors d ON u.id = d.user_id
      WHERE a.patient_id = $1 AND a.notes LIKE '%Payment:%'
      ORDER BY a.appointment_date DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching payment history' });
  }
});

module.exports = router;
