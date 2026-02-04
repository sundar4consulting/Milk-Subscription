import { format, parseISO, isValid } from 'date-fns';
import type { SubscriptionFrequency } from '@/types';

// Date formatting
export const formatDate = (date: string | Date, formatStr = 'MMM dd, yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, formatStr) : 'Invalid date';
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'MMM dd, yyyy hh:mm a');
};

export const formatShortDate = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy');
};

// Currency formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Status badges
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    // Subscription status
    ACTIVE: 'bg-green-100 text-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-red-100 text-red-800',

    // Delivery status
    SCHEDULED: 'bg-blue-100 text-blue-800',
    OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',

    // Adhoc request status
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    PARTIALLY_APPROVED: 'bg-orange-100 text-orange-800',
    REJECTED: 'bg-red-100 text-red-800',

    // Bill status
    DRAFT: 'bg-gray-100 text-gray-800',
    PAID: 'bg-green-100 text-green-800',
    PARTIALLY_PAID: 'bg-orange-100 text-orange-800',
    OVERDUE: 'bg-red-100 text-red-800',

    // Payment status
    SUCCESS: 'bg-green-100 text-green-800',
    REFUNDED: 'bg-purple-100 text-purple-800',
  };

  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Frequency labels
export const getFrequencyLabel = (frequency: SubscriptionFrequency, customDays?: number[]): string => {
  const labels: Record<SubscriptionFrequency, string> = {
    DAILY: 'Daily',
    ALTERNATE_DAYS: 'Alternate Days',
    WEEKLY: 'Weekly',
    CUSTOM: customDays ? `Custom (${getDayNames(customDays)})` : 'Custom',
  };
  return labels[frequency];
};

// Day names for custom schedule
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getDayNames = (days: number[]): string => {
  return days.map((d) => dayNames[d]).join(', ');
};

// Class name utility (simplified version of clsx)
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const isValidPincode = (pincode: string): boolean => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

// Truncate text
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

// Generate initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Get greeting based on time of day
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Pluralize word
export const pluralize = (count: number, singular: string, plural?: string): string => {
  return count === 1 ? singular : plural || `${singular}s`;
};

// Local storage helpers
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
};
