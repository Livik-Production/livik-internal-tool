import QuotationPreviewForm from '../../components/Finance/QuotationTab/QuotationPreviewForm';
import { getQuotationById } from '../../../lib/quotationService';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';

export default async function QuotationPage({ params }) {
  const { id } = await params;
  const quotationData = await getQuotationById(id);

  if (!quotationData) {
    notFound();
  }

  const companyDetailsRecord = await prisma.companyDetails.findFirst();
  const initialCompanyDetails = companyDetailsRecord
    ? JSON.parse(JSON.stringify(companyDetailsRecord))
    : null;

  const quotation = JSON.parse(JSON.stringify(quotationData));

  const mappedData = {
    id: quotation.id,
    quotationNumber: quotation.quotationNumber,
    date: quotation.quotationDate,
    client: {
      name: quotation.client || quotation.customer?.name || 'Client',
      city: quotation.customer?.city || '',
      state: quotation.customer?.state || '',
    },
    subject: quotation.subject,
    greeting: quotation.greeting,
    items: (quotation.items || []).map((i) => ({
      serialNumber: i.serialNumber,
      moduleName: i.moduleName,
      amount: i.amount,
    })),
    subTotal: quotation.subTotal,
    gstPercent: quotation.gstPercent,
    discountAmount: quotation.discountAmount,
    termsAndConditions: quotation.termsAndConditions,
  };

  return (
    <div
      id="quotation-print"
      className="print:m-0 print:p-0"
      style={{
        width: '100%',
        maxWidth: '794px',
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

        @media print {
          html, body { background: #fff !important; -webkit-print-color-adjust: exact; }

          #quotation-print {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 12mm 8mm !important;
            box-sizing: border-box !important;
            transform: none !important;
            zoom: 1 !important;
          }

          #quotation-print, #quotation-print * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            -webkit-text-size-adjust: 100% !important;
            color: inherit !important;
            background-color: transparent !important;
            box-shadow: none !important;
          }
        }
      `,
        }}
      />
      <QuotationPreviewForm
        quotationData={mappedData}
        initialCompanyDetails={initialCompanyDetails}
      />
    </div>
  );
}
