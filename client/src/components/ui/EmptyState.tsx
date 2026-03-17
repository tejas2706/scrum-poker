import { type ReactNode } from 'react';
import { Typography } from './Typography';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      {icon && <div className="mb-4 text-surface-400 dark:text-surface-500">{icon}</div>}
      <Typography variant="h5" className="mb-2 text-surface-700 dark:text-surface-300">
        {title}
      </Typography>
      {description && (
        <Typography variant="body" className="mb-6 max-w-md text-surface-500 dark:text-surface-400">
          {description}
        </Typography>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
