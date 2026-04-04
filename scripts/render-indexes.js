const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
const {
  PRIMARY_CATEGORY_DEFINITIONS,
  SECONDARY_CATEGORY_DEFINITIONS
} = require('./tool-taxonomy');

const SITE_URL = 'https://extformattools.com';
const SITE_NAME = 'ExtFormatTools';
const YANDEX_VERIFICATION_TOKEN = '3b38b8a52f66615d';
const CURRENT_YEAR = new Date().getFullYear();

function toolFilePath(slug) {
  return path.join(root, 'tools', slug, 'index.html');
}

function hasToolPage(tool) {
  return Boolean(tool && tool.slug) && fs.existsSync(toolFilePath(tool.slug));
}

function normalizeCategory(category = '') {
  if (category === 'text-tools') return 'text';
  if (category === 'developer-tools') return 'dev';
  return category;
}

function isLiveTool(tool) {
  return normalizeCategory(tool.category) && tool.status === 'live' && hasToolPage(tool);
}

const liveTools = tools.filter(isLiveTool);
const textTools = liveTools.filter(tool => normalizeCategory(tool.category) === 'text');
const devTools = liveTools.filter(tool => normalizeCategory(tool.category) === 'dev');

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function toolUrl(tool) {
  return `${SITE_URL}/tools/${tool.slug}/`;
}

function getPrimaryMeta(primaryCategory = '') {
  return PRIMARY_CATEGORY_DEFINITIONS[primaryCategory] || null;
}

function getSecondaryMeta(secondaryCategory = '') {
  return SECONDARY_CATEGORY_DEFINITIONS[secondaryCategory] || null;
}

function getTool(slug) {
  return liveTools.find(tool => tool.slug === slug);
}

function getPrimaryTools(primaryCategory, list = liveTools) {
  return list.filter(tool => tool.primaryCategory === primaryCategory);
}

function getRootHref(root) {
  return root === 'text' ? '/text-tools/' : '/developer-tools/';
}

function getRootMeta(rootKey) {
  if (rootKey === 'text') {
    return {
      label: 'Text Tools',
      href: '/text-tools/',
      buttonLabel: 'Browse Text Tools',
      description:
        'Cleanup, convert, extract, and analyze everyday text without changing the current page structure.'
    };
  }

  if (rootKey === 'dev') {
    return {
      label: 'Developer Tools',
      href: '/developer-tools/',
      buttonLabel: 'Browse Developer Tools',
      description:
        'Format JSON, test patterns, encode values, and handle quick utility work in stable categories.'
    };
  }

  return null;
}

function getSecondaryAnchor(primaryCategory, secondaryCategory = '') {
  const primaryMeta = getPrimaryMeta(primaryCategory);
  if (!primaryMeta) return secondaryCategory || 'more-tools';
  return `${primaryMeta.anchor}-${secondaryCategory || 'more-tools'}`;
}

function getGroupHref(primaryCategory, { secondaryCategory = '', localAnchors = false } = {}) {
  const primaryMeta = getPrimaryMeta(primaryCategory);
  if (!primaryMeta) return '#';

  const anchor = secondaryCategory
    ? getSecondaryAnchor(primaryCategory, secondaryCategory)
    : primaryMeta.anchor;

  return `${localAnchors ? '' : getRootHref(primaryMeta.root)}#${anchor}`;
}

function getPrimaryCategoriesForRoot(root) {
  return Object.entries(PRIMARY_CATEGORY_DEFINITIONS)
    .filter(([primaryCategory, meta]) => meta.root === root && getPrimaryTools(primaryCategory).length)
    .map(([primaryCategory, meta]) => ({
      primaryCategory,
      ...meta,
      count: getPrimaryTools(primaryCategory).length
    }));
}

function getSecondaryGroups(primaryCategory, list = liveTools) {
  const primaryTools = getPrimaryTools(primaryCategory, list);
  const order = [];
  const groups = new Map();

  for (const tool of primaryTools) {
    const secondaryCategory = tool.secondaryCategory || 'uncategorized';
    if (!groups.has(secondaryCategory)) {
      groups.set(secondaryCategory, []);
      order.push(secondaryCategory);
    }
    groups.get(secondaryCategory).push(tool);
  }

  return order.map(secondaryCategory => ({
    secondaryCategory,
    meta: getSecondaryMeta(secondaryCategory),
    tools: groups.get(secondaryCategory) || []
  }));
}

