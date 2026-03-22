const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
const bySlug = new Map(tools.map(t => [t.slug, t]));

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRelatedHtml(tool) {
  const related = Array.isArray(tool.related) ? tool.related : [];
  if (!related.length) return '';

  const items = related
    .map(slug => bySlug.get(slug))
    .filter(item => item && item.status === 'live')
    .map(item => {
      const name = escapeHtml(item.name || item.title || item.slug);
      const desc = escapeHtml(item.description || '');
      return `
        <a class="related-tool-card" href="/tools/${item.slug}/">
          <strong>${name}</strong>
          <span>${desc}</span>
        </a>`;
    })
    .join('\n');

  return `
    <section class="related-tools-section" aria-labelledby="related-tools-title">
      <div class="container">
        <div class="section-card">
          <h2 id="related-tools-title">Related Tools</h2>
          <p>Explore more tools that work well with this page.</p>
          <div class="related-tools-grid">
${items}
          </div>
        </div>
      </div>
    </section>`;
}

function buildStyleBlock() {
  return `
  <style id="related-tools-style">
    .related-tools-section {
      margin-top: 32px;
    }
    .section-card {
      background: #fff;
      border: 1px solid #d9e2ef;
      border-radius: 14px;
      padding: 16px;
    }
    .related-tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-top: 16px;
    }
    .related-tool-card {
      display: block;
      text-decoration: none;
      color: inherit;
      background: #fff;
      border: 1px solid #d9e2ef;
      border-radius: 14px;
      padding: 16px;
      transition: 0.18s ease;
    }
    .related-tool-card:hover {
      transform: translateY(-2px);
      border-color: #bfd0ea;
    }
    .related-tool-card strong {
      display: block;
      font-size: 15px;
      margin-bottom: 8px;
    }
    .related-tool-card span {
      display: block;
      font-size: 13px;
      line-height: 1.5;
      color: #5f6f86;
    }
  </style>`;
}

let updated = 0;

for (const tool of tools) {
  if (!tool.slug) continue;

  const filePath = path.join(toolsDir, tool.slug, 'index.html');
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');

  html = html.replace(/<section class="related-tools-section"[\s\S]*?<\/section>/i, '');

  if (!html.includes('id="related-tools-style"')) {
    html = html.replace(/<\/head>/i, `${buildStyleBlock()}\n</head>`);
  }

  const relatedHtml = buildRelatedHtml(tool);
  if (!relatedHtml) continue;

  if (/<\/main>/i.test(html)) {
    html = html.replace(/<\/main>/i, `${relatedHtml}\n</main>`);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Related tools added: tools/${tool.slug}/index.html`);
    updated++;
  } else {
    console.log(`⚠️ No </main> tag found: tools/${tool.slug}/index.html`);
  }
}

console.log(`\nDone. Updated: ${updated}`);
