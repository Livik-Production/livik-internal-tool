export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const quotationId = searchParams.get('id');

  if (!quotationId) {
    return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400 });
  }

  try {
    let browser;
    // For local development, we use standard puppeteer
    if (process.env.NODE_ENV === 'development') {
      const puppeteerDev = (await import('puppeteer')).default;
      browser = await puppeteerDev.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } else {
      // In Vercel production, use @sparticuz/chromium which fetches a serverless-friendly binary
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(
          'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
        ),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    }

    const page = await browser.newPage();
    // Ensure viewport matches the quotation container used in the app (794px width)
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    // Emulate print media so CSS print rules are applied
    await page.emulateMediaType('print');

    // Use the request host to construct the absolute URL
    const host = request.headers.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const quotationUrl = `${protocol}://${host}/quotation/${quotationId}`;

    await page.goto(quotationUrl, {
      waitUntil: 'load',
      timeout: 30000,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      scale: 1,
    });

    await browser.close();

    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quotation-${quotationId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Puppeteer PDF generation error:', error);
    return new Response('Failed to generate PDF: ' + error.message, {
      status: 500,
    });
  }
}
