// server/routes/payment.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { auth } = require('../middleware/auth');

let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('REPLACE')) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized (real mode)');
  } else {
    console.log('ℹ️  Stripe running in DEMO mode (no real charges)');
  }
} catch (e) {
  console.log('ℹ️  Stripe not available, demo mode active');
}

// POST /api/payment/create-intent
router.post('/create-intent', auth, async (req, res) => {
  const { doctor_id, consultation_fee, doctor_name, consultation_type } = req.body;

  if (!stripe) {
    return res.json({
      clientSecret: 'demo_secret_' + Date.now(),
      paymentIntentId: 'demo_pi_' + Date.now(),
      demo: true
    });
  }

  try {
    const amount = Math.round(parseFloat(consultation_fee) * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount, currency: 'inr',
      metadata: { doctor_id, patient_id: req.user.id, doctor_name, consultation_type },
      description: `Telemedicine Consultation with ${doctor_name}`,
      receipt_email: req.user.email,
    });
    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id, demo: false });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ message: 'Payment initiation failed: ' + err.message });
  }
});

// POST /api/payment/confirm
router.post('/confirm', auth, async (req, res) => {
  const { payment_intent_id, appointment_id, amount, is_demo } = req.body;

  try {
    // DEMO MODE: if no real Stripe key OR payment ID starts with demo_ → always succeed
    const isDemoPayment = !stripe || !payment_intent_id || String(payment_intent_id).startsWith('demo_') || String(is_demo) === 'true';

    if (!isDemoPayment) {
      try {
        const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
        if (intent.status !== 'succeeded') {
          return res.status(400).json({ message: 'Payment not verified by Stripe. Please try again.' });
        }
      } catch (stripeErr) {
        console.error('Stripe verify error:', stripeErr.message);
        return res.status(400).json({ message: 'Stripe verification failed: ' + stripeErr.message });
      }
    }

    // Update appointment notes only (safest — works with or without migration)
    if (appointment_id) {
      try {
        await pool.query(
          `UPDATE appointments
           SET notes = COALESCE(notes, '') || $1
           WHERE id = $2`,
          [` | Paid: ₹${parseFloat(amount) || 0} (ID:${payment_intent_id})`, appointment_id]
        );
      } catch (dbErr) {
        // Non-fatal — payment still succeeded even if DB update fails
        console.warn('DB update warning (non-fatal):', dbErr.message);
      }
    }

    // Always return success in demo mode
    return res.json({
      success: true,
      message: 'Payment confirmed successfully',
      payment_id: payment_intent_id,
      amount,
      demo: isDemoPayment
    });

  } catch (err) {
    console.error('Payment confirm error:', err.message);
    res.status(500).json({ message: 'Error confirming payment: ' + err.message });
  }
});

// POST /api/payment/refund
router.post('/refund', auth, async (req, res) => {
  const { appointment_id, reason } = req.body;

  try {
    const apptRes = await pool.query(`SELECT * FROM appointments WHERE id = $1`, [appointment_id]);
    if (apptRes.rows.length === 0) return res.status(404).json({ message: 'Appointment not found' });

    const appt = apptRes.rows[0];

    if (appt.patient_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to refund this appointment' });
    }

    // Extract payment ID from notes or payment_id column
    const paymentId = appt.payment_id || appt.notes?.match(/ID:([^\s\)]+)/)?.[1]?.trim();

    let refundId = 'demo_refund_' + Date.now();

    if (stripe && paymentId && !paymentId.startsWith('demo_')) {
      try {
        const refund = await stripe.refunds.create({ payment_intent: paymentId, reason: 'requested_by_customer' });
        refundId = refund.id;
      } catch (stripeErr) {
        console.error('Stripe refund error:', stripeErr.message);
        return res.status(500).json({ message: 'Stripe refund failed: ' + stripeErr.message });
      }
    }

    // Update notes (works without migration)
    await pool.query(
      `UPDATE appointments SET notes = COALESCE(notes,'') || ' | REFUNDED (ID:' || $1 || ')' WHERE id = $2`,
      [refundId, appointment_id]
    );

    // Try updating new columns if they exist
    try {
      await pool.query(
        `UPDATE appointments SET refund_id=$1, refund_reason=$2, refund_status='completed', payment_status='refunded' WHERE id=$3`,
        [refundId, reason || 'Refund processed', appointment_id]
      );
    } catch (_) { /* columns don't exist yet — fine */ }

    const paidAmount = appt.payment_amount || parseFloat(appt.notes?.match(/Paid: ₹([\d.]+)/)?.[1]) || 0;

    res.json({
      success: true,
      message: `Refund of ₹${paidAmount} processed successfully`,
      refund_id: refundId,
      amount: paidAmount
    });

  } catch (err) {
    console.error('Refund error:', err.message);
    res.status(500).json({ message: 'Error processing refund: ' + err.message });
  }
});

// POST /api/payment/request-refund
router.post('/request-refund', auth, async (req, res) => {
  const { appointment_id, reason } = req.body;
  try {
    await pool.query(
      `UPDATE appointments SET notes = COALESCE(notes,'') || ' | REFUND_REQUESTED' WHERE id=$1 AND patient_id=$2`,
      [appointment_id, req.user.id]
    );
    res.json({ message: 'Refund requested successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error requesting refund' });
  }
});

// GET /api/payment/history
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.appointment_date, a.appointment_time, a.consultation_type,
             a.notes, a.status,
             u.full_name AS doctor_name, d.specialization, d.consultation_fee
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      JOIN doctors d ON u.id = d.user_id
      WHERE a.patient_id = $1
        AND (a.notes LIKE '%Paid:%' OR a.notes LIKE '%Payment:%')
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    const rows = result.rows.map(r => ({
      ...r,
      payment_amount: parseFloat(r.notes?.match(/Paid: ₹([\d.]+)/)?.[1] || r.consultation_fee),
      payment_status: r.notes?.includes('REFUNDED') ? 'refunded' : 'paid',
      refund_status: r.notes?.includes('REFUNDED') ? 'completed' : null,
    }));

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching payment history' });
  }
});

module.exports = router;
