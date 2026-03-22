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

function getUseCaseData(tool) {
  const custom = tool.useCases || {};
  const customItems = Array.isArray(custom.items) ? custom.items.filter(Boolean) : [];

  if (custom.lead && customItems.length) {
    return {
      lead: custom.lead,
      items: customItems
    };
  }

  const name = tool.name || tool.title || tool.slug || 'this tool';
  const lower = `${tool.slug} ${name} ${tool.category || ''}`.toLowerCase();

  if (lower.includes('base64')) {
    return {
      lead: 'Use this for quick encode and decode checks during development work.',
      items: [
        `Convert API payload fragments or file metadata into Base64 without leaving the browser.`,
        `Decode Base64 strings from logs, config files, or webhook samples during debugging.`,
        `Quickly verify encoded text before pasting it into tests, docs, or implementation notes.`
      ]
    };
  }

  if (lower.includes('url encoder') || lower.includes('url-encoder') || lower.includes('url')) {
    return {
      lead: 'This is most useful when special characters are breaking a URL or hiding what it contains.',
      items: [
        `Encode query parameter values before adding them to links, redirects, or callback URLs.`,
        `Decode pasted URLs when you need to inspect readable paths, params, or tracking values.`,
        `Clean up encoded strings during debugging, QA, or documentation work.`
      ]
    };
  }

  if (lower.includes('password')) {
    return {
      lead: 'Open this when you need a password quickly and do not want to leave the browser.',
      items: [
        `Generate temporary credentials for QA, demos, staging environments, or internal tools.`,
        `Create stronger random passwords without relying on browser extensions or external apps.`,
        `Test signup, reset, or account provisioning flows with configurable password lengths and symbols.`
      ]
    };
  }

  if (lower.includes('uuid')) {
    return {
      lead: 'This fits the common need for quick UUID generation without opening another tool.',
      items: [
        `Create UUID v4 values for database seeds, fixtures, API requests, or test payloads.`,
        `Generate batches of identifiers quickly when you need unique values for development work.`,
        `Copy fresh UUIDs into spreadsheets, tickets, migrations, or manual QA notes.`
      ]
    };
  }

  if (lower.includes('timestamp')) {
    return {
      lead: 'Use it when a raw timestamp is the main thing slowing down your debugging.',
      items: [
        `Convert Unix timestamps from logs or APIs into readable dates while debugging time-based events.`,
        `Check whether a timestamp is stored in seconds or milliseconds before using it elsewhere.`,
        `Compare timestamps quickly when reviewing monitoring output, exports, or audit trails.`
      ]
    };
  }

  if (lower.includes('json-to-csv')) {
    return {
      lead: 'This helps when structured data needs to move into a spreadsheet quickly.',
      items: [
        `Turn API responses or exported objects into CSV files for spreadsheet review and handoff.`,
        `Flatten simple JSON arrays before sharing data with non-technical teammates.`,
        `Prepare structured records for CSV imports, audits, or manual data checks.`
      ]
    };
  }

  if ((tool.category || '').toLowerCase() === 'dev' || (tool.category || '').toLowerCase() === 'developer-tools') {
    return {
      lead: 'Use this when you need a quick browser-side check before moving data into code or docs.',
      items: [
        `Clean up developer input before using ${name} in debugging or implementation work.`,
        `Speed up routine formatting, conversion, or validation tasks directly in the browser.`,
        `Prepare data for copying into documentation, code comments, tickets, or internal tools.`
      ]
    };
  }

  if (lower.includes('counter')) {
    return {
      lead: 'Open it when you need a count before text goes into a limit-sensitive place.',
      items: [
        `Check writing length before publishing, submitting, or pasting content elsewhere.`,
        `Review drafts for editing, content limits, and structure.`,
        `Measure text quickly during writing, SEO, or documentation work.`
      ]
    };
  }

  if (lower.includes('sort')) {
    return {
      lead: 'This fits short list-cleanup jobs that do not need a spreadsheet or script.',
      items: [
        `Reorder lists before pasting them into spreadsheets, docs, or content systems.`,
        `Organize keywords, names, or notes into a cleaner sequence.`,
        `Clean up repeated manual list work directly in the browser.`
      ]
    };
  }

  if (lower.includes('case')) {
    return {
      lead: 'Use it when the wording is right but the capitalization is inconsistent.',
      items: [
        `Convert text formatting for titles, headings, naming conventions, or content cleanup.`,
        `Standardize copied text before using it in documents, websites, or notes.`,
        `Save time when switching between multiple casing styles.`
      ]
    };
  }

  if (lower.includes('line') || lower.includes('space') || lower.includes('text')) {
    return {
      lead: 'This is for cleanup work where pasted text needs a quick fix before reuse.',
      items: [
        `Clean pasted text before sending, publishing, or importing it elsewhere.`,
        `Prepare content for spreadsheets, forms, CMS editors, or documentation.`,
        `Reduce manual editing when working with copied content from PDFs, emails, or websites.`
      ]
    };
  }

  return {
    lead: 'Use this when a quick browser-side utility is faster than opening a larger app.',
    items: [
      `Use ${name} to speed up repetitive browser-based editing or formatting work.`,
      `Handle quick cleanup tasks without installing extra software.`,
      `Prepare content or data before copying it into your next workflow step.`
    ]
  };
}

function buildUseCasesSection(tool) {
  const useCases = getUseCaseData(tool);
  const items = useCases.items
    .map(item => `          <li>${escapeHtml(item)}</li>`)
    .join('\n');

  return `
    <section class="tool-use-cases-section" aria-labelledby="tool-use-cases-title">
      <div class="container">
        <div class="section-card">
          <h2 id="tool-use-cases-title">Use cases</h2>
          <p>${escapeHtml(useCases.lead)}</p>
          <ul class="use-cases-list">
${items}
          </ul>
        </div>
      </div>
    </section>`;
}

function buildStyleBlock() {
  return `
  <style id="tool-use-cases-style">
    .tool-use-cases-section {
      margin-top: 32px;
    }
    .section-card {
      background: #fff;
      border: 1px solid #d9e2ef;
      border-radius: 14px;
      padding: 16px;
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
  html = html.replace(/<section[^>]*aria-labelledby="tool-use-cases-title"[\s\S]*?<\/section>/i, '');

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
