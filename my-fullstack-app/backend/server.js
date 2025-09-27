import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { loadCSV, simulateNewRow, getVibrations, getPredictions } from './controllers/vibrationController.js';

// Load .env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS only for frontend
app.use(cors({
  origin: 'https://vibration-q6co.onrender.com'
}));

app.use(express.json());

// Load CSV and start simulation
loadCSV();
simulateNewRow();

// Routes
app.get('/vibration', getVibrations);
app.get('/predict', getPredictions);

app.listen(PORT, () => 
  console.log(`🚀 Backend running at http://localhost:${PORT}`)
);
