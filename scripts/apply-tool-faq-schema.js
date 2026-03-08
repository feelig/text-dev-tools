const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');
const SITE_URL = 'https://extformattools.com';

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildFaqSection(tool) {
  const faq = Array.isArray(tool.faq) ? tool.faq : [];
  if (!faq.length) return '';

  const items = faq.map(item => `
          <div class="faq-item">
            <h3>${escapeHtml(item.q || '')}</h3>
            <p>${escapeHtml(item.a || '')}</p>
          </div>`).join('\n');

  return `
    <section class="tool-faq-section" aria-labelledby="tool-faq-title">
      <div class="section-card">
        <h2 id="tool-faq-title">FAQ</h2>
        <p>Common questions about this tool.</p>
        <div class="faq-list">
${items}
        </div>
      </div>
    </section>`;
}

function buildFaqStyleBlock() {
  return `
  <style id="tool-faq-style">
    .tool-faq-section {
      margin-top: 32px;
    }
    .faq-list {
      display: grid;
      gap: 14px;
      margin-top: 16px;
    }
    .faq-item {
      background: #fff;
      border: 1px solid #d9e2ef;
      border-radius: 14px;
      padding: 16px;
    }
    .faq-item h3 {
      margin: 0 0 8px;
      font-size: 16px;
    }
    .faq-item p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #5f6f86;
    }
  </style>`;
}

function buildFaqSchema(tool) {
  const faq = Array.isArray(tool.faq) ? tool.faq : [];
  if (!faq.length) return '';

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(item => ({
      "@type": "Question",
      "name": item.q || '',
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a || ''
      }
    }))
  };

  return `  <script id="tool-faq-schema" type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>`;
}

function buildWebPageSchema(tool) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": tool.title || `${tool.name || tool.slug} Tool`,
    "description": tool.description || '',
    "url": `${SITE_URL}/tools/${tool.slug}/`
  };

  return `  <script id="tool-webpage-schema" type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>`;
}

let updated = 0;

for (const tool of tools) {
  if (!tool.slug) continue;

  const filePath = path.join(toolsDir, tool.slug, 'index.html');
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');

  html = html.replace(/<section class="tool-faq-section"[\s\S]*?<\/section>/i, '');
  html = html.replace(/<script id="tool-faq-schema" type="application\/ld\+json">[\s\S]*?<\/script>/i, '');
  html = html.replace(/<script id="tool-webpage-schema" type="application\/ld\+json">[\s\S]*?<\/script>/i, '');

  if (!html.includes('id="tool-faq-style"')) {
    html = html.replace(/<\/head>/i, `${buildFaqStyleBlock()}\n</head>`);
  }

  const faqSection = buildFaqSection(tool);
  if (faqSection && /<\/main>/i.test(html)) {
    html = html.replace(/<\/main>/i, `${faqSection}\n</main>`);
  }

  const faqSchema = buildFaqSchema(tool);
  const webPageSchema = buildWebPageSchema(tool);

  html = html.replace(/<\/head>/i, `${webPageSchema}\n${faqSchema ? faqSchema + '\n' : ''}</head>`);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ FAQ/schema added: tools/${tool.slug}/index.html`);
  updated++;
}

console.log(`\nDone. Updated: ${updated}`);
