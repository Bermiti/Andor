#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'app');
const REPORT_JSON = path.join(ROOT, 'reports', 'itinerary-eval-report.json');

function walk(dir, extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.css'])) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, extensions));
    } else if (extensions.has(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function fail(failures, message) {
  failures.push(message);
}

function checkPackage(failures) {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(read(pkgPath));
  if (!pkg.scripts?.build) fail(failures, 'package.json missing build script');
  if (!pkg.scripts?.['test:e2e']) fail(failures, 'package.json missing test:e2e script');
  if (!pkg.scripts?.['eval:itineraries']) fail(failures, 'package.json missing eval:itineraries script');
  if (!pkg.scripts?.['check:launch']) fail(failures, 'package.json missing check:launch script');
}

function checkDocs(failures) {
  const checklist = path.join(ROOT, 'LAUNCH_CHECKLIST.md');
  if (!fs.existsSync(checklist)) {
    fail(failures, 'LAUNCH_CHECKLIST.md is missing');
    return;
  }
  const text = read(checklist);
  ['GROQ_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'ANTHROPIC_API_KEY'].forEach((envVar) => {
    if (!text.includes(envVar)) fail(failures, `LAUNCH_CHECKLIST.md does not document ${envVar}`);
  });
}

function checkAppStatic(failures) {
  const files = walk(APP_DIR);
  const forbidden = [
    ['console.log', /console\.log\s*\(/],
    ['alert(', /\balert\s*\(/],
    ['confirm(', /\bconfirm\s*\(/],
    ['TODO', /\bTODO\b/],
    ['Explore Tokyo', /Explore Tokyo/i],
    ['empty src', /\bsrc\s*=\s*["']["']/],
    ['href="#"', /\bhref\s*=\s*["']#["']/],
  ];

  for (const file of files) {
    const text = read(file);
    forbidden.forEach(([label, pattern]) => {
      if (pattern.test(text)) fail(failures, `${rel(file)} contains ${label}`);
    });

    const blankLinks = text.match(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gs) || [];
    blankLinks.forEach((tag) => {
      if (!/rel\s*=\s*["'][^"']*\bnoopener\b[^"']*\bnoreferrer\b[^"']*["']/.test(tag)) {
        fail(failures, `${rel(file)} has target="_blank" without rel="noopener noreferrer"`);
      }
    });
  }
}

function runFixtureEval(failures) {
  const result = spawnSync(process.execPath, ['scripts/eval-itineraries.js', '--fixtures', '--quiet'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    fail(failures, 'Fixture itinerary evaluation failed');
    return;
  }
  if (!fs.existsSync(REPORT_JSON)) {
    fail(failures, 'Itinerary eval report JSON was not written');
    return;
  }
  const report = JSON.parse(read(REPORT_JSON));
  if (!Array.isArray(report.results) || report.results.some((item) => !item.passed)) {
    fail(failures, 'Itinerary eval report contains failing destinations');
  }
}

function main() {
  const failures = [];
  checkPackage(failures);
  checkDocs(failures);
  checkAppStatic(failures);
  runFixtureEval(failures);

  if (failures.length > 0) {
    process.stderr.write('Launch check failed:\n');
    failures.forEach((failure) => process.stderr.write(`- ${failure}\n`));
    process.exit(1);
  }

  process.stdout.write('Launch check passed: scripts, docs, static checks, and fixture eval are clean.\n');
}

main();
