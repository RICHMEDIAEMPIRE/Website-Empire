// bridge.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(bodyParser.json());

const PORT = 3000;
const BASE_DIR = process.env.ALLOWED_DIR || path.resolve(__dirname);

function safePath(requestedPath) {
  const fullPath = path.resolve(BASE_DIR, requestedPath);
  if (!fullPath.startsWith(BASE_DIR)) {
    throw new Error('Access denied');
  }
  return fullPath;
}

app.get('/file', (req, res) => {
  try {
    const filePath = safePath(req.query.path);
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ success: true, content });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/file', (req, res) => {
  try {
    const filePath = safePath(req.body.path);
    fs.writeFileSync(filePath, req.body.content, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/list', (req, res) => {
  try {
    const folder = safePath(req.query.path || '');
    const files = fs.readdirSync(folder);
    res.json({ success: true, files });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/run', (req, res) => {
  if (process.env.ALLOW_COMMANDS !== 'true') {
    return res.status(403).json({ success: false, error: 'Command execution disabled' });
  }
  exec(req.body.command, { cwd: BASE_DIR }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ success: false, error: stderr });
    res.json({ success: true, output: stdout });
  });
});

app.listen(PORT, () => {
  console.log(`Bridge running at http://localhost:${PORT}`);
});
