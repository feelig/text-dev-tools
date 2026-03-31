const PRIMARY_CATEGORY_DEFINITIONS = {
  'text-cleanup': {
    label: 'Text Cleanup',
    shortLabel: 'Cleanup',
    root: 'text',
    anchor: 'group-text-cleanup',
    description: 'Whitespace fixes, blank-line cleanup, and quick copy-paste repair.'
  },
  'text-conversion': {
    label: 'Text Conversion',
    shortLabel: 'Conversion',
    root: 'text',
    anchor: 'group-text-conversion',
    description: 'Change text structure, case, line format, or list layout.'
  },
  'text-analysis': {
    label: 'Text Analysis',
    shortLabel: 'Analysis',
    root: 'text',
    anchor: 'group-text-analysis',
    description: 'Count content, measure structure, and inspect vocabulary patterns.'
  },
  'text-extraction': {
    label: 'Extraction Tools',
    shortLabel: 'Extraction',
    root: 'text',
    anchor: 'group-text-extraction',
    description: 'Pull numbers, URLs, and email addresses out of raw text.'
  },
  'data-json': {
    label: 'JSON & Data',
    shortLabel: 'JSON & Data',
    root: 'dev',
    anchor: 'group-data-json',
    description: 'Format, validate, and convert structured data for development work.'
  },
  'encoding-ids': {
    label: 'Encoding & IDs',
    shortLabel: 'Encoding',
    root: 'dev',
    anchor: 'group-encoding-ids',
    description: 'Encode values, generate identifiers, and handle utility output.'
  },
  'developer-formatting': {
    label: 'Developer Formatting',
    shortLabel: 'Formatting',
    root: 'dev',
    anchor: 'group-developer-formatting',
    description: 'Regex, escaping, diffing, and text prep for technical workflows.'
  },
  'time-web': {
    label: 'Time & Web',
    shortLabel: 'Time & Web',
    root: 'dev',
    anchor: 'group-time-web',
    description: 'Timestamp and SEO-facing helpers for URLs and lightweight web work.'
  }
};

const SECONDARY_CATEGORY_DEFINITIONS = {
  'whitespace-cleanup': {
    label: 'Whitespace Cleanup',
    parent: 'text-cleanup'
  },
  'list-cleanup': {
    label: 'List Cleanup',
    parent: 'text-cleanup'
  },
  'text-formatting': {
    label: 'Text Formatting',
    parent: 'text-conversion'
  },
  'list-formatting': {
    label: 'List Formatting',
    parent: 'text-conversion'
  },
  'counting-metrics': {
    label: 'Counting & Metrics',
    parent: 'text-analysis'
  },
  'vocabulary-analysis': {
    label: 'Vocabulary Analysis',
    parent: 'text-analysis'
  },
  'structured-extraction': {
    label: 'Structured Extraction',
    parent: 'text-extraction'
  },
  'json-validation': {
    label: 'JSON Validation',
    parent: 'data-json'
  },
  'data-conversion': {
    label: 'Data Conversion',
    parent: 'data-json'
  },
  'encoding-decoding': {
    label: 'Encoding & Decoding',
    parent: 'encoding-ids'
  },
  'generators': {
    label: 'Generators',
    parent: 'encoding-ids'
  },
  'escaping-testing': {
    label: 'Escaping & Testing',
    parent: 'developer-formatting'
  },
  'comparison-review': {
    label: 'Comparison & Review',
    parent: 'developer-formatting'
  },
  'time-conversion': {
    label: 'Time Conversion',
    parent: 'time-web'
  },
  'web-seo': {
    label: 'Web & SEO',
    parent: 'time-web'
  }
};

