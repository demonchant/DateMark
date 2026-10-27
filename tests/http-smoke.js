const assert = require('node:assert/strict');

async function main() {
  const base = process.env.DATEMARK_BASE_URL || 'http://127.0.0.1:4173';
  const [pageResponse, dashboardResponse, styleResponse, iconResponse, heroImageResponse, dashboardImageResponse] = await Promise.all([
    fetch(`${base}/`), fetch(`${base}/dashboard.html`), fetch(`${base}/src/styles.css`), fetch(`${base}/src/favicon.svg`),
    fetch(`${base}/assets/minimalist-study-planner-still-life.png`), fetch(`${base}/assets/pastel-study-planner-workspace.png`)
  ]);
  assert.equal(pageResponse.status, 200);
  assert.equal(dashboardResponse.status, 200);
  assert.equal(styleResponse.status, 200);
  assert.equal(iconResponse.status, 200);
  assert.equal(heroImageResponse.status, 200);
  assert.equal(dashboardImageResponse.status, 200);
  const [html, dashboard, css, icon] = await Promise.all([pageResponse.text(), dashboardResponse.text(), styleResponse.text(), iconResponse.text()]);
  assert.match(html, /<title>DateMark/);
  assert.match(html, /href="dashboard\.html"/);
  assert.match(html, /href="#how-it-works"/);
  assert.match(html, /href="#privacy"/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /id="privacy"/);
  assert.doesNotMatch(html, /id="source-text"|id="candidate-list"|id="find-dates"/);
  assert.match(dashboard, /<title>DateMark Dashboard<\/title>/);
  assert.match(dashboard, /id="tool"/);
  assert.match(dashboard, /id="source-text"/);
  assert.match(dashboard, /id="candidate-list"/);
  assert.match(dashboard, /href="index\.html#privacy"/);
  assert.doesNotMatch(html, /src\/(app|parser)\.js/);
  assert.match(dashboard, /src\/app\.js/);
  assert.match(dashboard, /src\/parser\.js/);
  assert.doesNotMatch(`${html}\n${dashboard}`, /October 30, 2026|November 12, 2026|Example format/);
  assert.match(css, /minimalist-study-planner-still-life\.png/);
  assert.match(css, /pastel-study-planner-workspace\.png/);
  assert.doesNotMatch(css, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(icon, /#583c52/);
  assert.equal(iconResponse.headers.get('content-type'), 'image/svg+xml');

  const colors = [...new Set(css.match(/#[0-9a-fA-F]{6}/g) || [])];
  function hue(hex) {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    if (!delta) return 0;
    let h;
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
    return (h + 360) % 360;
  }
  const greenOrBlue = colors.filter(color => hue(color) > 70 && hue(color) < 250);
  assert.deepEqual(greenOrBlue, [], 'palette contains no green or blue hues');
  console.log(JSON.stringify({ homepage: pageResponse.status, dashboard: dashboardResponse.status, stylesheet: styleResponse.status, favicon: iconResponse.status, heroImage: heroImageResponse.status, dashboardImage: dashboardImageResponse.status, landingLinksToDashboard: true, toolLivesOnDashboard: true, noSampleRecords: true, noRemoteFonts: true, noGreenOrBluePalette: true }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
