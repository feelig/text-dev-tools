const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const publicDir = path.join(root, 'public');
const sitemapPaths = [
  path.join(root, 'sitemap.xml'),
  path.join(publicDir, 'sitemap.xml')
];

const SITE_URL = 'https://extformattools.com';
const INDEXABLE_STATUSES = new Set(['live', 'active', 'beta']);

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

function toolFilePath(slug) {
  return path.join(root, 'tools', slug, 'index.html');
}

const staticPages = [
  { url: '/', filePath: path.join(root, 'index.html') },
  { url: '/text-tools/', filePath: path.join(root, 'text-tools', 'index.html') },
  { url: '/developer-tools/', filePath: path.join(root, 'developer-tools', 'index.html') }
];

const toolPages = tools
  .filter(tool => {
    const status = String(tool.status || '').toLowerCase();
    return tool.indexable !== false && INDEXABLE_STATUSES.has(status) && fs.existsSync(toolFilePath(tool.slug));
  })
  .map(tool => ({
    url: `/tools/${tool.slug}/`,
    filePath: toolFilePath(tool.slug)
  }));

const allPages = [...staticPages, ...toolPages];

function formatLastMod(filePath) {
  if (!fs.existsSync(filePath)) return '';
  return fs.statSync(filePath).mtime.toISOString().slice(0, 10);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(({ url, filePath }) => {
    const lastmod = formatLastMod(filePath);
    return `  <url>
    <loc>${SITE_URL}${url}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`;
  })
  .join('\n')}
</urlset>
`;

fs.mkdirSync(publicDir, { recursive: true });
for (const sitemapPath of sitemapPaths) {
  fs.writeFileSync(sitemapPath, xml, 'utf8');
  console.log(`Sitemap created: ${sitemapPath}`);
}
console.log(`Total URLs: ${allPages.length}`);
