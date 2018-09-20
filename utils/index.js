const puppeteer = require('puppeteer');

module.exports = {
  grabContent,
  printDivider,
  printHtml,
}

// `networkidle` preferences documented in page.goto() documentation here.
// https://github.com/GoogleChrome/puppeteer/blob/811415bc8c47f7882375629b57b3fe186ad61ed4/docs/api.md
function getNetworkIdlePreference(idlePreference) {
  switch(idlePreference) {
    case 0:
      return 'load';
    case 1:
      return 'domcontentloaded';
    case 2:
      return 'networkidle0';
    case 3:
      return 'networkidle2';
    default:
      return 'load';
  }
}

async function grabContent(url, idlePreference = 0) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const prefs = { timeout: 0, waitUntil: getNetworkIdlePreference(idlePreference)};
  await page.goto(url, prefs);
  const content = await page.content();
  browser.close()
  return content;
}

function printDivider() {
  let div = '#'.repeat(60)
  console.log(`\n${div}\n${div}\n${div}\n`);
}

function printHtml(html) {
  html = html.split('<').join('\n<').split('>').join('>\n').split('\n\n').join('\n');
  let lines = html.split('\n');
  let indent = 0;
  for (let i=0; i<lines.length; i++) {
    let line = lines[i];
    if (line.startsWith('</')) {
      indent -= 2;
      console.log(' '.repeat(indent) + line);
    } else if (line.startsWith('<')) {
      console.log(' '.repeat(indent) + line);
      indent += 2;
    } else {
      console.log(' '.repeat(indent) + line);
    }
  }
}
