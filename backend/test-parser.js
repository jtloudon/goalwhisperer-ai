import fs from 'fs';

const content = fs.readFileSync('/Users/jesseloudon/Documents/claude/goals/okr-web-app/personal/plans/2025-week-5-q4.md', 'utf-8');

console.log('Testing action parsing...\n');

console.log('=== Testing original regex ===');
const actionsSection1 = content.match(/## Key Actions This Week\n\n([\s\S]+?)(?=\n\n##|$)/);
console.log('Original regex - Section found:', !!actionsSection1);
if (actionsSection1) console.log('Original regex - Section length:', actionsSection1[1].length);

console.log('\n=== Testing fixed regex ===');
const actionsSection2 = content.match(/## Key Actions This Week\n\n([\s\S]+?)(?=\n## |$)/);
console.log('Fixed regex - Section found:', !!actionsSection2);
if (actionsSection2) console.log('Fixed regex - Section length:', actionsSection2[1].length);

console.log('\n=== Using fixed regex ===');
const actionsSection = actionsSection2;

if (actionsSection) {
  const actionMatches = Array.from(actionsSection[1].matchAll(/### \d+\. (.+)/g));
  console.log('Actions found:', actionMatches.length);
  actionMatches.forEach((m, i) => console.log(`  ${i+1}: ${m[1]}`));
}
