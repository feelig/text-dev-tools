const fs = require('fs');
const path = require('path');

const root = process.cwd();
const distDir = path.join(root, 'dist');

const copyTargets = [
  '_redirects',
  'index.html',
  'robots.txt',
  'sitemap.xml',
  'BingSiteAuth.xml',
  'google344ab89be96f99c0.html',
  '035c0643075c4058a31f69be1bfebef0.txt',
  'about',
  'contact',
  'privacy',
  'terms',
  'text-tools',
  'developer-tools',
  'tools'
];

function copyEntry(relativePath) {
  const source = path.join(root, relativePath);
  if (!fs.existsSync(source)) {
    return false;
  }

  const destination = path.join(distDir, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
  return true;
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

let copied = 0;

for (const target of copyTargets) {
  if (copyEntry(target)) {
    copied += 1;
    console.log(`Copied: ${target}`);
  }
}

const adsSource = path.join(root, 'public', 'ads.txt');
const adsDestination = path.join(distDir, 'ads.txt');
if (fs.existsSync(adsSource)) {
  fs.copyFileSync(adsSource, adsDestination);
  copied += 1;
  console.log('Copied: ads.txt');
}

console.log(`Deploy directory ready: ${distDir}`);
console.log(`Entries copied: ${copied}`);
