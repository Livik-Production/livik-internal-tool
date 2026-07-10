export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get('id');

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
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
      // Then inside your GET function where you configure Vercel production:
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        // Provide the direct GitHub release URL to the exact matching version
        executablePath: await chromium.executablePath(
          'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
        ),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    }

    const page = await browser.newPage();
    // Ensure viewport matches the invoice container used in the app (794px width)
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });
    // Emulate print media so CSS print rules are applied
    await page.emulateMediaType('print');

    // Use the request host to construct the absolute URL
    const host = request.headers.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const invoiceUrl = `${protocol}://${host}/invoice/${invoiceId}`;

    await page.goto(invoiceUrl, {
      waitUntil: 'load', // Wait for the page and images to load. (networkidle times out due to Next.js HMR websockets)
      timeout: 30000,
    });

    // Inject CSS to force uniform border color before PDF generation
    await page.addStyleTag({
      content: `
        * {
          border-color: #000000 !important;
          outline-color: #000000 !important;
        }
        
        [class*="border-"] {
          border-color: #000000 !important;
        }
        
        svg, svg * {
          stroke: #000000 !important;
        }
      `,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true, // respects @page CSS rules
      // Use 1.0 scale to avoid fractional-pixel scaling which can misalign 0.5px borders
      scale: 1,
      margin: {
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
      },
    });

    await browser.close();

    // Use standard Response for raw binary buffers to prevent Next.js from corrupting it
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Puppeteer PDF generation error:', error);
    return new Response('Failed to generate PDF: ' + error.message, {
      status: 500,
    });
  }
}
