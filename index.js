const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

const validateInputs = (inputs) => {
  return Object.values(inputs).every(input => input && input.trim() !== '');
};

app.post('/explain', (req, res) => {
  const { host, user, password, database, query } = req.body;

  if (!validateInputs({ host, user, database, query })) {
    return res.status(400).json({ error: 'All input fields are required' });
  }

  const connection = mysql.createConnection({ host, user, password, database });

  connection.query("explain " + query, (err, results) => {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      res.json({ results });
    }
    connection.end();
  });
});

app.post('/explainanalyze', (req, res) => {
  const { host, user, password, database, query } = req.body;

  if (!validateInputs({ host, user, database, query })) {
    return res.status(400).json({ error: 'All input fields are required' });
  }

  const connection = mysql.createConnection({ host, user, password, database });

  connection.query("explain analyze " + query, (err, results) => {
    if (err) {
      res.status(400).json({ error: err.message });
    } else {
      res.json({ results });
    }
    connection.end();
  });
});

app.post('/analyze', async (req, res) => {
  const { host, user, password, database, query } = req.body;

  if (!validateInputs({ host, user, database, query })) {
    return res.status(400).json({ error: 'All input fields are required' });
  }

  const connection = mysql.createConnection({ host, user, password, database });

  try {
    const explainPromise = new Promise((resolve, reject) => {
      connection.query("explain " + query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    const explainAnalyzePromise = new Promise((resolve, reject) => {
      connection.query("explain analyze " + query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    const [explainResults, explainAnalyzeResults] = await Promise.all([explainPromise, explainAnalyzePromise]);

    res.json({ explainResults, explainAnalyzeResults });
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    connection.end();
  }
});

app.listen(10000, () => {
  console.log('🚀 Backend running at http://localhost:10000');
});