const { Pool } = require('pg');

// Uses environment variables for DB authentication (.env)
const pool = new Pool();

// 🛠️ THE FIX: Auto-initialize the table on startup.
// This guarantees the table exists in the exact database Node is connected to.
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedbacks (
                id SERIAL PRIMARY KEY,
                customer_name VARCHAR(100),
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                signature TEXT NOT NULL,
                public_key TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Database initialized: 'feedbacks' table is ready.");
    } catch (err) {
        console.error("❌ Failed to create table. Check your .env credentials:", err.message);
    }
}

// Run the initialization immediately
initDB();

async function addFeedback({ customer_name, rating, comment, signature, public_key }) {
    const result = await pool.query(
        `INSERT INTO feedbacks (customer_name, rating, comment, signature, public_key)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [customer_name, rating, comment, signature, public_key]
    );
    return result.rows[0];
}

async function getAllFeedback() {
    const result = await pool.query(
        `SELECT * FROM feedbacks ORDER BY created_at DESC`
    );
    return result.rows;
}

module.exports = { addFeedback, getAllFeedback };