const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

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
  { url: '/developer-tools/', filePath: path.join(root, 'developer-tools', 'index.html') },
  { url: '/text-tools/cleanup/', filePath: path.join(root, 'text-tools', 'cleanup', 'index.html') },
  { url: '/text-tools/conversion/', filePath: path.join(root, 'text-tools', 'conversion', 'index.html') },
  { url: '/text-tools/analysis/', filePath: path.join(root, 'text-tools', 'analysis', 'index.html') },
  { url: '/text-tools/extraction/', filePath: path.join(root, 'text-tools', 'extraction', 'index.html') },
  { url: '/developer-tools/json-data/', filePath: path.join(root, 'developer-tools', 'json-data', 'index.html') },
  { url: '/developer-tools/encoding-ids/', filePath: path.join(root, 'developer-tools', 'encoding-ids', 'index.html') },
  {
    url: '/developer-tools/developer-formatting/',
    filePath: path.join(root, 'developer-tools', 'developer-formatting', 'index.html')
  },
  { url: '/developer-tools/time-web/', filePath: path.join(root, 'developer-tools', 'time-web', 'index.html') }
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

  const relativePath = path.relative(root, filePath);

  try {
    const workingTreeChange = execFileSync('git', ['status', '--porcelain', '--', relativePath], {
      cwd: root,
      encoding: 'utf8'
    }).trim();

    if (workingTreeChange) {
      return new Date().toISOString().slice(0, 10);
    }

    const lastCommitDate = execFileSync('git', ['log', '-1', '--format=%cs', '--', relativePath], {
      cwd: root,
      encoding: 'utf8'
    }).trim();

    if (lastCommitDate) return lastCommitDate;
  } catch (error) {
    // Fall back to the file timestamp when the build runs outside a Git checkout.
  }

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
