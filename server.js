const path = require('path');
const express = require('express');

const app = express();
const DIST_DIR = path.join(__dirname, '/');
const HTML_FILE = path.join(DIST_DIR, 'index.ejs');

app.use(express.static(DIST_DIR));
app.engine('html', require('ejs').renderFile);
app.get('*', (req, res) => {
    res.render(HTML_FILE, {
        token: req.query.token
    });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`App Listening to ${PORT}....`);
});