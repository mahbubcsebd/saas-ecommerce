export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'COMPLETED';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

export const getOrderStatusConfig = (status: string): StatusConfig => {
  const s = status.toUpperCase();

  switch (s) {
    case 'PENDING':
      return {
        label: 'Pending',
        color: 'text-amber-700 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200/50 dark:border-amber-800/50',
        iconColor: 'bg-amber-500',
      };
    case 'CONFIRMED':
      return {
        label: 'Confirmed',
        color: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200/50 dark:border-blue-800/50',
        iconColor: 'bg-blue-500',
      };
    case 'PROCESSING':
      return {
        label: 'Processing',
        color: 'text-indigo-700 dark:text-indigo-400',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        borderColor: 'border-indigo-200/50 dark:border-indigo-800/50',
        iconColor: 'bg-indigo-500',
      };
    case 'SHIPPED':
      return {
        label: 'Shipped',
        color: 'text-purple-700 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200/50 dark:border-purple-800/50',
        iconColor: 'bg-purple-500',
      };
    case 'DELIVERED':
    case 'COMPLETED':
      return {
        label: 'Delivered',
        color: 'text-emerald-700 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderColor: 'border-emerald-200/50 dark:border-emerald-800/50',
        iconColor: 'bg-emerald-500',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        color: 'text-rose-700 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-900/20',
        borderColor: 'border-rose-200/50 dark:border-rose-800/50',
        iconColor: 'bg-rose-500',
      };
    case 'RETURNED':
      return {
        label: 'Returned',
        color: 'text-slate-700 dark:text-slate-400',
        bgColor: 'bg-slate-100 dark:bg-slate-800/50',
        borderColor: 'border-slate-200 dark:border-slate-700',
        iconColor: 'bg-slate-500',
      };
    default:
      return {
        label: status,
        color: 'text-slate-600 dark:text-slate-400',
        bgColor: 'bg-slate-50 dark:bg-slate-900/50',
        borderColor: 'border-slate-200 dark:border-slate-800',
        iconColor: 'bg-slate-400',
      };
  }
};
