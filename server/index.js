require('@dotenvx/dotenvx').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const fs      = require('fs');
const path    = require('path');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// Dynamically load every feature that has a <feature>.routes.js file
const featuresDir = path.join(__dirname, 'features');
fs.readdirSync(featuresDir).forEach(feature => {
  const routesFile = path.join(featuresDir, feature, `${feature}.routes.js`);
  if (fs.existsSync(routesFile)) {
    app.use(`/api/${feature}`, require(routesFile));
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'OK' } });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Grub-Grab server running on port ${PORT}`));
