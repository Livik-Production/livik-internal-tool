import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get('id');

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
  }

  try {
    const isLocal = process.env.NODE_ENV === 'development';
    
    let localExecutablePath;
    if (isLocal) {
      const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
      const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      if (fs.existsSync(chromePath)) {
        localExecutablePath = chromePath;
      } else if (fs.existsSync(edgePath)) {
        localExecutablePath = edgePath;
      } else {
        throw new Error('Local browser executable not found. Please install Chrome or Edge.');
      }
    }

    // Launch puppeteer in headless mode
    const browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      executablePath: isLocal ? localExecutablePath : await chromium.executablePath(),
      headless: true,
    });

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
