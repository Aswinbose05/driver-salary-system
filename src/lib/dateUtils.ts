/**
 * Time zone and Currency helpers for Driver Earnings System (Asia/Kolkata & INR)
 */

export const TIME_ZONE = 'Asia/Kolkata';
export const CURRENCY_SYMBOL = '₹';

/**
 * Format a number to Indian Rupees format with ₹ symbol (e.g. ₹2,400, ₹1,20,000)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
  return `₹${formatted}`;
}

/**
 * Get current date string in Asia/Kolkata timezone in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // en-CA produces YYYY-MM-DD
}

/**
 * Get current month string in Asia/Kolkata timezone in YYYY-MM format
 */
export function getCurrentMonthString(): string {
  const today = getTodayDateString();
  return today.substring(0, 7);
}

/**
 * Format a YYYY-MM-DD date to a readable string (e.g. "17 Oct 2026")
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a YYYY-MM date to month and year (e.g. "October 2026")
 */
export function formatMonthYear(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format timestamp to readable date and time in IST (e.g. "17 Oct 2026, 07:15 PM")
 */
export function formatDateTime(isoStr: string): string {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Generate a list of the last 12 months in YYYY-MM format for dropdowns
 */
export function getRecentMonths(count = 12): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = [];
  const current = getCurrentMonthString();
  const [currentYear, currentMonth] = current.split('-').map(Number);

  for (let i = 0; i < count; i++) {
    let year = currentYear;
    let month = currentMonth - i;
    while (month <= 0) {
      month += 12;
      year -= 1;
    }
    const val = `${year}-${String(month).padStart(2, '0')}`;
    months.push({
      value: val,
      label: formatMonthYear(val),
    });
  }

  return months;
}

/**
 * Check if a work date is within allowed editing window
 */
export function isDateEditable(workDate: string, allowPastDays: number): boolean {
  const today = getTodayDateString();
  if (workDate === today) return true;
  if (workDate > today) return false; // Future dates not allowed
  
  // Calculate difference in days
  const todayDate = new Date(today);
  const targetDate = new Date(workDate);
  const diffTime = todayDate.getTime() - targetDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= allowPastDays;
}