function toolSearchValue(tool) {
  const primaryMeta = getPrimaryMeta(tool.primaryCategory);
  const secondaryMeta = getSecondaryMeta(tool.secondaryCategory);

  return [
    tool.title,
    tool.name,
    tool.description,
    tool.intro,
    primaryMeta ? primaryMeta.label : '',
    secondaryMeta ? secondaryMeta.label : '',
    ...(Array.isArray(tool.keywords) ? tool.keywords : []),
    ...(Array.isArray(tool.tags) ? tool.tags : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function buildItemListSchema(name, itemListUrl, list) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: itemListUrl,
    itemListElement: list.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tool.title,
      url: toolUrl(tool)
    }))
  };
}

function toolCard(tool, { tagLabel = '', searchable = false } = {}) {
  const searchAttrs = searchable
    ? ` data-tool-card data-search="${escapeHtml(toolSearchValue(tool))}" data-category="${escapeHtml(normalizeCategory(tool.category))}"`
    : '';

  return `
        <a class="tool-card" href="/tools/${escapeHtml(tool.slug)}/"${searchAttrs}>
          <h3>${escapeHtml(tool.title)}</h3>
          <p>${escapeHtml(tool.description)}</p>
          ${tagLabel ? `<span class="tool-tag">${escapeHtml(tagLabel)}</span>` : `<span class="tool-status">Live Tool</span>`}
        </a>`;
}

function taskCard(title, description, slugs) {
  const links = slugs
    .map(getTool)
    .filter(Boolean)
    .map(
      tool =>
        `<a class="mini-link" href="/tools/${escapeHtml(tool.slug)}/">${escapeHtml(tool.title)}</a>`
    )
    .join('\n');

  return `
        <div class="card task-card">
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(description)}</p>
          <div class="mini-link-row">
${links}
          </div>
        </div>`;
}

function directoryCard(primaryCategory) {
  const meta = getPrimaryMeta(primaryCategory);
  if (!meta) return '';

  const toolsInGroup = getPrimaryTools(primaryCategory);
  const href = getGroupHref(primaryCategory);
  const preview = toolsInGroup
    .slice(0, 3)
    .map(
      tool => `<a class="mini-link" href="/tools/${escapeHtml(tool.slug)}/">${escapeHtml(tool.title)}</a>`
    )
    .join('\n');

  return `
        <div class="card directory-card">
          <div class="directory-count">${toolsInGroup.length}</div>
          <h3>${escapeHtml(meta.label)}</h3>
          <p>${escapeHtml(meta.description)}</p>
          <div class="mini-link-row">
${preview}
          </div>
          <div class="button-row">
            <a class="button button-secondary" href="${escapeHtml(href)}">Open Group</a>
          </div>
        </div>`;
}

function primarySummaryCard(primaryCategory, { localAnchors = false } = {}) {
  const meta = getPrimaryMeta(primaryCategory);
  if (!meta) return '';

  const toolsInGroup = getPrimaryTools(primaryCategory);
  const secondaryGroups = getSecondaryGroups(primaryCategory);
  const subgroupPills = secondaryGroups
    .map(({ secondaryCategory, meta: secondaryMeta, tools: groupedTools }) => {
      const label = secondaryMeta ? secondaryMeta.label : 'More Tools';
      const href = getGroupHref(primaryCategory, { secondaryCategory, localAnchors });

      return `<a class="subgroup-pill" href="${escapeHtml(href)}">${escapeHtml(label)} <span>${groupedTools.length}</span></a>`;
    })
    .join('\n');

  return `
        <div class="card overview-card">
          <div class="overview-head">
            <div class="directory-count">${toolsInGroup.length}</div>
            <div>
              <h3>${escapeHtml(meta.label)}</h3>
              <p>${escapeHtml(meta.description)}</p>
            </div>
          </div>
          <div class="subgroup-pills">
${subgroupPills}
          </div>
          <div class="button-row">
            <a class="button button-secondary" href="${escapeHtml(getGroupHref(primaryCategory, { localAnchors }))}">Open Group</a>
          </div>
        </div>`;
}

