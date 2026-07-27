import { describe, expect, it } from 'vitest';
import { calculateInvoiceCycle } from '../helpers/invoice-date.helper';

describe('calculateInvoiceCycle', () => {
  it('uses the current month as the start and the next month as the end for a normal cycle', () => {
    const customer = {
      invoiceFromDay: 5,
      invoiceToDay: 7,
      reminderDaysBefore: 1,
    };

    const cycle = calculateInvoiceCycle(customer as any, new Date(Date.UTC(2026, 6, 18)));

    expect(cycle.invoiceStartDate).toEqual(new Date(Date.UTC(2026, 6, 5)));
    expect(cycle.invoiceEndDate).toEqual(new Date(Date.UTC(2026, 7, 7)));
    expect(cycle.reminderDate).toEqual(new Date(Date.UTC(2026, 7, 6)));
  });

  it('handles wrap-around and leap-year transitions safely', () => {
    const customer = {
      invoiceFromDay: 25,
      invoiceToDay: 5,
      reminderDaysBefore: 2,
    };

    const cycle = calculateInvoiceCycle(customer as any, new Date(Date.UTC(2024, 1, 20)));

    expect(cycle.invoiceStartDate).toEqual(new Date(Date.UTC(2024, 1, 25)));
    expect(cycle.invoiceEndDate).toEqual(new Date(Date.UTC(2024, 2, 5)));
    expect(cycle.reminderDate).toEqual(new Date(Date.UTC(2024, 2, 3)));
  });
});
