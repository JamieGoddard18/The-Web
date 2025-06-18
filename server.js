const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());

const LAYOUT_PATH = path.join(__dirname, 'layout.json');

app.use(express.static('public')); 

app.get('/layout', (req, res) => {
  fs.readFile(LAYOUT_PATH, 'utf8', (err, data) => {
    if (err) {
      return res.json({}); 
    }
    res.type('json').send(data);/// huh
  });
});

app.post('/layout', (req, res) => {
  const layout = req.body;
  fs.writeFile(LAYOUT_PATH, JSON.stringify(layout, null, 2), err => {
    if (err) return res.status(500).send('Failed to save layout');
    res.send('Layout saved');
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));