const express = require('express');
const router = require('./routes/index');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', router);


app.use(errorHandler);

module.exports = app;
