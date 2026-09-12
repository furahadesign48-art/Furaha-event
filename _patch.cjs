const fs = require('fs');
const target = process.argv[2];
const patchFile = process.argv[3];
const startMark = process.argv[4];
const endMark = process.argv[5];

if (!target || !patchFile || !startMark || !endMark) {
  console.error('Usage: node patch.js <target.tsx> <patch.txt> <startMark> <endMark>');
  process.exit(2);
}

let t = fs.readFileSync(target, 'utf8');
const replacement = fs.readFileSync(patchFile, 'utf8');
const start = t.indexOf(startMark);
const end = t.indexOf(endMark);
if (start < 0 || end < 0) { console.error('marks not found in', target, 'start=', start, 'end=', end); process.exit(1); }
const out = t.substring(0, start) + replacement + t.substring(end);
fs.writeFileSync(target, out, 'utf8');
console.log('OK patched', target, 'range', start, '->', end, 'patchlen', replacement.length);
