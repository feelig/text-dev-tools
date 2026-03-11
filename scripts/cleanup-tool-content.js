const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

function stripSection(html, className) {
  const pattern = new RegExp(`\\s*<section class="${className}"[\\s\\S]*?<\\/section>`, 'i');
  return html.replace(pattern, '');
}

function countMatches(html, pattern) {
  return (html.match(pattern) || []).length;
}

function hasDuplicateFaqSchema(html) {
  const spaced = countMatches(html, /"@type"\s*:\s*"FAQPage"/gi);
  const compact = countMatches(html, /"@type":"FAQPage"/gi);
  return spaced + compact > 1;
}

let updated = 0;

for (const tool of tools) {
  if (!tool.slug) continue;

  const filePath = path.join(toolsDir, tool.slug, 'index.html');
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;

  const faqHeadingCount =
    countMatches(html, /<h2[^>]*>\s*FAQ\s*<\/h2>/gi) +
    countMatches(html, /<h2[^>]*>\s*Frequently asked questions\s*<\/h2>/gi);
  const relatedHeadingCount = countMatches(html, /<h2[^>]*>\s*Related tools\s*<\/h2>/gi);

  if (relatedHeadingCount > 1) {
    html = stripSection(html, 'related-tools-section');
  }
  if (faqHeadingCount > 1) {
    html = stripSection(html, 'tool-faq-section');
  }

  if (hasDuplicateFaqSchema(html)) {
    html = html.replace(
      /\s*<script id="tool-faq-schema" type="application\/ld\+json">[\s\S]*?<\/script>/i,
      ''
    );
  }

  html = html.replace(/\n{4,}/g, '\n\n\n');

  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Cleaned duplicate content: tools/${tool.slug}/index.html`);
    updated++;
  }
}

console.log(`\nDone. Updated: ${updated}`);
