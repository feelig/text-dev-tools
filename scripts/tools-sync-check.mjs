import fs from 'fs';
import path from 'path';

const TOOLS_JSON_PATH = path.resolve('data/tools.json');
const TOOLS_DIR = path.resolve('tools');
const REPORT_PATH = path.resolve('test-results/tools-sync-check.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function getJsonTools() {
  const data = readJson(TOOLS_JSON_PATH);
  return data
    .filter(item => item && item.slug)
    .map(item => ({
      slug: item.slug,
      status: item.status || 'unknown',
      title: item.title || '',
      primaryCategory: item.primaryCategory || '',
      secondaryCategory: item.secondaryCategory || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));
}

function getFileTools() {
  if (!fs.existsSync(TOOLS_DIR)) return [];
  const entries = fs.readdirSync(TOOLS_DIR, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const slug = entry.name;
      const filePath = path.join(TOOLS_DIR, slug, 'index.html');
      return {
        slug,
        hasPage: fs.existsSync(filePath),
        filePath
      };
    })
    .filter(item => item.hasPage);
}

function main() {
  const jsonTools = getJsonTools();
  const fileTools = getFileTools();

  const jsonMap = new Map(jsonTools.map(t => [t.slug, t]));
  const fileMap = new Map(fileTools.map(t => [t.slug, t]));

  const missingPages = [];
  const orphanPages = [];
  const plannedButPageExists = [];
  const liveButPageMissing = [];
  const activeButPageMissing = [];
  const unknownStatusButPageExists = [];
  const missingTaxonomy = [];

  for (const tool of jsonTools) {
    const hasPage = fileMap.has(tool.slug);

    if (!tool.primaryCategory || !tool.secondaryCategory || !tool.tags.length) {
      missingTaxonomy.push({
        slug: tool.slug,
        primaryCategory: tool.primaryCategory,
        secondaryCategory: tool.secondaryCategory,
        tagsCount: tool.tags.length
      });
    }

    if (!hasPage) {
      missingPages.push({
        slug: tool.slug,
        status: tool.status,
        title: tool.title
      });

      if (tool.status === 'live') {
        liveButPageMissing.push(tool.slug);
      }
      if (tool.status === 'active') {
        activeButPageMissing.push(tool.slug);
      }
    }

    if (hasPage && tool.status === 'planned') {
      plannedButPageExists.push(tool.slug);
    }

    if (hasPage && !['planned', 'live', 'active', 'beta'].includes(tool.status)) {
      unknownStatusButPageExists.push({
        slug: tool.slug,
        status: tool.status
      });
    }
  }

  for (const page of fileTools) {
    if (!jsonMap.has(page.slug)) {
      orphanPages.push(page.slug);
    }
  }

  const report = {
    summary: {
      jsonTools: jsonTools.length,
      pageTools: fileTools.length,
      missingPagesCount: missingPages.length,
      orphanPagesCount: orphanPages.length,
      plannedButPageExistsCount: plannedButPageExists.length,
      liveButPageMissingCount: liveButPageMissing.length,
      activeButPageMissingCount: activeButPageMissing.length,
      unknownStatusButPageExistsCount: unknownStatusButPageExists.length,
      missingTaxonomyCount: missingTaxonomy.length
    },
    missingPages,
    orphanPages,
    plannedButPageExists,
    liveButPageMissing,
    activeButPageMissing,
    unknownStatusButPageExists,
    missingTaxonomy
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log('===== TOOLS SYNC CHECK =====');
  console.log(`JSON tools: ${report.summary.jsonTools}`);
  console.log(`Page tools: ${report.summary.pageTools}`);
  console.log(`Missing pages: ${report.summary.missingPagesCount}`);
  console.log(`Orphan pages: ${report.summary.orphanPagesCount}`);
  console.log(`planned but page exists: ${report.summary.plannedButPageExistsCount}`);
  console.log(`live but page missing: ${report.summary.liveButPageMissingCount}`);
  console.log(`active but page missing: ${report.summary.activeButPageMissingCount}`);
  console.log(`unknown status but page exists: ${report.summary.unknownStatusButPageExistsCount}`);
  console.log(`missing taxonomy: ${report.summary.missingTaxonomyCount}`);

  if (missingPages.length) {
    console.log('\nMissing pages:');
    for (const item of missingPages) {
      console.log(`- ${item.slug} [status=${item.status}]`);
    }
  }

  if (orphanPages.length) {
    console.log('\nOrphan pages (page exists, JSON missing):');
    for (const slug of orphanPages) {
      console.log(`- ${slug}`);
    }
  }

  if (plannedButPageExists.length) {
    console.log('\nPlanned but page exists:');
    for (const slug of plannedButPageExists) {
      console.log(`- ${slug}`);
    }
  }

  if (liveButPageMissing.length) {
    console.log('\nLive but page missing:');
    for (const slug of liveButPageMissing) {
      console.log(`- ${slug}`);
    }
  }

  if (activeButPageMissing.length) {
    console.log('\nActive but page missing:');
    for (const slug of activeButPageMissing) {
      console.log(`- ${slug}`);
    }
  }

  if (unknownStatusButPageExists.length) {
    console.log('\nUnknown status but page exists:');
    for (const item of unknownStatusButPageExists) {
      console.log(`- ${item.slug} [status=${item.status}]`);
    }
  }

  if (missingTaxonomy.length) {
    console.log('\nMissing taxonomy:');
    for (const item of missingTaxonomy) {
      console.log(`- ${item.slug} [primary=${item.primaryCategory || 'missing'}, secondary=${item.secondaryCategory || 'missing'}, tags=${item.tagsCount}]`);
    }
  }

  console.log(`\nSaved report: ${REPORT_PATH}`);

  if (missingPages.length || orphanPages.length || liveButPageMissing.length || activeButPageMissing.length || missingTaxonomy.length) {
    process.exit(1);
  }
}

main();
