const test = require('node:test');
const assert = require('node:assert/strict');
const parser = require('../src/parser.js');

test('finds explicit month-name dates only on coursework lines', () => {
  const result = parser.parse([
    'Lab report 2 due October 30, 2026',
    'Campus club meets November 2, 2026',
    'Midterm exam: 2026-11-12'
  ].join('\n'));
  assert.equal(result.length, 2);
  assert.equal(result[0].date, '2026-10-30');
  assert.equal(result[0].status, 'needs_review');
  assert.equal(result[0].sourceText, 'Lab report 2 due October 30, 2026');
  assert.equal(result[1].date, '2026-11-12');
});

test('does not guess a missing year or numeric date order', () => {
  const result = parser.parse('Quiz due Nov 2\nAssignment 4 due 03/04/2026');
  assert.equal(result.length, 2);
  assert.equal(result[0].status, 'unresolved');
  assert.equal(result[0].date, '');
  assert.match(result[1].reason, /does not identify a safe month\/day order/);
});

test('a user-supplied year is explicit and remains review-required', () => {
  const [item] = parser.parse('Quiz due Nov 2', { year: 2026 });
  assert.equal(item.date, '2026-11-02');
  assert.equal(item.status, 'year_review');
  assert.match(item.reason, /Check it against the course source/);
});

test('source offsets remain exact with Windows CRLF line endings', () => {
  const text = 'Heading\r\n  Final exam due May 8, 2027  \r\n';
  const [item] = parser.parse(text);
  assert.equal(text.slice(item.sourceStart, item.sourceEnd), item.sourceText);
  assert.equal(item.line, 2);
});

test('rejects invalid dates and bad input configuration', () => {
  const [item] = parser.parse('Final exam due February 30, 2026');
  assert.equal(item.status, 'unresolved');
  assert.equal(item.date, '');
  assert.throws(() => parser.parse('x'.repeat(parser.MAX_CHARS + 1)), /limited/);
  assert.throws(() => parser.parse('Quiz due Apr 3', { year: 1800 }), /2000 to 2100/);
});

test('ICS export includes only confirmed all-day entries and escapes content', () => {
  const item = { id: 'quiz-1', status: 'confirmed', date: '2026-11-02', title: 'Quiz; 1, final', sourceName: 'BIO 101 syllabus', sourceText: 'Quiz due Nov 2, 2026', line: 1 };
  const ics = parser.toICS([item], new Date('2026-10-27T12:00:00.000Z'));
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261102/);
  assert.match(ics, /SUMMARY:Quiz\\; 1\\, final/);
  assert.match(ics, /DESCRIPTION:Source: BIO 101 syllabus\\; line 1: Quiz due Nov 2\\, 2026/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  assert.throws(() => parser.toICS([{ ...item, status: 'needs_review' }]), /Only confirmed/);
  assert.throws(() => parser.toICS([]), /Confirm at least one/);
});

test('ICS lines are folded at UTF-8 octet limits without splitting characters', () => {
  const event = { id: 'long', status: 'confirmed', date: '2026-11-02', title: `É${'a'.repeat(100)}`, sourceText: `Lab due ${'界'.repeat(40)}`, line: 1 };
  const ics = parser.toICS([event]);
  for (const line of ics.split('\r\n').filter(Boolean)) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `${Buffer.byteLength(line, 'utf8')} octets`);
  assert.match(ics, /\r\n /);
});
