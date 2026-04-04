const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');
const SITE_URL = 'https://extformattools.com';
const SITE_NAME = 'ExtFormatTools';
const ACRONYM_WORDS = new Set(['API', 'CSV', 'HTML', 'ID', 'IDs', 'JSON', 'PDF', 'Regex', 'SQL', 'TSV', 'URL', 'URLs', 'UUID']);

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  return words.slice(0, wordLimit).join(' ').trim();
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
    "name": buildSeoTitle(tool),
    "description": buildSeoDescription(tool),
    "url": `${SITE_URL}/tools/${tool.slug}/`,
    "isPartOf": {
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": `${SITE_URL}/`
    }
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
