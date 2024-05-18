const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mysql = require('mysql2');

const dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'aviatorBot'
});

dbConnection.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database.');
});

//TODO! -- Fix deprecated code

app.use(express.static('public'));
const ARIMA = require('arima');

async function predictNextValue() {
  // Fetch the latest 100 values from the database
  const [rows] = await dbConnection.promise().query('SELECT * FROM bubble_data ORDER BY created_at DESC LIMIT 100');
  const values = rows.map(row => row.value);

  // Train the ARIMA model with the latest values
  const arima = new ARIMA({ p: 2, d: 2, q: 2, verbose: false });
  arima.train(values);

  // Make a prediction using the trained model
  const [predictedValue] = arima.predict(1);
  console.log(predictedValue)
  return predictedValue;
}


io.on('connection', (socket) => {
  console.log('A user connected');

  setInterval(async () => {
    const query = 'SELECT value, created_at FROM bubble_data ORDER BY created_at DESC LIMIT 1';
    dbConnection.query(query, async (err, result) => {
      if (err) throw err;

      if (result.length > 0) {
        const predictedValue = await predictNextValue();
        socket.emit('newData', { ...result[0], predictedValue });
      }
    });
  }, 1000);

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
