import React from 'react';
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className,
  onClose,
}) => {
  const styles = {
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-400',
      title: 'text-blue-800',
      text: 'text-blue-700',
    },
    success: {
      container: 'bg-green-50 border-green-200',
      icon: 'text-green-400',
      title: 'text-green-800',
      text: 'text-green-700',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-400',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-400',
      title: 'text-red-800',
      text: 'text-red-700',
    },
  };

  const icons = {
    info: InformationCircleIcon,
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: ExclamationCircleIcon,
  };

  const Icon = icons[type];
  const style = styles[type];

  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex items-start',
        style.container,
        className
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', style.icon)} />
      <div className="ml-3 flex-1">
        {title && (
          <h3 className={cn('text-sm font-medium', style.title)}>{title}</h3>
        )}
        <div className={cn('text-sm', style.text, title && 'mt-1')}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn('ml-auto flex-shrink-0', style.icon, 'hover:opacity-75')}
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
