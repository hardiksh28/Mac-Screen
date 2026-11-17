// Builds the static landing page into dist-site/ (deploy that folder to Vercel, Netlify or GitHub Pages).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'dist-site');
const cp = (from, to) => fs.cpSync(path.join(root, from), path.join(out, to), { recursive: true });
fs.rmSync(out, { recursive: true, force: true });
cp('site', '.');
cp('assets', 'assets');
// the live demo runs the real renderer
cp('src/renderer', 'app/src/renderer');
cp('src/shared', 'app/src/shared');
cp('assets', 'app/assets');
console.log('Landing page built in dist-site/');
