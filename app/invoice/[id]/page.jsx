import PreviewForm from '../../components/Finance/InvoiceTab/PreviewForm';
import { getInvoiceById } from '../../../lib/invoiceService';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';

export default async function InvoicePage({ params }) {
  const { id } = await params;
  const invoiceData = await getInvoiceById(id);

  if (!invoiceData) {
    notFound();
  }

  const companyDetailsRecord = await prisma.companyDetails.findFirst();
  const initialCompanyDetails = companyDetailsRecord ? JSON.parse(JSON.stringify(companyDetailsRecord)) : null;

  // Parse if it was returned as Mongoose document or stringified JSON
  const invoice = JSON.parse(JSON.stringify(invoiceData));

  // The GST-exclusion marker (if present) is packed just before the `||CUR:`
  // currency marker inside each item's description column (no schema change).
  const products = (invoice.items || []).map((i) => {
    const rawDescription = i.description || '';
    const parts = rawDescription.split('||CUR:');
    let description = parts[0] || '';
    const currency = parts[1] || 'INR';
    let gstIncluded = true;
    if (description.endsWith('||GST:0')) {
      gstIncluded = false;
      description = description.slice(0, -'||GST:0'.length);
    }
    return {
      name: i.particular,
      description,
      price: i.amount,
      hsn: i.hsnSacCode,
      currency,
      gstIncluded,
    };
  });

  const subTotal = Number(invoice.subTotal || 0);
  const discountPercent = Number(invoice.discountPercent || 0);
  const discountAmount = (subTotal * discountPercent) / 100;
  const subtotalAfterDiscount = subTotal - discountAmount;

  const gstRate = Number(invoice.taxPercent || 0) / 2;
  // Only GST-included items contribute to the taxable base, matching how the
  // total was originally calculated when the invoice was created.
  const gstTaxableAmount = products.reduce((sum, p) => {
    if (p.gstIncluded === false) return sum;
    return sum + Number(p.price || 0);
  }, 0);

  // Map the DB structure to the structure expected by PreviewForm
  const mappedData = {
    id: invoice.id || invoice._id,
    client: {
      name: invoice.client || invoice.customer?.companyName || 'Client',
      address: invoice.customer?.address1 || invoice.address || 'Address',
      address2: invoice.customer?.address2 || '',
      city: invoice.customer?.city || invoice.city || 'City',
      state: invoice.customer?.state || invoice.state || 'State',
      gst: invoice.customer?.gstnNumber || invoice.gst || '',
      cin: invoice.customer?.cinNumber || invoice.cin || '',
      email: invoice.customer?.email || '',
      mobile: invoice.customer?.mobile || '',
    },
    products,
    totalAmount: subTotal,
    subtotalAfterDiscount,
    discountAmount,
    // The stored total already reflects any GST exclusion (see calcTotals
    // override in lib/invoiceService.js), so it's trusted directly here.
    totalAmountWithGST: Number(invoice.total || 0),
    cgstRate: gstRate,
    sgstRate: gstRate,
    cgstAmount: (gstTaxableAmount * gstRate) / 100,
    sgstAmount: (gstTaxableAmount * gstRate) / 100,
    date: invoice.invoiceDate,
    invoiceNumber: invoice.invoiceNumber,
    invoiceType: invoice.invoiceType,
  };

  return (
    <div
      id="invoice-preview-print"
      className="print:m-0 print:p-0"
      style={{
        width: '794px',
        margin: '0 auto',
        background: '#fff',
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page { size: A4; margin: 0; }

        body {
          background: white !important;
        }

        /* Print-specific adjustments to improve PDF rendering */
        @media print {
          html, body { background: #fff !important; -webkit-print-color-adjust: exact; }

          /* Force exact A4 size wrapper, using padding for margin so browser doesn't scale */
          #invoice-preview-print {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 12mm !important;
            box-sizing: border-box !important;
            transform: none !important;
            zoom: 1 !important;
          }

          /* Make sure elements use box-sizing to avoid subpixel layout shifts */
          #invoice-preview-print, #invoice-preview-print * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            -webkit-text-size-adjust: 100% !important;
            /* Force a single border color for all printable elements */
            border-color: #000000 !important;
            outline-color: #000000 !important;
            stroke: #000000 !important; /* SVG strokes */
            color: inherit !important;
            background-color: transparent !important;
            box-shadow: none !important;
          }

          /* Also ensure pseudo elements and SVG children match the border color */
          #invoice-preview-print *::before,
          #invoice-preview-print *::after,
          #invoice-preview-print svg,
          #invoice-preview-print svg * {
            border-color: #000000 !important;
            outline-color: #000000 !important;
            stroke: #000000 !important;
            fill: #000000 !important;
            background-color: transparent !important;
          }

          /* If fractional 0.5px Tailwind borders cause artifacts in PDF renderers,
             increase them to 1px for print only (keeps layout identical). */
          #invoice-preview-print .border-r-\[0\.5px\],
          #invoice-preview-print .border-l-\[0\.5px\],
          #invoice-preview-print .border-t-\[0\.5px\],
          #invoice-preview-print .border-b-\[0\.5px\] {
            border-width: 1px !important;
            border-style: solid !important;
            border-color: #000000 !important;
          }

          /* Prevent text-size adjustments that can reduce spacing in print */
          #invoice-preview-print, #invoice-preview-print * { -webkit-text-size-adjust: 100% !important; }
        }
      `,
        }}
      />
      <PreviewForm invoiceData={mappedData} letterPad="with" initialCompanyDetails={initialCompanyDetails} />
    </div>
  );
}
