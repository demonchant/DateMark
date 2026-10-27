(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const textInput = $('source-text');
  const list = $('candidate-list');
  const form = $('course-name');
  const status = $('status');
  let candidates = [];
  let originalSource = '';

  function announce(message, kind = '') {
    status.textContent = message;
    status.className = `status${kind ? ` status-${kind}` : ''}`;
  }
  function updateCounts() {
    const confirmed = candidates.filter(item => item.status === 'confirmed').length;
    $('candidate-count').textContent = `${candidates.length} found`;
    $('confirmed-count').textContent = confirmed;
    $('export-ics').disabled = confirmed === 0;
    $('empty-state').hidden = candidates.length > 0;
  }
  function make(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content != null) element.textContent = content;
    return element;
  }
  function field(labelText, value, type, key, item, attrs = {}) {
    const wrap = make('label', `field field-${key}`);
    wrap.append(make('span', 'field-label', labelText));
    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') input.type = type;
    input.value = value;
    input.dataset.id = item.id;
    input.dataset.field = key;
    if (attrs.maxLength) input.maxLength = attrs.maxLength;
    if (attrs.required) input.required = true;
    if (attrs.min) input.min = attrs.min;
    if (attrs.max) input.max = attrs.max;
    if (attrs.rows) input.rows = attrs.rows;
    wrap.append(input);
    return wrap;
  }
  function render() {
    list.replaceChildren();
    for (const item of candidates) {
      const card = make('article', `candidate candidate-${item.status}`);
      card.setAttribute('aria-label', `Candidate from line ${item.line}`);
      const head = make('div', 'candidate-top');
      const badgeLabel = item.status === 'confirmed' ? 'Confirmed' : item.status === 'rejected' ? 'Left out' : item.status === 'unresolved' ? 'Needs a date' : item.status === 'year_review' ? 'Check the year' : 'Review this date';
      head.append(make('span', `state-badge state-${item.status}`, badgeLabel));
      head.append(make('span', 'line-ref', `SOURCE LINE ${item.line}`));
      card.append(head);

      const quote = make('blockquote', 'source-quote');
      const quoteLabel = make('span', 'quote-label', 'SOURCE WORDING');
      const quoteText = make('p', 'quote-text');
      quoteText.textContent = item.sourceText;
      quote.append(quoteLabel, quoteText);
      card.append(quote);
      if (item.reason) card.append(make('p', 'candidate-reason', item.reason));

      const fields = make('div', 'candidate-fields');
      fields.append(field('Calendar title', item.title, 'text', 'title', item, { maxLength: 120, required: true }));
      fields.append(field('Date', item.date, 'date', 'date', item, { min: '2000-01-01', max: '2100-12-31', required: true }));
      card.append(fields);

      const actions = make('div', 'candidate-actions');
      const confirm = make('button', 'button button-confirm', item.status === 'confirmed' ? 'Recheck & confirm' : 'Confirm date');
      confirm.type = 'button'; confirm.dataset.action = 'confirm'; confirm.dataset.id = item.id;
      const reject = make('button', 'text-button', item.status === 'rejected' ? 'Review again' : 'Leave out');
      reject.type = 'button'; reject.dataset.action = 'reject'; reject.dataset.id = item.id;
      actions.append(confirm, reject);
      card.append(actions);
      list.append(card);
    }
    updateCounts();
  }

  $('source-text').addEventListener('input', () => {
    $('char-count').textContent = `${textInput.value.length.toLocaleString()} / 40,000 characters`;
  });

  $('find-dates').addEventListener('click', () => {
    try {
      originalSource = textInput.value;
      candidates = DateMarkParser.parse(originalSource, { year: $('course-year').value })
        .map(item => ({ ...item, course: form.value.trim(), status: item.status }));
      render();
      if (candidates.length) announce(`Found ${candidates.length} written date${candidates.length === 1 ? '' : 's'}. Check each source line, title, and calendar date before confirming.`, 'info');
      else if (originalSource.trim()) announce('No supported coursework dates found. No calendar events were created. Try explicit English month names or an ISO date on a line with a course deadline.', 'empty');
      else announce('Paste course text first. Nothing was processed.', 'error');
    } catch (error) {
      candidates = [];
      render();
      announce(error.message || 'Could not read that text. No calendar events were created.', 'error');
    }
  });

  list.addEventListener('input', event => {
    const input = event.target;
    if (!input.matches('[data-field]')) return;
    const item = candidates.find(entry => entry.id === input.dataset.id);
    if (!item) return;
    const key = input.dataset.field;
    const wasConfirmed = item.status === 'confirmed';
    item[key] = input.value;
    item.status = 'needs_review';
    const card = input.closest('.candidate');
    card.className = 'candidate candidate-needs_review';
    const badge = card && card.querySelector('.state-badge');
    if (badge) { badge.className = 'state-badge state-needs_review'; badge.textContent = 'Review this date'; }
    if (key === 'date' && input.value) item.reason = '';
    updateCounts();
    if (wasConfirmed) announce('An edit reopened this item for review. Confirm it again before export.', 'info');
  });

  list.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const item = candidates.find(entry => entry.id === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === 'reject') {
      item.status = item.status === 'rejected' ? 'needs_review' : 'rejected';
      render();
      announce(item.status === 'rejected' ? 'This candidate will stay out of your calendar.' : 'Candidate returned to review.', 'info');
      return;
    }
    const card = button.closest('.candidate');
    const title = card.querySelector('[data-field="title"]');
    const date = card.querySelector('[data-field="date"]');
    item.title = title.value.trim(); item.date = date.value;
    if (!title.value.trim()) { title.focus(); announce('Add a calendar title before confirming.', 'error'); return; }
    if (!date.value || !date.validity.valid) { date.focus(); announce('Choose a valid date before confirming. DateMark will not fill in a missing or invalid date.', 'error'); return; }
    item.status = 'confirmed';
    render();
    announce('Confirmed for export. The .ics file contains this all-day date and its source line.', 'success');
  });

  $('export-ics').addEventListener('click', () => {
    const confirmed = candidates.filter(item => item.status === 'confirmed');
    try {
      const content = DateMarkParser.toICS(confirmed);
      const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const safeName = (form.value.trim() || 'course-dates').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'course-dates';
      anchor.download = `${safeName}.ics`;
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      announce(`Calendar file generated with ${confirmed.length} confirmed date${confirmed.length === 1 ? '' : 's'}. Import it into your calendar yourself; DateMark cannot verify that import.`, 'success');
    } catch (error) {
      announce(error.message || 'Calendar file could not be generated.', 'error');
    }
  });
})();
