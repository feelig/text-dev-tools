const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getUseCases(tool) {
  const name = tool.name || tool.title || tool.slug || 'this tool';
  const lower = `${tool.slug} ${name} ${tool.category || ''}`.toLowerCase();

  if ((tool.category || '').toLowerCase() === 'developer-tools') {
    return [
      `Clean up developer input before using ${name} in debugging or implementation work.`,
      `Speed up routine formatting, conversion, or validation tasks directly in the browser.`,
      `Prepare data for copying into documentation, code comments, tickets, or internal tools.`
    ];
  }

  if (lower.includes('counter')) {
    return [
      `Check writing length before publishing, submitting, or pasting content elsewhere.`,
      `Review drafts for editing, content limits, and structure.`,
      `Measure text quickly during writing, SEO, or documentation work.`
    ];
  }

  if (lower.includes('sort')) {
    return [
      `Reorder lists before pasting them into spreadsheets, docs, or content systems.`,
      `Organize keywords, names, or notes into a cleaner sequence.`,
      `Clean up repeated manual list work directly in the browser.`
    ];
  }

  if (lower.includes('case')) {
    return [
      `Convert text formatting for titles, headings, naming conventions, or content cleanup.`,
      `Standardize copied text before using it in documents, websites, or notes.`,
      `Save time when switching between multiple casing styles.`
    ];
  }

  if (lower.includes('line') || lower.includes('space') || lower.includes('text')) {
    return [
      `Clean pasted text before sending, publishing, or importing it elsewhere.`,
      `Prepare content for spreadsheets, forms, CMS editors, or documentation.`,
      `Reduce manual editing when working with copied content from PDFs, emails, or websites.`
    ];
  }

  return [
    `Use ${name} to speed up repetitive browser-based editing or formatting work.`,
    `Handle quick cleanup tasks without installing extra software.`,
    `Prepare content or data before copying it into your next workflow step.`
  ];
}

function buildUseCasesSection(tool) {
  const items = getUseCases(tool)
    .map(item => `          <li>${escapeHtml(item)}</li>`)
    .join('\n');

  return `
    <section class="tool-use-cases-section" aria-labelledby="tool-use-cases-title">
      <div class="section-card">
        <h2 id="tool-use-cases-title">Use cases</h2>
        <p>Common situations where this tool can help.</p>
        <ul class="use-cases-list">
${items}
        </ul>
      </div>
    </section>`;
}

function buildStyleBlock() {
  return `
  <style id="tool-use-cases-style">
    .tool-use-cases-section {
      margin-top: 32px;
    }
    .use-cases-list {
      margin: 16px 0 0;
      padding-left: 20px;
      color: #5f6f86;
    }
    .use-cases-list li {
      margin: 0 0 12px;
      line-height: 1.7;
    }
  </style>`;
}

let updated = 0;

for (const tool of tools) {
  if (!tool.slug) continue;

  const filePath = path.join(toolsDir, tool.slug, 'index.html');
  if (!fs.existsSync(filePath)) continue;

  let html = fs.readFileSync(filePath, 'utf8');

  html = html.replace(/<section class="tool-use-cases-section"[\s\S]*?<\/section>/i, '');

  if (!html.includes('id="tool-use-cases-style"')) {
    html = html.replace(/<\/head>/i, `${buildStyleBlock()}\n</head>`);
  }

  const sectionHtml = buildUseCasesSection(tool);

  if (/<\/main>/i.test(html)) {
    html = html.replace(/<\/main>/i, `${sectionHtml}\n</main>`);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Use cases added: tools/${tool.slug}/index.html`);
    updated++;
  } else {
    console.log(`⚠️ No </main> tag found: tools/${tool.slug}/index.html`);
  }
}

console.log(`\nDone. Updated: ${updated}`);
