const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');
const SITE_URL = 'https://text-dev-tools.pages.dev';

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function upsertTag(html, pattern, replacement, insertAfterPattern = null) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }
  if (insertAfterPattern && insertAfterPattern.test(html)) {
    return html.replace(insertAfterPattern, match => `${match}\n${replacement}`);
  }
  return html;
}

let updatedCount = 0;
let skippedCount = 0;

for (const tool of tools) {
  const slug = tool.slug;
  if (!slug) continue;

  const filePath = path.join(toolsDir, slug, 'index.html');
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Missing file: tools/${slug}/index.html`);
    skippedCount++;
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  const title = escapeHtml(tool.title || `${tool.name || slug} Tool`);
  const description = escapeHtml(
    tool.description || `Use this free online ${tool.name || slug} tool in your browser.`
  );
  const canonicalUrl = `${SITE_URL}/tools/${slug}/`;

  html = upsertTag(
    html,
    /<title>[\s\S]*?<\/title>/i,
    `  <title>${title}</title>`,
    /<head[^>]*>/i
  );

  if (/<meta\s+name=["']description["']/i.test(html)) {
    html = html.replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      `  <meta name="description" content="${description}" />`
    );
  } else {
    html = html.replace(
      /<title>[\s\S]*?<\/title>/i,
      match => `${match}\n  <meta name="description" content="${description}" />`
    );
  }

  if (/<link\s+rel=["']canonical["']/i.test(html)) {
    html = html.replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      `  <link rel="canonical" href="${canonicalUrl}" />`
    );
  } else if (/<meta\s+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<meta\s+name=["']description["'][^>]*>/i,
      match => `${match}\n  <link rel="canonical" href="${canonicalUrl}" />`
    );
  }

  if (/<meta\s+property=["']og:title["']/i.test(html)) {
    html = html.replace(
      /<meta\s+property=["']og:title["'][^>]*>/i,
      `  <meta property="og:title" content="${title}" />`
    );
  } else {
    html = html.replace(
      /<link\s+rel=["']canonical["'][^>]*>/i,
      match => `${match}\n  <meta property="og:title" content="${title}" />`
    );
  }

  if (/<meta\s+property=["']og:description["']/i.test(html)) {
    html = html.replace(
      /<meta\s+property=["']og:description["'][^>]*>/i,
      `  <meta property="og:description" content="${description}" />`
    );
  } else {
    html = html.replace(
      /<meta\s+property=["']og:title["'][^>]*>/i,
      match => `${match}\n  <meta property="og:description" content="${description}" />`
    );
  }

  if (/<meta\s+property=["']og:url["']/i.test(html)) {
    html = html.replace(
      /<meta\s+property=["']og:url["'][^>]*>/i,
      `  <meta property="og:url" content="${canonicalUrl}" />`
    );
  } else {
    html = html.replace(
      /<meta\s+property=["']og:description["'][^>]*>/i,
      match => `${match}\n  <meta property="og:url" content="${canonicalUrl}" />`
    );
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Updated SEO: tools/${slug}/index.html`);
  updatedCount++;
}

console.log(`\nDone. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
