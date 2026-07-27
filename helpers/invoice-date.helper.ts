export interface InvoiceCycleDates {
  invoiceStartDate: Date;
  invoiceEndDate: Date;
  reminderDate: Date;
}

interface InvoiceCycleCustomerLike {
  invoiceFromDay?: number | null;
  invoiceToDay?: number | null;
  reminderDaysBefore?: number | null;
}

function toSafeDateParts(date: Date): { year: number; month: number; day: number } {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function buildDateForParts(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

function normalizeDay(value: number | null | undefined, fallbackDay: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallbackDay;
  }

  return Math.max(1, Math.min(value, 31));
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function resolveDateForMonth(year: number, monthIndex: number, day: number): Date {
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const safeDay = Math.min(day, daysInMonth);
  return buildDateForParts(year, monthIndex, safeDay);
}

export function calculateInvoiceCycle(
  customer: InvoiceCycleCustomerLike,
  today: Date
): InvoiceCycleDates {
  const { year, month } = toSafeDateParts(today);
  const nextMonthIndex = (month + 1) % 12;
  const nextMonthYear = month === 11 ? year + 1 : year;

  const invoiceFromDay = normalizeDay(customer.invoiceFromDay, 1);
  const invoiceToDay = normalizeDay(customer.invoiceToDay, 1);
  const reminderDaysBefore = Math.max(1, customer.reminderDaysBefore ?? 1);

  const invoiceStartDate = resolveDateForMonth(year, month, invoiceFromDay);
  const invoiceEndDate = resolveDateForMonth(
    nextMonthYear,
    nextMonthIndex,
    invoiceToDay
  );

  const reminderDate = new Date(invoiceEndDate);
  reminderDate.setUTCDate(reminderDate.getUTCDate() - reminderDaysBefore);

  return {
    invoiceStartDate,
    invoiceEndDate,
    reminderDate,
  };
}

export function getInvoiceReminderCandidates(
  customer: InvoiceCycleCustomerLike,
  today: Date
): InvoiceCycleDates[] {
  const todayMonthCycle = calculateInvoiceCycle(customer, today);
  const { year, month } = toSafeDateParts(today);
  const previousMonthAnchor = buildDateForParts(year, month - 1, 1);
  const previousMonthCycle = calculateInvoiceCycle(customer, previousMonthAnchor);

  return [todayMonthCycle, previousMonthCycle];
}

export function isReminderDate(
  customer: InvoiceCycleCustomerLike,
  today: Date
): boolean {
  const normalizedToday = buildDateForParts(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );

  return getInvoiceReminderCandidates(customer, today).some(
    (cycle) => cycle.reminderDate.getTime() === normalizedToday.getTime()
  );
}
