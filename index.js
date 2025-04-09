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

const logger = require('./logger');


app.post('/analyze', async (req, res) => {
  const { host, user, password, database, query } = req.body;

  logger.info(`POST /analyze | Query: ${query}`);

  if (!validateInputs({ host, user, database, query })) {
    logger.warn('POST /analyze | Missing input fields');
    return res.status(400).json({ error: 'All input fields are required' });
  }

  const connection = mysql.createConnection({ host, user, password, database });

  const runQuery = (sql) => {
    logger.info(`Running query: ${sql}`);
    return new Promise((resolve, reject) => {
      connection.query(sql, (err, results) => {
        if (err) {
          logger.error(`Query failed: ${sql} | Error: ${err.message}`);
          return reject(err);
        }
        logger.info(`Query successful: ${sql}`);
        resolve(results);
      });
    });
  };

  try {
    const explainResults = await runQuery("EXPLAIN " + query);
    const explainAnalyzeResults = await runQuery("EXPLAIN ANALYZE " + query);

    logger.info('POST /analyze | Sending response');
    res.json({ explainResults, explainAnalyzeResults });
  } catch (err) {
    logger.error(`POST /analyze | Error: ${err.message}`);
    res.status(400).json({ error: err.message });
  } finally {
    try {
      connection.end();
      logger.info('Database connection closed');
    } catch (endErr) {
      logger.warn(`Error closing DB connection: ${endErr.message}`);
    }
  }
});

app.listen(10000, () => {
  console.log('🚀 Backend running at http://localhost:10000');
});