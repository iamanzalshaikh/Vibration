// import fs from 'fs';
// import path from 'path';
// import { parse } from 'csv-parse';
// import { linearRegressionPredict } from '../utils/mlModel.js';

// let vibrationData = [];

// // Correct CSV path
// const csvPath = path.join(process.cwd(), 'vibration.csv'); // Correct path

// export const loadCSV = () => {
//   fs.createReadStream(csvPath)
//     .pipe(parse({ columns: true, skip_empty_lines: true }))
//     .on('data', row => {
//       vibrationData.push({
//         timestamp: row.timestamp,
//         vibration: parseFloat(row.vibration),
//         timeNumeric: new Date(row.timestamp).getTime(),
//         anomaly: parseFloat(row.vibration) > 0.17
//       });
//     })
//     .on('end', () => console.log(`✅ Loaded ${vibrationData.length} vibration rows`))
//     .on('error', err => console.error('❌ CSV Load Error:', err));
// };

// // Simulate new row every 60 seconds
// export const simulateNewRow = () => {
//   setInterval(() => {
//     if (vibrationData.length === 0) return;
//     const lastTimestamp = new Date(vibrationData[vibrationData.length - 1].timestamp);
//     const newTimestamp = new Date(lastTimestamp.getTime() + 2000); // 2s interval
//     const newVibration = 0.10 + Math.random() * 0.07;

//     vibrationData.push({
//       timestamp: newTimestamp.toISOString(),
//       vibration: parseFloat(newVibration.toFixed(3)),
//       timeNumeric: newTimestamp.getTime(),
//       anomaly: newVibration > 0.17
//     });

//     console.log('✅ Added new vibration row:', newTimestamp.toISOString());
//   }, 60000); // every 60 seconds
// };

// // Get all vibration data
// export const getVibrations = (req, res) => {
//   res.json({ success: true, data: vibrationData, timestamp: new Date().toISOString() });
// };

// // Get ML predictions
// export const getPredictions = (req, res) => {
//   const steps = parseInt(req.query.steps) || 10;
//   const predictions = linearRegressionPredict(vibrationData, steps);
//   res.json({ success: true, data: predictions, steps, timestamp: new Date().toISOString() });
// };


import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { linearRegressionPredict } from '../utils/mlModel.js';

let vibrationData = [];

// Load CSV on startup
export const loadCSV = () => {
const csvPath = path.join(process.cwd(), 'vibration.csv'); // Correct path
  fs.createReadStream(csvPath)
    .pipe(parse({ columns: true, skip_empty_lines: true }))
    .on('data', row => {
      vibrationData.push({
        timestamp: row.timestamp,
        vibration: parseFloat(row.vibration),
        timeNumeric: new Date(row.timestamp).getTime(),
        anomaly: parseFloat(row.vibration) > 0.17
      });
    })
    .on('end', () => console.log(`✅ Loaded ${vibrationData.length} vibration rows`))
    .on('error', err => console.error('❌ CSV Load Error:', err));
};

// Append new simulated vibration row every 60s
export const simulateNewRow = () => {
  setInterval(() => {
    const newTimestamp = new Date(); // current time
    const newVibration = 0.10 + Math.random() * 0.07;

    vibrationData.push({
      timestamp: newTimestamp.toISOString(),
      vibration: parseFloat(newVibration.toFixed(3)),
      timeNumeric: newTimestamp.getTime(),
      anomaly: newVibration > 0.17
    });

    console.log('✅ Added new vibration row:', newTimestamp.toISOString());
  }, 60000); // every 60 seconds
};

// Controllers
export const getVibrations = (req, res) => {
  res.json({
    success: true,
    data: vibrationData,
    count: vibrationData.length,
    timestamp: new Date().toISOString()
  });
};

export const getPredictions = (req, res) => {
  const steps = parseInt(req.query.steps) || 10;
  const predictions = linearRegressionPredict(vibrationData, steps);

  res.json({
    success: true,
    data: predictions,
    steps,
    timestamp: new Date().toISOString()
  });
};
