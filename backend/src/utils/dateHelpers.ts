import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  getDay,
  addDays,
  differenceInDays,
  parseISO,
  format,
  isWithinInterval,
  isBefore,
  isAfter,
  startOfDay,
} from 'date-fns';
import { SubscriptionFrequency } from '@prisma/client';

// Day name to number mapping (0 = Sunday, 6 = Saturday)
const dayNameToNumber: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Get delivery dates for a subscription based on frequency
 */
export function getDeliveryDates(
  startDate: Date,
  endDate: Date,
  frequency: SubscriptionFrequency,
  customDays?: string[]
): Date[] {
  const dates: Date[] = [];
  const allDates = eachDayOfInterval({ start: startDate, end: endDate });

  for (const date of allDates) {
    const dayOfWeek = getDay(date);
    const isWeekendDay = isWeekend(date);

    switch (frequency) {
      case SubscriptionFrequency.DAILY:
        dates.push(date);
        break;

      case SubscriptionFrequency.ALTERNATE:
        // Include every alternate day starting from start date
        const daysDiff = differenceInDays(date, startDate);
        if (daysDiff % 2 === 0) {
          dates.push(date);
        }
        break;

      case SubscriptionFrequency.WEEKDAYS:
        if (!isWeekendDay) {
          dates.push(date);
        }
        break;

      case SubscriptionFrequency.WEEKENDS:
        if (isWeekendDay) {
          dates.push(date);
        }
        break;

      case SubscriptionFrequency.CUSTOM:
        if (customDays && customDays.length > 0) {
          const dayNumbers = customDays.map(
            (day) => dayNameToNumber[day.toLowerCase()]
          );
          if (dayNumbers.includes(dayOfWeek)) {
            dates.push(date);
          }
        }
        break;
    }
  }

  return dates;
}

/**
 * Filter out vacation dates from delivery dates
 */
export function excludeVacationDates(
  deliveryDates: Date[],
  vacations: Array<{ startDate: Date; endDate: Date }>
): Date[] {
  return deliveryDates.filter((date) => {
    return !vacations.some((vacation) =>
      isWithinInterval(date, {
        start: startOfDay(vacation.startDate),
        end: startOfDay(vacation.endDate),
      })
    );
  });
}

/**
 * Filter out holiday dates from delivery dates
 */
export function excludeHolidayDates(
  deliveryDates: Date[],
  holidays: Date[]
): Date[] {
  const holidayStrings = holidays.map((h) => format(h, 'yyyy-MM-dd'));
  return deliveryDates.filter(
    (date) => !holidayStrings.includes(format(date, 'yyyy-MM-dd'))
  );
}

/**
 * Calculate scheduled delivery dates for a billing period
 */
export function calculateScheduledDeliveries(
  subscriptionStartDate: Date,
  subscriptionEndDate: Date | null,
  frequency: SubscriptionFrequency,
  customDays: string[] | null,
  billingStart: Date,
  billingEnd: Date,
  vacations: Array<{ startDate: Date; endDate: Date }>,
  holidays: Date[],
  pauseStartDate?: Date | null,
  pauseEndDate?: Date | null
): {
  scheduledDates: Date[];
  vacationDates: Date[];
  holidayDates: Date[];
  pausedDates: Date[];
  actualDeliveryDates: Date[];
} {
  // Determine effective start and end for the billing period
  const effectiveStart = isBefore(subscriptionStartDate, billingStart)
    ? billingStart
    : subscriptionStartDate;
  
  let effectiveEnd = billingEnd;
  if (subscriptionEndDate && isBefore(subscriptionEndDate, billingEnd)) {
    effectiveEnd = subscriptionEndDate;
  }

  // Get all scheduled delivery dates
  const scheduledDates = getDeliveryDates(
    effectiveStart,
    effectiveEnd,
    frequency,
    customDays || undefined
  );

  // Track excluded dates
  const vacationDates: Date[] = [];
  const holidayDates: Date[] = [];
  const pausedDates: Date[] = [];

  // Filter vacation dates
  let remainingDates = scheduledDates.filter((date) => {
    const isVacation = vacations.some((v) =>
      isWithinInterval(date, {
        start: startOfDay(v.startDate),
        end: startOfDay(v.endDate),
      })
    );
    if (isVacation) vacationDates.push(date);
    return !isVacation;
  });

  // Filter holiday dates
  const holidayStrings = holidays.map((h) => format(h, 'yyyy-MM-dd'));
  remainingDates = remainingDates.filter((date) => {
    const isHoliday = holidayStrings.includes(format(date, 'yyyy-MM-dd'));
    if (isHoliday) holidayDates.push(date);
    return !isHoliday;
  });

  // Filter pause period
  if (pauseStartDate && pauseEndDate) {
    remainingDates = remainingDates.filter((date) => {
      const isPaused = isWithinInterval(date, {
        start: startOfDay(pauseStartDate),
        end: startOfDay(pauseEndDate),
      });
      if (isPaused) pausedDates.push(date);
      return !isPaused;
    });
  }

  return {
    scheduledDates,
    vacationDates,
    holidayDates,
    pausedDates,
    actualDeliveryDates: remainingDates,
  };
}

/**
 * Get billing period for a given date
 */
export function getBillingPeriod(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * Generate bill number
 */
export function generateBillNumber(customerId: string, date: Date): string {
  const monthYear = format(date, 'yyyyMM');
  const shortId = customerId.slice(-6).toUpperCase();
  return `BILL-${monthYear}-${shortId}`;
}

/**
 * Generate adhoc request number
 */
export function generateAdhocRequestNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ADH-${timestamp}-${random}`;
}

/**
 * Check if a date is valid for adhoc request
 */
export function isValidAdhocDate(
  requestDate: Date,
  minAdvanceDays: number,
  maxAdvanceDays: number
): { valid: boolean; reason?: string } {
  const today = startOfDay(new Date());
  const minDate = addDays(today, minAdvanceDays);
  const maxDate = addDays(today, maxAdvanceDays);

  if (isBefore(requestDate, minDate)) {
    return {
      valid: false,
      reason: `Request date must be at least ${minAdvanceDays} day(s) in advance`,
    };
  }

  if (isAfter(requestDate, maxDate)) {
    return {
      valid: false,
      reason: `Request date cannot be more than ${maxAdvanceDays} days in advance`,
    };
  }

  return { valid: true };
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency = 'INR',
  locale = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Parse date string safely
 */
export function parseDateSafe(dateString: string): Date | null {
  try {
    const parsed = parseISO(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}
