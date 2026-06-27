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
    const modules = ['invoice', 'employee', 'contract_employee'];
    // Add dynamic asset keys from the request body
    Object.keys(body).forEach((key) => {
      if (key.startsWith('asset_') && !modules.includes(key)) {
        modules.push(key);
      }
    });
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
              await prisma.$executeRawUnsafe(
                `SELECT setval('employee_number_seq', ${nextVal - 1}, true)`
              );
            } catch (seqErr) {
              console.error('Failed to set employee sequence:', seqErr);
            }
          }
        } else if (mod === 'contract_employee' && nextNumber) {
          const nextVal = parseInt(nextNumber, 10);
          if (!isNaN(nextVal)) {
            try {
              await prisma.$executeRawUnsafe(
                `SELECT setval('contract_employee_number_seq', ${nextVal - 1}, true)`
              );
            } catch (seqErr) {
              console.error(
                'Failed to set contract employee sequence:',
                seqErr
              );
            }
          }
        } else if (mod.startsWith('asset_') && nextNumber) {
          const nextVal = parseInt(nextNumber, 10);
          if (!isNaN(nextVal)) {
            try {
              const seqName = `${mod.toLowerCase().replace(/[^a-z0-9]/g, '_')}_seq`;
              await prisma.$executeRawUnsafe(
                `CREATE SEQUENCE IF NOT EXISTS ${seqName} START 1;`
              );
              await prisma.$executeRawUnsafe(
                `SELECT setval('${seqName}', ${nextVal - 1}, true)`
              );
            } catch (seqErr) {
              console.error(`Failed to set sequence for ${mod}:`, seqErr);
            }
          }
        }

        let oldS = oldSettingsMap[mod];
        if (!oldS) {
          if (mod === 'invoice') {
            oldS = { prefix: 'INV-', padding: 4, suffix: '-2026' };
          } else if (mod === 'employee') {
            oldS = { prefix: 'LK', padding: 3, suffix: '' };
          } else if (mod === 'contract_employee') {
            oldS = { prefix: 'LKC', padding: 3, suffix: '' };
          } else if (mod.startsWith('asset_')) {
            const assetType = mod.slice(6);
            const defaultKeywords = {
              Laptop: 'LAP',
              Mobile: 'MB',
              TV: 'TV',
              Keyboard: 'KB',
              Monitor: 'MN',
              Mouse: 'MS',
              Printer: 'PR',
              Tablet: 'TB',
              Chair: 'CHR',
              Table: 'TBL',
              Camera: 'CAM',
              Other: 'OTH',
            };
            const keyword = defaultKeywords[assetType] || 'OTH';
            oldS = {
              prefix: `${keyword}-`,
              padding: 3,
              suffix: `-${String(new Date().getFullYear()).slice(-2)}`,
            };
          }
        }

        if (mod === 'employee') {
          const employees = await prisma.employee.findMany();
          const standardEmployees = employees.filter(
            (e) => (e.workType || '').toUpperCase() !== 'CONTRACT'
          );

          // Step 1: Set temporary IDs to avoid unique constraint collisions
          for (const emp of standardEmployees) {
            await prisma.employee.update({
              where: { id: emp.id },
              data: { empId: emp.empId + '_temp' },
            });
          }
          const usedSequences = new Set();
          // Step 2: Format to final new IDs
          for (const emp of standardEmployees) {
            let seq = extractSequence(emp.empId, oldS.prefix, oldS.suffix);
            while (usedSequences.has(seq)) {
              seq++;
            }
            usedSequences.add(seq);
            const newEmpId = `${prefix || ''}${String(seq).padStart(Number(padding || 3), '0')}${suffix || ''}`;
            await prisma.employee.update({
              where: { id: emp.id },
              data: { empId: newEmpId },
            });
          }
        } else if (mod === 'contract_employee') {
          const employees = await prisma.employee.findMany();
          const contractEmployees = employees.filter(
            (e) => (e.workType || '').toUpperCase() === 'CONTRACT'
          );

          // Step 1: Set temporary IDs to avoid unique constraint collisions
          for (const emp of contractEmployees) {
            await prisma.employee.update({
              where: { id: emp.id },
              data: {
                empId: emp.empId + '_temp',
                contractEmpId: (emp.contractEmpId || emp.empId) + '_temp',
              },
            });
          }
          const usedSequences = new Set();
          // Step 2: Format to final new IDs
          for (const emp of contractEmployees) {
            let seq = extractSequence(emp.empId, oldS.prefix, oldS.suffix);
            while (usedSequences.has(seq)) {
              seq++;
            }
            usedSequences.add(seq);
            const newEmpId = `${prefix || ''}${String(seq).padStart(Number(padding || 3), '0')}${suffix || ''}`;
            await prisma.employee.update({
              where: { id: emp.id },
              data: { empId: newEmpId, contractEmpId: newEmpId },
            });
          }
        } else if (mod.startsWith('asset_')) {
          const assetType = mod.slice(6); // remove 'asset_'
          const assets = await prisma.asset.findMany({
            where: { deviceType: assetType },
          });

          // Step 1: Set temporary tags to avoid unique constraint collisions
          for (const asset of assets) {
            await prisma.asset.update({
              where: { id: asset.id },
              data: { assetTag: asset.assetTag + '_temp' },
            });
          }
          const usedSequences = new Set();
          // Step 2: Format to final new tags
          for (const asset of assets) {
            let seq = extractSequence(asset.assetTag, oldS.prefix, oldS.suffix);
            while (usedSequences.has(seq)) {
              seq++;
            }
            usedSequences.add(seq);
            const newAssetTag = `${prefix || ''}${String(seq).padStart(Number(padding || 3), '0')}${suffix || ''}`;
            await prisma.asset.update({
              where: { id: asset.id },
              data: { assetTag: newAssetTag },
            });
          }
        } else if (mod === 'invoice') {
          const invoices = await prisma.invoice.findMany();

          await prisma.$transaction(
            async (tx) => {
              // Drop foreign key constraint temporarily during migration to prevent reference issues
              await tx.$executeRawUnsafe(
                `ALTER TABLE "InvoiceItem" DROP CONSTRAINT IF EXISTS "InvoiceItem_invoice_number_fkey"`
              );
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
                const usedSequences = new Set();
                // Format to new IDs
                for (const inv of invoices) {
                  let seq = extractSequence(
                    inv.invoiceNumber,
                    oldS.prefix,
                    oldS.suffix
                  );
                  while (usedSequences.has(seq)) {
                    seq++;
                  }
                  usedSequences.add(seq);
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
            },
            {
              timeout: 30000, // Increase timeout to 30 seconds to support larger datasets on remote DB
            }
          );
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
