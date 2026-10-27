// Ad-hoc Chrome DevTools Protocol smoke check. This is not the required Playwright suite.
// Start Edge/Chromium with remote debugging, then run this file from the repo root.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const debugUrl = process.env.CHROME_DEBUG_URL || 'http://127.0.0.1:9222';
const baseUrl = process.env.DATEMARK_BASE_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve('artifacts', 'chromium-smoke');
fs.mkdirSync(outputDir, { recursive: true });

async function pause(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function main() {
  const targetsResponse = await fetch(`${debugUrl}/json/list`);
  assert.equal(targetsResponse.status, 200, 'Chromium DevTools endpoint is reachable');
  const targets = await targetsResponse.json();
  const page = targets.find(target => target.type === 'page');
  assert.ok(page, 'a browser page target exists');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  let nextId = 0;
  const pending = new Map();
  const externalRequests = [];
  const failedRequests = [];
  const consoleErrors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result || {});
      return;
    }
    if (message.method === 'Network.requestWillBeSent') {
      const url = message.params.request.url;
      if (!url.startsWith(baseUrl)) externalRequests.push(url);
    }
    if (message.method === 'Network.loadingFailed') failedRequests.push(`${message.params.errorText}`);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') consoleErrors.push(message.params.args.map(arg => arg.value || arg.description || '').join(' '));
  });
  function send(method, params = {}) {
    const id = ++nextId;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
    return result.result?.value;
  }
  async function waitFor(expression, timeoutMs = 5000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (await evaluate(expression)) return;
      await pause(100);
    }
    throw new Error(`Timed out waiting for ${expression}`);
  }
  function saveScreenshot(file) {
    return send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
      .then(result => fs.writeFileSync(path.join(outputDir, file), Buffer.from(result.data, 'base64')));
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: outputDir });
  await send('Page.navigate', { url: baseUrl });
  await waitFor("document.readyState === 'complete' && document.title.includes('DateMark')");
  assert.equal(await evaluate("document.querySelector('h1')?.innerText"), 'Every deadline.\nWith its source attached.');
  await saveScreenshot('landing.png');

  // This is the real, published event deadline sentence; it is not a seeded product record.
  const source = 'Submissions close November 20, 2026 at 5:00 PM Eastern Time.';
  const sourceLiteral = JSON.stringify(source);
  await evaluate(`document.querySelector('#source-text').value = ${sourceLiteral}; document.querySelector('#source-text').dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#find-dates').click()`);
  await waitFor("document.querySelectorAll('.candidate').length === 1");
  const candidate = await evaluate(`({quote:document.querySelector('.quote-text').textContent, date:document.querySelector('[data-field=date]').value, state:document.querySelector('.state-badge').textContent})`);
  assert.deepEqual(candidate, { quote: source, date: '2026-11-20', state: 'Review this date' });
  await evaluate("document.querySelector('[data-action=confirm]').click()");
  await waitFor("document.querySelector('.candidate .state-badge')?.textContent === 'Confirmed' && !document.querySelector('#export-ics').disabled");
  await saveScreenshot('confirmed-source-line.png');

  await evaluate("document.querySelector('#export-ics').click()");
  let downloadPath;
  for (let attempt = 0; attempt < 50; attempt++) {
    const file = fs.readdirSync(outputDir).find(name => name.endsWith('.ics'));
    if (file) { downloadPath = path.join(outputDir, file); break; }
    await pause(100);
  }
  assert.ok(downloadPath, 'browser generated an actual .ics download');
  const ics = fs.readFileSync(downloadPath, 'utf8');
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261120/);
  assert.match(ics, /SUMMARY:Submissions close November 20\\, 2026 at 5:00 PM Eastern Time\./);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1);

  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const mobile = await evaluate("({width:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth, transition:getComputedStyle(document.querySelector('#find-dates')).transitionDuration})");
  assert.ok(mobile.scroll <= mobile.width, `mobile page has no horizontal overflow: ${JSON.stringify(mobile)}`);
  assert.ok(mobile.transition.split(',').every(value => Number.parseFloat(value) === 0), `reduced motion disables transitions: ${JSON.stringify(mobile)}`);

  await send('Page.reload', { ignoreCache: true });
  await waitFor("document.readyState === 'complete' && document.title.includes('DateMark')");
  const cleared = await evaluate("({source:document.querySelector('#source-text').value, candidates:document.querySelectorAll('.candidate').length, exportDisabled:document.querySelector('#export-ics').disabled})");
  assert.deepEqual(cleared, { source: '', candidates: 0, exportDisabled: true });
  assert.deepEqual(externalRequests, [], 'no off-origin browser requests occurred');
  assert.deepEqual(failedRequests, [], 'no network requests failed');
  assert.deepEqual(consoleErrors, [], 'browser console contains no errors');

  console.log(JSON.stringify({ browser: page.browserContextId || 'Chromium DevTools target', target: page.url, candidate, icsEvents: 1, mobile, cleared, externalRequests, failedRequests, consoleErrors, screenshots: ['artifacts/chromium-smoke/landing.png', 'artifacts/chromium-smoke/confirmed-source-line.png'], icsFile: path.relative(process.cwd(), downloadPath) }, null, 2));
  ws.close();
}

main().catch(error => { console.error(error); process.exitCode = 1; });
