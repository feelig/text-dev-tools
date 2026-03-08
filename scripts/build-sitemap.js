const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const publicDir = path.join(root, 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

const SITE_URL = 'https://extformattools.com';

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

const staticPages = [
  '/',
  '/text-tools/',
  '/developer-tools/',
  '/about/',
  '/privacy/',
  '/terms/',
  '/contact/'
];

const toolPages = tools.map(tool => `/tools/${tool.slug}/`);

const allPages = [...staticPages, ...toolPages];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(url => `  <url>
    <loc>${SITE_URL}${url}</loc>
  </url>`).join('\n')}
</urlset>
`;

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(sitemapPath, xml, 'utf8');

console.log(`Sitemap created: ${sitemapPath}`);
console.log(`Total URLs: ${allPages.length}`);
