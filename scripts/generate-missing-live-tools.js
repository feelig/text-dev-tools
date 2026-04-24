const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const toolsDir = path.join(root, 'tools');
const SITE_NAME = 'ExtFormatTools';

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
const toolMap = new Map(tools.map((tool) => [tool.slug, tool]));

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function scriptSafeJson(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function categoryMeta(category) {
  if (category === 'dev' || category === 'developer-tools') {
    return {
      slug: 'developer-tools',
      label: 'Developer Tools'
    };
  }

  return {
    slug: 'text-tools',
    label: 'Text Tools'
  };
}

function buildStatsGrid(items = []) {
  if (!items.length) return '';

  return `
              <div class="stats-grid">
${items
  .map(
    (item) => `                <div class="stat-card">
                  <span>${escapeHtml(item.label)}</span>
                  <strong id="${escapeHtml(item.id)}">${escapeHtml(item.initial)}</strong>
                </div>`
  )
  .join('\n')}
              </div>`;
}

function pageTemplate(tool, config) {
  const category = categoryMeta(tool.category);
  const title = tool.name || tool.title || tool.slug;
  const description = tool.description || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(tool.title || `${title} Tool`)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index,follow" />
  <meta property="og:title" content="${escapeHtml(tool.title || title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <style>
    :root {
      --bg: #f6f8fb;
      --card: #ffffff;
      --text: #16202a;
      --muted: #5c6773;
      --border: #d9e0e7;
      --primary: #1463ff;
      --primary-hover: #0f52d6;
      --success: #137333;
      --error: #b42318;
      --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      --radius: 16px;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.55;
    }

    .container {
      width: min(1100px, calc(100% - 32px));
      margin: 0 auto;
    }

    .site-header {
      padding: 20px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      background: #fff;
    }

    .site-header .brand {
      font-size: 20px;
      font-weight: 700;
      text-decoration: none;
      color: var(--text);
    }

    .breadcrumb {
      font-size: 14px;
      color: var(--muted);
      margin: 20px 0 8px;
    }

    .breadcrumb a {
      color: var(--muted);
      text-decoration: none;
    }

    .hero {
      padding: 12px 0 24px;
    }

    .hero h1 {
      margin: 0 0 10px;
      font-size: 34px;
      line-height: 1.15;
    }

    .hero p {
      margin: 0;
      max-width: 760px;
      color: var(--muted);
      font-size: 17px;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    .card,
    .section-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 20px;
    }

    .tool-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }

    .panel h2 {
      margin: 0 0 12px;
      font-size: 20px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .panel-header p {
      margin: 0;
      font-size: 14px;
      color: var(--muted);
    }

    .control-row {
      display: grid;
      gap: 8px;
      margin-bottom: 12px;
    }

    .field-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
    }

    select,
    textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: #fff;
      color: var(--text);
      outline: none;
    }

    select {
      padding: 12px 14px;
      font-size: 14px;
    }

    textarea {
      min-height: 280px;
      resize: vertical;
      padding: 14px;
      font-size: 15px;
      line-height: 1.5;
    }

    select:focus,
    textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(20, 99, 255, 0.12);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 14px;
    }

    button {
      appearance: none;
      border: 0;
      border-radius: 12px;
      padding: 11px 16px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: 0.18s ease;
    }

    .btn-primary {
      background: var(--primary);
      color: #fff;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    .btn-secondary {
      background: #eef3f8;
      color: var(--text);
    }

    .btn-secondary:hover {
      background: #e3ebf4;
    }

    .status {
      margin-top: 12px;
      min-height: 22px;
      font-size: 14px;
      color: var(--muted);
    }

    .status.success {
      color: var(--success);
      font-weight: 700;
    }

    .status.error {
      color: var(--error);
      font-weight: 700;
    }

    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 14px;
      font-size: 13px;
      color: var(--muted);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .stat-card {
      border: 1px solid var(--border);
      border-radius: 14px;
      background: #fbfcfe;
      padding: 14px;
    }

    .stat-card span {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-card strong {
      display: block;
      margin-top: 8px;
      font-size: 24px;
      line-height: 1;
      color: var(--text);
    }

    .site-footer {
      padding: 28px 0 50px;
      color: var(--muted);
      font-size: 14px;
    }

    @media (max-width: 860px) {
      .tool-layout {
        grid-template-columns: 1fr;
      }

      .hero h1 {
        font-size: 28px;
      }

      textarea {
        min-height: 220px;
      }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="container">
      <a class="brand" href="/">${SITE_NAME}</a>
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb">
      <a href="/">Home</a> / <a href="/${escapeHtml(category.slug)}/">${escapeHtml(category.label)}</a> / ${escapeHtml(title)}
    </div>

    <section class="hero">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
    </section>

    <section class="grid">
      <div class="card">
        <div class="tool-layout">
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Input</h2>
                <p>${escapeHtml(config.inputDescription)}</p>
              </div>
            </div>
${config.inputControls || ''}
            <textarea id="inputText" placeholder="${escapeHtml(config.inputPlaceholder)}"></textarea>
            <div class="actions">
              <button class="btn-primary" id="processBtn" type="button">${escapeHtml(config.processLabel)}</button>
              <button class="btn-secondary" id="sampleBtn" type="button">Load Example</button>
              <button class="btn-secondary" id="clearBtn" type="button">Clear</button>
            </div>
            <div class="meta-bar">
              <span id="inputChars">0 characters</span>
              <span id="inputLines">0 lines</span>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Output</h2>
                <p>${escapeHtml(config.outputDescription)}</p>
              </div>
            </div>
            <textarea id="outputText" placeholder="${escapeHtml(config.outputPlaceholder)}" readonly></textarea>
            <div class="actions">
              <button class="btn-primary" id="copyBtn" type="button">Copy Result</button>
            </div>
            <div class="status" id="statusMessage" aria-live="polite"></div>
            <div class="meta-bar">
              <span id="outputChars">0 characters</span>
              <span id="outputLines">0 lines</span>
            </div>
${buildStatsGrid(config.stats || [])}
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">
      © 2026 ${SITE_NAME}
    </div>
  </footer>

  <script>
    const pageConfig = ${scriptSafeJson({
      slug: tool.slug,
      sampleText: config.sampleText,
      sampleState: config.sampleState || {},
      emptyInputMessage: config.emptyInputMessage || 'Paste some text first.',
      requiresNonWhitespaceInput:
        config.requiresNonWhitespaceInput === false ? false : true
    })};

    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const processBtn = document.getElementById('processBtn');
    const sampleBtn = document.getElementById('sampleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const statusMessage = document.getElementById('statusMessage');

    const inputChars = document.getElementById('inputChars');
    const inputLines = document.getElementById('inputLines');
    const outputChars = document.getElementById('outputChars');
    const outputLines = document.getElementById('outputLines');
    const quoteType = document.getElementById('quoteType');

    function normalizeNewlines(text) {
      return String(text).replace(/\\r\\n?/g, '\\n');
    }

    function countLines(text) {
      if (!text) return 0;
      return normalizeNewlines(text).split('\\n').length;
    }

    function updateStats() {
      inputChars.textContent = inputText.value.length + ' characters';
      inputLines.textContent = countLines(inputText.value) + ' lines';
      outputChars.textContent = outputText.value.length + ' characters';
      outputLines.textContent = countLines(outputText.value) + ' lines';
    }

    function setStatus(message, type = '') {
      statusMessage.textContent = message;
      statusMessage.className = type ? 'status ' + type : 'status';
    }

    function setStat(id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = String(value);
      }
    }

    function resetToolStats() {
      setStat('statMatches', 0);
      setStat('statLinesProcessed', 0);
      setStat('statItems', 0);
      setStat('statSlugLength', 0);
      setStat('statTitleChars', 0);
      setStat('statTitleWords', 0);
      setStat('statTitleStatus', 'Ready');
      setStat('statDescriptionChars', 0);
      setStat('statDescriptionWords', 0);
      setStat('statDescriptionStatus', 'Ready');
      setStat('statUrlsCleaned', 0);
      setStat('statLinksExtracted', 0);
      setStat('statMetaItems', 0);
      setStat('statTotalWords', 0);
      setStat('statUniqueWords', 0);
      setStat('statRepeatedWords', 0);
      setStat('statVariety', '0%');
      setStat('statTopWord', '-');
      setStat('statTopCount', 0);
    }

    function updateToolStats(stats = {}) {
      if ('matches' in stats) setStat('statMatches', stats.matches);
      if ('linesProcessed' in stats) setStat('statLinesProcessed', stats.linesProcessed);
      if ('items' in stats) setStat('statItems', stats.items);
      if ('slugLength' in stats) setStat('statSlugLength', stats.slugLength);
      if ('titleChars' in stats) setStat('statTitleChars', stats.titleChars);
      if ('titleWords' in stats) setStat('statTitleWords', stats.titleWords);
      if ('titleStatus' in stats) setStat('statTitleStatus', stats.titleStatus);
      if ('descriptionChars' in stats) setStat('statDescriptionChars', stats.descriptionChars);
      if ('descriptionWords' in stats) setStat('statDescriptionWords', stats.descriptionWords);
      if ('descriptionStatus' in stats) setStat('statDescriptionStatus', stats.descriptionStatus);
      if ('urlsCleaned' in stats) setStat('statUrlsCleaned', stats.urlsCleaned);
      if ('linksExtracted' in stats) setStat('statLinksExtracted', stats.linksExtracted);
      if ('metaItems' in stats) setStat('statMetaItems', stats.metaItems);
      if ('totalWords' in stats) setStat('statTotalWords', stats.totalWords);
      if ('uniqueWords' in stats) setStat('statUniqueWords', stats.uniqueWords);
      if ('repeatedWords' in stats) setStat('statRepeatedWords', stats.repeatedWords);
      if ('variety' in stats) setStat('statVariety', stats.variety + '%');
      if ('topWord' in stats) setStat('statTopWord', stats.topWord || '-');
      if ('topCount' in stats) setStat('statTopCount', stats.topCount || 0);
    }

    function applySampleState() {
      if (quoteType && pageConfig.sampleState && pageConfig.sampleState.quoteType) {
        quoteType.value = pageConfig.sampleState.quoteType;
      }
    }

    function getWordTokens(text) {
      const matches = normalizeNewlines(text)
        .toLowerCase()
        .match(/[\\p{L}\\p{N}]+(?:['’-][\\p{L}\\p{N}]+)*/gu);

      return matches ? matches.filter(Boolean) : [];
    }

    function cleanUrlMatch(url) {
      return url.replace(/[),.;!?]+$/g, '');
    }

    function extractPhoneNumberMatches(text) {
      const candidates = normalizeNewlines(text).match(/(?:\\+?\\d[\\d().\\s-]{5,}\\d)/g) || [];
      return candidates
        .map((candidate) => cleanUrlMatch(candidate).trim())
        .filter(Boolean)
        .filter((candidate) => {
          const digits = candidate.replace(/\\D/g, '');
          if (digits.length < 7 || digits.length > 15) return false;
          if (/^\\d{4}[-\\/.]\\d{1,2}[-\\/.]\\d{1,2}$/.test(candidate)) return false;
          return true;
        });
    }

    function extractHashtagMatches(text) {
      const matches = [];
      const pattern = /(^|[^\\p{L}\\p{N}_])(#[\\p{L}\\p{N}_]+)/gu;
      for (const match of normalizeNewlines(text).matchAll(pattern)) {
        matches.push(match[2]);
      }
      return matches;
    }

    function extractDomainMatches(text) {
      const matches = [];
      const pattern = /(?:https?:\\/\\/|ftp:\\/\\/)?(?:www\\.)?((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,})(?::\\d{2,5})?(?:[/?#][^\\s<>"']*)?/gi;
      for (const match of normalizeNewlines(text).matchAll(pattern)) {
        const domain = cleanUrlMatch(match[1] || '').toLowerCase();
        if (domain) {
          matches.push(domain);
        }
      }
      return matches;
    }

    function stripHtmlTags(text) {
      const withoutHiddenContent = normalizeNewlines(text)
        .replace(/<script[\\s\\S]*?<\\/script>/gi, '')
        .replace(/<style[\\s\\S]*?<\\/style>/gi, '');
      const markupWithBreaks = withoutHiddenContent
        .replace(/<br\\s*\\/?>/gi, '\\n')
        .replace(/<\\/(p|div|section|article|li|ul|ol|blockquote|h[1-6]|tr)>/gi, '\\n')
        .replace(/<\\/td>/gi, '\\t');
      const parser = new DOMParser();
      const doc = parser.parseFromString(markupWithBreaks, 'text/html');
      const rawText = (doc.body.textContent || '').replace(/\\u00a0/g, ' ');
      return normalizeNewlines(rawText)
        .replace(/[ \\t]+\\n/g, '\\n')
        .replace(/\\n[ \\t]+/g, '\\n')
        .replace(/\\n{3,}/g, '\\n\\n')
        .trim();
    }

    function escapeQuotedLine(line, quoteMode) {
      const escapedBackslashes = line.replace(/\\\\/g, '\\\\\\\\');
      if (quoteMode === 'single') {
        return escapedBackslashes.replace(/'/g, "\\\\'");
      }
      return escapedBackslashes.replace(/"/g, '\\\\"');
    }

    function slugifyText(text) {
      return normalizeNewlines(text)
        .normalize('NFKD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
    }

    function normalizeInlineText(text) {
      return normalizeNewlines(text).replace(/\\s+/g, ' ').trim();
    }

    function classifyLength(length, shortMax, goodMax, okayMax) {
      if (length <= shortMax) {
        return {
          label: 'Short',
          guidance: 'Consider adding more context so the text is specific enough.'
        };
      }

      if (length <= goodMax) {
        return {
          label: 'Good',
          guidance: 'Good length for many search results.'
        };
      }

      if (length <= okayMax) {
        return {
          label: 'Long',
          guidance: 'It may still work, but trimming it could reduce truncation risk.'
        };
      }

      return {
        label: 'Too Long',
        guidance: 'Consider shortening it to reduce the chance of truncation.'
      };
    }

    function extractUrlMatches(text) {
      return (normalizeNewlines(text).match(/(?:https?:\\/\\/|ftp:\\/\\/|www\\.)[^\\s<>"']+/gi) || [])
        .map(cleanUrlMatch)
        .filter(Boolean);
    }

    function looksLikeUrlCandidate(value) {
      return /^(?:[a-z][a-z0-9+.-]*:\\/\\/)?(?:www\\.)?(?:[a-z0-9-]+\\.)+[a-z]{2,}(?:[/?#]|$)/i.test(value);
    }

    function normalizeUrlCandidate(value) {
      const cleaned = cleanUrlMatch(String(value || '').trim());
      if (!cleaned) return '';
      if (/^[a-z][a-z0-9+.-]*:\\/\\//i.test(cleaned)) return cleaned;
      if (/^www\\./i.test(cleaned) || looksLikeUrlCandidate(cleaned)) {
        return 'https://' + cleaned;
      }
      return '';
    }

    function buildCleanUrl(parsedUrl, original) {
      const hadProtocol = /^[a-z][a-z0-9+.-]*:\\/\\//i.test(original);
      const withoutProtocol = original.replace(/^[a-z][a-z0-9+.-]*:\\/\\//i, '');
      const hasExplicitPath = /\\//.test(withoutProtocol);
      const pathValue = parsedUrl.pathname === '/' && !hasExplicitPath ? '' : parsedUrl.pathname;
      const prefix = hadProtocol ? parsedUrl.protocol + '//' : '';
      return prefix + parsedUrl.host + pathValue + parsedUrl.hash;
    }

    function removeUrlParametersFromValue(value) {
      const original = cleanUrlMatch(String(value || '').trim());
      const normalized = normalizeUrlCandidate(original);
      if (!normalized) return '';

      const parsedUrl = new URL(normalized);
      parsedUrl.search = '';
      return buildCleanUrl(parsedUrl, original);
    }

    function extractLinksFromHtml(text) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(normalizeNewlines(text), 'text/html');
      return Array.from(doc.querySelectorAll('a[href]'))
        .map((link) => cleanUrlMatch(link.getAttribute('href') || '').trim())
        .filter(Boolean);
    }

    function extractMetaTagItems(text) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(normalizeNewlines(text), 'text/html');
      const selectors = [
        ['Title', 'title', 'text'],
        ['Meta Description', 'meta[name="description"]', 'content'],
        ['Robots', 'meta[name="robots"]', 'content'],
        ['Canonical', 'link[rel~="canonical"]', 'href'],
        ['OG Title', 'meta[property="og:title"]', 'content'],
        ['OG Description', 'meta[property="og:description"]', 'content'],
        ['OG URL', 'meta[property="og:url"]', 'content'],
        ['Twitter Card', 'meta[name="twitter:card"]', 'content'],
        ['Twitter Title', 'meta[name="twitter:title"]', 'content'],
        ['Twitter Description', 'meta[name="twitter:description"]', 'content']
      ];

      return selectors
        .map(([label, selector, mode]) => {
          const node = doc.querySelector(selector);
          if (!node) return null;

          const value = mode === 'text'
            ? normalizeInlineText(node.textContent || '')
            : normalizeInlineText(node.getAttribute(mode) || '');

          if (!value) return null;
          return label + ': ' + value;
        })
        .filter(Boolean);
    }

    function processTool(source) {
      switch (pageConfig.slug) {
        case 'extract-numbers': {
          const matches = normalizeNewlines(source).match(/-?(?:\\d*\\.\\d+|\\d+)/g) || [];
          return matches.length
            ? {
                output: matches.join('\\n'),
                status: 'Numbers extracted successfully.',
                type: 'success',
                stats: { matches: matches.length }
              }
            : {
                output: '',
                status: 'No numbers found.',
                stats: { matches: 0 }
              };
        }
        case 'extract-urls': {
          const matches = (normalizeNewlines(source).match(/(?:https?:\\/\\/|ftp:\\/\\/|www\\.)[^\\s<>"']+/gi) || [])
            .map(cleanUrlMatch)
            .filter(Boolean);
          return matches.length
            ? {
                output: matches.join('\\n'),
                status: 'URLs extracted successfully.',
                type: 'success',
                stats: { matches: matches.length }
              }
            : {
                output: '',
                status: 'No URLs found.',
                stats: { matches: 0 }
              };
        }
        case 'extract-emails': {
          const matches = normalizeNewlines(source).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi) || [];
          return matches.length
            ? {
                output: matches.join('\\n'),
                status: 'Email addresses extracted successfully.',
                type: 'success',
                stats: { matches: matches.length }
              }
            : {
                output: '',
                status: 'No email addresses found.',
                stats: { matches: 0 }
              };
        }
        case 'extract-phone-numbers': {
          const matches = extractPhoneNumberMatches(source);
          return matches.length
            ? {
                output: matches.join('\\n'),
                status: 'Phone numbers extracted successfully.',
                type: 'success',
                stats: { matches: matches.length }
              }
            : {
                output: '',
                status: 'No phone numbers found.',
                stats: { matches: 0 }
              };
        }
        case 'extract-hashtags': {
          const matches = extractHashtagMatches(source);
          return matches.length
            ? {
                output: matches.join('\\n'),
                status: 'Hashtags extracted successfully.',
                type: 'success',
                stats: { matches: matches.length }
              }
            : {
                output: '',
                status: 'No hashtags found.',
                stats: { matches: 0 }
              };
        }
        case 'extract-domains': {
          const matches = extractDomainMatches(source);
          return matches.length
            ? {
                output: matches.join('\\n'),
                status: 'Domains extracted successfully.',
                type: 'success',
                stats: { matches: matches.length }
              }
            : {
                output: '',
                status: 'No domains found.',
                stats: { matches: 0 }
              };
        }
        case 'number-lines': {
          const lines = normalizeNewlines(source).split('\\n');
          const width = String(lines.length).length;
          return {
            output: lines
              .map((line, index) => String(index + 1).padStart(width, ' ') + '. ' + line)
              .join('\\n'),
            status: 'Lines numbered successfully.',
            type: 'success',
            stats: { linesProcessed: lines.length }
          };
        }
        case 'add-quotes': {
          const quoteMode = quoteType ? quoteType.value : 'double';
          const quoteCharacter = quoteMode === 'single' ? "'" : '"';
          const items = normalizeNewlines(source)
            .split('\\n')
            .map((line) => line.trim())
            .filter(Boolean);
          return items.length
            ? {
                output: items
                  .map((line) => quoteCharacter + escapeQuotedLine(line, quoteMode) + quoteCharacter)
                  .join('\\n'),
                status: 'Quotes added successfully.',
                type: 'success',
                stats: { items: items.length }
              }
            : {
                output: '',
                status: 'No non-empty lines were found.',
                stats: { items: 0 }
              };
        }
        case 'comma-to-newline': {
          const items = normalizeNewlines(source)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
          return items.length
            ? {
                output: items.join('\\n'),
                status: 'Items split into lines successfully.',
                type: 'success',
                stats: { items: items.length }
              }
            : {
                output: '',
                status: 'No comma-separated items were found.',
                stats: { items: 0 }
              };
        }
        case 'newline-to-comma': {
          const items = normalizeNewlines(source)
            .split('\\n')
            .map((item) => item.trim())
            .filter(Boolean);
          return items.length
            ? {
                output: items.join(', '),
                status: 'Lines joined successfully.',
                type: 'success',
                stats: { items: items.length }
              }
            : {
                output: '',
                status: 'No line-based items were found.',
                stats: { items: 0 }
              };
        }
        case 'count-unique-words': {
          const words = getWordTokens(source);
          const uniqueWords = [...new Set(words)];
          const repeatedWords = words.length - uniqueWords.length;
          const variety = words.length ? Math.round((uniqueWords.length / words.length) * 100) : 0;
          return words.length
            ? {
                output: uniqueWords.sort((a, b) => a.localeCompare(b)).join('\\n'),
                status: 'Unique word count ready.',
                type: 'success',
                stats: {
                  totalWords: words.length,
                  uniqueWords: uniqueWords.length,
                  repeatedWords,
                  variety
                }
              }
            : {
                output: '',
                status: 'No words found.',
                stats: {
                  totalWords: 0,
                  uniqueWords: 0,
                  repeatedWords: 0,
                  variety: 0
                }
              };
        }
        case 'text-to-slug': {
          const slug = slugifyText(source);
          if (!slug) {
            throw new Error('No letters or numbers were found to build a slug.');
          }
          return {
            output: slug,
            status: 'Slug created successfully.',
            type: 'success',
            stats: { slugLength: slug.length }
          };
        }
        case 'word-frequency': {
          const words = getWordTokens(source);
          if (!words.length) {
            return {
              output: '',
              status: 'No words found.',
              stats: {
                totalWords: 0,
                uniqueWords: 0,
                topWord: '-',
                topCount: 0
              }
            };
          }

          const counts = new Map();
          for (const word of words) {
            counts.set(word, (counts.get(word) || 0) + 1);
          }

          const ranked = [...counts.entries()].sort((left, right) => {
            if (right[1] !== left[1]) return right[1] - left[1];
            return left[0].localeCompare(right[0]);
          });

          return {
            output: ranked.map(([word, count]) => word + ': ' + count).join('\\n'),
              status: 'Word frequency analyzed successfully.',
              type: 'success',
              stats: {
                totalWords: words.length,
                uniqueWords: counts.size,
              topWord: ranked[0][0],
              topCount: ranked[0][1]
            }
          };
        }
        case 'json-minify': {
          try {
            const parsed = JSON.parse(source);
            return {
              output: JSON.stringify(parsed),
              status: 'JSON minified successfully.',
              type: 'success'
            };
          } catch (error) {
            throw new Error('Invalid JSON: ' + error.message);
          }
        }
        case 'strip-html-tags': {
          const tagMatches = normalizeNewlines(source).match(/<[^>]+>/g) || [];
          if (!tagMatches.length) {
            return {
              output: normalizeNewlines(source).trim(),
              status: 'No HTML tags found. Text returned unchanged.'
            };
          }

          return {
            output: stripHtmlTags(source),
              status: 'HTML tags removed successfully.',
              type: 'success'
            };
        }
        case 'title-tag-checker': {
          const normalized = normalizeInlineText(source);
          const words = normalized ? normalized.split(/\\s+/).filter(Boolean) : [];
          const assessment = classifyLength(normalized.length, 30, 60, 70);

          return {
            output: [
              'Normalized title: ' + normalized,
              'Characters: ' + normalized.length,
              'Words: ' + words.length,
              'Assessment: ' + assessment.guidance
            ].join('\\n'),
            status: 'Title tag length checked.',
            type: 'success',
            stats: {
              titleChars: normalized.length,
              titleWords: words.length,
              titleStatus: assessment.label
            }
          };
        }
        case 'meta-description-checker': {
          const normalized = normalizeInlineText(source);
          const words = normalized ? normalized.split(/\\s+/).filter(Boolean) : [];
          const assessment = classifyLength(normalized.length, 70, 160, 180);

          return {
            output: [
              'Normalized description: ' + normalized,
              'Characters: ' + normalized.length,
              'Words: ' + words.length,
              'Assessment: ' + assessment.guidance
            ].join('\\n'),
            status: 'Meta description length checked.',
            type: 'success',
            stats: {
              descriptionChars: normalized.length,
              descriptionWords: words.length,
              descriptionStatus: assessment.label
            }
          };
        }
        case 'remove-url-parameters': {
          const extractedMatches = extractUrlMatches(source);
          const candidates = extractedMatches.length
            ? extractedMatches
            : normalizeNewlines(source).split('\\n').map((line) => line.trim()).filter(Boolean);
          const cleaned = candidates
            .map((candidate) => removeUrlParametersFromValue(candidate))
            .filter(Boolean);

          if (!cleaned.length) {
            return {
              output: '',
              status: 'No URLs were found to clean.',
              stats: { urlsCleaned: 0 }
            };
          }

          return {
            output: cleaned.join('\\n'),
            status: 'URL parameters removed successfully.',
            type: 'success',
            stats: { urlsCleaned: cleaned.length }
          };
        }
        case 'extract-links-from-html': {
          const links = extractLinksFromHtml(source);
          return links.length
            ? {
                output: links.join('\\n'),
                status: 'HTML links extracted successfully.',
                type: 'success',
                stats: { linksExtracted: links.length }
              }
            : {
                output: '',
                status: 'No anchor links found.',
                stats: { linksExtracted: 0 }
              };
        }
        case 'extract-meta-tags': {
          const items = extractMetaTagItems(source);
          return items.length
            ? {
                output: items.join('\\n'),
                status: 'Meta tags extracted successfully.',
                type: 'success',
                stats: { metaItems: items.length }
              }
            : {
                output: '',
                status: 'No supported meta tags found.',
                stats: { metaItems: 0 }
              };
        }
        default:
          return {
            output: normalizeNewlines(source),
            status: 'Processed successfully.',
            type: 'success'
          };
      }
    }

    processBtn.addEventListener('click', () => {
      const source = inputText.value;
      const isEmpty = pageConfig.requiresNonWhitespaceInput === false ? source.length === 0 : !source.trim();

      if (isEmpty) {
        outputText.value = '';
        resetToolStats();
        setStatus(pageConfig.emptyInputMessage);
        updateStats();
        return;
      }

      try {
        const result = processTool(source);
        outputText.value = result.output || '';
        resetToolStats();
        updateToolStats(result.stats || {});
        setStatus(result.status || 'Processed successfully.', result.type || '');
      } catch (error) {
        outputText.value = '';
        resetToolStats();
        setStatus(error.message || 'Something went wrong.', 'error');
      }

      updateStats();
    });

    sampleBtn.addEventListener('click', () => {
      inputText.value = pageConfig.sampleText || '';
      outputText.value = '';
      resetToolStats();
      applySampleState();
      setStatus('Example text loaded.');
      updateStats();
    });

    clearBtn.addEventListener('click', () => {
      inputText.value = '';
      outputText.value = '';
      resetToolStats();
      applySampleState();
      setStatus('');
      updateStats();
      inputText.focus();
    });

    copyBtn.addEventListener('click', async () => {
      if (!outputText.value) {
        setStatus('There is no result to copy yet.');
        return;
      }

      try {
        await navigator.clipboard.writeText(outputText.value);
        setStatus('Result copied to clipboard.', 'success');
      } catch (error) {
        setStatus('Copy failed. Please copy the result manually.', 'error');
      }
    });

    inputText.addEventListener('input', updateStats);
    outputText.addEventListener('input', updateStats);

    resetToolStats();
    applySampleState();
    updateStats();
  </script>
</body>
</html>
`;
}

const pageConfigs = {
  'extract-numbers': {
    processLabel: 'Extract Numbers',
    inputDescription: 'Paste text that contains numbers, amounts, or codes.',
    inputPlaceholder: 'Paste text with numbers here...',
    outputDescription: 'Every number found will be listed on its own line.',
    outputPlaceholder: 'Extracted numbers will appear here...',
    sampleText: 'Order 15 ships in 2.5 days.\nRefund amount: -10\nReference: 88421',
    stats: [{ id: 'statMatches', label: 'Matches', initial: '0' }]
  },
  'extract-urls': {
    processLabel: 'Extract URLs',
    inputDescription: 'Paste text, notes, or emails that contain links.',
    inputPlaceholder: 'Paste text with URLs here...',
    outputDescription: 'Every detected URL will be listed on its own line.',
    outputPlaceholder: 'Extracted URLs will appear here...',
    sampleText:
      'Docs: https://example.com/docs\nStatus: http://status.example.net/report?day=7\nBackup: www.example.org',
    stats: [{ id: 'statMatches', label: 'Matches', initial: '0' }]
  },
  'extract-emails': {
    processLabel: 'Extract Emails',
    inputDescription: 'Paste text, messages, or exports that contain email addresses.',
    inputPlaceholder: 'Paste text with email addresses here...',
    outputDescription: 'Every detected email address will be listed on its own line.',
    outputPlaceholder: 'Extracted email addresses will appear here...',
    sampleText: 'Sales: sales@example.com\nSupport: help@test.dev\nTeam: admin@example.org',
    stats: [{ id: 'statMatches', label: 'Matches', initial: '0' }]
  },
  'extract-phone-numbers': {
    processLabel: 'Extract Phone Numbers',
    inputDescription: 'Paste text, notes, or exports that contain phone numbers.',
    inputPlaceholder: 'Paste text with phone numbers here...',
    outputDescription: 'Every detected phone number will be listed on its own line.',
    outputPlaceholder: 'Extracted phone numbers will appear here...',
    sampleText: 'US: +1 (415) 555-0199\nUK: 020 7946 0958\nOffice: +61 2 9374 4000',
    stats: [{ id: 'statMatches', label: 'Matches', initial: '0' }]
  },
  'extract-hashtags': {
    processLabel: 'Extract Hashtags',
    inputDescription: 'Paste captions, social posts, or notes that include hashtags.',
    inputPlaceholder: 'Paste text with hashtags here...',
    outputDescription: 'Each detected hashtag will be listed on its own line.',
    outputPlaceholder: 'Extracted hashtags will appear here...',
    sampleText: 'Campaign copy: #SpringLaunch #ProductUpdate #2026Goals',
    stats: [{ id: 'statMatches', label: 'Matches', initial: '0' }]
  },
  'extract-domains': {
    processLabel: 'Extract Domains',
    inputDescription: 'Paste text that contains URLs, email addresses, or domain names.',
    inputPlaceholder: 'Paste text with domains here...',
    outputDescription: 'Each detected domain will be listed on its own line.',
    outputPlaceholder: 'Extracted domains will appear here...',
    sampleText: 'Docs: https://docs.example.com/start\nEmail: team@example.org\nPortal: portal.test.dev/login',
    stats: [{ id: 'statMatches', label: 'Matches', initial: '0' }]
  },
  'number-lines': {
    processLabel: 'Number Lines',
    inputDescription: 'Paste text that should be easier to reference line by line.',
    inputPlaceholder: 'Paste multi-line text here...',
    outputDescription: 'Each line will be returned with a line number prefix.',
    outputPlaceholder: 'Numbered lines will appear here...',
    sampleText: 'alpha\nbeta\ngamma',
    stats: [{ id: 'statLinesProcessed', label: 'Lines', initial: '0' }]
  },
  'add-quotes': {
    processLabel: 'Add Quotes',
    inputDescription: 'Paste one item per line before wrapping each line in quotes.',
    inputPlaceholder: 'Paste one item per line here...',
    outputDescription: 'Each non-empty line will be returned as a quoted string.',
    outputPlaceholder: 'Quoted lines will appear here...',
    inputControls: `            <div class="control-row">
              <label class="field-label" for="quoteType">Quote type</label>
              <select id="quoteType">
                <option value="double">Double quotes</option>
                <option value="single">Single quotes</option>
              </select>
            </div>`,
    sampleText: 'apple\nbanana\ncarrot',
    sampleState: { quoteType: 'double' },
    stats: [{ id: 'statItems', label: 'Quoted', initial: '0' }]
  },
  'comma-to-newline': {
    processLabel: 'Comma to Newline',
    inputDescription: 'Paste comma-separated items that should become a vertical list.',
    inputPlaceholder: 'Paste comma-separated items here...',
    outputDescription: 'Each trimmed item will be shown on its own line.',
    outputPlaceholder: 'Line-separated items will appear here...',
    sampleText: 'apple, banana, carrot, dragon fruit',
    stats: [{ id: 'statItems', label: 'Items', initial: '0' }]
  },
  'newline-to-comma': {
    processLabel: 'Newline to Comma',
    inputDescription: 'Paste one item per line before joining the list.',
    inputPlaceholder: 'Paste one item per line here...',
    outputDescription: 'All non-empty lines will be joined with commas.',
    outputPlaceholder: 'Comma-separated output will appear here...',
    sampleText: 'apple\nbanana\ncarrot',
    stats: [{ id: 'statItems', label: 'Items', initial: '0' }]
  },
  'count-unique-words': {
    processLabel: 'Count Unique Words',
    inputDescription: 'Paste text to measure total words and distinct vocabulary.',
    inputPlaceholder: 'Paste text here...',
    outputDescription: 'Unique words will be listed in alphabetical order.',
    outputPlaceholder: 'Unique words will appear here...',
    sampleText: 'Apple banana apple carrot banana apple',
    stats: [
      { id: 'statTotalWords', label: 'Total', initial: '0' },
      { id: 'statUniqueWords', label: 'Unique', initial: '0' },
      { id: 'statRepeatedWords', label: 'Repeated', initial: '0' },
      { id: 'statVariety', label: 'Variety', initial: '0%' }
    ]
  },
  'text-to-slug': {
    processLabel: 'Create Slug',
    inputDescription: 'Paste a title, name, or phrase that should become URL-friendly.',
    inputPlaceholder: 'Paste a title or phrase here...',
    outputDescription: 'A clean slug will be generated for URLs or filenames.',
    outputPlaceholder: 'Generated slug will appear here...',
    sampleText: 'Spring Launch: New Product Page 2026!',
    stats: [{ id: 'statSlugLength', label: 'Slug Length', initial: '0' }]
  },
  'word-frequency': {
    processLabel: 'Analyze Word Frequency',
    inputDescription: 'Paste text to rank words from most frequent to least frequent.',
    inputPlaceholder: 'Paste text here...',
    outputDescription: 'Each line will show a word and how often it appears.',
    outputPlaceholder: 'Word frequency results will appear here...',
    sampleText: 'apple banana apple carrot banana apple',
    stats: [
      { id: 'statTotalWords', label: 'Total', initial: '0' },
      { id: 'statUniqueWords', label: 'Unique', initial: '0' },
      { id: 'statTopWord', label: 'Top Word', initial: '-' },
      { id: 'statTopCount', label: 'Top Count', initial: '0' }
    ]
  },
  'json-minify': {
    processLabel: 'Minify JSON',
    inputDescription: 'Paste formatted or spaced JSON that should become compact.',
    inputPlaceholder: 'Paste JSON here...',
    outputDescription: 'Valid JSON will be returned as a minified single-line string.',
    outputPlaceholder: 'Minified JSON will appear here...',
    sampleText: '{\n  "name": "Alice",\n  "items": [1, 2],\n  "ok": true\n}'
  },
  'strip-html-tags': {
    processLabel: 'Strip HTML Tags',
    inputDescription: 'Paste HTML, embed code, or markup that should become plain text.',
    inputPlaceholder: 'Paste HTML here...',
    outputDescription: 'Visible text will be returned without HTML tags.',
    outputPlaceholder: 'Plain text output will appear here...',
    sampleText: '<article><h2>Launch update</h2><p>Hello <strong>world</strong></p><p>Next line &amp; more.</p></article>'
  },
  'title-tag-checker': {
    processLabel: 'Check Title Tag',
    inputDescription: 'Paste a page title or SEO headline draft.',
    inputPlaceholder: 'Paste a title tag here...',
    outputDescription: 'The title will be normalized and returned with quick length guidance.',
    outputPlaceholder: 'Title tag feedback will appear here...',
    sampleText: ' Free online JSON formatter for API testing and payload cleanup ',
    stats: [
      { id: 'statTitleChars', label: 'Chars', initial: '0' },
      { id: 'statTitleWords', label: 'Words', initial: '0' },
      { id: 'statTitleStatus', label: 'Status', initial: 'Ready' }
    ]
  },
  'meta-description-checker': {
    processLabel: 'Check Meta Description',
    inputDescription: 'Paste a draft meta description or SERP snippet.',
    inputPlaceholder: 'Paste a meta description here...',
    outputDescription: 'The description will be normalized and returned with quick snippet guidance.',
    outputPlaceholder: 'Meta description feedback will appear here...',
    sampleText:
      'Format JSON in your browser before testing APIs, debugging payloads, or sharing clean examples with your team.',
    stats: [
      { id: 'statDescriptionChars', label: 'Chars', initial: '0' },
      { id: 'statDescriptionWords', label: 'Words', initial: '0' },
      { id: 'statDescriptionStatus', label: 'Status', initial: 'Ready' }
    ]
  },
  'remove-url-parameters': {
    processLabel: 'Remove URL Parameters',
    inputDescription: 'Paste URLs or text that contains links with query parameters.',
    inputPlaceholder: 'Paste URLs here...',
    outputDescription: 'Each detected URL will be returned without the query string.',
    outputPlaceholder: 'Cleaned URLs will appear here...',
    sampleText:
      'https://example.com/product?id=42&utm_source=newsletter\nwww.test.dev/path?ref=campaign#pricing',
    stats: [{ id: 'statUrlsCleaned', label: 'URLs', initial: '0' }]
  },
  'extract-links-from-html': {
    processLabel: 'Extract Links From HTML',
    inputDescription: 'Paste HTML markup that contains anchor tags.',
    inputPlaceholder: 'Paste HTML here...',
    outputDescription: 'Every anchor href value will be listed on its own line.',
    outputPlaceholder: 'Extracted links will appear here...',
    sampleText:
      '<nav><a href="/about">About</a><a href="https://example.com/contact?src=nav">Contact</a></nav>',
    stats: [{ id: 'statLinksExtracted', label: 'Links', initial: '0' }]
  },
  'extract-meta-tags': {
    processLabel: 'Extract Meta Tags',
    inputDescription: 'Paste HTML or a head snippet that contains SEO metadata.',
    inputPlaceholder: 'Paste HTML or head markup here...',
    outputDescription: 'Supported title, canonical, robots, and metadata tags will be returned line by line.',
    outputPlaceholder: 'Extracted meta tags will appear here...',
    sampleText:
      '<head><title>Sample Page</title><meta name="description" content="Example snippet"><link rel="canonical" href="https://example.com/page"><meta property="og:title" content="OG Sample Page"></head>',
    stats: [{ id: 'statMetaItems', label: 'Tags', initial: '0' }]
  }
};

let generated = 0;

for (const [slug, config] of Object.entries(pageConfigs)) {
  const tool = toolMap.get(slug);
  if (!tool) {
    console.log(`Skipping ${slug}: missing tool data`);
    continue;
  }

  const toolDir = path.join(toolsDir, slug);
  fs.mkdirSync(toolDir, { recursive: true });
  fs.writeFileSync(path.join(toolDir, 'index.html'), pageTemplate(tool, config), 'utf8');
  console.log(`Generated missing live tool page: tools/${slug}/index.html`);
  generated++;
}

console.log(`\nDone. Generated: ${generated}`);
