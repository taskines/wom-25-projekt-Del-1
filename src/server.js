const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

const usersRouter = require('./routes/users');
const refreshRouter = require('./routes/refresh');

// /users → login yms.
app.use('/users', usersRouter);

// /refresh → refresh ja logout
app.use('/refresh', refreshRouter);

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
