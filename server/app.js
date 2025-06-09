const express = require('express');
const router = require('./routes/index');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/api', router);


app.use(errorHandler);

module.exports = app;
