// const path = require('path');
// const express = require('express');

import path from 'path';
import express from 'express';
import {
    fileURLToPath
} from 'url';
import ejs from 'ejs';
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DIST_DIR = path.join(__dirname, '/src/');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

app.use(express.static(DIST_DIR));
app.engine('html', ejs.renderFile);
app.get('*', (req, res) => {
    res.render(HTML_FILE, {
        token: req.query.token
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`App Listening to ${PORT}....`);
});