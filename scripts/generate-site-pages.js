const fs = require('fs');
const path = require('path');

const root = process.cwd();
const publicDir = path.join(root, 'public');
const SITE_URL = 'https://extformattools.com';
const SITE_NAME = 'ExtFormatTools';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function pageTemplate({ title, description, canonical, body, robots = 'noindex,follow' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="${robots}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <style>
    :root{
      --bg:#f6f8fb;
      --card:#ffffff;
      --text:#152033;
      --muted:#5f6f86;
      --border:#d9e2ef;
      --primary:#2563eb;
      --primary-hover:#1d4ed8;
      --shadow:0 10px 30px rgba(15,23,42,.06);
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      background:var(--bg);
      color:var(--text);
      line-height:1.6;
    }
    .container{
      width:min(960px, calc(100% - 32px));
      margin:0 auto;
    }
    .site-header{
      background:#fff;
      border-bottom:1px solid var(--border);
      position:sticky;
      top:0;
      z-index:10;
    }
    .header-inner{
      min-height:64px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
    }
    .brand{
      font-weight:800;
      text-decoration:none;
      color:var(--text);
      letter-spacing:-0.02em;
    }
    .nav{
      display:flex;
      gap:18px;
      flex-wrap:wrap;
    }
    .nav a, .footer-links a{
      color:var(--muted);
      text-decoration:none;
      font-weight:600;
    }
    .nav a:hover, .footer-links a:hover, .brand:hover{
      color:var(--primary);
    }
    .hero{
      padding:48px 0 20px;
    }
    .hero-card, .content-card{
      background:var(--card);
      border:1px solid var(--border);
      border-radius:20px;
      box-shadow:var(--shadow);
      padding:28px;
    }
    h1{
      margin:0 0 12px;
      font-size:clamp(30px, 5vw, 42px);
      line-height:1.1;
      letter-spacing:-0.03em;
    }
    h2{
      margin:0 0 14px;
      font-size:24px;
      line-height:1.2;
      letter-spacing:-0.02em;
    }
    p{
      margin:0 0 14px;
      color:var(--muted);
    }
    .content{
      padding:0 0 48px;
    }
    .content-card + .content-card{
      margin-top:18px;
    }
    ul{
      margin:0;
      padding-left:18px;
      color:var(--muted);
    }
    .site-footer{
      border-top:1px solid var(--border);
      background:#fff;
      margin-top:36px;
    }
    .footer-inner{
      min-height:64px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:16px;
      flex-wrap:wrap;
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/">${SITE_NAME}</a>
      <nav class="nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/text-tools/">Text Tools</a>
        <a href="/developer-tools/">Developer Tools</a>
        <a href="/about/">About</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <div class="hero-card">
          ${body.hero}
        </div>
      </div>
    </section>

    <section class="content">
      <div class="container">
        ${body.sections}
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>© 2026 ${SITE_NAME}</div>
      <div class="footer-links">
        <a href="/about/">About</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
        <a href="/contact/">Contact</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}

const pages = [
  {
    slug: 'about',
    title: 'About ExtFormatTools',
    description: 'Learn about ExtFormatTools and the free browser-based text and developer utilities available on the site.',
    hero: `
      <h1>About ExtFormatTools</h1>
      <p>ExtFormatTools is a growing collection of free browser-based utilities for text cleanup, formatting, conversion, extraction, and developer workflows.</p>
    `,
    sections: `
      <div class="content-card">
        <h2>What this site does</h2>
        <p>This site provides lightweight online tools designed to work quickly without unnecessary friction. The focus is on practical utilities for writers, marketers, students, developers, and operations work.</p>
      </div>
      <div class="content-card">
        <h2>Current tool categories</h2>
        <ul>
          <li>Text tools such as counters, case conversion, sorting, and cleanup tools</li>
          <li>Developer tools such as JSON formatting, regex testing, encoding, and data conversion</li>
        </ul>
      </div>
      <div class="content-card">
        <h2>How the tools work</h2>
        <p>Many tools are designed to run directly in the browser for speed and convenience. The goal is to keep the experience simple, fast, and easy to use on desktop and mobile.</p>
      </div>
    `
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy | ExtFormatTools',
    description: 'Read the privacy policy for ExtFormatTools, including general information about browser-based tools, analytics, and third-party advertising.',
    hero: `
      <h1>Privacy Policy</h1>
      <p>This page explains the general privacy practices for ExtFormatTools.</p>
    `,
    sections: `
      <div class="content-card">
        <h2>General use</h2>
        <p>ExtFormatTools provides browser-based utilities. Tool inputs may be processed locally in the browser depending on the tool implementation.</p>
      </div>
      <div class="content-card">
        <h2>Analytics and logs</h2>
        <p>Like most websites, this site may use basic analytics, performance monitoring, and standard server or platform logs to understand traffic and improve the site.</p>
      </div>
      <div class="content-card">
        <h2>Advertising</h2>
        <p>This site may display third-party advertising in the future, including Google AdSense or similar services. These providers may use cookies or similar technologies subject to their own policies.</p>
      </div>
      <div class="content-card">
        <h2>External links</h2>
        <p>This site may link to third-party websites. Their privacy practices are governed by their own policies, not this one.</p>
      </div>
      <div class="content-card">
        <h2>Policy updates</h2>
        <p>This privacy policy may be updated as the site evolves.</p>
      </div>
    `
  },
  {
    slug: 'terms',
    title: 'Terms of Use | ExtFormatTools',
    description: 'Read the terms of use for ExtFormatTools and the general conditions for using the site.',
    hero: `
      <h1>Terms of Use</h1>
      <p>These terms describe the general conditions for using ExtFormatTools.</p>
    `,
    sections: `
      <div class="content-card">
        <h2>Use of the site</h2>
        <p>You may use the tools and content on this site for general informational and utility purposes. Availability and functionality may change over time.</p>
      </div>
      <div class="content-card">
        <h2>No warranty</h2>
        <p>The site and tools are provided on an as-is basis without guarantees of completeness, accuracy, uptime, or fitness for a particular purpose.</p>
      </div>
      <div class="content-card">
        <h2>User responsibility</h2>
        <p>You are responsible for reviewing any output generated by the tools before relying on it in production, legal, financial, academic, or operational contexts.</p>
      </div>
      <div class="content-card">
        <h2>Third-party services</h2>
        <p>The site may use third-party hosting, analytics, or advertising services. Their operation is governed by their own terms and policies.</p>
      </div>
    `
  },
  {
    slug: 'contact',
    title: 'Contact ExtFormatTools',
    description: 'Contact page for ExtFormatTools feedback, tool suggestions, and future business inquiries.',
    hero: `
      <h1>Contact ExtFormatTools</h1>
      <p>For general questions, feedback, or tool suggestions, use the contact details published for this site.</p>
    `,
    sections: `
      <div class="content-card">
        <h2>Feedback and suggestions</h2>
        <p>If you have ideas for new tools, bug reports, or usability feedback, you can publish a contact email or form here later.</p>
      </div>
      <div class="content-card">
        <h2>Business and partnership inquiries</h2>
        <p>This page can also be used for future advertising, affiliate, or business inquiries.</p>
      </div>
      <div class="content-card">
        <h2>Status</h2>
        <p>This contact page is currently a placeholder page so the site has a complete public-facing structure.</p>
      </div>
    `
  }
];

for (const page of pages) {
  const html = pageTemplate({
    title: page.title,
    description: page.description,
    canonical: `${SITE_URL}/${page.slug}/`,
    body: {
      hero: page.hero,
      sections: page.sections
    }
  });

  for (const baseDir of [root, publicDir]) {
    const dir = path.join(baseDir, page.slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  }

  console.log(`Generated: /${page.slug}/`);
}

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

for (const robotsPath of [path.join(root, 'robots.txt'), path.join(publicDir, 'robots.txt')]) {
  fs.writeFileSync(robotsPath, robots, 'utf8');
}
console.log('Generated: /robots.txt');
