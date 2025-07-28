const express = require('express');
const cors = require('cors');
const mainRouter = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', mainRouter);

app.use((req, res, next) => {
    res.status(404).json({ success: false, message: "Not Found: The requested URL was not found on this server." });
});

app.use(errorHandler);

module.exports = app;
