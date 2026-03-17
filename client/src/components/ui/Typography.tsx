import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'small' | 'caption';

interface TypographyProps {
  variant?: TypographyVariant;
  children: ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

const variantStyles: Record<TypographyVariant, string> = {
  h1: 'text-4xl font-semibold tracking-tight text-surface-900 dark:text-surface-50',
  h2: 'text-3xl font-semibold tracking-tight text-surface-900 dark:text-surface-50',
  h3: 'text-2xl font-semibold tracking-tight text-surface-900 dark:text-surface-50',
  h4: 'text-xl font-semibold tracking-tight text-surface-900 dark:text-surface-50',
  h5: 'text-lg font-semibold tracking-tight text-surface-900 dark:text-surface-50',
  h6: 'text-base font-semibold tracking-tight text-surface-900 dark:text-surface-50',
  body: 'text-base font-normal text-surface-700 dark:text-surface-300',
  small: 'text-sm font-normal text-surface-600 dark:text-surface-400',
  caption: 'text-xs font-normal text-surface-500 dark:text-surface-500',
};

const defaultElements: Record<TypographyVariant, keyof React.JSX.IntrinsicElements> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body: 'p',
  small: 'p',
  caption: 'span',
};

export function Typography({ variant = 'body', children, className, as }: TypographyProps) {
  const Component = as || defaultElements[variant];
  const baseStyles = variantStyles[variant];

  return (
    <Component className={cn(baseStyles, className)}>
      {children}
    </Component>
  );
}
