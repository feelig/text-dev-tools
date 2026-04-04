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
