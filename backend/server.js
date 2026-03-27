require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { keyPairFromSeed } = require('./eddsa');

const app = express();
app.use(cors({
    origin: 'https://eval-test-canteen.vercel.app', // Your exact Vercel URL (No trailing slash!)
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Use a deterministic seed for EdDSA (from env)
const hexSeed = process.env.EDDSA_SEED;
if (!hexSeed || hexSeed.length !== 64) {
    throw new Error('EDDSA_SEED must be set and be 32 bytes/64 hex chars.');
}

// Make keypair globally available (for use in routes)
const { keyPair } = require('./keypair');
module.exports.keyPair = keyPair;

app.use('/api', routes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));