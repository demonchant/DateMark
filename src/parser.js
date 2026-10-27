/* Deterministic, local date candidate parser. No network or model calls. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DateMarkParser = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_CHARS = 40000;
  const CONTEXT = /\b(due|deadlines?|submit|submissions?|exams?|tests?|quizzes?|midterms?|finals?|assignments?|projects?|essays?|reports?|labs?|presentations?|papers?|homework|worksheets?|reading responses?)\b/i;
  const MONTHS = {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
    may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
    september: 9, sept: 9, sep: 9, october: 10, oct: 10, november: 11, nov: 11,
    december: 12, dec: 12
  };
  const MONTH_NAMES = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');

  function validDate(year, month, day) {
    if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) return false;
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
  }

  function parseDateTokens(line, fallbackYear) {
    const matches = [];
    const patterns = [
      { regex: new RegExp(`\\b(${MONTH_NAMES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, 'gi'), order: 'month' },
      { regex: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_NAMES})\\.?[,]?\\s*(\\d{4})?\\b`, 'gi'), order: 'day' },
      { regex: /\b(20\d{2})-(\d{2})-(\d{2})\b/g, order: 'iso' }
    ];
    for (const p of patterns) {
      p.regex.lastIndex = 0;
      let m;
      while ((m = p.regex.exec(line)) !== null) {
        let year, month, day, hasYear;
        if (p.order === 'month') {
          month = MONTHS[m[1].toLowerCase().replace('.', '')]; day = Number(m[2]); year = m[3] ? Number(m[3]) : null; hasYear = Boolean(m[3]);
        } else if (p.order === 'day') {
          day = Number(m[1]); month = MONTHS[m[2].toLowerCase().replace('.', '')]; year = m[3] ? Number(m[3]) : null; hasYear = Boolean(m[3]);
        } else {
          year = Number(m[1]); month = Number(m[2]); day = Number(m[3]); hasYear = true;
        }
        const effectiveYear = year || fallbackYear || null;
        matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], year, month, day, hasYear, effectiveYear,
          valid: effectiveYear !== null && validDate(effectiveYear, month, day) });
      }
    }
    matches.sort((a, b) => a.start - b.start || a.end - b.end);
    // Overlapping patterns should not create duplicate events.
    return matches.filter((item, i) => !matches.slice(0, i).some(prev => item.start < prev.end && prev.start < item.end));
  }

  function parse(text, options = {}) {
    if (typeof text !== 'string') throw new TypeError('Course text must be a string.');
    if (text.length > MAX_CHARS) throw new RangeError(`Text is limited to ${MAX_CHARS.toLocaleString()} characters.`);
    const fallbackYear = options.year == null || options.year === '' ? null : Number(options.year);
    if (fallbackYear !== null && (!Number.isInteger(fallbackYear) || fallbackYear < 2000 || fallbackYear > 2100)) throw new RangeError('Choose a year from 2000 to 2100.');
    const lines = text.split(/\r?\n/);
    const candidates = [];
    let offset = 0;
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const nextBreak = text.startsWith('\r\n', offset + line.length) ? 2 : text[offset + line.length] === '\n' ? 1 : 0;
      if (!CONTEXT.test(line)) { offset += line.length + nextBreak; continue; }
      const dateTokens = parseDateTokens(line, fallbackYear);
      for (const date of dateTokens) {
        const sourceText = line.trim();
        const normalizedLineStart = offset + line.search(/\S|$/);
        const status = !date.valid ? 'unresolved' : date.hasYear ? 'needs_review' : 'year_review';
        const year = date.valid ? date.effectiveYear : null;
        const iso = year ? `${year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}` : '';
        candidates.push({
          id: `line-${index + 1}-date-${date.start}`,
          title: sourceText.length > 100 ? `${sourceText.slice(0, 97)}…` : sourceText,
          date: iso,
          status,
          dateText: date.text,
          sourceText,
          line: index + 1,
          sourceStart: normalizedLineStart,
          sourceEnd: normalizedLineStart + sourceText.length,
          reason: !date.valid ? (date.effectiveYear === null ? 'A year is missing. Add a year or edit this date before confirming.' : 'This is not a valid calendar date.')
            : !date.hasYear ? `Year ${year} comes from your setting. Check it against the course source.` : ''
        });
      }
      const numericDates = [...line.matchAll(/\b\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\b/g)];
      for (const [numericIndex, match] of numericDates.entries()) {
        const sourceText = line.trim();
        const normalizedLineStart = offset + line.search(/\S|$/);
        candidates.push({ id: `line-${index + 1}-numeric-${match.index}-${numericIndex}`, title: sourceText.length > 100 ? `${sourceText.slice(0, 97)}…` : sourceText,
          date: '', status: 'unresolved', dateText: match[0], sourceText, line: index + 1, sourceStart: normalizedLineStart, sourceEnd: normalizedLineStart + sourceText.length,
          reason: `“${match[0]}” does not identify a safe month/day order. Check the source, then enter the intended date manually.` });
      }
      if (dateTokens.length === 0 && numericDates.length === 0 && /\b(?:today|tomorrow|yesterday|next\s+\w+|this\s+\w+|end\s+of\s+(?:the\s+)?week|tba|tbd|to be announced)\b/i.test(line)) {
        const sourceText = line.trim();
        const normalizedLineStart = offset + line.search(/\S|$/);
        candidates.push({ id: `line-${index + 1}-relative`, title: sourceText.length > 100 ? `${sourceText.slice(0, 97)}…` : sourceText,
          date: '', status: 'unresolved', dateText: '', sourceText, line: index + 1, sourceStart: normalizedLineStart, sourceEnd: normalizedLineStart + sourceText.length,
          reason: 'This date is relative or unresolved. Check the source and enter a calendar date manually.' });
      }
      offset += line.length + nextBreak;
    }
    return candidates;
  }

  function escapeICS(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }

  function foldICSLine(line) {
    const encoder = new TextEncoder();
    const output = [];
    let current = '', bytes = 0;
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (bytes + size > 75) {
        output.push(current);
        current = ` ${character}`;
        bytes = 1 + size;
      } else {
        current += character;
        bytes += size;
      }
    }
    output.push(current);
    return output;
  }

  function toICS(events, generatedAt = new Date()) {
    if (!Array.isArray(events) || events.length === 0) throw new RangeError('Confirm at least one date before exporting.');
    const stamp = generatedAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DateMark//Evidence-first calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    for (const [index, event] of events.entries()) {
      if (event.status !== 'confirmed' || !/^\d{4}-\d{2}-\d{2}$/.test(event.date)) throw new TypeError('Only confirmed dates can be exported.');
      const [year, month, day] = event.date.split('-').map(Number);
      if (!validDate(year, month, day)) throw new TypeError('An event has an invalid calendar date.');
      const uid = `${event.id || `event-${index + 1}`}@datemark.local`;
      lines.push('BEGIN:VEVENT', `UID:${escapeICS(uid)}`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${event.date.replace(/-/g, '')}`, `SUMMARY:${escapeICS(event.title || event.sourceText || 'Course deadline')}`, `DESCRIPTION:${escapeICS(`Source line ${event.line || ''}: ${event.sourceText || ''}`)}`, 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return `${lines.flatMap(foldICSLine).join('\r\n')}\r\n`;
  }

  return { MAX_CHARS, parse, parseDateTokens, toICS };
});
