const SITE_NAME = 'ExtFormatTools';

const ACRONYM_WORDS = new Map([
  ['API', 'API'],
  ['APIS', 'APIs'],
  ['CSV', 'CSV'],
  ['HTML', 'HTML'],
  ['ID', 'ID'],
  ['IDS', 'IDs'],
  ['JSON', 'JSON'],
  ['OG', 'OG'],
  ['PDF', 'PDF'],
  ['REGEX', 'Regex'],
  ['SEO', 'SEO'],
  ['SERP', 'SERP'],
  ['SQL', 'SQL'],
  ['TSV', 'TSV'],
  ['URL', 'URL'],
  ['URLS', 'URLs'],
  ['UUID', 'UUID']
]);

const SHORT_ACTION_OVERRIDES = {
  'case-converter': 'Convert text case',
  'base64-encoder': 'Encode and decode Base64',
  'comma-to-newline': 'Convert commas to new lines',
  'count-unique-words': 'Count unique words',
  'duplicate-line-remover': 'Remove duplicate lines',
  'json-validator': 'Check JSON syntax',
  'line-counter': 'Count lines in text',
  'meta-description-checker': 'Check meta description length',
  'newline-to-comma': 'Convert lines to commas',
  'number-lines': 'Add line numbers',
  'paragraph-counter': 'Count paragraphs in text',
  'regex-tester': 'Test regular expressions',
  'remove-url-parameters': 'Remove URL parameters',
  'sentence-counter': 'Count sentences in text',
  'text-diff': 'Compare text side by side',
  'text-reverser': 'Reverse text',
  'title-tag-checker': 'Check SEO title length',
  'timestamp-converter': 'Convert Unix timestamps',
  'trim-lines': 'Trim whitespace on each line',
  'trim-text': 'Trim leading and trailing spaces',
  'word-frequency': 'Analyze word frequency',
  'extract-links-from-html': 'Extract links from HTML',
  'extract-meta-tags': 'Extract title, canonical, and meta tags'
};

const TRAILING_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
  'without'
]);

function plainToolName(tool) {
  return String(tool.name || tool.title || tool.slug || 'Tool').replace(/\s+Tool$/i, '').trim();
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function cleanText(text = '') {
  return String(text)
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function cleanClause(text = '') {
  return cleanText(text)
    .replace(/[,:;/-]+$/g, '')
    .trim();
}

function trimTrailingStopWords(text = '') {
  let words = cleanClause(text).split(/\s+/).filter(Boolean);
  while (words.length) {
    const lastWord = words[words.length - 1].replace(/[^A-Za-z0-9/-]+$/g, '').toLowerCase();
    if (!TRAILING_STOP_WORDS.has(lastWord)) break;
    words = words.slice(0, -1);
  }
  return cleanClause(words.join(' '));
}

function truncateAtWordBoundary(text, maxLength) {
  const normalized = cleanClause(text);
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;

  let shortened = normalized.slice(0, maxLength);
  shortened = shortened.replace(/\s+\S*$/g, '');
  shortened = trimTrailingStopWords(shortened);

  if (!shortened) {
    shortened = trimTrailingStopWords(normalized.slice(0, maxLength));
  }

  return cleanClause(shortened);
}

function toTitlePhrase(text) {
  return String(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const normalized = word.replace(/[^A-Za-z0-9/-]/g, '');
      const upper = normalized.toUpperCase();
      const acronym = ACRONYM_WORDS.get(upper);

      if (acronym) {
        return word.replace(normalized, acronym);
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
  return cleanClause(text.charAt(0).toUpperCase() + text.slice(1));
}

function pushUnique(candidates, text) {
  const value = cleanClause(text);
  if (!value) return;
  if (!candidates.includes(value)) {
    candidates.push(value);
  }
}

function buildActionCandidates(tool) {
  const candidates = [];
  const override = SHORT_ACTION_OVERRIDES[tool.slug];
  const action = buildActionClause(tool);
  const description = cleanClause(String(tool.description || '').replace(/\.$/, ''));

  if (override) pushUnique(candidates, override);
  pushUnique(candidates, action);

  if (action) {
    pushUnique(candidates, action.replace(/\s+and\s+(?:return|show|review|check)\b[\s\S]*$/i, ''));
    pushUnique(candidates, action.replace(/\s+in a focused browser workflow$/i, ''));
    pushUnique(candidates, action.replace(/\s+in one place$/i, ''));
    pushUnique(candidates, action.replace(/\s+(?:instantly|quickly|easily)$/i, ''));
    pushUnique(candidates, action.split(',')[0]);
    pushUnique(candidates, action.replace(/\s+and\s+.*$/i, ''));
  }

  if (description && description !== action) {
    pushUnique(candidates, description.split(',')[0]);
    pushUnique(candidates, description.replace(/\s+and\s+.*$/i, ''));
  }

  return candidates.map(trimTrailingStopWords).filter(Boolean);
}

function buildSeoTitle(tool) {
  if (tool.seoTitle) return tool.seoTitle;

  const head = cleanClause(buildTitleHead(tool));
  const maxTitleLength = 68;

  if (head.length >= maxTitleLength) {
    return truncateAtWordBoundary(head, maxTitleLength) || truncate(head, maxTitleLength);
  }

  const maxActionLength = maxTitleLength - head.length - 3;
  const actionCandidates = buildActionCandidates(tool);

  for (const candidate of actionCandidates) {
    if (candidate.length <= maxActionLength) {
      return `${head} - ${candidate}`;
    }
  }

  for (const candidate of actionCandidates) {
    const shortened = truncateAtWordBoundary(candidate, maxActionLength);
    if (shortened && !isIncompleteTitleFragment(shortened)) {
      return `${head} - ${shortened}`;
    }
  }

  return head;
}

function buildSeoDescription(tool) {
  if (tool.seoDescription) return tool.seoDescription;

  const source = String(tool.intro || tool.description || `Use this free online ${plainToolName(tool)} tool in your browser.`).trim();
  const withPeriod = /[.!?]$/.test(source) ? source : `${source}.`;
  const branded = withPeriod.length < 132 ? `${withPeriod} Free browser tool on ${SITE_NAME}.` : withPeriod;

  return truncate(branded, 158);
}

function isIncompleteTitleFragment(text = '') {
  const normalized = cleanClause(text);
  if (!normalized) return true;
  if (/[,:;/-]$/.test(normalized)) return true;

  const lastWord = normalized.split(/\s+/).pop().replace(/[^A-Za-z0-9/-]+$/g, '').toLowerCase();
  return TRAILING_STOP_WORDS.has(lastWord);
}

module.exports = {
  SITE_NAME,
  buildSeoDescription,
  buildSeoTitle,
  isIncompleteTitleFragment
};
