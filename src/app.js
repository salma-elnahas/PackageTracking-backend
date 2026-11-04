const express = require('express');
const cors = require('cors');

const app = express();

// allows only angular app (port 4200) to call the API
app.use(cors({ origin: 'http://localhost:4200' }));
// read the request body as JSON that frontend sends
app.use(express.json());

// simple test route
app.get('/api/health', (req, res) => res.json({ status: 'hello world' }));

module.exports = app;