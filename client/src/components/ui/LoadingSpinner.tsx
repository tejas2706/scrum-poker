import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <motion.div
      className={cn('inline-block', sizeClasses[size], className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    >
      <div
        className={cn(
          'h-full w-full rounded-full border-surface-300 dark:border-surface-600 border-t-surface-900 dark:border-t-surface-50'
        )}
      />
    </motion.div>
  );
}
