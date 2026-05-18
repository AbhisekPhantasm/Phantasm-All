import * as fs from 'fs';
import * as path from 'path';

/**
 * inject-allure-styles.ts
 * ──────────────────────────────────────────────────────────
 * Injects custom CSS into all HTML files within the Allure
 * report directory so screenshots and videos display at
 * full width.
 * ──────────────────────────────────────────────────────────
 */

const REPORT_DIR = path.join(__dirname, 'allure-report');
const CSS_FILE = path.join(__dirname, 'allure-custom-styles.css');
const MARKER = '/* Allure Custom Styles for Full Width Media */';

function injectIntoHtml(htmlPath: string, cssContent: string) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  if (html.includes(MARKER)) {
    console.log(`  ℹ️  Already injected: ${path.basename(htmlPath)}`);
    return;
  }

  const styleTag = `<style>\n${MARKER}\n${cssContent}\n</style>`;

  if (html.includes('</head>')) {
    html = html.replace('</head>', `${styleTag}\n</head>`);
  } else {
    // Fallback: prepend to body
    html = styleTag + '\n' + html;
  }

  fs.writeFileSync(htmlPath, html);
  console.log(`  ✅ Injected into: ${path.basename(htmlPath)}`);
}

// ── Main ──────────────────────────────────────────────────

if (!fs.existsSync(CSS_FILE)) {
  console.error(`❌ CSS file not found: ${CSS_FILE}`);
  process.exit(1);
}

if (!fs.existsSync(REPORT_DIR)) {
  console.error(`❌ Allure report directory not found: ${REPORT_DIR}`);
  console.log('   Run "allure generate allure-results --clean -o allure-report" first.');
  process.exit(1);
}

const css = fs.readFileSync(CSS_FILE, 'utf8');
let injected = 0;

// Find all HTML files in the report directory (recursively)
function flattenReport(dir: string) {
  const awesomeDir = path.join(dir, 'awesome');
  const allure2Dir = path.join(dir, 'allure2');
  
  const sourceDir = fs.existsSync(awesomeDir) ? awesomeDir : (fs.existsSync(allure2Dir) ? allure2Dir : null);
  
  if (sourceDir) {
    console.log(`  📂 Flattening report from ${path.basename(sourceDir)}...`);
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      const src = path.join(sourceDir, file);
      const dest = path.join(dir, file);
      if (fs.existsSync(dest)) {
        if (fs.lstatSync(dest).isDirectory()) {
          // Merge directories if needed (basic implementation)
          const subFiles = fs.readdirSync(src);
          for (const subFile of subFiles) {
            fs.renameSync(path.join(src, subFile), path.join(dest, subFile));
          }
        } else {
          fs.unlinkSync(dest);
          fs.renameSync(src, dest);
        }
      } else {
        fs.renameSync(src, dest);
      }
    }
    fs.rmdirSync(sourceDir, { recursive: true });
  }
}

function walkDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.html')) {
      injectIntoHtml(fullPath, css);
      injected++;
    }
  }
}

flattenReport(REPORT_DIR);
walkDir(REPORT_DIR);
console.log(`\n✅ Done! Injected custom styles into ${injected} HTML file(s).`);