const TOOL_TAXONOMY = {
  'remove-line-breaks': {
    primaryCategory: 'text-cleanup',
    secondaryCategory: 'whitespace-cleanup',
    tags: ['cleanup', 'line breaks', 'paragraph', 'copy paste']
  },
  'remove-extra-spaces': {
    primaryCategory: 'text-cleanup',
    secondaryCategory: 'whitespace-cleanup',
    tags: ['cleanup', 'spaces', 'whitespace', 'copy paste']
  },
  'duplicate-line-remover': {
    primaryCategory: 'text-cleanup',
    secondaryCategory: 'list-cleanup',
    tags: ['cleanup', 'duplicates', 'lists', 'dedupe']
  },
  'remove-empty-lines': {
    primaryCategory: 'text-cleanup',
    secondaryCategory: 'whitespace-cleanup',
    tags: ['cleanup', 'blank lines', 'whitespace', 'text prep']
  },
  'remove-blank-lines': {
    primaryCategory: 'text-cleanup',
    secondaryCategory: 'whitespace-cleanup',
    tags: ['cleanup', 'blank lines', 'line cleanup', 'text prep']
  },
  'trim-lines': {
    primaryCategory: 'text-cleanup',
    secondaryCategory: 'whitespace-cleanup',
    tags: ['cleanup', 'trim', 'line cleanup', 'whitespace']
  },
  'trim-text': {
    primaryCategory: 'text-cleanup',
    secondaryCategory: 'whitespace-cleanup',
    tags: ['cleanup', 'trim', 'whitespace', 'copy paste']
  },
  'replace-tabs-with-spaces': {
    primaryCategory: 'text-cleanup',
    secondaryCategory: 'whitespace-cleanup',
    tags: ['cleanup', 'tabs', 'spaces', 'formatting']
  },
  'case-converter': {
    primaryCategory: 'text-conversion',
    secondaryCategory: 'text-formatting',
    tags: ['conversion', 'case', 'uppercase', 'lowercase']
  },
  'text-sorter': {
    primaryCategory: 'text-conversion',
    secondaryCategory: 'list-formatting',
    tags: ['conversion', 'sorting', 'lists', 'alphabetical']
  },
  'text-reverser': {
    primaryCategory: 'text-conversion',
    secondaryCategory: 'text-formatting',
    tags: ['conversion', 'reverse', 'strings', 'formatting']
  },
  'number-lines': {
    primaryCategory: 'text-conversion',
    secondaryCategory: 'list-formatting',
    tags: ['conversion', 'line numbers', 'lists', 'review']
  },
  'add-quotes': {
    primaryCategory: 'text-conversion',
    secondaryCategory: 'text-formatting',
    tags: ['conversion', 'quotes', 'lists', 'code prep']
  },
  'comma-to-newline': {
    primaryCategory: 'text-conversion',
    secondaryCategory: 'list-formatting',
    tags: ['conversion', 'comma separated', 'lists', 'formatting']
  },
  'newline-to-comma': {
    primaryCategory: 'text-conversion',
    secondaryCategory: 'list-formatting',
    tags: ['conversion', 'comma separated', 'lists', 'formatting']
  },
  'word-counter': {
    primaryCategory: 'text-analysis',
    secondaryCategory: 'counting-metrics',
    tags: ['analysis', 'word count', 'characters', 'writing']
  },
  'character-counter': {
    primaryCategory: 'text-analysis',
    secondaryCategory: 'counting-metrics',
    tags: ['analysis', 'character count', 'length', 'writing']
  },
  'paragraph-counter': {
    primaryCategory: 'text-analysis',
    secondaryCategory: 'counting-metrics',
    tags: ['analysis', 'paragraphs', 'structure', 'writing']
  },
  'line-counter': {
    primaryCategory: 'text-analysis',
    secondaryCategory: 'counting-metrics',
    tags: ['analysis', 'lines', 'structure', 'metrics']
  },
  'sentence-counter': {
    primaryCategory: 'text-analysis',
    secondaryCategory: 'counting-metrics',
    tags: ['analysis', 'sentences', 'structure', 'metrics']
  },
  'count-unique-words': {
    primaryCategory: 'text-analysis',
    secondaryCategory: 'vocabulary-analysis',
    tags: ['analysis', 'unique words', 'vocabulary', 'content review']
  },
  'word-frequency': {
    primaryCategory: 'text-analysis',
    secondaryCategory: 'vocabulary-analysis',
    tags: ['analysis', 'word frequency', 'keywords', 'content review']
  },
  'extract-numbers': {
    primaryCategory: 'text-extraction',
    secondaryCategory: 'structured-extraction',
    tags: ['extraction', 'numbers', 'entities', 'data pull']
  },
  'extract-urls': {
    primaryCategory: 'text-extraction',
    secondaryCategory: 'structured-extraction',
    tags: ['extraction', 'urls', 'links', 'data pull']
  },
  'extract-emails': {
    primaryCategory: 'text-extraction',
    secondaryCategory: 'structured-extraction',
    tags: ['extraction', 'emails', 'contacts', 'data pull']
  },
  'json-formatter': {
    primaryCategory: 'data-json',
    secondaryCategory: 'json-validation',
    tags: ['json', 'formatting', 'developer', 'data']
  },
  'json-validator': {
    primaryCategory: 'data-json',
    secondaryCategory: 'json-validation',
    tags: ['json', 'validation', 'developer', 'data']
  },
  'json-to-csv': {
    primaryCategory: 'data-json',
    secondaryCategory: 'data-conversion',
    tags: ['json', 'csv', 'conversion', 'data']
  },
  'csv-to-json': {
    primaryCategory: 'data-json',
    secondaryCategory: 'data-conversion',
    tags: ['csv', 'json', 'conversion', 'data']
  },
  'base64-encoder': {
    primaryCategory: 'encoding-ids',
    secondaryCategory: 'encoding-decoding',
    tags: ['encoding', 'base64', 'developer', 'conversion']
  },
  'url-encoder': {
    primaryCategory: 'encoding-ids',
    secondaryCategory: 'encoding-decoding',
    tags: ['encoding', 'url', 'developer', 'conversion']
  },
  'password-generator': {
    primaryCategory: 'encoding-ids',
    secondaryCategory: 'generators',
    tags: ['generator', 'password', 'security', 'utility']
  },
  'uuid-generator': {
    primaryCategory: 'encoding-ids',
    secondaryCategory: 'generators',
    tags: ['generator', 'uuid', 'ids', 'developer']
  },
  'regex-tester': {
    primaryCategory: 'developer-formatting',
    secondaryCategory: 'escaping-testing',
    tags: ['regex', 'testing', 'developer', 'validation']
  },
  'html-escape': {
    primaryCategory: 'developer-formatting',
    secondaryCategory: 'escaping-testing',
    tags: ['html', 'escape', 'encoding', 'developer']
  },
  'html-unescape': {
    primaryCategory: 'developer-formatting',
    secondaryCategory: 'escaping-testing',
    tags: ['html', 'unescape', 'encoding', 'developer']
  },
  'text-diff': {
    primaryCategory: 'developer-formatting',
    secondaryCategory: 'comparison-review',
    tags: ['diff', 'comparison', 'review', 'developer']
  },
  'timestamp-converter': {
    primaryCategory: 'time-web',
    secondaryCategory: 'time-conversion',
    tags: ['timestamp', 'time', 'date', 'developer']
  },
  'text-to-slug': {
    primaryCategory: 'time-web',
    secondaryCategory: 'web-seo',
    tags: ['slug', 'seo', 'urls', 'web']
  }
};

module.exports = {
  PRIMARY_CATEGORY_DEFINITIONS,
  SECONDARY_CATEGORY_DEFINITIONS,
  TOOL_TAXONOMY
};
