import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

function extractSequence(str, oldPrefix = '', oldSuffix = '') {
  let temp = str || '';
  if (temp.endsWith('_temp')) {
    temp = temp.slice(0, -5);
  }
  // Robust pattern matching for legacy assets: KEYWORD-XXXX-YY
  const assetPatternMatch = temp.match(/^[A-Z]+-(\d+)-\d{2}$/i);
  if (assetPatternMatch) {
    return parseInt(assetPatternMatch[1], 10);
  }

  if (oldPrefix && temp.startsWith(oldPrefix)) {
    temp = temp.slice(oldPrefix.length);
  }
  if (oldSuffix && temp.endsWith(oldSuffix)) {
    temp = temp.slice(0, -oldSuffix.length);
  }
  const numMatches = temp.match(/\d+/g);
  if (numMatches && numMatches.length > 0) {
    return parseInt(numMatches[numMatches.length - 1], 10);
  }
  return 1;
}

export async function GET() {
  try {
    const settings = await prisma.numberFormatSetting.findMany();
    const result = {};
    settings.forEach((s) => {
      result[s.module] = {
        prefix: s.prefix || '',
        nextNumber: s.nextNumber || '',
        padding: s.padding ?? 3,
        suffix: s.suffix || '',
      };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch number format settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch number format settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const modules = ['invoice', 'employee', 'contract_employee', 'asset'];
    const updatedSettings = {};

    // Get old settings to know the previous prefix/suffix formats
    const oldSettings = await prisma.numberFormatSetting.findMany();
    const oldSettingsMap = {};
    oldSettings.forEach((s) => {
      oldSettingsMap[s.module] = s;
    });

    for (const mod of modules) {
      if (body[mod]) {
        const { prefix, nextNumber, padding, suffix } = body[mod];
        const updated = await prisma.numberFormatSetting.upsert({
          where: { module: mod },
          update: {
            prefix: prefix ?? '',
            nextNumber: nextNumber !== undefined ? String(nextNumber) : '',
            padding: padding !== undefined ? Number(padding) : 3,
            suffix: suffix ?? '',
          },
          create: {
            module: mod,
            prefix: prefix ?? '',
            nextNumber: nextNumber !== undefined ? String(nextNumber) : '',
            padding: padding !== undefined ? Number(padding) : 3,
            suffix: suffix ?? '',
          },
        });

        // Set database sequence numbers if requested
        if (mod === 'employee' && nextNumber) {
          const nextVal = parseInt(nextNumber, 10);
          if (!isNaN(nextVal)) {
            try {
              await prisma.$executeRawUnsafe(`SELECT setval('employee_number_seq', ${nextVal - 1}, true)`);
            } catch (seqErr) {
              console.error('Failed to set employee sequence:', seqErr);
            }
          }
        } else if (mod === 'contract_employee' && nextNumber) {
          const nextVal = parseInt(nextNumber, 10);
          if (!isNaN(nextVal)) {
            try {
              await prisma.$executeRawUnsafe(`SELECT setval('contract_employee_number_seq', ${nextVal - 1}, true)`);
            } catch (seqErr) {
              console.error('Failed to set contract employee sequence:', seqErr);
            }
          }
        } else if (mod === 'asset' && nextNumber) {
          const nextVal = parseInt(nextNumber, 10);
          if (!isNaN(nextVal)) {
            try {
              await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS asset_number_seq START 1;`);
              await prisma.$executeRawUnsafe(`SELECT setval('asset_number_seq', ${nextVal - 1}, true)`);
            } catch (seqErr) {
              console.error('Failed to set asset sequence:', seqErr);
            }
          }
        }

        // Migrate existing records
        const oldS = oldSettingsMap[mod] || {
          prefix: mod === 'invoice' ? 'INV-' : mod === 'employee' ? 'LK' : mod === 'asset' ? 'AST-' : 'LKC',
          padding: mod === 'invoice' ? 4 : mod === 'asset' ? 4 : 3,
          suffix: mod === 'invoice' ? '-2026' : '',
        };

        if (mod === 'employee') {
          const employees = await prisma.employee.findMany();
          const standardEmployees = employees.filter(e => (e.workType || '').toUpperCase() !== 'CONTRACT');
          
          // Step 1: Set temporary IDs to avoid unique constraint collisions
          for (const emp of standardEmployees) {
            await prisma.employee.update({
              where: { id: emp.id },
              data: { empId: emp.empId + '_temp' },
            });
          }
          // Step 2: Format to final new IDs
          for (const emp of standardEmployees) {
            const seq = extractSequence(emp.empId, oldS.prefix, oldS.suffix);
            const newEmpId = `${prefix || ''}${String(seq).padStart(Number(padding || 3), '0')}${suffix || ''}`;
            await prisma.employee.update({
              where: { id: emp.id },
              data: { empId: newEmpId },
            });
          }
        } else if (mod === 'contract_employee') {
          const employees = await prisma.employee.findMany();
          const contractEmployees = employees.filter(e => (e.workType || '').toUpperCase() === 'CONTRACT');

          // Step 1: Set temporary IDs to avoid unique constraint collisions
          for (const emp of contractEmployees) {
            await prisma.employee.update({
              where: { id: emp.id },
              data: { empId: emp.empId + '_temp', contractEmpId: (emp.contractEmpId || emp.empId) + '_temp' },
            });
          }
          // Step 2: Format to final new IDs
          for (const emp of contractEmployees) {
            const seq = extractSequence(emp.empId, oldS.prefix, oldS.suffix);
            const newEmpId = `${prefix || ''}${String(seq).padStart(Number(padding || 3), '0')}${suffix || ''}`;
            await prisma.employee.update({
              where: { id: emp.id },
              data: { empId: newEmpId, contractEmpId: newEmpId },
            });
          }
        } else if (mod === 'asset') {
          const assets = await prisma.asset.findMany();

          // Step 1: Set temporary tags to avoid unique constraint collisions
          for (const asset of assets) {
            await prisma.asset.update({
              where: { id: asset.id },
              data: { assetTag: asset.assetTag + '_temp' },
            });
          }
          // Step 2: Format to final new tags
          for (const asset of assets) {
            const seq = extractSequence(asset.assetTag, oldS.prefix, oldS.suffix);
            const newAssetTag = `${prefix || ''}${String(seq).padStart(Number(padding || 3), '0')}${suffix || ''}`;
            await prisma.asset.update({
              where: { id: asset.id },
              data: { assetTag: newAssetTag },
            });
          }
        } else if (mod === 'invoice') {
          const invoices = await prisma.invoice.findMany();
          
          await prisma.$transaction(async (tx) => {
            // Drop foreign key constraint temporarily during migration to prevent reference issues
            await tx.$executeRawUnsafe(`ALTER TABLE "InvoiceItem" DROP CONSTRAINT IF EXISTS "InvoiceItem_invoice_number_fkey"`);
            try {
              // Rename to _temp
              for (const inv of invoices) {
                const tempNum = inv.invoiceNumber + '_temp';
                await tx.invoiceItem.updateMany({
                  where: { invoiceNumber: inv.invoiceNumber },
                  data: { invoiceNumber: tempNum },
                });
                await tx.invoice.update({
                  where: { id: inv.id },
                  data: { invoiceNumber: tempNum },
                });
              }
              // Format to new IDs
              for (const inv of invoices) {
                const seq = extractSequence(inv.invoiceNumber, oldS.prefix, oldS.suffix);
                const newInvoiceNumber = `${prefix || ''}${String(seq).padStart(Number(padding || 3), '0')}${suffix || ''}`;
                const tempNum = inv.invoiceNumber + '_temp';
                
                await tx.invoiceItem.updateMany({
                  where: { invoiceNumber: tempNum },
                  data: { invoiceNumber: newInvoiceNumber },
                });
                await tx.invoice.update({
                  where: { id: inv.id },
                  data: { invoiceNumber: newInvoiceNumber },
                });
              }
            } finally {
              // Re-create the foreign key constraint with ON UPDATE CASCADE and ON DELETE CASCADE
              await tx.$executeRawUnsafe(`
                ALTER TABLE "InvoiceItem" 
                ADD CONSTRAINT "InvoiceItem_invoice_number_fkey" 
                FOREIGN KEY (invoice_number) REFERENCES "Invoice"(invoice_number) 
                ON UPDATE CASCADE ON DELETE RESTRICT
              `);
            }
          }, {
            timeout: 30000 // Increase timeout to 30 seconds to support larger datasets on remote DB
          });
        }

        updatedSettings[mod] = {
          prefix: updated.prefix,
          nextNumber: updated.nextNumber,
          padding: updated.padding,
          suffix: updated.suffix,
        };
      }
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Failed to update number format settings:', error);
    return NextResponse.json(
      { error: 'Failed to update number format settings' },
      { status: 500 }
    );
  }
}
