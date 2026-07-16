const fs = require('fs');
const path = require('path');

// Parse is done with a light regex approach to avoid extra deps.
// Input: JUnit XML from karma-junit-reporter
// Output: SonarQube Generic Test Execution XML
const INPUT  = process.argv[2] || 'reports/TESTS-karma.xml';
const OUTPUT = process.argv[3] || 'reports/sonar-test-execution.xml';

// Map a JUnit <testcase> to a real test file path under sonar.tests.
// Adjust this to your actual test file layout.
function resolvePath(classname, name) {
  const c = (classname || '').toLowerCase();
  if (c.includes('formatter'))  return 'webapp/test/unit/model/formatter.js';
  if (c.includes('view1'))      return 'webapp/test/unit/controller/View1.controller.js';
  if (c.includes('model'))      return 'webapp/test/unit/model/models.js';
  if (c.includes('navigation')) return 'webapp/test/integration/NavigationJourney.js';
  // fallback: a file that definitely exists under sonar.tests
  return 'webapp/test/unit/AllTests.js';
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

const xml = fs.readFileSync(INPUT, 'utf8');

// Extract each <testcase ...>...</testcase> (and self-closing ones)
const caseRe = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
const attrRe = /(\w+)="([^"]*)"/g;

const byFile = {};
let m;
while ((m = caseRe.exec(xml)) !== null) {
  const attrs = {};
  let a;
  while ((a = attrRe.exec(m[1])) !== null) attrs[a[1]] = a[2];
  const inner = m[3] || '';

  const file = resolvePath(attrs.classname, attrs.name);
  const durationMs = Math.round(parseFloat(attrs.time || '0') * 1000);

  const failMatch = inner.match(/<failure\b[^>]*>([\s\S]*?)<\/failure>/);
  const errMatch  = inner.match(/<error\b[^>]*>([\s\S]*?)<\/error>/);

  let body = '';
  if (failMatch) {
    body = `<failure message="test failure">${esc(failMatch[1].trim())}</failure>`;
  } else if (errMatch) {
    body = `<error message="test error">${esc(errMatch[1].trim())}</error>`;
  }

  const tc = body
    ? `    <testCase name="${esc(attrs.name)}" duration="${durationMs}">${body}</testCase>`
    : `    <testCase name="${esc(attrs.name)}" duration="${durationMs}"/>`;

  (byFile[file] = byFile[file] || []).push(tc);
}

let out = '<?xml version="1.0" encoding="UTF-8"?>\n<testExecutions version="1">\n';
for (const file of Object.keys(byFile)) {
  out += `  <file path="${esc(file)}">\n${byFile[file].join('\n')}\n  </file>\n`;
}
out += '</testExecutions>\n';

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, out, 'utf8');
console.log(`Wrote ${OUTPUT} (${Object.keys(byFile).length} files)`);