function directoryRootCard(rootKey) {
  const rootMeta = getRootMeta(rootKey);
  if (!rootMeta) return '';

  const groups = getPrimaryCategoriesForRoot(rootKey);
  const list = rootKey === 'text' ? textTools : devTools;
  const overviewCards = groups
    .map(group => primarySummaryCard(group.primaryCategory))
    .join('\n');

  return `
        <div class="card directory-root-card">
          <div class="directory-root-head">
            <div>
              <div class="eyebrow">Main Section</div>
              <h3>${escapeHtml(rootMeta.label)}</h3>
              <p>${escapeHtml(rootMeta.description)}</p>
            </div>
            <div class="directory-root-stat">${list.length} live tools</div>
          </div>
          <div class="button-row">
            <a class="button button-primary" href="${escapeHtml(rootMeta.href)}">${escapeHtml(rootMeta.buttonLabel)}</a>
          </div>
          <div class="directory-overview-grid">
${overviewCards}
          </div>
        </div>`;
}

function searchSection({ sectionId, title, description, inputLabel, inputPlaceholder, toolsList, emptyText }) {
  const cards = toolsList
    .map(tool => {
      const primaryMeta = getPrimaryMeta(tool.primaryCategory);
      return toolCard(tool, {
        searchable: true,
        tagLabel: primaryMeta ? primaryMeta.shortLabel : ''
      });
    })
    .join('\n');

  return `
    <section class="section" id="${escapeHtml(sectionId)}">
      <div class="container">
        <div class="search-card card" data-tool-search>
          <div class="section-head">
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(description)}</p>
          </div>
          <label class="search-label" for="${escapeHtml(sectionId)}-search">${escapeHtml(inputLabel)}</label>
          <div class="search-row">
            <input
              class="search-input"
              id="${escapeHtml(sectionId)}-search"
              type="search"
              placeholder="${escapeHtml(inputPlaceholder)}"
              autocomplete="off"
              spellcheck="false"
              data-search-input
            />
            <button class="button button-secondary" type="button" data-search-clear>Clear</button>
          </div>
          <p class="search-summary" data-search-count></p>
          <div class="tools-grid" data-tools-grid>
${cards}
          </div>
          <p class="empty-state" data-search-empty hidden>${escapeHtml(emptyText)}</p>
        </div>
      </div>
    </section>`;
}

function buildDirectorySections(rootKey) {
  return getPrimaryCategoriesForRoot(rootKey)
    .map(({ primaryCategory, label, description, anchor }) => {
      const secondaryGroups = getSecondaryGroups(primaryCategory);

      const secondaryHtml = secondaryGroups
        .map(({ secondaryCategory, meta, tools: groupedTools }) => {
          const tagLabel = meta ? meta.label : '';
          const cards = groupedTools
            .map(tool => toolCard(tool, { tagLabel }))
            .join('\n');

          return `
        <div class="subgroup-card" id="${escapeHtml(getSecondaryAnchor(primaryCategory, secondaryCategory))}">
          <div class="section-head">
            <h3>${escapeHtml(meta ? meta.label : 'More Tools')}</h3>
            <p>${groupedTools.length} tools in this subgroup.</p>
          </div>
          <div class="tools-grid">
${cards}
          </div>
        </div>`;
        })
        .join('\n');

      return `
      <section class="section directory-section" id="${escapeHtml(anchor)}">
        <div class="section-head">
          <h2>${escapeHtml(label)}</h2>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="subgroup-stack">
${secondaryHtml}
        </div>
      </section>`;
    })
    .join('\n');
}

