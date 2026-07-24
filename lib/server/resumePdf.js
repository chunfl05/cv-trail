// Renders an HTML string to a PDF buffer via headless Chrome.
// Locally, uses the full `puppeteer` package (bundles its own Chromium).
// On Vercel/serverless, uses `puppeteer-core` + `@sparticuz/chromium`, which
// ships a Chromium build made for AWS Lambda/Vercel's runtime.
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_VERSION;

async function launchBrowser() {
  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = await import('puppeteer-core');
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  const puppeteer = await import('puppeteer');
  return puppeteer.launch({ headless: true });
}

export async function htmlToPdfBuffer(html) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'letter',
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
