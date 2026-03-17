import { type ReactNode, type ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps extends Omit<ComponentProps<typeof motion.div>, 'children'> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = true, ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      whileHover={hover ? { y: -1 } : undefined}
      className={cn(
        'rounded-lg bg-white dark:bg-surface-800',
        'border border-surface-200 dark:border-surface-700',
        'shadow-soft',
        hover && 'transition-shadow duration-200 hover:shadow-soft-md',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('px-4 sm:px-6 py-3 sm:py-4 border-b border-surface-200 dark:border-surface-700', className)}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('px-4 sm:px-6 py-3 sm:py-4', className)}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('px-4 sm:px-6 py-3 sm:py-4 border-t border-surface-200 dark:border-surface-700', className)}>
      {children}
    </div>
  );
}
