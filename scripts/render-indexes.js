const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

function normalizeCategory(category = '') {
  if (category === 'text-tools') return 'text';
  if (category === 'developer-tools') return 'dev';
  return category;
}

function isLiveTool(tool) {
  return normalizeCategory(tool.category) && tool.status === 'live';
}

const liveTools = tools.filter(isLiveTool);

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toolCard(tool, tagLabel) {
  return `
        <a class="tool-card" href="/tools/${escapeHtml(tool.slug)}/">
          <h3>${escapeHtml(tool.title)}</h3>
          <p>${escapeHtml(tool.description)}</p>
          ${tagLabel ? `<span class="tool-tag">${escapeHtml(tagLabel)}</span>` : `<span class="tool-status">Live Tool</span>`}
        </a>`;
}

function layout({ title, description, body, extraHead = '', robots = 'index,follow' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="${robots}" />
  ${extraHead}
  <style>
    :root {
      --bg: #f6f8fb;
      --card: #ffffff;
      --text: #16202a;
      --muted: #5c6773;
      --border: #d9e0e7;
      --primary: #1463ff;
      --primary-hover: #0f52d6;
      --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      --radius: 16px;
      --success-bg: #eef7f1;
      --success-text: #137333;
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
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }

    .site-header {
      background: rgba(255, 255, 255, 0.96);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 0;
    }

    .brand {
      font-size: 21px;
      font-weight: 700;
      text-decoration: none;
      color: var(--text);
      white-space: nowrap;
    }

    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .nav a {
      text-decoration: none;
      color: var(--muted);
      font-size: 14px;
      font-weight: 700;
    }

    .nav a:hover {
      color: var(--primary);
    }

    .hero {
      padding: 34px 0 24px;
    }

    .hero h1 {
      margin: 0 0 10px;
      font-size: 38px;
      line-height: 1.1;
    }

    .hero p {
      margin: 0;
      max-width: 760px;
      color: var(--muted);
      font-size: 17px;
    }

    .section {
      padding: 10px 0 24px;
    }

    .section-head {
      margin-bottom: 16px;
    }

    .section-head h2 {
      margin: 0 0 6px;
      font-size: 28px;
    }

    .section-head p {
      margin: 0;
      color: var(--muted);
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .tool-card, .card {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      box-shadow: var(--shadow);
    }

    .tool-card {
      display: block;
      text-decoration: none;
      color: var(--text);
      transition: 0.18s ease;
    }

    .tool-card:hover {
      transform: translateY(-3px);
      border-color: #bfd0ea;
    }

    .tool-card h3 {
      margin: 0 0 8px;
      font-size: 18px;
    }

    .tool-card p {
      margin: 0;
      color: var(--muted);
      font-size: 14px;
    }

    .tool-tag, .tool-status {
      display: inline-block;
      margin-top: 12px;
      font-size: 12px;
      font-weight: 700;
      padding: 7px 10px;
      border-radius: 999px;
    }

    .tool-tag {
      color: var(--primary);
      background: #edf3ff;
    }

    .tool-status {
      color: var(--success-text);
      background: var(--success-bg);
    }

    .button {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 0;
      text-decoration: none;
      border-radius: 12px;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: 0.18s ease;
    }

    .button-primary {
      background: var(--primary);
      color: #fff;
    }

    .button-primary:hover {
      background: var(--primary-hover);
    }

    .button-secondary {
      background: #eef3f8;
      color: var(--text);
    }

    .button-secondary:hover {
      background: #e3ebf4;
    }

    .button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 18px;
    }

    .category-grid, .benefits-grid, .faq-list {
      display: grid;
      gap: 16px;
    }

    .category-grid {
      grid-template-columns: 1fr 1fr;
    }

    .benefits-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .faq-item {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow);
      padding: 18px 20px;
    }

    .faq-item h3 {
      margin: 0 0 8px;
      font-size: 18px;
    }

    .faq-item p, .card p, .card li {
      color: #31404f;
    }

    .ad-slot {
      display: grid;
      place-items: center;
      min-height: 120px;
      border: 1px dashed #b9c6d3;
      border-radius: 16px;
      color: #7a8794;
      background: #fbfcfe;
      font-size: 14px;
      text-align: center;
      padding: 20px;
    }

    .site-footer {
      padding: 30px 0 46px;
      color: var(--muted);
      font-size: 14px;
    }

    .footer-inner {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 14px;
      padding-top: 12px;
      border-top: 1px solid rgba(0,0,0,0.08);
    }

    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .footer-links a {
      color: var(--muted);
      text-decoration: none;
    }

    .breadcrumb {
      font-size: 14px;
      color: var(--muted);
      margin: 20px 0 10px;
    }

    .breadcrumb a {
      color: var(--muted);
      text-decoration: none;
    }

    ul.info-list {
      margin: 0;
      padding-left: 18px;
    }

    ul.info-list li + li {
      margin-top: 8px;
    }

    @media (max-width: 980px) {
      .tools-grid, .category-grid, .benefits-grid {
        grid-template-columns: 1fr;
      }

      .hero h1 {
        font-size: 30px;
      }
    }

    @media (max-width: 720px) {
      .header-inner {
        align-items: start;
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function renderHome() {
  const popular = liveTools.slice(0, 6).map(t => {
    const tag = t.category === 'dev' ? 'Developer Tool' : 'Text Tool';
    return toolCard(t, tag);
  }).join('\n');

  return layout({
    title: 'Text Dev Tools - Free Online Text & Developer Tools',
    description: 'Free browser tools for text cleanup, quick counts, JSON formatting, regex testing, and everyday developer tasks.',
    extraHead: `
  <script type="application/ld+json">
  {
    "@context":"https://schema.org",
    "@type":"FAQPage",
    "mainEntity":[
      {
        "@type":"Question",
        "name":"Are these tools free to use?",
        "acceptedAnswer":{"@type":"Answer","text":"Yes. The tools on this site are free to use without creating an account."}
      },
      {
        "@type":"Question",
        "name":"Do I need to install anything?",
        "acceptedAnswer":{"@type":"Answer","text":"No. These tools work directly in your browser, so there is nothing to install."}
      },
      {
        "@type":"Question",
        "name":"Is my text processed in the browser?",
        "acceptedAnswer":{"@type":"Answer","text":"For the current static tools, text is processed in the browser with client-side JavaScript."}
      }
    ]
  }
  </script>`,
    body: `
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/">Text Dev Tools</a>
      <nav class="nav" aria-label="Primary">
        <a href="#popular-tools">Popular Tools</a>
        <a href="#categories">Categories</a>
        <a href="#faq">FAQ</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <h1>Free browser tools for text cleanup, quick counts, and developer formatting</h1>
        <p>Open a tool, paste your input, get the result, and move on. No sign-up, no install, and no extra steps between you and the answer.</p>
        <div class="button-row">
          <a class="button button-primary" href="#popular-tools">Browse Popular Tools</a>
          <a class="button button-secondary" href="#categories">View Categories</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="benefits-grid">
          <div class="card">
            <h3>Check words, characters, and lines</h3>
            <p>Use quick counters before you submit, publish, edit, or hand off text.</p>
          </div>
          <div class="card">
            <h3>Clean text fast</h3>
            <p>Fix spaces, line breaks, case, and repeated lines without opening another app.</p>
          </div>
          <div class="card">
            <h3>Format and test structured text</h3>
            <p>Format JSON, test regex, and encode text with focused browser-side tools.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="popular-tools">
      <div class="container">
        <div class="section-head">
          <h2>Popular tools</h2>
          <p>Start with the tools people usually need first.</p>
        </div>
        <div class="tools-grid">
${popular}
        </div>
      </div>
    </section>

    <section class="section" id="categories">
      <div class="container">
        <div class="section-head">
          <h2>Browse by category</h2>
          <p>Go straight to the category that matches the job you need to finish.</p>
        </div>

        <div class="category-grid">
          <div class="card">
            <h3>Text Tools</h3>
            <p>Cleanup, count, sort, and convert everyday text in one place.</p>
            <div class="button-row">
              <a class="button button-primary" href="/text-tools/">Browse Text Tools</a>
            </div>
          </div>

          <div class="card">
            <h3>Developer Tools</h3>
            <p>Format JSON, test regex, and encode text for common technical workflows.</p>
            <div class="button-row">
              <a class="button button-secondary" href="/developer-tools/">Browse Developer Tools</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="faq">
      <div class="container">
        <div class="section-head">
          <h2>Frequently asked questions</h2>
          <p>Short answers for new visitors.</p>
        </div>
        <div class="faq-list">
          <div class="faq-item">
            <h3>Are these tools free to use?</h3>
            <p>Yes. The tools on this site are free to use without creating an account.</p>
          </div>
          <div class="faq-item">
            <h3>Do I need to install anything?</h3>
            <p>No. These tools work directly in your browser, so there is nothing to install.</p>
          </div>
          <div class="faq-item">
            <h3>Is my text processed in the browser?</h3>
            <p>For the current static tools, text is processed in the browser with client-side JavaScript.</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>© 2026 Text Dev Tools</div>
      <div class="footer-links">
        <a href="/text-tools/">Text Tools</a>
        <a href="/developer-tools/">Developer Tools</a>
        <a href="/about/">About</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
        <a href="/contact/">Contact</a>
      </div>
    </div>
  </footer>`
  });
}

function renderCategoryPage(categoryKey, pageTitle, pageDescription, heroTitle, heroText) {
  const list = liveTools.filter(t => normalizeCategory(t.category) === categoryKey);
  const cards = list.map(t => toolCard(t, null)).join('\n');

  return layout({
    title: pageTitle,
    description: pageDescription,
    robots: 'noindex,follow',
    body: `
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/">Text Dev Tools</a>
      <nav class="nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/text-tools/">Text Tools</a>
        <a href="/developer-tools/">Developer Tools</a>
        <a href="/about/">About</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
        <a href="/contact/">Contact</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="breadcrumb">
      <a href="/">Home</a> / ${escapeHtml(heroTitle)}
    </div>

    <section class="hero">
      <h1>${escapeHtml(heroTitle)}</h1>
      <p>${escapeHtml(heroText)}</p>
    </section>

    <section class="section">
      <div class="ad-slot">Quick jump: choose the tool below that matches the job you need to finish.</div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Choose a tool</h2>
        <p>Pick the live tool that matches the task you need to finish.</p>
      </div>
      <div class="tools-grid">
${cards}
      </div>
    </section>

    <section class="section">
      <div class="card">
        <div class="section-head">
          <h2>About this category</h2>
          <p>This page groups the live tools in this category so you can get to the right tool faster.</p>
        </div>
        <ul class="info-list">
          <li>Only live tools are listed here</li>
          <li>Each tool works directly in the browser</li>
          <li>Use this page to jump straight to the exact tool you need</li>
        </ul>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>© 2026 Text Dev Tools</div>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/text-tools/">Text Tools</a>
        <a href="/developer-tools/">Developer Tools</a>
      </div>
    </div>
  </footer>`
  });
}

fs.writeFileSync(path.join(root, 'index.html'), renderHome(), 'utf8');

fs.mkdirSync(path.join(root, 'text-tools'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'text-tools', 'index.html'),
  renderCategoryPage(
    'text',
    'Text Tools - Free Online Text Cleanup & Formatting Tools',
    'Browse free browser-based text tools for removing line breaks, cleaning spaces, counting words, converting case, and related cleanup work.',
    'Text Tools',
    'Clean, count, sort, and convert text in your browser without extra steps.'
  ),
  'utf8'
);

fs.mkdirSync(path.join(root, 'developer-tools'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'developer-tools', 'index.html'),
  renderCategoryPage(
    'dev',
    'Developer Tools - Free Online Formatting & Utility Tools',
    'Browse free browser-based developer tools for formatting JSON, testing regex, encoding text, and handling common utility tasks.',
    'Developer Tools',
    'Format, test, and encode structured text in your browser without extra setup.'
  ),
  'utf8'
);

console.log('Rendered: index.html, text-tools/index.html, developer-tools/index.html');
