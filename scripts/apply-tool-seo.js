const fs = require('fs');
const path = require('path');
const { SITE_NAME, buildSeoDescription, buildSeoTitle } = require('./tool-seo-utils');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');
const SITE_URL = 'https://extformattools.com';

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
const INDEXABLE_STATUSES = new Set(['live', 'active', 'beta']);

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function robotsDirective(tool) {
  if (tool.indexable === false) return 'noindex,follow';
  const status = String(tool.status || '').toLowerCase();
  return INDEXABLE_STATUSES.has(status) ? 'index,follow' : 'noindex,follow';
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

  const title = escapeHtml(buildSeoTitle(tool));
  const description = escapeHtml(buildSeoDescription(tool));
  const canonicalUrl = `${SITE_URL}/tools/${slug}/`;
  const robots = robotsDirective(tool);

  html = upsertTag(
    html,
    /^[ \t]*<title>[\s\S]*?<\/title>/im,
    `  <title>${title}</title>`,
    /<head[^>]*>/i
  );

  if (/<meta\s+name=["']description["']/i.test(html)) {
    html = html.replace(
      /^[ \t]*<meta\s+name=["']description["'][^>]*>/im,
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
      /^[ \t]*<link\s+rel=["']canonical["'][^>]*>/im,
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
      /^[ \t]*<meta\s+property=["']og:title["'][^>]*>/im,
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
      /^[ \t]*<meta\s+property=["']og:description["'][^>]*>/im,
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
      /^[ \t]*<meta\s+property=["']og:url["'][^>]*>/im,
      `  <meta property="og:url" content="${canonicalUrl}" />`
    );
  } else {
    html = html.replace(
      /<meta\s+property=["']og:description["'][^>]*>/i,
      match => `${match}\n  <meta property="og:url" content="${canonicalUrl}" />`
    );
  }

  html = upsertTag(
    html,
    /^[ \t]*<meta\s+property=["']og:site_name["'][^>]*>/im,
    `  <meta property="og:site_name" content="${SITE_NAME}" />`,
    /<meta\s+property=["']og:url["'][^>]*>/i
  );

  html = upsertTag(
    html,
    /^[ \t]*<meta\s+name=["']twitter:card["'][^>]*>/im,
    `  <meta name="twitter:card" content="summary" />`,
    /<meta\s+property=["']og:site_name["'][^>]*>/i
  );

  html = upsertTag(
    html,
    /^[ \t]*<meta\s+name=["']twitter:title["'][^>]*>/im,
    `  <meta name="twitter:title" content="${title}" />`,
    /<meta\s+name=["']twitter:card["'][^>]*>/i
  );

  html = upsertTag(
    html,
    /^[ \t]*<meta\s+name=["']twitter:description["'][^>]*>/im,
    `  <meta name="twitter:description" content="${description}" />`,
    /<meta\s+name=["']twitter:title["'][^>]*>/i
  );

  html = upsertTag(
    html,
    /^[ \t]*<meta\s+name=["']theme-color["'][^>]*>/im,
    `  <meta name="theme-color" content="#1463ff" />`,
    /<meta\s+name=["']twitter:description["'][^>]*>/i
  );

  html = upsertTag(
    html,
    /^[ \t]*<meta\s+name=["']robots["'][^>]*>/im,
    `  <meta name="robots" content="${robots}" />`,
    /<meta\s+name=["']theme-color["'][^>]*>/i
  );

  html = html.replace(/Text Dev Tools/g, SITE_NAME);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Updated SEO: tools/${slug}/index.html`);
  updatedCount++;
}

console.log(`\nDone. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
