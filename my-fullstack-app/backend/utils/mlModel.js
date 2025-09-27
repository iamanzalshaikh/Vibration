import regression from 'regression';

export const linearRegressionPredict = (data, steps) => {
  if (data.length < 2) return [];

  const regressionData = data.map((d, i) => [i, d.vibration]);
  const result = regression.linear(regressionData);

  const lastIndex = data.length - 1;
  const lastTimestamp = new Date(data[lastIndex].timestamp);

  const predictions = [];
  for (let i = 1; i <= steps; i++) {
    const predictedVibration = result.predict(lastIndex + i)[1];
    const noise = (Math.random() - 0.5) * 0.02;
    const finalPrediction = Math.max(0, predictedVibration + noise);
    const futureTimestamp = new Date(lastTimestamp.getTime() + i * 2000);

    predictions.push({
      timestamp: futureTimestamp.toISOString(),
      vibration: parseFloat(finalPrediction.toFixed(3)),
      predicted: true
    });
  }

  return predictions;
};
