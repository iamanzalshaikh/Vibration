import express from 'express';
import { getPredictions, getVibrations } from '../controllers/vibrationController.js';

const router = express.Router();

router.get('/vibration', getVibrations);
router.get('/predict', getPredictions);

export default router;
