const socket = io();

const chartElement = document.getElementById('lineChart').getContext('2d');

const chartData = {
  labels: [],
  datasets: [{
    label: 'Values',
    data: [],
    borderColor: 'rgba(75, 192, 192, 1)',
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    borderWidth: 2,
    pointRadius: 3,
    pointBackgroundColor: 'rgba(255, 255, 255, 1)',
    pointBorderColor: 'rgba(75, 192, 192, 1)',
    pointBorderWidth: 1,
    cubicInterpolationMode: 'default'
  }]
};


const lineChart = new Chart(chartElement, {
  type: 'line',
  data: chartData,
  options: {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'second',
          displayFormats: {
            second: 'HH:mm:ss'
          }
        },
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(75, 192, 192, 1)',
          callback: function(value, index, values) {
            const currentTime = new Date().getTime();
            const valueTime = new Date(value).getTime();
            const diffInSeconds = Math.round((currentTime - valueTime) / 1000);
            
            if (diffInSeconds < 60) {
              return diffInSeconds + ' secs ago';
            } else if (diffInSeconds < 3600) {
              return Math.floor(diffInSeconds / 60) + ' min ago';
            } else {
              return Math.floor(diffInSeconds / 3600) + ' hours ago';
            }
          }
        },
      },
      y: {
        grid: {
          color: 'rgba(75, 192, 192, 0.1)'
        },
        ticks: {
          color: 'rgba(75, 192, 192, 1)'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(75, 192, 192, 1)'
        }
      }
    }
  }
});


function updatePredictionTable(predictions) {
  const tableBody = document.getElementById('predictionTableBody');
  tableBody.innerHTML = '';

  predictions.forEach((prediction, index) => {
    const row = document.createElement('tr');

    const indexCell = document.createElement('td');
    indexCell.textContent = index + 1;
    row.appendChild(indexCell);

    const predictedCell = document.createElement('td');
    predictedCell.textContent = prediction.predicted.toFixed(2);
    row.appendChild(predictedCell);

    const actualCell = document.createElement('td');
    actualCell.textContent = prediction.actual.toFixed(2);
    row.appendChild(actualCell);

    const correctCell = document.createElement('td');
    correctCell.textContent = prediction.correct ? 'Yes' : 'No';
    row.appendChild(correctCell);

    tableBody.appendChild(row);
  });
}



function movingAverage(values, windowSize) {
  const result = [];
  for (let i = 0; i <= values.length - windowSize; i++) {
    result.push(values.slice(i, i + windowSize).reduce((a, b) => a + b) / windowSize);
  }
  return result;
}

function meanAbsolutePercentageError(y_true, y_pred) {
  const n = y_true.length;
  let totalError = 0;
  for (let i = 0; i < n; i++) {
    totalError += Math.abs((y_true[i] - y_pred[i]) / y_true[i]);
  }
  return (totalError / n) * 100;
}


let lastValue = null;
let currentPrediction = null;
let correctPredictions = 0;
let totalPredictions = 0;
const latestPredictions = [];

socket.on('newData', async (dataPoint) => {
  const { value, created_at, predictedValue } = dataPoint;
  
  // Check if the new value is different from the last value
  if (lastValue === null || lastValue !== value) {
    chartData.labels.push(created_at);
    chartData.datasets[0].data.push(value);

    if (currentPrediction !== null) {
      
      const predictedValueElement = document.getElementById('predictedValue');
      predictedValueElement.innerHTML = `Predicted Value: ${dataPoint.predictedValue.toFixed(2)}`;
      const actualValue = value;
      const isCorrect = currentPrediction <= actualValue;
      correctPredictions += isCorrect ? 1 : 0;
      totalPredictions += 1;

      latestPredictions.push({
        predicted: currentPrediction,
        actual: actualValue,
        correct: isCorrect
      });

      if (latestPredictions.length > 10) {
        latestPredictions.shift();
      }

      updatePredictionTable(latestPredictions);

      const accuracyRate = (correctPredictions / totalPredictions) * 100;
      console.log('Accuracy rate:', accuracyRate);

      const accuracyElement = document.getElementById('accuracyRate');
      accuracyElement.textContent = 'Accuracy rate: ' + accuracyRate.toFixed(2) + '%';
    }

    currentPrediction = predictedValue;
    lineChart.update();
  }

  // Update the last value
  lastValue = value;
});

