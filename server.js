require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Route files
const checkConditions = require('./routes/checkConditions');
const addEvent = require('./routes/addEvent');

// Routes
app.use('/check-kayak-conditions', checkConditions);
app.use('/add-kayak-event', addEvent);

app.get('/', (req, res) => {
    res.send('MCP Kayaking Server is Live 🚣');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
