const express = require('express');
const router = express.Router();
const { addFeedback, getAllFeedback } = require('./db');
const { signFeedback, verifySignature } = require('./eddsa');
const { keyPair } = require('./keypair');

router.post('/feedback', async (req, res) => {
    let { customer_name, rating, comment } = req.body;
    
    // 1. Strict typing before validation and signing
    customer_name = customer_name ? String(customer_name).trim() : null; 
    rating = Number(rating); 
    comment = comment ? String(comment).trim() : "";

    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    if (!comment) return res.status(400).json({ error: 'Comment required' });

    // 2. Cryptographically sign the data
    const feedbackForSign = { customer_name, rating, comment };
    const signature = signFeedback(keyPair.secretKey, feedbackForSign);
    const public_key = Buffer.from(keyPair.publicKey).toString('base64');

    try {
        const inserted = await addFeedback({ customer_name, rating, comment, signature, public_key });
        res.status(201).json(inserted);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Database insertion failed." });
    }
});

router.get('/feedbacks', async (req, res) => {
    try {
        const rows = await getAllFeedback();
        res.json(rows);
    } catch {
        res.status(500).json({ error: "Couldn't fetch feedback." });
    }
});

router.post('/verify', async (req, res) => {
    const { customer_name, rating, comment, signature, public_key } = req.body;
    const feedbackForVerify = { customer_name, rating, comment };
    
    try {
        const pubKeyBin = Buffer.from(public_key, 'base64');
        const valid = verifySignature(pubKeyBin, feedbackForVerify, signature);
        res.json({ valid });
    } catch (e) {
        res.json({ valid: false, error: "Malformed cryptographic data." });
    }
});

module.exports = router;