const fs = require('fs');
const path = require('path');

const root = process.cwd();
const toolsPath = path.join(root, 'data', 'tools.json');
const {
  PRIMARY_CATEGORY_DEFINITIONS,
  SECONDARY_CATEGORY_DEFINITIONS,
  TOOL_TAXONOMY
} = require('./tool-taxonomy');

const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

const updatedTools = tools.map((tool) => {
  const taxonomy = TOOL_TAXONOMY[tool.slug];
  if (!taxonomy) {
    throw new Error(`Missing taxonomy for slug: ${tool.slug}`);
  }

  if (!PRIMARY_CATEGORY_DEFINITIONS[taxonomy.primaryCategory]) {
    throw new Error(`Unknown primary category "${taxonomy.primaryCategory}" for ${tool.slug}`);
  }

  if (!SECONDARY_CATEGORY_DEFINITIONS[taxonomy.secondaryCategory]) {
    throw new Error(`Unknown secondary category "${taxonomy.secondaryCategory}" for ${tool.slug}`);
  }

  const tags = Array.from(new Set((taxonomy.tags || []).filter(Boolean)));
  if (!tags.length) {
    throw new Error(`Missing tags for slug: ${tool.slug}`);
  }

  return {
    ...tool,
    primaryCategory: taxonomy.primaryCategory,
    secondaryCategory: taxonomy.secondaryCategory,
    tags
  };
});

fs.writeFileSync(toolsPath, `${JSON.stringify(updatedTools, null, 2)}\n`, 'utf8');

console.log(`Updated taxonomy fields for ${updatedTools.length} tools.`);
