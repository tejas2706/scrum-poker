import { forwardRef, type ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ComponentProps<typeof motion.button>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-surface-900 dark:bg-surface-50 text-white dark:text-surface-900 hover:bg-surface-800 dark:hover:bg-surface-100 active:bg-surface-700 dark:active:bg-surface-200',
  secondary:
    'bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 active:bg-surface-100 dark:active:bg-surface-600',
  ghost:
    'bg-transparent text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 active:bg-surface-200 dark:active:bg-surface-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, className, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? {} : { scale: 1.01 }}
        whileTap={disabled ? {} : { scale: 0.99 }}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
