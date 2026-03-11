const { execSync } = require('child_process');

const steps = [
  'node scripts/apply-tool-seo.js',
  'node scripts/apply-tool-related.js',
  'node scripts/apply-tool-faq-schema.js',
  'node scripts/apply-tool-intro.js',
  'node scripts/apply-tool-howto.js',
  'node scripts/apply-tool-use-cases.js',
  'node scripts/apply-tool-examples.js',
  'node scripts/cleanup-tool-content.js'
];

for (const step of steps) {
  console.log(`\n>>> ${step}`);
  execSync(step, { stdio: 'inherit' });
}

console.log('\n✅ Tool page build pipeline completed');
