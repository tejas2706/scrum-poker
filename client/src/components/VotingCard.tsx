import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface VotingCardProps {
  value: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VotingCard({ value, isSelected, onClick, disabled }: VotingCardProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative h-20 w-16 rounded-lg border-2 font-semibold text-lg',
        'transition-all duration-200',
        'bg-white dark:bg-surface-800',
        'border-surface-200 dark:border-surface-700',
        'hover:border-surface-400 dark:hover:border-surface-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-500 focus-visible:ring-offset-2',
        isSelected && 'border-surface-900 dark:border-surface-50 bg-surface-50 dark:bg-surface-700 shadow-soft-md',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-pressed={isSelected}
      aria-label={`Vote ${value}`}
    >
      {value}
    </motion.button>
  );
}