function layout({ title, description, canonical, body, extraHead = '', robots = 'index,follow' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta name="robots" content="${escapeHtml(robots)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
  <meta name="yandex-verification" content="${escapeHtml(YANDEX_VERIFICATION_TOKEN)}" />
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

    html {
      scroll-behavior: smooth;
    }

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
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(10px);
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

    .nav a:hover,
    .brand:hover,
    .footer-links a:hover,
    .mini-link:hover,
    .breadcrumb a:hover {
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
      max-width: 780px;
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

    .section-head h3 {
      margin: 0 0 6px;
      font-size: 22px;
    }

    .section-head p {
      margin: 0;
      color: var(--muted);
    }

    .tools-grid,
    .task-grid,
    .stats-grid,
    .category-grid,
    .benefits-grid,
    .faq-list,
    .directory-grid,
    .directory-root-grid,
    .directory-overview-grid {
      display: grid;
      gap: 16px;
    }

    .tools-grid,
    .task-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
      margin-top: 22px;
    }

    .category-grid {
      grid-template-columns: 1fr 1fr;
    }

    .benefits-grid,
    .directory-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .directory-root-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .directory-overview-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .tool-card,
    .card,
    .subgroup-card {
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

    .tool-card h3,
    .task-card h3,
    .faq-item h3,
    .stat-card h2,
    .card h3 {
      margin: 0 0 8px;
    }

    .tool-card h3 {
      font-size: 18px;
    }

    .tool-card p,
    .task-card p,
    .faq-item p,
    .card p,
    .card li,
    .stat-card p,
    .subgroup-card p {
      margin: 0;
      color: #31404f;
      font-size: 14px;
    }

    .tool-tag,
    .tool-status {
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

    .stat-card h2 {
      font-size: 30px;
      line-height: 1;
    }

    .stat-card p {
      color: var(--muted);
    }

    .task-card,
    .directory-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .directory-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 42px;
      padding: 8px 10px;
      border-radius: 999px;
      background: #f3f7ff;
      color: var(--primary);
      font-size: 13px;
      font-weight: 700;
    }

    .mini-link-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .mini-link {
      display: inline-flex;
      align-items: center;
      padding: 8px 10px;
      border-radius: 999px;
      background: #f4f7fb;
      color: var(--text);
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
    }

    .eyebrow {
      display: inline-flex;
      margin-bottom: 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--primary);
    }

    .directory-root-card {
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .directory-root-head,
    .overview-head {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 16px;
    }

    .directory-root-stat {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 92px;
      padding: 10px 14px;
      border-radius: 999px;
      background: #edf3ff;
      color: var(--primary);
      font-size: 13px;
      font-weight: 700;
    }

    .overview-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: none;
      background: #fbfcff;
    }

    .overview-card .button-row {
      margin-top: 0;
    }

    .subgroup-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .subgroup-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #eef3f8;
      color: var(--text);
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
    }

    .subgroup-pill span {
      color: var(--muted);
      font-size: 12px;
    }

    .directory-section + .directory-section {
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      padding-top: 28px;
    }

    .subgroup-stack {
      display: grid;
      gap: 18px;
    }

    .search-card {
      padding: 22px;
    }

    .search-label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
    }

    .search-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
    }

    .search-input {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: #fff;
      color: var(--text);
      font-size: 15px;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(20, 99, 255, 0.12);
    }

    .search-summary {
      margin: 12px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    .empty-state {
      margin: 16px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    .faq-item {
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow);
      padding: 18px 20px;
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
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .footer-links a,
    .breadcrumb a {
      color: var(--muted);
      text-decoration: none;
    }

    .breadcrumb {
      font-size: 14px;
      color: var(--muted);
      margin: 20px 0 10px;
    }

    ul.info-list {
      margin: 0;
      padding-left: 18px;
    }

    ul.info-list li + li {
      margin-top: 8px;
    }

    @media (max-width: 980px) {
      .tools-grid,
      .task-grid,
      .benefits-grid,
      .directory-grid,
      .directory-root-grid,
      .directory-overview-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .stats-grid,
      .category-grid,
      .faq-list {
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

      .search-row,
      .tools-grid,
      .task-grid,
      .benefits-grid,
      .directory-grid,
      .directory-root-grid,
      .directory-overview-grid {
        grid-template-columns: 1fr;
      }

      .directory-root-head,
      .overview-head {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
${body}
  <script>
    (function () {
      const groups = document.querySelectorAll('[data-tool-search]');
      groups.forEach(group => {
        const input = group.querySelector('[data-search-input]');
        const clear = group.querySelector('[data-search-clear]');
        const cards = Array.from(group.querySelectorAll('[data-tool-card]'));
        const summary = group.querySelector('[data-search-count]');
        const empty = group.querySelector('[data-search-empty]');

        if (!input || !cards.length) return;

        const total = cards.length;

        function update() {
          const rawQuery = input.value.trim();
          const query = rawQuery.toLowerCase();
          let visibleCount = 0;

          cards.forEach(card => {
            const haystack = (card.dataset.search || '').toLowerCase();
            const matches = !query || haystack.includes(query);
            card.hidden = !matches;
            if (matches) visibleCount += 1;
          });

          if (summary) {
            summary.textContent = query
              ? visibleCount + ' tool' + (visibleCount === 1 ? '' : 's') + ' match "' + rawQuery + '".'
              : 'Showing all ' + total + ' tools.';
          }

          if (empty) {
            empty.hidden = visibleCount !== 0;
          }
        }

        input.addEventListener('input', update);

        if (clear) {
          clear.addEventListener('click', () => {
            input.value = '';
            input.focus();
            update();
          });
        }

        update();
      });
    })();
  </script>
</body>
</html>`;
}

function renderHome() {
  const popularSlugs = [
    'word-counter',
    'remove-extra-spaces',
    'text-sorter',
    'json-formatter',
    'json-validator',
    'regex-tester'
  ];

  const popular = popularSlugs
    .map(getTool)
    .filter(Boolean)
    .map(tool => {
      const tag = normalizeCategory(tool.category) === 'dev' ? 'Developer Tool' : 'Text Tool';
      return toolCard(tool, { tagLabel: tag });
    })
    .join('\n');

  const tasks = [
    taskCard(
      'Clean copied text',
      'Fix spaces, line breaks, and other copy-paste issues before moving text into a form, doc, or CMS.',
      ['remove-extra-spaces', 'remove-line-breaks', 'remove-empty-lines']
    ),
    taskCard(
      'Count content length',
      'Check word counts, character limits, and repeated-word patterns before publishing or submitting text.',
      ['word-counter', 'character-counter', 'word-frequency']
    ),
    taskCard(
      'Sort or deduplicate lists',
      'Turn rough line-by-line exports into ordered, cleaner lists without opening a spreadsheet.',
      ['text-sorter', 'duplicate-line-remover', 'trim-lines']
    ),
    taskCard(
      'Validate developer input',
      'Format JSON, validate syntax, and test regex when you need a quick browser-side check.',
      ['json-formatter', 'json-validator', 'regex-tester']
    ),
    taskCard(
      'Encode or generate values',
      'Handle URLs, Base64 strings, passwords, and UUIDs when you need a quick utility step.',
      ['url-encoder', 'base64-encoder', 'uuid-generator']
    ),
    taskCard(
      'Extract useful data',
      'Pull numbers, emails, or URLs out of raw text and reuse them somewhere cleaner.',
      ['extract-numbers', 'extract-emails', 'extract-urls']
    )
  ].join('\n');

  const directoryRoots = ['text', 'dev']
    .map(directoryRootCard)
    .join('\n');

  const homeSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      alternateName: 'extformattools.com'
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      alternateName: 'extformattools.com',
      description:
        'Use ExtFormatTools for browser-based text cleanup, counting, extraction, JSON formatting, regex testing, and quick developer utilities.'
    },
    buildItemListSchema('Live browser tools', `${SITE_URL}/#find-tools`, liveTools),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Are these tools free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The tools on this site are free to use without creating an account.'
          }
        },
        {
          '@type': 'Question',
          name: 'Do I need to install anything?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. These tools work directly in your browser, so there is nothing to install.'
          }
        },
        {
          '@type': 'Question',
          name: 'Can the site support more categories later?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The tool directory is already organized into task groups so the site can scale without changing existing tool URLs.'
          }
        }
      ]
    }
  ]
    .map(schema => `  <script type="application/ld+json">${safeJsonLd(schema)}</script>`)
    .join('\n');

  return layout({
    title: 'ExtFormatTools | Free Online Text and Developer Tools',
    description:
      'Use ExtFormatTools for browser-based text cleanup, counting, extraction, JSON formatting, regex testing, and quick developer utilities.',
    canonical: `${SITE_URL}/`,
    extraHead: homeSchemas,
    body: `
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/">${SITE_NAME}</a>
      <nav class="nav" aria-label="Primary">
        <a href="#popular-tools">Popular Tools</a>
        <a href="#start-here">Start Here</a>
        <a href="#tool-directory">Directory</a>
        <a href="#find-tools">Find Tools</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <h1>Free online text and developer tools from ${SITE_NAME}</h1>
        <p>Open a tool, paste your input, get the result, and move on. ${SITE_NAME} keeps text cleanup, extraction, JSON work, regex checks, and quick utility tasks simple in the browser.</p>
        <div class="button-row">
          <a class="button button-primary" href="#find-tools">Find a Tool</a>
          <a class="button button-secondary" href="/text-tools/">Browse Text Tools</a>
          <a class="button button-secondary" href="/developer-tools/">Browse Developer Tools</a>
        </div>
        <div class="stats-grid">
          <div class="card stat-card">
            <h2>${liveTools.length}</h2>
            <p>live tools linked from the main site</p>
          </div>
          <div class="card stat-card">
            <h2>${textTools.length}</h2>
            <p>text tools for cleanup, analysis, and conversion</p>
          </div>
          <div class="card stat-card">
            <h2>${devTools.length}</h2>
            <p>developer tools for JSON, regex, encoding, and utilities</p>
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

    <section class="section" id="start-here">
      <div class="container">
        <div class="section-head">
          <h2>Start with the job you need to finish</h2>
          <p>These grouped entry points keep the site simple when you know the task, but not the tool name.</p>
        </div>
        <div class="task-grid">
${tasks}
        </div>
      </div>
    </section>

    <section class="section" id="categories">
      <div class="container">
        <div class="section-head">
          <h2>Browse by category</h2>
          <p>Keep the current top-level structure while the tool directory grows underneath it.</p>
        </div>

        <div class="category-grid">
          <div class="card">
            <h3>Text Tools</h3>
            <p>Cleanup, count, extract, and convert everyday text in one place for writing, operations, and copy-paste workflows.</p>
            <div class="button-row">
              <a class="button button-primary" href="/text-tools/">Browse Text Tools</a>
            </div>
          </div>

          <div class="card">
            <h3>Developer Tools</h3>
            <p>Format JSON, test regex, encode values, and handle quick technical utilities without changing the current URL system.</p>
            <div class="button-row">
              <a class="button button-secondary" href="/developer-tools/">Browse Developer Tools</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="tool-directory">
      <div class="container">
        <div class="section-head">
          <h2>Browse the tool directory</h2>
          <p>The site now scales like a directory: keep the main entry pages, then drill into grouped tools and subgroups without changing tool URLs.</p>
        </div>
        <div class="directory-root-grid">
${directoryRoots}
        </div>
      </div>
    </section>

${searchSection({
  sectionId: 'find-tools',
  title: 'Find a live tool fast',
  description:
    'Search by tool name, task, tag, or keyword when you already know roughly what you need.',
  inputLabel: 'Search tools',
  inputPlaceholder: 'Try: json, counter, whitespace, regex, email, slug',
  toolsList: liveTools,
  emptyText: 'No live tools matched that search. Try a broader keyword like "text", "json", "cleanup", or "count".'
})}

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
            <h3>Can the site support more categories later?</h3>
            <p>Yes. The taxonomy is already in place, so future tools can slot into the directory without changing their URLs.</p>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>© ${CURRENT_YEAR} ${SITE_NAME}</div>
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

function renderCategoryPage({
  categoryKey,
  slug,
  pageTitle,
  pageDescription,
  heroTitle,
  heroText,
  searchPlaceholder,
  featuredSlugs,
  benefitCards,
  aboutPoints,
  alternateCategoryLabel,
  alternateCategoryHref
}) {
  const list = liveTools.filter(tool => normalizeCategory(tool.category) === categoryKey);
  const primaryGroups = getPrimaryCategoriesForRoot(categoryKey);
  const featuredCards = featuredSlugs
    .map(getTool)
    .filter(tool => tool && normalizeCategory(tool.category) === categoryKey)
    .map(tool => {
      const secondaryMeta = getSecondaryMeta(tool.secondaryCategory);
      return toolCard(tool, { tagLabel: secondaryMeta ? secondaryMeta.label : '' });
    })
    .join('\n');

  const benefitHtml = benefitCards
    .map(
      item => `
        <div class="card">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
        </div>`
    )
    .join('\n');

  const directoryOverviewCards = primaryGroups
    .map(group => primarySummaryCard(group.primaryCategory, { localAnchors: true }))
    .join('\n');

  const collectionUrl = `${SITE_URL}/${slug}/`;
  const categorySchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: pageTitle,
      url: collectionUrl,
      description: pageDescription
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${SITE_URL}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: heroTitle,
          item: collectionUrl
        }
      ]
    },
    buildItemListSchema(`${heroTitle} list`, collectionUrl, list)
  ]
    .map(schema => `  <script type="application/ld+json">${safeJsonLd(schema)}</script>`)
    .join('\n');

  return layout({
    title: pageTitle,
    description: pageDescription,
    canonical: collectionUrl,
    robots: 'index,follow',
    extraHead: categorySchemas,
    body: `
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/">${SITE_NAME}</a>
      <nav class="nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/text-tools/">Text Tools</a>
        <a href="/developer-tools/">Developer Tools</a>
        <a href="#directory">Directory</a>
        <a href="#find-tool">Find Tools</a>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      <div class="breadcrumb">
        <a href="/">Home</a> / ${escapeHtml(heroTitle)}
      </div>

      <section class="hero">
        <h1>${escapeHtml(heroTitle)}</h1>
        <p>${escapeHtml(heroText)}</p>
        <div class="button-row">
          <a class="button button-primary" href="#directory">Browse Directory</a>
          <a class="button button-secondary" href="#find-tool">Search Tools</a>
          <a class="button button-secondary" href="${escapeHtml(alternateCategoryHref)}">Browse ${escapeHtml(alternateCategoryLabel)}</a>
        </div>
        <div class="stats-grid">
          <div class="card stat-card">
            <h2>${list.length}</h2>
            <p>live tools in this category</p>
          </div>
          <div class="card stat-card">
            <h2>${primaryGroups.length}</h2>
            <p>directory groups already mapped for future growth</p>
          </div>
          <div class="card stat-card">
            <h2>${benefitCards.length}</h2>
            <p>core use directions shown before the tool list</p>
          </div>
        </div>
      </section>

      <section class="section" id="top-picks">
        <div class="section-head">
          <h2>Start with the most used tools</h2>
          <p>If you are not sure where to begin, these are the easiest entry points.</p>
        </div>
        <div class="tools-grid">
${featuredCards}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>What people usually do here</h2>
          <p>Use this category page as a short path to the job you need to finish.</p>
        </div>
        <div class="benefits-grid">
${benefitHtml}
        </div>
      </section>

      <section class="section" id="directory">
        <div class="section-head">
          <h2>Browse the directory by group</h2>
          <p>This mirrors how larger tool sites grow: keep the top-level page stable, then let visitors jump into the right subgroup when the directory gets bigger.</p>
        </div>
        <div class="directory-overview-grid">
${directoryOverviewCards}
        </div>
      </section>

${buildDirectorySections(categoryKey)}
    </div>

${searchSection({
  sectionId: 'find-tool',
  title: `Find the right ${heroTitle.toLowerCase()}`,
  description: 'Search by task, tool name, category, or tag to jump straight to the page you need.',
  inputLabel: `Search ${heroTitle.toLowerCase()}`,
  inputPlaceholder: searchPlaceholder,
  toolsList: list,
  emptyText: `No ${heroTitle.toLowerCase()} matched that search. Try a broader keyword or browse the grouped directory above.`
})}

    <div class="container">
      <section class="section">
        <div class="card">
          <div class="section-head">
            <h2>About this category</h2>
            <p>This page keeps the current URL structure intact while adding a scalable classification layer under the surface.</p>
          </div>
          <ul class="info-list">
${aboutPoints.map(point => `          <li>${escapeHtml(point)}</li>`).join('\n')}
          </ul>
        </div>
      </section>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>© ${CURRENT_YEAR} ${SITE_NAME}</div>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/text-tools/">Text Tools</a>
        <a href="/developer-tools/">Developer Tools</a>
        <a href="/about/">About</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
      </div>
    </div>
  </footer>`
  });
}

fs.writeFileSync(path.join(root, 'index.html'), renderHome(), 'utf8');

fs.mkdirSync(path.join(root, 'text-tools'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'text-tools', 'index.html'),
  renderCategoryPage({
    categoryKey: 'text',
    slug: 'text-tools',
    pageTitle: 'Text Tools | Cleanup, Counting, and Extraction Tools | ExtFormatTools',
    pageDescription:
      'Browse ExtFormatTools text tools for cleanup, counting, conversion, and extraction tasks in your browser with no install.',
    heroTitle: 'Text Tools',
    heroText:
      'Clean, count, extract, and convert text in your browser without extra steps. ExtFormatTools groups related jobs together so you can find the right text tool fast.',
    searchPlaceholder: 'Try: cleanup, counter, whitespace, extract, quote, frequency',
    featuredSlugs: ['word-counter', 'remove-extra-spaces', 'text-sorter', 'duplicate-line-remover'],
    benefitCards: [
      {
        title: 'Clean pasted text quickly',
        text: 'Fix spacing, line breaks, and formatting problems before moving text into another tool or document.'
      },
      {
        title: 'Measure drafts and structure',
        text: 'Check words, characters, lines, and repeated vocabulary when content has limits or needs editing.'
      },
      {
        title: 'Reshape lists and pull entities',
        text: 'Convert list formats, add quotes, and extract URLs or emails without opening a spreadsheet.'
      }
    ],
    aboutPoints: [
      'The top-level URL stays the same, but tools are now grouped underneath by cleanup, conversion, analysis, and extraction.',
      'Each live tool still opens on its original URL, so existing bookmarks and search signals are preserved.',
      'This makes it easier to expand toward a larger directory model later, similar to bigger online tool sites.'
    ],
    alternateCategoryLabel: 'Developer Tools',
    alternateCategoryHref: '/developer-tools/'
  }),
  'utf8'
);

fs.mkdirSync(path.join(root, 'developer-tools'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'developer-tools', 'index.html'),
  renderCategoryPage({
    categoryKey: 'dev',
    slug: 'developer-tools',
    pageTitle: 'Developer Tools | JSON, Regex, Encoding, and Utility Tools | ExtFormatTools',
    pageDescription:
      'Browse ExtFormatTools developer tools for JSON, regex, encoding, IDs, timestamps, and other quick browser-based utility tasks.',
    heroTitle: 'Developer Tools',
    heroText:
      'Format, validate, encode, and convert developer-facing text in your browser without extra setup. ExtFormatTools keeps these utility pages organized into stable groups for easier discovery.',
    searchPlaceholder: 'Try: json, encoding, uuid, regex, slug, timestamp',
    featuredSlugs: ['json-formatter', 'json-validator', 'regex-tester', 'base64-encoder'],
    benefitCards: [
      {
        title: 'Check structured data quickly',
        text: 'Format and validate JSON when you need to inspect payloads, configs, or copied API data.'
      },
      {
        title: 'Handle encoding and ID tasks',
        text: 'Encode values, generate UUIDs or passwords, and finish lightweight utility steps without leaving the browser.'
      },
      {
        title: 'Prepare web and debugging output',
        text: 'Test regex, escape HTML, compare text, and create slugs or timestamp conversions for technical workflows.'
      }
    ],
    aboutPoints: [
      'The developer tool index now has internal groups for JSON & data, encoding & IDs, developer formatting, and time & web helpers.',
      'Tool URLs remain unchanged, which protects current internal links, search indexing, and bookmarks.',
      'This gives you a clear path to grow toward a larger multi-category directory later without replatforming the site.'
    ],
    alternateCategoryLabel: 'Text Tools',
    alternateCategoryHref: '/text-tools/'
  }),
  'utf8'
);

console.log('Rendered: index.html, text-tools/index.html, developer-tools/index.html');
