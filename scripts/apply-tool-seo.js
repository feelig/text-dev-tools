const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');
const SITE_URL = 'https://extformattools.com';
const SITE_NAME = 'ExtFormatTools';

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
const ACRONYM_WORDS = new Set(['API', 'CSV', 'HTML', 'ID', 'IDs', 'JSON', 'PDF', 'Regex', 'SQL', 'TSV', 'URL', 'URLs', 'UUID']);

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function robotsDirective(tool) {
  return tool.status === 'live' ? 'index,follow' : 'noindex,follow';
}

function plainToolName(tool) {
  return String(tool.name || tool.title || tool.slug || 'Tool').replace(/\s+Tool$/i, '').trim();
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function trimWords(text, wordLimit) {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text.trim();
  return `${words.slice(0, wordLimit).join(' ').trim()}`;
}

function toTitlePhrase(text) {
  return String(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const normalized = word.replace(/[^A-Za-z0-9/-]/g, '');
      const upper = normalized.toUpperCase();
      if (ACRONYM_WORDS.has(upper)) {
        return word.replace(normalized, upper);
      }
      if (/^[A-Za-z0-9/-]+$/.test(normalized)) {
        return word.replace(normalized, normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase());
      }
      return word;
    })
    .join(' ');
}

function preferredKeyword(tool) {
  const keywords = Array.isArray(tool.keywords) ? tool.keywords.filter(Boolean) : [];
  return (
    keywords.find((keyword) => /from text|to [a-z]|to csv|to json|to slug|to newline|to comma|line numbers/i.test(keyword)) ||
    keywords.find((keyword) => /online/i.test(keyword) && keyword.toLowerCase().includes(plainToolName(tool).toLowerCase().split(' ')[0])) ||
    ''
  );
}

function buildTitleHead(tool) {
  const keyword = preferredKeyword(tool);
  if (keyword) {
    return /online/i.test(keyword) ? toTitlePhrase(keyword) : `${toTitlePhrase(keyword)} Online`;
  }

  const baseName = plainToolName(tool);
  return /online/i.test(baseName) ? baseName : `${baseName} Online`;
}

function buildActionClause(tool) {
  let text = String(tool.description || tool.intro || '').trim().replace(/\.$/, '');
  if (!text) return '';

  text = text
    .replace(/\s+instantly online$/i, '')
    .replace(/\s+online$/i, '')
    .replace(/^use this tool to\s+/i, '')
    .split(/\s+(?:for|while|without|before|when)\s+/i)[0]
    .trim();

  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildSeoTitle(tool) {
  if (tool.seoTitle) return tool.seoTitle;

  const head = buildTitleHead(tool);
  const action = buildActionClause(tool);

  if (!action) return head.length <= 68 ? head : truncate(head, 68);

  let title = `${head} - ${action}`;
  if (title.length <= 68) return title;

  title = `${head} - ${trimWords(action, 4)}`;
  if (title.length <= 68) return title;

  title = `${head} - ${trimWords(action, 3)}`;
  if (title.length <= 68) return title;

  return head.length <= 68 ? head : truncate(head, 68);
}

function buildSeoDescription(tool) {
  if (tool.seoDescription) return tool.seoDescription;

  const source = String(tool.intro || tool.description || `Use this free online ${plainToolName(tool)} tool in your browser.`).trim();
  const withPeriod = /[.!?]$/.test(source) ? source : `${source}.`;
  const branded = withPeriod.length < 132 ? `${withPeriod} Free browser tool on ${SITE_NAME}.` : withPeriod;

  return truncate(branded, 158);
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

  html = upsertTag(
    html,
    /<meta\s+property=["']og:site_name["'][^>]*>/i,
    `  <meta property="og:site_name" content="${SITE_NAME}" />`,
    /<meta\s+property=["']og:url["'][^>]*>/i
  );

  html = upsertTag(
    html,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `  <meta name="robots" content="${robots}" />`,
    /<meta\s+name=["']description["'][^>]*>/i
  );

  html = html.replace(/Text Dev Tools/g, SITE_NAME);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Updated SEO: tools/${slug}/index.html`);
  updatedCount++;
}

console.log(`\nDone. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
