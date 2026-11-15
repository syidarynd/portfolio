#!/usr/bin/env node
import fs from 'node:fs';

const target = 'index.html';
if (!fs.existsSync(target)) {
  console.error('Security audit: index.html not found.');
  process.exit(2);
}
const source = fs.readFileSync(target, 'utf8');
const rules = [
  { id: 'DOM-XSS-INNERHTML', severity: 'HIGH', re: /\\.innerHTML\\s*=/g, message: 'innerHTML assignment: use DOM APIs and textContent for untrusted data.' },
  { id: 'INLINE-EVENT-HANDLER', severity: 'MEDIUM', re: /\\son(?:click|change|input|submit|mouseover|mouseout|error|load)\\s*=/gi, message: 'Inline event handler: register listeners with addEventListener.' },
  { id: 'DANGEROUS-EVAL', severity: 'HIGH', re: /\\b(?:eval\\s*\\(|new\\s+Function\\s*\\()/g, message: 'Dynamic code execution primitive detected.' },
  { id: 'DOCUMENT-WRITE', severity: 'MEDIUM', re: /\\bdocument\\.write\\s*\\(/g, message: 'document.write detected.' }
];
const findings = [];
for (const rule of rules) {
  for (const match of source.matchAll(rule.re)) {
    const offset = match.index ?? 0;
    const line = source.slice(0, offset).split('\\n').length;
    findings.push({ rule: rule.id, severity: rule.severity, line, message: rule.message });
  }
}
const report = {
  scanner: 'portfolio-security-audit',
  file: target,
  scannedAt: new Date().toISOString(),
  findingCount: findings.length,
  counts: Object.fromEntries(['HIGH','MEDIUM','LOW'].map(level => [level, findings.filter(f => f.severity === level).length])),
  findings
};
fs.mkdirSync('security-reports', { recursive: true });
fs.writeFileSync('security-reports/dom-audit.json', JSON.stringify(report, null, 2) + '\\n');
console.log(JSON.stringify(report, null, 2));
if (process.env.STRICT_SECURITY === '1' && findings.length > 0) {
  console.error('Strict security gate failed. Remediate findings before enabling required checks.');
  process.exit(1);
}
