const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files with no-cache headers for instant CSS updates
const staticOptions = {
  etag: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
};
app.use(express.static(path.join(__dirname), staticOptions));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules'), staticOptions));
app.use('/vendor', express.static(path.join(__dirname, 'node_modules/bwip-js/dist'), staticOptions));

// Route all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 VibeCode BWIP Barcode Studio running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
